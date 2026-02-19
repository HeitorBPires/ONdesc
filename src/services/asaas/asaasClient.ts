type AsaasEnv = "sandbox" | "production";

function getAsaasBaseUrl() {
  const env = (process.env.ASAAS_ENV ?? "sandbox") as AsaasEnv;

  if (env === "production") return "https://api.asaas.com/v3";
  return "https://api-sandbox.asaas.com/v3";
}

export async function asaasFetch<T>(
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const baseUrl = getAsaasBaseUrl();
  const accessToken = process.env.ASAAS_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("ASAAS_ACCESS_TOKEN não configurado no .env");
  }

  const url = `${baseUrl}${endpoint}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      access_token: accessToken,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      body?.errors?.[0]?.description ||
      body?.message ||
      res.statusText ||
      "Erro desconhecido";

    throw new Error(`Asaas API error (${res.status}): ${msg}`);
  }

  return body as T;
}
