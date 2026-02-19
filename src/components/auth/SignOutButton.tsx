"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
    >
      Sair
    </button>
  );
}
