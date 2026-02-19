import type { SupabaseClient } from "@supabase/supabase-js";

type DbClient = SupabaseClient;

type CalculationStage = "COPEL_UPLOADED" | "CALCULATED";

export type ClientListItem = {
  id: string;
  uc: string;
  nome: string;
  telefone: string;
  vencimento: string;
  dataVencimento: string;
  status: string;
  asaasCustomerId: string;
  hasAttachment: boolean;
  canUpload: boolean;
  canCalculate: boolean;
  tarifa: number | null;
  porcentagem: number | null;
};

type ClientAttachment = {
  id: string;
  calculationId: string;
  docType: string;
  bucket: string;
  path: string;
  filename: string;
  createdAt: string;
};

export type MonthlyCalculation = {
  id: string;
  clientId: string;
  refMonth: string;
  stage: string;
};

const CLIENT_ATTACHMENTS_BUCKET = "documents";
const COPEL_DOCUMENT_TYPE = "COPEL_PDF";

function readString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }

  return "";
}

function readNumberOrNull(
  row: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function normalizeStatus(value: string): "PENDENTE" | "PAGO" | "AGUARD. PAG." {
  const status = value.trim().toUpperCase();
  if (status === "PAGO") return "PAGO";
  if (status === "AGUARD. PAG.") return "AGUARD. PAG.";
  return "PENDENTE";
}

const STATUS_SORT_ORDER: Record<"PENDENTE" | "AGUARD. PAG." | "PAGO", number> = {
  PENDENTE: 0,
  "AGUARD. PAG.": 1,
  PAGO: 2,
};

function mapClientRow(row: Record<string, unknown>): ClientListItem {
  const status = normalizeStatus(readString(row, ["status"]) || "PENDENTE");

  return {
    id: readString(row, ["id", "client_id"]),
    uc: readString(row, ["uc", "unidade_consumidora"]),
    nome: readString(row, ["nome", "name"]),
    telefone: readString(row, ["telefone"]),
    vencimento: readString(row, [
      "venc",
      "vencimento",
      "data_vencimento",
      "due_date",
    ]),
    dataVencimento: readString(row, ["data_vencimento"]),
    status,
    asaasCustomerId: readString(row, ["asaas_customer_id", "asaasCustomerId"]),
    hasAttachment: false,
    canUpload: true,
    canCalculate: false,
    tarifa: readNumberOrNull(row, ["tarifa"]),
    porcentagem: readNumberOrNull(row, ["porcentagem"]),
  };
}

function mapAttachmentRow(row: Record<string, unknown>): ClientAttachment {
  return {
    id: readString(row, ["id"]),
    calculationId: readString(row, [
      "calculation_id",
      "monthly_calculation_id",
    ]),
    docType: readString(row, ["doc_type"]),
    bucket: readString(row, ["bucket"]),
    path: readString(row, ["path", "file_path"]),
    filename: readString(row, ["filename", "file_name"]),
    createdAt: readString(row, ["created_at", "createdAt"]),
  };
}

function mapMonthlyCalculationRow(
  row: Record<string, unknown>,
): MonthlyCalculation {
  return {
    id: readString(row, ["id"]),
    clientId: readString(row, ["client_id", "clientId"]),
    refMonth: readString(row, ["ref_month", "refMonth"]),
    stage: readString(row, ["stage"]),
  };
}

export function getRefMonth(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}-${year}`;
}

function parseRefMonth(value: string): number {
  const match = value.match(/^(\d{2})-(\d{4})$/);
  if (!match) return -1;

  const month = Number(match[1]);
  const year = Number(match[2]);
  if (!Number.isFinite(month) || !Number.isFinite(year)) return -1;
  return year * 100 + month;
}

function parseBrDate(value: string): Date | null {
  const match = value.match(/^([0-3]\d)\/([01]\d)\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function shouldResetPaidStatus(
  proximaLeitura: string | null,
  now: Date = new Date(),
): boolean {
  if (!proximaLeitura) return false;

  const leituraDate = parseBrDate(proximaLeitura);
  if (!leituraDate) return false;

  const limite = new Date(leituraDate);
  limite.setDate(limite.getDate() + 2);

  return now.getTime() > limite.getTime();
}

async function getLatestProximaLeituraByClientId(
  supabase: DbClient,
  clientId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("monthly_calculations")
    .select("ref_month, proxima_leitura")
    .eq("client_id", clientId)
    .not("proxima_leitura", "is", null);

  if (error) {
    throw new Error(`Erro ao buscar próxima leitura: ${error.message}`);
  }

  const rows = (Array.isArray(data) ? data : [])
    .filter((item) => typeof item === "object" && item !== null)
    .map((item) => item as Record<string, unknown>);

  if (rows.length === 0) return null;

  const sorted = rows.sort((a, b) => {
    const aRef = parseRefMonth(readString(a, ["ref_month", "refMonth"]));
    const bRef = parseRefMonth(readString(b, ["ref_month", "refMonth"]));
    return bRef - aRef;
  });

  const latest = sorted[0];
  const value = readString(latest, ["proxima_leitura"]);
  return value || null;
}

async function ensureClientStatusUpToDate(
  supabase: DbClient,
  client: ClientListItem,
): Promise<string> {
  const normalizedStatus = normalizeStatus(client.status);

  if (normalizedStatus !== "PAGO") {
    return client.status;
  }

  const latestProximaLeitura = await getLatestProximaLeituraByClientId(
    supabase,
    client.id,
  );

  if (!shouldResetPaidStatus(latestProximaLeitura)) {
    return client.status;
  }

  const { error } = await supabase
    .from("clients")
    .update({ status: "PENDENTE" })
    .eq("id", client.id);

  if (error) {
    throw new Error(`Erro ao atualizar status do cliente: ${error.message}`);
  }

  return "PENDENTE";
}

export async function listClientsWithAttachmentStatus(
  supabase: DbClient,
): Promise<ClientListItem[]> {
  const { data: clientsData, error: clientsError } = await supabase
    .from("clients")
    .select("*");

  if (clientsError) {
    throw new Error(`Erro ao listar clientes: ${clientsError.message}`);
  }

  const clients = (Array.isArray(clientsData) ? clientsData : [])
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map(mapClientRow)
    .filter((client) => client.id);

  if (clients.length === 0) {
    return [];
  }

  const refMonth = getRefMonth();
  const { data: calculationsData, error: calculationsError } = await supabase
    .from("monthly_calculations")
    .select("client_id, documents!inner(doc_type)")
    .eq("ref_month", refMonth)
    .eq("documents.doc_type", COPEL_DOCUMENT_TYPE)
    .in(
      "client_id",
      clients.map((client) => client.id),
    );

  if (calculationsError) {
    throw new Error(
      `Erro ao carregar status de anexos: ${calculationsError.message}`,
    );
  }

  const attachedClientIds = new Set<string>();

  if (Array.isArray(calculationsData)) {
    for (const row of calculationsData) {
      if (!row || typeof row !== "object") continue;
      const clientId = readString(row as Record<string, unknown>, [
        "client_id",
      ]);
      if (clientId) attachedClientIds.add(clientId);
    }
  }

  const clientsWithUpdatedStatus = await Promise.all(
    clients.map(async (client) => ({
      ...client,
      status: await ensureClientStatusUpToDate(supabase, client),
    })),
  );

  const clientsWithFlags = clientsWithUpdatedStatus.map((client) => {
    const hasAttachment = attachedClientIds.has(client.id);
    const normalizedStatus = normalizeStatus(client.status);
    const canUpload = normalizedStatus === "PENDENTE";

    return {
      ...client,
      hasAttachment,
      canUpload,
      canCalculate: hasAttachment && normalizedStatus === "PENDENTE",
    };
  });

  clientsWithFlags.sort((a, b) => {
    const statusA = normalizeStatus(a.status);
    const statusB = normalizeStatus(b.status);
    const statusDiff = STATUS_SORT_ORDER[statusA] - STATUS_SORT_ORDER[statusB];
    if (statusDiff !== 0) return statusDiff;

    return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
  });

  return clientsWithFlags;
}

export async function canUploadCopelPdf(
  supabase: DbClient,
  clientId: string,
): Promise<{ allowed: boolean; status: string }> {
  const client = await getClientOrThrow(supabase, clientId);
  const status = normalizeStatus(await ensureClientStatusUpToDate(supabase, client));
  return {
    allowed: status === "PENDENTE",
    status,
  };
}

export async function updateClientStatus(
  supabase: DbClient,
  clientId: string,
  status: "PENDENTE" | "PAGO" | "Aguard. Pag." | "AGUARD. PAG.",
): Promise<void> {
  const normalized = normalizeStatus(status);
  const payloadStatus = normalized === "AGUARD. PAG." ? "Aguard. Pag." : normalized;

  const { error } = await supabase
    .from("clients")
    .update({ status: payloadStatus })
    .eq("id", clientId);

  if (error) {
    throw new Error(`Erro ao atualizar status do cliente: ${error.message}`);
  }
}

export async function getClientOrThrow(supabase: DbClient, clientId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar cliente: ${error.message}`);
  }

  if (!data || typeof data !== "object") {
    throw new Error("Cliente não encontrado.");
  }

  return mapClientRow(data as Record<string, unknown>);
}

