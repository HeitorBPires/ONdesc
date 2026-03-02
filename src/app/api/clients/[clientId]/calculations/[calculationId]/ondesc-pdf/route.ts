import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import {
  downloadClientPdfFromStorage,
  getMonthlyCalculationDetailsByIdOrThrow,
  getOndescDocumentByCalculationId,
} from "@/lib/supabase/data-access";

function isValidId(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeFilename(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "fatura-ondesc.pdf";
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
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

    await getMonthlyCalculationDetailsByIdOrThrow(supabase, {
      clientId,
      calculationId,
    });

    const attachment = await getOndescDocumentByCalculationId(
      supabase,
      calculationId,
    );

    if (!attachment) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Fatura ONDESC não encontrada no storage para este cálculo. Gere o boleto para salvar o documento.",
        },
        { status: 404 },
      );
    }

    const pdfArrayBuffer = await downloadClientPdfFromStorage(supabase, {
      bucket: attachment.bucket,
      path: attachment.path,
    });

    return new NextResponse(pdfArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${sanitizeFilename(attachment.filename || "fatura-ondesc.pdf")}"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.toLowerCase()
        : "erro interno ao carregar fatura ondesc";

    if (message.includes("não encontrado")) {
      return NextResponse.json(
        { success: false, error: "Cálculo mensal não encontrado." },
        { status: 404 },
      );
    }

    if (message.includes("storage") || message.includes("bucket")) {
      return NextResponse.json(
        { success: false, error: "Erro no storage ao carregar fatura ONDESC." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Erro interno ao carregar fatura ONDESC." },
      { status: 500 },
    );
  }
}
