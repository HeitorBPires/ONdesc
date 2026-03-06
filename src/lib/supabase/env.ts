type SupabaseEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type SupabaseEnvName =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY";

function readEnv(name: SupabaseEnvName) {
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

export function getSupabaseServiceRoleKey(): string {
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceRoleKey) {
    throw new Error(
      "Variavel ausente: configure SUPABASE_SERVICE_ROLE_KEY no .env.local (com valor nao vazio).",
    );
  }

  return serviceRoleKey;
}
