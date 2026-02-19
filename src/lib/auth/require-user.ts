import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      unauthorizedResponse: NextResponse.json(
        { error: "Token inválido ou sessão expirada." },
        { status: 401 },
      ),
    };
  }

  return { user, unauthorizedResponse: null };
}
