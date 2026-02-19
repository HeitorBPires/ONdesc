import { NextRequest, NextResponse } from "next/server";
import {
  calculateCopelInvoice,
  extractTextFromPDF,
  parseCopelItems,
} from "../../../../lib/calculator";
import { extractDadosFaturaCopel } from "../../../../lib/extractDados";
import { validateDadosFaturaCopel } from "../../../../lib/validateDadosUsuario";
import {
  downloadClientPdfFromStorage,
  getClientOrThrow,
  getCopelDocumentByCalculationIdOrThrow,
  getMonthlyCalculationByClientMonthOrThrow,
  getRefMonth,
  updateMonthlyCalculation,
} from "@/lib/supabase/data-access";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";

export type ErrorLevel = "critical" | "warning";

export interface ApiError {
  field: string;
  message: string;
  level: ErrorLevel;
}

type CalculationMode = "automatico" | "taxa" | "porcentagem";

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

function buildDateWithFixedDay(year: number, monthIndex: number, day: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return new Date(year, monthIndex, safeDay);
}

function resolveDueDateFromClientConfig(
  clientDueDateConfig: string | undefined,
  copelDueDate: string,
): string {
  const config = clientDueDateConfig?.trim();
  if (!config) return copelDueDate;

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

  const baseDueDate = parseBrDate(copelDueDate);
  if (!baseDueDate) {
    throw new Error("Vencimento da fatura COPEL inválido para calcular novo vencimento.");
  }

  let resolved = buildDateWithFixedDay(
    baseDueDate.getFullYear(),
    baseDueDate.getMonth(),
    fixedDay,
  );

  // Se o dia fixo já passou para este mês, move para o mês seguinte.
  if (resolved.getTime() < baseDueDate.getTime()) {
    const nextMonth = new Date(baseDueDate.getFullYear(), baseDueDate.getMonth() + 1, 1);
    resolved = buildDateWithFixedDay(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      fixedDay,
    );
  }

  return formatBrDate(resolved);
}

