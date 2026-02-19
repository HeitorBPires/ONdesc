import React from "react";
import path from "node:path";
import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";

import OndescInvoicePdf from "@/pdf/OndescInvoicePdf";
import type { OndescInvoicePdfData } from "@/pdf/OndescInvoicePdf";

import { fileToBase64 } from "@/pdf/utils/fileToBase64";
import { generateBarcodeBase64 } from "@/pdf/utils/barcode";

import {
  brDateToAsaasDate,
  fetchInvoiceDataAsaas,
} from "@/services/asaas/invoiceService";
import { mergePdfBuffers } from "@/pdf/utils/mergePdf";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import {
  createMonthlyInvoice,
  downloadClientPdfFromStorage,
  getClientOrThrow,
  getCopelDocumentByCalculationIdOrThrow,
  getMonthlyCalculationByClientMonthOrThrow,
  getRefMonth,
  updateClientStatus,
} from "@/lib/supabase/data-access";

function isValidClientId(clientId: string): boolean {
  return typeof clientId === "string" && clientId.trim().length > 0;
}

function isValidBrDate(value: string): boolean {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function parseBrDate(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatBrDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function buildDateWithFixedDay(
  year: number,
  monthIndex: number,
  day: number,
): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return new Date(year, monthIndex, safeDay);
}

function resolveDueDateFromClientConfig(
  clientDueDateConfig: string | undefined,
  referenceDueDate: string,
): string {
  const config = clientDueDateConfig?.trim();
  if (!config) return referenceDueDate;

  if (isValidBrDate(config)) {
    return config;
  }

  if (!/^\d{1,2}$/.test(config)) {
    throw new Error(
      "Data de vencimento configurada no cliente é inválida (use dia 1-31 ou dd/MM/yyyy).",
    );
  }

  const fixedDay = Number(config);
  if (!Number.isFinite(fixedDay) || fixedDay < 1 || fixedDay > 31) {
    throw new Error(
      "Dia de vencimento configurado no cliente é inválido (permitido 1 a 31).",
    );
  }

  const baseDueDate = parseBrDate(referenceDueDate);
  if (!baseDueDate) {
    throw new Error("Vencimento base inválido para calcular novo vencimento.");
  }

  let resolved = buildDateWithFixedDay(
    baseDueDate.getFullYear(),
    baseDueDate.getMonth(),
    fixedDay,
  );

  if (resolved.getTime() < baseDueDate.getTime()) {
    const nextMonth = new Date(
      baseDueDate.getFullYear(),
      baseDueDate.getMonth() + 1,
      1,
    );
    resolved = buildDateWithFixedDay(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      fixedDay,
    );
  }

  return formatBrDate(resolved);
}

function parseNumericInput(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRefMonth(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.replace("/", "-");
}

function normalizeDueDate(
  asaasDueDate: string | undefined,
  fallbackDueDate: unknown,
): string | null {
  if (typeof asaasDueDate === "string" && asaasDueDate.trim()) {
    return asaasDueDate.trim();
  }

  if (typeof fallbackDueDate !== "string" || !fallbackDueDate.trim()) {
    return null;
  }

  try {
    return brDateToAsaasDate(fallbackDueDate.trim());
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { unauthorizedResponse } = await requireUser();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const formData = await req.formData();
    const dataStr = formData.get("data");
    const clientIdRaw = formData.get("clientId");
    const monthlyCalculationIdRaw = formData.get("monthlyCalculationId");

    if (typeof dataStr !== "string") {
      return NextResponse.json(
        { error: "Campo 'data' ausente ou inválido." },
        { status: 400 },
      );
    }

    const clientId = typeof clientIdRaw === "string" ? clientIdRaw.trim() : "";

    if (!isValidClientId(clientId)) {
      return NextResponse.json(
        { error: "clientId inválido." },
        { status: 400 },
      );
    }

    const monthlyCalculationId =
      typeof monthlyCalculationIdRaw === "string"
        ? monthlyCalculationIdRaw.trim()
        : "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(dataStr);
    } catch {
      return NextResponse.json(
        { error: "JSON inválido no campo 'data'." },
        { status: 400 },
      );
    }

    const data = parsed as OndescInvoicePdfData;
    const supabase = await createClient();
    const client = await getClientOrThrow(supabase, clientId);
    const clientDueDateRaw = client.dataVencimento?.trim();

    if (!client.asaasCustomerId?.trim()) {
      return NextResponse.json(
        {
          error:
            "Cliente sem asaas_customer_id configurado. Cadastre o ID do cliente no Asaas antes de gerar o boleto.",
        },
        { status: 422 },
      );
    }

    let effectiveDueDate = data.vencimento;
    try {
      effectiveDueDate = resolveDueDateFromClientConfig(
        clientDueDateRaw,
        data.vencimento,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao aplicar data de vencimento do cliente.";

      return NextResponse.json(
        {
          error: message,
        },
        { status: 400 },
      );
    }

    const dataAsaas = await fetchInvoiceDataAsaas({
      asaasCustomerId: client.asaasCustomerId,
      vencimento: effectiveDueDate,
      valor: data.valorFatura,
    });

    const qrCodeBase64 = `data:image/png;base64,${dataAsaas.PixData.encodedImage}`;

    const barcodeBase64 = await generateBarcodeBase64(
      dataAsaas.IdentificationFieldData.barCode,
    );

    const publicDir = path.join(process.cwd(), "public");

    const dataNew: OndescInvoicePdfData = {
      ...data,
      vencimento: effectiveDueDate,
      logoBase64: await fileToBase64(
        path.join(publicDir, "img/PHOTO-2026-01-06-15-55-08.jpg"),
      ),
      qrCodeBase64,
      barcodeBase64,
      pixCopyPaste: dataAsaas.PixData.payload,
      barcodeLine: dataAsaas.IdentificationFieldData.identificationField,
    };

    const doc = React.createElement(OndescInvoicePdf, {
      data: dataNew,
    }) as ReactElement<DocumentProps>;

    const instance = pdf(doc);
    const invoiceBlob = await instance.toBlob();
    const invoiceBuffer = await invoiceBlob.arrayBuffer();

    const calculationId = monthlyCalculationId
      ? monthlyCalculationId
      : (
          await getMonthlyCalculationByClientMonthOrThrow(supabase, {
            clientId,
            refMonth: getRefMonth(),
          })
        ).id;

    const attachment = await getCopelDocumentByCalculationIdOrThrow(
      supabase,
      calculationId,
    );

    const copelPdfBuffer = await downloadClientPdfFromStorage(supabase, {
      bucket: attachment.bucket,
      path: attachment.path,
    });

    const finalPdfBytes = await mergePdfBuffers(invoiceBuffer, copelPdfBuffer);
    const finalPdfArrayBuffer = finalPdfBytes.slice().buffer;

    try {
      const dueDate = normalizeDueDate(
        dataAsaas.payment.dueDate,
        effectiveDueDate,
      );
      const invoiceValue =
        typeof dataAsaas.payment.value === "number"
          ? dataAsaas.payment.value
          : parseNumericInput(data.valorFatura);
      const discountValue = parseNumericInput(data.descontoUsuario);
      const discountPercent = parseNumericInput(data.porcentagemDesconto);
      const refMonth = normalizeRefMonth(data.mesReferencia) ?? getRefMonth();
      const paymentRecord = dataAsaas.payment as Record<string, unknown>;
      const asaasCustomerId =
        dataAsaas.customerId ||
        (typeof paymentRecord.customer === "string"
          ? paymentRecord.customer
          : null);

      await createMonthlyInvoice(supabase, {
        uc: data.uc || null,
        due_date: dueDate,
        invoice_value: invoiceValue,
        ref_month: refMonth,
        discount_value: discountValue,
        discount_percent: discountPercent,
        status: dataAsaas.payment.status || null,
        created_at: new Date().toISOString(),
        calculation_id: calculationId,
        asaas_charge_id: dataAsaas.payment.id,
        asaas_invoice_url:
          dataAsaas.payment.invoiceUrl || dataAsaas.payment.bankSlipUrl || null,
        asaas_customer_id: asaasCustomerId,
        client_id: clientId,
      });

      await updateClientStatus(supabase, clientId, "Aguard. Pag.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao salvar monthly_invoices.";

      return NextResponse.json(
        {
          error: `Erro ao salvar invoice: ${message}`,
        },
        { status: 500 },
      );
    }

    function pegarPrimeiroNome(nome: string): string {
      return nome.trim().split(/\s+/).slice(0, 1).join(" ");
    }

    return new NextResponse(finalPdfArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="ONDESC_${pegarPrimeiroNome(data.cliente.nome)}_${data.uc}_${data.mesReferencia.replace("/", "")}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);

    const message =
      err instanceof Error ? err.message.toLowerCase() : "erro interno";

    if (message.includes("sem pdf anexado")) {
      return NextResponse.json(
        {
          error: "Cliente sem PDF anexado.",
        },
        { status: 404 },
      );
    }

    if (message.includes("storage") || message.includes("bucket")) {
      return NextResponse.json(
        {
          error: "Erro no storage ao baixar PDF do cliente.",
        },
        { status: 500 },
      );
    }

    if (
      message.includes("asaas_customer_id") ||
      message.includes("cliente asaas não encontrado")
    ) {
      return NextResponse.json(
        {
          error:
            "Cliente não encontrado no Asaas para o asaas_customer_id informado.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno ao gerar o PDF.",
      },
      { status: 500 },
    );
  }
}
