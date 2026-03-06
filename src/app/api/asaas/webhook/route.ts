import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateClientStatus } from "@/lib/supabase/data-access";

export const runtime = "nodejs";

type AsaasWebhookPayload = {
  id?: string;
  event?: string;
  payment?: {
    id?: string;
    status?: string;
  };
};

type MonthlyInvoiceRow = {
  id: string | null;
  client_id: string | null;
  ref_month: string | null;
};

type ClientRow = {
  id: string | null;
};

type HandledEventName = "PAYMENT_RECEIVED" | "PAYMENT_OVERDUE";

const EVENT_STATUS_MAP: Record<
  HandledEventName,
  { invoiceStatus: "PAGO" | "VENCIDO"; clientStatus: "PAGO" | "VENCIDO" }
> = {
  PAYMENT_RECEIVED: {
    invoiceStatus: "PAGO",
    clientStatus: "PAGO",
  },
  PAYMENT_OVERDUE: {
    invoiceStatus: "VENCIDO",
    clientStatus: "VENCIDO",
  },
};

function readTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUpper(value: unknown): string {
  return readTrimmedString(value).toUpperCase();
}

function parseRefMonth(value: string): number {
  const match = value.match(/^(\d{2})-(\d{4})$/);
  if (!match) return -1;

  const month = Number(match[1]);
  const year = Number(match[2]);

  if (
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    month < 1 ||
    month > 12
  ) {
    return -1;
  }

  return year * 100 + month;
}

function isHandledEvent(eventName: string): eventName is HandledEventName {
  return eventName === "PAYMENT_RECEIVED" || eventName === "PAYMENT_OVERDUE";
}

function getLatestInvoiceByRefMonth(
  rows: Array<{ id: unknown; ref_month: unknown }>,
) {
  if (!rows.length) return null;

  const sorted = [...rows].sort((a, b) => {
    const aRef = parseRefMonth(readTrimmedString(a.ref_month));
    const bRef = parseRefMonth(readTrimmedString(b.ref_month));
    const refDiff = bRef - aRef;
    if (refDiff !== 0) return refDiff;

    const aId = readTrimmedString(a.id);
    const bId = readTrimmedString(b.id);
    return bId.localeCompare(aId);
  });

  return sorted[0];
}

