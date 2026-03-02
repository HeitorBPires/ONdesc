import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import {
  getClientOrThrow,
  listMonthlyCalculationsByClient,
} from "@/lib/supabase/data-access";

function isValidClientId(clientId: string): boolean {
  return typeof clientId === "string" && clientId.trim().length > 0;
}

export async function GET(
  _req: Request,
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
    const supabase = await createClient();
    await getClientOrThrow(supabase, clientId);
    const history = await listMonthlyCalculationsByClient(supabase, clientId);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao buscar histórico de faturas.";

    if (message.toLowerCase().includes("não encontrado")) {
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