export async function upsertMonthlyCalculationByClientMonth(
  supabase: DbClient,
  args: { clientId: string; refMonth?: string; stage?: CalculationStage },
): Promise<MonthlyCalculation> {
  const payload: Record<string, unknown> = {
    client_id: args.clientId,
    ref_month: args.refMonth ?? getRefMonth(),
    stage: args.stage ?? "COPEL_UPLOADED",
  };

  const { data, error } = await supabase
    .from("monthly_calculations")
    .upsert(payload, {
      onConflict: "client_id,ref_month",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Erro ao salvar cálculo mensal: ${error.message}`);
  }

  if (!data || typeof data !== "object") {
    throw new Error("Cálculo mensal não retornado pelo Supabase.");
  }

  return mapMonthlyCalculationRow(data as Record<string, unknown>);
}

export async function getMonthlyCalculationByClientMonthOrThrow(
  supabase: DbClient,
  args: { clientId: string; refMonth?: string },
): Promise<MonthlyCalculation> {
  const { data, error } = await supabase
    .from("monthly_calculations")
    .select("*")
    .eq("client_id", args.clientId)
    .eq("ref_month", args.refMonth ?? getRefMonth())
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar cálculo mensal: ${error.message}`);
  }

  if (!data || typeof data !== "object") {
    throw new Error("Cálculo mensal não encontrado para o mês de referência.");
  }

  return mapMonthlyCalculationRow(data as Record<string, unknown>);
}

