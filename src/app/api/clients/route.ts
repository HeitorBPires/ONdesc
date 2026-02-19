import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { listClientsWithAttachmentStatus } from "@/lib/supabase/data-access";

export async function GET() {
  const { unauthorizedResponse } = await requireUser();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const supabase = await createClient();
    const clients = await listClientsWithAttachmentStatus(supabase);

    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar clientes.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