export async function POST(req: NextRequest) {
  const errors: ApiError[] = [];
  const { unauthorizedResponse } = await requireUser();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const body = (await req.json()) as {
      clientId?: string;
      modoCalculo?: CalculationMode;
      tarifa?: number;
      porcentagem?: number;
    };
    const clientId = body?.clientId?.trim() || "";

    if (!isValidClientId(clientId)) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              field: "clientId",
              message: "clientId inválido",
              level: "critical",
            },
          ],
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const refMonth = getRefMonth();

    const client = await getClientOrThrow(supabase, clientId);
    const monthlyCalculation = await getMonthlyCalculationByClientMonthOrThrow(
      supabase,
      {
        clientId,
        refMonth,
      },
    );

    const attachment = await getCopelDocumentByCalculationIdOrThrow(
      supabase,
      monthlyCalculation.id,
    );

    const fileArrayBuffer = await downloadClientPdfFromStorage(supabase, {
      bucket: attachment.bucket,
      path: attachment.path,
    });

    const text = await extractTextFromPDF(Buffer.from(fileArrayBuffer));

    if (!text || text.length < 100) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              field: "pdf",
              message: "Texto extraído do PDF é inválido",
              level: "critical",
            },
          ],
        },
        { status: 422 },
      );
    }

    const requestedMode = body?.modoCalculo;
    const tarifaFromBody =
      typeof body?.tarifa === "number" ? body.tarifa : undefined;
    const porcentagemFromBody =
      typeof body?.porcentagem === "number" ? body.porcentagem : undefined;
    const clientDueDateRaw = client.dataVencimento?.trim();
    const clientTarifa = client.tarifa ?? undefined;
    const clientPorcentagem = client.porcentagem ?? undefined;

    let tarifa: number | undefined;
    let porcentagem: number | undefined;
    let modoAplicado: CalculationMode = "automatico";

    const applyClientOverrides = () => {
      if (
        clientTarifa !== undefined &&
        (!Number.isFinite(clientTarifa) || clientTarifa <= 0)
      ) {
        return NextResponse.json(
          {
            success: false,
            errors: [
              {
                field: "tarifa",
                message: "Tarifa configurada no cliente é inválida.",
                level: "critical",
              },
            ],
          },
          { status: 400 },
        );
      }

      if (
        clientPorcentagem !== undefined &&
        (!Number.isFinite(clientPorcentagem) ||
          clientPorcentagem < 12 ||
          clientPorcentagem > 15)
      ) {
        return NextResponse.json(
          {
            success: false,
            errors: [
              {
                field: "porcentagem",
                message:
                  "Porcentagem configurada no cliente é inválida (permitido 12% a 15%).",
                level: "critical",
              },
            ],
          },
          { status: 400 },
        );
      }

      tarifa = clientTarifa;
      porcentagem = tarifa === undefined ? clientPorcentagem : undefined;

      if (tarifa !== undefined) {
        modoAplicado = "taxa";
      } else if (porcentagem !== undefined) {
        modoAplicado = "porcentagem";
      } else {
        modoAplicado = "automatico";
      }

      return null;
    };

    if (requestedMode === "taxa") {
      if (
        tarifaFromBody === undefined ||
        !Number.isFinite(tarifaFromBody) ||
        tarifaFromBody <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            errors: [
              {
                field: "tarifa",
                message: "Tarifa inválida.",
                level: "critical",
              },
            ],
          },
          { status: 400 },
        );
      }

      tarifa = tarifaFromBody;
      modoAplicado = "taxa";
    } else if (requestedMode === "porcentagem") {
      if (
        porcentagemFromBody === undefined ||
        !Number.isFinite(porcentagemFromBody) ||
        porcentagemFromBody < 12 ||
        porcentagemFromBody > 15
      ) {
        return NextResponse.json(
          {
            success: false,
            errors: [
              {
                field: "porcentagem",
                message: "Porcentagem inválida (permitido 12% a 15%).",
                level: "critical",
              },
            ],
          },
          { status: 400 },
        );
      }

      porcentagem = porcentagemFromBody;
      modoAplicado = "porcentagem";
    } else if (requestedMode === "automatico") {
      const invalidOverrideResponse = applyClientOverrides();
      if (invalidOverrideResponse) return invalidOverrideResponse;
    } else {
      // Regra padrão sem override:
      // 1) tarifa do cliente
      // 2) porcentagem do cliente
      // 3) automático
      const invalidOverrideResponse = applyClientOverrides();
      if (invalidOverrideResponse) return invalidOverrideResponse;
    }

    let resultado = null;

    try {
      const itens = parseCopelItems(text);
      resultado = calculateCopelInvoice(itens, {
        tarifaNovaFatura: tarifa,
        porcentagemDesejada: porcentagem,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao processar cálculo";
      errors.push({
        field: "calculo",
        message,
        level: "critical",
      });
    }

    const dadosUsuario = extractDadosFaturaCopel(text);

    if (clientDueDateRaw) {
      try {
        dadosUsuario.vencimento = resolveDueDateFromClientConfig(
          clientDueDateRaw,
          dadosUsuario.vencimento,
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao aplicar data de vencimento do cliente.";

        return NextResponse.json(
          {
            success: false,
            errors: [
              {
                field: "data_vencimento",
                message,
                level: "critical",
              },
            ],
          },
          { status: 400 },
        );
      }
    }

    const errosUsuario = validateDadosFaturaCopel(dadosUsuario);

    errosUsuario.forEach((e) =>
      errors.push({
        field: e.field,
        message: e.message,
        level: "warning",
      }),
    );

    if (resultado) {
      try {
        await updateMonthlyCalculation(supabase, monthlyCalculation.id, {
          stage: "CALCULATED",
          uc: dadosUsuario.uc,
          mes_referencia: dadosUsuario.mesReferencia,
          copel_data_vencimento: dadosUsuario.vencimento,
          proxima_leitura: dadosUsuario.proximaLeitura,
          copel_valor: resultado.totalFaturaCopel,
          consumo_kwh: resultado.consumoMes,
          tarifa_copel: resultado.tarifaCopel,
          copel_items: resultado.itens,
          valor_sem_ondesc: resultado.valorSemDesconto,
          valor_com_ondesc: resultado.valorNovaFatura,
          valor_desconto: resultado.descontoUsuario,
          percentual_desconto: resultado.porcentagemDesconto,
          tarifa_ondesc: resultado.tarifaNovaFatura,
          valor_total_ondesc: resultado.valorTotal,
          valor_total_copel: resultado.totalFaturaCopel,
          modo_calculo: resultado.modoCalculo ?? modoAplicado,
          client_id: clientId,
        });

      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar monthly_calculations.";

        return NextResponse.json(
          {
            success: false,
            errors: [
              ...errors,
              {
                field: "monthly_calculations",
                message,
                level: "critical",
              },
            ],
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: errors.every((e) => e.level !== "critical"),
      errors,
      data: resultado
        ? {
            ...resultado,
            dadosUsuario,
            clientId,
            monthlyCalculationId: monthlyCalculation.id,
            modoCalculo: resultado.modoCalculo ?? modoAplicado,
          }
        : null,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao processar o cálculo.";

    if (message.toLowerCase().includes("sem pdf anexado")) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              field: "attachment",
              message: "Cliente sem PDF anexado",
              level: "critical",
            },
          ],
        },
        { status: 404 },
      );
    }

    if (
      message.toLowerCase().includes("storage") ||
      message.toLowerCase().includes("bucket")
    ) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              field: "storage",
              message: `Erro no storage: ${message}`,
              level: "critical",
            },
          ],
        },
        { status: 500 },
      );
    }

    if (
      message.toLowerCase().includes("não encontrado") ||
      message.toLowerCase().includes("mês de referência")
    ) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              field: "clientId",
              message,
              level: "critical",
            },
          ],
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        errors: [
          {
            field: "internal",
            message,
            level: "critical",
          },
        ],
      },
      { status: 500 },
    );
  }
}
