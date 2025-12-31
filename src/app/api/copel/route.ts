import { NextRequest, NextResponse } from "next/server";
import {
  calculateCopelInvoice,
  extractTextFromPDF,
  parseCopelItems,
} from "../../../../lib/calculator";
import { ItemFatura, ResultadoFatura } from "../../../../types";
import { extractDadosFaturaCopel } from "../../../../lib/extractDados";
import { validateDadosFaturaCopel } from "../../../../lib/validateDadosUsuario";

export type ErrorLevel = "critical" | "warning";

export interface ApiError {
  field: string;
  message: string;
  level: ErrorLevel;
}

export async function POST(req: NextRequest) {
  const errors: ApiError[] = [];

  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const tarifa = Number(formData.get("tarifa"));

    if (!file) {
      errors.push({
        field: "file",
        message: "Arquivo PDF não informado",
        level: "critical",
      });
    }

    if (!isFinite(tarifa)) {
      errors.push({
        field: "tarifa",
        message: "Tarifa inválida",
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
        { status: 422 }
      );
    }

    let itens: ItemFatura[] = [];
    let resultado: ResultadoFatura | null = null;

    try {
      itens = parseCopelItems(text);
      resultado = calculateCopelInvoice(itens, tarifa);
    } catch (err: any) {
      errors.push({
        field: "calculo",
        message: err.message,
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
      })
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
      { status: 500 }
    );
  }
}
