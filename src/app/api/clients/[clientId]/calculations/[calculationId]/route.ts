import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import {
  getClientDetailsOrThrow,
  getMonthlyCalculationDetailsByIdOrThrow,
} from "@/lib/supabase/data-access";
import { ApiResponse, ResultadoFatura } from "../../../../../../../types";

function isValidId(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

type RawItem = {
  descricao?: string;
  unidade?: string;
  quantidade?: number | string;
  precoUnitario?: number | string;
  valor?: number | string;
};

function parseNumber(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ clientId: string; calculationId: string }> },
) {
  const { unauthorizedResponse } = await requireUser();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { clientId, calculationId } = await context.params;

  if (!isValidId(clientId) || !isValidId(calculationId)) {
    return NextResponse.json(
      { success: false, error: "Parâmetros inválidos." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const [client, monthlyCalculation] = await Promise.all([
      getClientDetailsOrThrow(supabase, clientId),
      getMonthlyCalculationDetailsByIdOrThrow(supabase, {
        clientId,
        calculationId,
      }),
    ]);

    if (monthlyCalculation.stage !== "CALCULATED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Este cálculo ainda não está finalizado. A visualização está disponível somente para cálculos prontos.",
        },
        { status: 409 },
      );
    }

    const itens = monthlyCalculation.copelItems.map((item) => {
      const row = item as RawItem;
      return {
        descricao: row.descricao ?? "",
        unidade: row.unidade ?? "",
        quantidade: parseNumber(row.quantidade),
        precoUnitario: parseNumber(row.precoUnitario),
        valor: parseNumber(row.valor),
      };
    });

    const data: ResultadoFatura = {
      itens,
      energiaInjetadaKwh: monthlyCalculation.energiaInjetadaKwh ?? 0,
      valorSemDesconto: monthlyCalculation.valorSemOndesc ?? 0,
      totalFaturaCopel: monthlyCalculation.valorTotalCopel ?? 0,
      valorNovaFatura: monthlyCalculation.valorComOndesc ?? 0,
      descontoUsuario: monthlyCalculation.valorDesconto ?? 0,
      valorTotal: monthlyCalculation.valorTotalOndesc ?? 0,
      porcentagemDesconto: monthlyCalculation.percentualDesconto ?? 0,
      modoCalculo: monthlyCalculation.modoCalculo,
      porcentagemDesejada:
        monthlyCalculation.modoCalculo === "porcentagem"
          ? monthlyCalculation.percentualDesconto ?? undefined
          : undefined,
      tarifaNovaFatura: monthlyCalculation.tarifaOndesc ?? 0,
      tarifaCopel: monthlyCalculation.tarifaCopel ?? 0,
      consumoMes: monthlyCalculation.consumoKwh ?? 0,
      clientId,
      monthlyCalculationId: monthlyCalculation.id,
      dadosUsuario: {
        uc: monthlyCalculation.uc || client.uc || "",
        mesReferencia: monthlyCalculation.mesReferencia || "",
        vencimento: monthlyCalculation.vencimento || "",
        proximaLeitura: monthlyCalculation.proximaLeitura || "",
        cliente: {
          nome: client.nome || "",
          endereco: client.endereco || "",
          cep: client.cep || "",
          cidade: client.cidade || "",
          estado: client.estado || "",
          documento: {
            tipo: client.documentoTipo,
            valor: client.documentoValor || "",
          },
        },
      },
    };

    const response: ApiResponse<ResultadoFatura> = {
      success: true,
      errors: [],
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao carregar cálculo mensal.";
    const normalized = message.toLowerCase();

    if (normalized.includes("não encontrado")) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