export async function getCopelDocumentByCalculationIdOrThrow(
  supabase: DbClient,
  calculationId: string,
): Promise<ClientAttachment> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("calculation_id", calculationId)
    .eq("doc_type", COPEL_DOCUMENT_TYPE)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar documento COPEL: ${error.message}`);
  }

  if (!data || typeof data !== "object") {
    throw new Error("Cliente sem PDF anexado.");
  }

  const attachment = mapAttachmentRow(data as Record<string, unknown>);

  if (!attachment.id) {
    throw new Error("Documento COPEL inválido.");
  }

  return attachment;
}

export async function getClientAttachmentOrThrow(
  supabase: DbClient,
  clientId: string,
) {
  const monthlyCalculation = await getMonthlyCalculationByClientMonthOrThrow(
    supabase,
    {
      clientId,
      refMonth: getRefMonth(),
    },
  );

  return await getCopelDocumentByCalculationIdOrThrow(
    supabase,
    monthlyCalculation.id,
  );
}

function buildClientPdfPath(clientId: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `clients/${clientId}/${Date.now()}-${safeName}`;
}

export async function uploadClientAttachment(
  supabase: DbClient,
  args: { clientId: string; file: File },
) {
  const monthlyCalculation = await upsertMonthlyCalculationByClientMonth(
    supabase,
    {
      clientId: args.clientId,
      refMonth: getRefMonth(),
      stage: "COPEL_UPLOADED",
    },
  );

  const path = buildClientPdfPath(args.clientId, args.file.name);

  const { error: uploadError } = await supabase.storage
    .from(CLIENT_ATTACHMENTS_BUCKET)
    .upload(path, args.file, {
      contentType: args.file.type || "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `Erro ao enviar arquivo para o storage: ${uploadError.message}`,
    );
  }

  const payload: Record<string, unknown> = {
    client_id: args.clientId,
    calculation_id: monthlyCalculation.id,
    doc_type: COPEL_DOCUMENT_TYPE,
    ref_month: getRefMonth(),
    bucket: CLIENT_ATTACHMENTS_BUCKET,
    path,
    filename: args.file.name,
    mime_type: args.file.type || "application/pdf",
    size_bytes: args.file.size,
  };

  const { data, error } = await supabase
    .from("documents")
    .upsert(payload, {
      onConflict: "calculation_id,doc_type",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Erro ao salvar registro de anexo: ${error.message}`);
  }

  if (!data || typeof data !== "object") {
    throw new Error("Registro de anexo não retornado pelo Supabase.");
  }

  const attachment = mapAttachmentRow(data as Record<string, unknown>);

  return {
    id: attachment.id,
    monthlyCalculationId: monthlyCalculation.id,
  };
}

export async function downloadClientPdfFromStorage(
  supabase: DbClient,
  args: { bucket: string; path: string },
): Promise<ArrayBuffer> {
  const { data, error } = await supabase.storage
    .from(args.bucket)
    .download(args.path);

  if (error) {
    throw new Error(`Erro ao baixar arquivo do storage: ${error.message}`);
  }

  return await data.arrayBuffer();
}

export async function updateMonthlyCalculation(
  supabase: DbClient,
  id: string,
  payload: Record<string, unknown>,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("monthly_calculations")
    .update(payload)
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar cálculo mensal: ${error.message}`);
  }

  if (!data || typeof data !== "object") {
    throw new Error("Cálculo mensal não retornado pelo Supabase.");
  }

  return {
    id: readString(data as Record<string, unknown>, ["id"]),
  };
}

export async function createMonthlyInvoice(
  supabase: DbClient,
  payload: Record<string, unknown>,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("monthly_invoices")
    .upsert(payload, {
      onConflict: "calculation_id",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Erro ao salvar invoice mensal: ${error.message}`);
  }

  if (!data || typeof data !== "object") {
    throw new Error("Invoice mensal não retornada pelo Supabase.");
  }

  return {
    id: readString(data as Record<string, unknown>, ["id"]),
  };
}