export async function POST(req: Request) {
  const configuredWebhookToken = readTrimmedString(
    process.env.ASAAS_TOKEN_WEBHOOK,
  );
  if (!configuredWebhookToken) {
    console.error("Webhook Asaas rejeitado: ASAAS_TOKEN_WEBHOOK ausente.");
    return NextResponse.json(
      { error: "Webhook token não configurado." },
      { status: 500 },
    );
  }

  const requestToken = readTrimmedString(req.headers.get("asaas-access-token"));
  if (!requestToken || requestToken !== configuredWebhookToken) {
    return NextResponse.json(
      { error: "Token do webhook inválido." },
      { status: 401 },
    );
  }

  let payload: AsaasWebhookPayload;
  try {
    payload = (await req.json()) as AsaasWebhookPayload;
  } catch {
    return NextResponse.json(
      { error: "Payload JSON inválido." },
      { status: 400 },
    );
  }

  const eventName = normalizeUpper(payload.event);
  if (!isHandledEvent(eventName)) {
    return NextResponse.json(
      {
        received: true,
        ignored: true,
        reason: `Evento "${eventName || "N/A"}" não é tratado por esta rota.`,
      },
      { status: 200 },
    );
  }

  const paymentId = readTrimmedString(payload.payment?.id);
  if (!paymentId) {
    return NextResponse.json(
      { error: "Webhook inválido: payment.id ausente." },
      { status: 400 },
    );
  }

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error("Erro de configuração do Supabase para webhook:", error);
    return NextResponse.json(
      { error: "Configuração do Supabase ausente para webhook." },
      { status: 500 },
    );
  }

  const { data: invoice, error: invoiceLookupError } = await supabase
    .from("monthly_invoices")
    .select("id, client_id, ref_month")
    .eq("asaas_charge_id", paymentId)
    .maybeSingle();

  if (invoiceLookupError) {
    console.error(
      "Erro ao buscar monthly_invoices por asaas_charge_id:",
      invoiceLookupError,
    );
    return NextResponse.json(
      { error: "Erro ao consultar fatura mensal." },
      { status: 500 },
    );
  }

  if (!invoice) {
    return NextResponse.json(
      { error: "Fatura mensal não encontrada para este payment.id." },
      { status: 404 },
    );
  }

  const typedInvoice = invoice as MonthlyInvoiceRow;
  const invoiceId = readTrimmedString(typedInvoice.id);
  if (!invoiceId) {
    return NextResponse.json(
      { error: "Fatura mensal encontrada, mas sem id válido." },
      { status: 500 },
    );
  }

  const eventStatus = EVENT_STATUS_MAP[eventName];

  const { error: invoiceUpdateError } = await supabase
    .from("monthly_invoices")
    .update({ status: eventStatus.invoiceStatus })
    .eq("id", invoiceId);

  if (invoiceUpdateError) {
    console.error("Erro ao atualizar status da monthly_invoices:", invoiceUpdateError);
    return NextResponse.json(
      { error: "Erro ao atualizar status da fatura mensal." },
      { status: 500 },
    );
  }

  const clientId = readTrimmedString(typedInvoice.client_id);
  if (!clientId) {
    return NextResponse.json(
      {
        received: true,
        invoiceStatusUpdated: true,
        clientStatusUpdated: false,
        reason: "Fatura sem client_id; status do cliente não foi alterado.",
      },
      { status: 200 },
    );
  }

  const { data: clientInvoices, error: latestInvoiceError } = await supabase
    .from("monthly_invoices")
    .select("id, ref_month")
    .eq("client_id", clientId)
    .not("ref_month", "is", null);

  if (latestInvoiceError) {
    console.error(
      "Erro ao buscar última monthly_invoices do cliente:",
      latestInvoiceError,
    );
    return NextResponse.json(
      { error: "Erro ao validar última fatura do cliente." },
      { status: 500 },
    );
  }

  const invoiceRows = (Array.isArray(clientInvoices) ? clientInvoices : []).map(
    (item) => {
      const row =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : {};
      return {
        id: row.id,
        ref_month: row.ref_month,
      };
    },
  );

  const latestInvoice = getLatestInvoiceByRefMonth(invoiceRows);
  const latestInvoiceId = readTrimmedString(latestInvoice?.id);
  if (!latestInvoiceId) {
    return NextResponse.json(
      {
        received: true,
        invoiceStatusUpdated: true,
        clientStatusUpdated: false,
        reason:
          "Não foi possível identificar a última fatura do cliente por ref_month.",
      },
      { status: 200 },
    );
  }

  if (latestInvoiceId !== invoiceId) {
    return NextResponse.json(
      {
        received: true,
        invoiceStatusUpdated: true,
        clientStatusUpdated: false,
        reason: "A fatura do evento não é a última fatura gerada do cliente.",
      },
      { status: 200 },
    );
  }

  const { data: client, error: clientLookupError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .maybeSingle();

  if (clientLookupError) {
    console.error("Erro ao buscar cliente por client_id:", clientLookupError);
    return NextResponse.json(
      { error: "Erro ao consultar cliente." },
      { status: 500 },
    );
  }

  if (!client || !readTrimmedString((client as ClientRow).id)) {
    return NextResponse.json(
      { error: "Cliente não encontrado para o client_id da fatura." },
      { status: 404 },
    );
  }

  try {
    await updateClientStatus(supabase, clientId, eventStatus.clientStatus);
  } catch (error) {
    console.error("Erro ao atualizar status do cliente:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status do cliente." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      received: true,
      invoiceStatusUpdated: true,
      clientStatusUpdated: true,
    },
    { status: 200 },
  );
}
