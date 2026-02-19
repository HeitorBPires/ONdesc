import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import {
  canUploadCopelPdf,
  uploadClientAttachment,
} from "@/lib/supabase/data-access";

function isValidClientId(clientId: string): boolean {
  return typeof clientId === "string" && clientId.trim().length > 0;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const { unauthorizedResponse } = await requireUser();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { clientId } = await context.params;

  if (!isValidClientId(clientId)) {
    return NextResponse.json(
      { success: false, error: "clientId inválido." },
      { status: 400 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Arquivo PDF não informado." },
        { status: 400 },
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "Apenas arquivos PDF são permitidos." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const uploadPermission = await canUploadCopelPdf(supabase, clientId);

    if (!uploadPermission.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Upload bloqueado para cliente com status PAGO. Aguarde o ciclo da próxima leitura.",
        },
        { status: 409 },
      );
    }

    // await getClientOrThrow(supabase, clientId);
    const attachment = await uploadClientAttachment(supabase, {
      clientId,
      file,
    });

    return NextResponse.json({
      success: true,
      data: {
        attachmentId: attachment.id,
        monthlyCalculationId: attachment.monthlyCalculationId,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao enviar PDF do cliente.";

    const normalized = message.toLowerCase();

    if (normalized.includes("storage") || normalized.includes("bucket")) {
      return NextResponse.json(
        { success: false, error: `Erro no storage: ${message}` },
        { status: 500 },
      );
    }

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
