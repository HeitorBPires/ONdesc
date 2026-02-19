import { NextRequest, NextResponse } from "next/server";
import {
  calculateCopelInvoice,
  extractTextFromPDF,
  parseCopelItems,
} from "../../../../lib/calculator";
import { ItemFatura, ResultadoFatura } from "../../../../types";
import { extractDadosFaturaCopel } from "../../../../lib/extractDados";
import { validateDadosFaturaCopel } from "../../../../lib/validateDadosUsuario";
import { requireUser } from "@/lib/auth/require-user";

export type ErrorLevel = "critical" | "warning";

export interface ApiError {
  field: string;
  message: string;
  level: ErrorLevel;
}

export async function POST(req: NextRequest) {
  const errors: ApiError[] = [];
  const { unauthorizedResponse } = await requireUser();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;

    const tarifaRaw = formData.get("tarifa");
    const tarifa =
      tarifaRaw !== null && tarifaRaw !== "" ? Number(tarifaRaw) : undefined;

    const porcentagemRaw = formData.get("porcentagem");
    const porcentagem =
      porcentagemRaw !== null && porcentagemRaw !== ""
        ? Number(porcentagemRaw)
        : undefined;

    if (!file) {
      errors.push({
        field: "file",
        message: "Arquivo PDF não informado",
        level: "critical",
      });
    }

    if (tarifa !== undefined && (!isFinite(tarifa) || tarifa <= 0)) {
      errors.push({
        field: "tarifa",
        message: "Tarifa inválida",
        level: "critical",
      });
    }

    if (
      porcentagem !== undefined &&
      (!isFinite(porcentagem) || porcentagem < 12 || porcentagem > 15)
    ) {
      errors.push({
        field: "porcentagem",
        message: "Porcentagem inválida (permitido 12% a 15%)",
        level: "critical",
      });
    }

    if (errors.some((e) => e.level === "critical")) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const buffer = Buffer.from(await file!.arrayBuffer());
    const text = await extractTextFromPDF(buffer);
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

    let itens: ItemFatura[] = [];
    let resultado: ResultadoFatura | null = null;

    try {
      itens = parseCopelItems(text);

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
    const errosUsuario = validateDadosFaturaCopel(dadosUsuario);

    errosUsuario.forEach((e) =>
      errors.push({
        field: e.field,
        message: e.message,
        level: "warning",
      }),
    );

    return NextResponse.json({
      success: errors.every((e) => e.level !== "critical"),
      errors,
      data: resultado
        ? {
            ...resultado,
            dadosUsuario,
          }
        : null,
    });
  } catch (error) {
    console.error("Erro inesperado:", error);

    return NextResponse.json(
      {
        success: false,
        errors: [
          {
            field: "internal",
            message: "Erro interno ao processar a fatura",
            level: "critical",
          },
        ],
      },
      { status: 500 },
    );
  }
}
