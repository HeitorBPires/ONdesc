type SupabaseEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function readEnv(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
) {
  const value = process.env[name];

  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function hasSupabaseEnv(): boolean {
  return Boolean(
    readEnv("NEXT_PUBLIC_SUPABASE_URL") &&
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

export function getSupabaseEnv(): SupabaseEnv {
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Variaveis ausentes: configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local (com valores nao vazios).",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}
