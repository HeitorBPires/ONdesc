"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nextPath = useMemo(() => {
    const value = searchParams.get("next");
    return value && value.startsWith("/") ? value : "/";
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    let error: { message: string } | null = null;

    try {
      const supabase = createClient();
      const result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      error = result.error;
    } catch {
      setErrorMessage(
        "Configuracao de ambiente ausente. Verifique as variaveis do Supabase.",
      );
      setLoading(false);
      return;
    }

    if (error) {
      setErrorMessage("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      <h1 className="text-2xl font-bold text-gray-900">Entrar</h1>
      <p className="mt-2 text-sm text-gray-600">
        Faça login para acessar a aplicação.
      </p>

      <label className="mt-6 block text-sm font-medium text-gray-700">
        E-mail
      </label>
      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-500 focus:ring-2"
        placeholder="voce@empresa.com"
      />

      <label className="mt-4 block text-sm font-medium text-gray-700">
        Senha
      </label>
      <input
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-500 focus:ring-2"
        placeholder="Sua senha"
      />

      {errorMessage && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {loading ? "Validando..." : "Entrar"}
      </button>
    </form>
  );
}
