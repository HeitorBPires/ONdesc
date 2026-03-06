"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Lock,
  MoreVertical,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { SimulationPdfGenerator } from "@/components/SimulationPdfGenerator";

type ClientRow = {
  id: string;
  uc: string;
  nome: string;
  telefone: string;
  vencimento: string;
  status: string;
  hasAttachment: boolean;
  canUpload: boolean;
  canCalculate: boolean;
};

type ClientsResponse = {
  success: boolean;
  data?: ClientRow[];
  error?: string;
};

type MonthlyCalculationHistoryRow = {
  id: string;
  clientId: string;
  refMonth: string;
  stage: string;
  invoiceStatus: string | null;
};

type MonthlyCalculationHistoryResponse = {
  success: boolean;
  data?: MonthlyCalculationHistoryRow[];
  error?: string;
};

function normalizeStatus(
  status: string,
): "PENDENTE" | "AGUARD. PAG." | "VENCIDO" | "PAGO" {
  const value = (status || "").trim().toUpperCase();
  if (value === "PAGO") return "PAGO";
  if (value === "VENCIDO") return "VENCIDO";
  if (value === "AGUARD. PAG.") return "AGUARD. PAG.";
  return "PENDENTE";
}

function formatStatusLabel(status: string): string {
  const normalized = normalizeStatus(status);
  if (normalized === "AGUARD. PAG.") return "Aguard. Pag.";
  if (normalized === "VENCIDO") return "Vencido";
  if (normalized === "PAGO") return "Pago";
  return "Pendente";
}

function formatPhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  const normalized =
    digits.length >= 12 && digits.startsWith("55") ? digits.slice(2) : digits;

  if (normalized.length === 11) {
    return normalized.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (normalized.length === 10) {
    return normalized.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return phone || "-";
}

function formatRefMonthLabel(refMonth: string): string {
  const match = (refMonth || "").match(/^(\d{2})-(\d{4})$/);
  if (!match) return refMonth || "-";

  const month = Number(match[1]);
  const year = Number(match[2]);
  if (
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isFinite(year)
  ) {
    return refMonth;
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("pt-BR", {
    month: "long",
  });

  return `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)} de ${year}`;
}

function formatStageLabel(stage: string): string {
  if (stage === "CALCULATED") return "Calculado";
  if (stage === "COPEL_UPLOADED") return "PDF Enviado";
  return stage || "-";
}

function normalizeInvoiceStatus(
  status: string | null | undefined,
):
  | "PAGO"
  | "VENCIDO"
  | "AGUARD. PAG."
  | "PENDENTE"
  | "SEM_COBRANCA"
  | "OUTRO" {
  const value = (status || "").trim().toUpperCase();
  if (!value) return "SEM_COBRANCA";

  if (
    value === "PAGO" ||
    value === "RECEIVED" ||
    value === "CONFIRMED" ||
    value === "PAYMENT_RECEIVED" ||
    value === "PAYMENT_CONFIRMED"
  ) {
    return "PAGO";
  }

  if (value === "VENCIDO" || value === "OVERDUE" || value === "PAYMENT_OVERDUE") {
    return "VENCIDO";
  }

  if (value === "AGUARD. PAG." || value === "AWAITING_PAYMENT") {
    return "AGUARD. PAG.";
  }

  if (value === "PENDENTE" || value === "PENDING") {
    return "PENDENTE";
  }

  return "OUTRO";
}

function formatInvoiceStatusLabel(status: string | null | undefined): string {
  const normalized = normalizeInvoiceStatus(status);
  if (normalized === "PAGO") return "Pago";
  if (normalized === "VENCIDO") return "Vencido";
  if (normalized === "AGUARD. PAG.") return "Aguard. Pag.";
  if (normalized === "PENDENTE") return "Pendente";
  if (normalized === "SEM_COBRANCA") return "Sem cobrança";
  return (status || "").trim() || "Sem cobrança";
}

function getInvoiceStatusBadgeClass(status: string | null | undefined): string {
  const normalized = normalizeInvoiceStatus(status);
  if (normalized === "PAGO") return "bg-emerald-100 text-emerald-800";
  if (normalized === "VENCIDO") return "bg-rose-100 text-rose-800";
  if (normalized === "AGUARD. PAG.") return "bg-blue-100 text-blue-800";
  if (normalized === "PENDENTE") return "bg-amber-100 text-amber-800";
  if (normalized === "SEM_COBRANCA") return "bg-slate-100 text-slate-700";
  return "bg-gray-100 text-gray-700";
}

function canOpenCalculation(stage: string): boolean {
  return stage === "CALCULATED";
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadingClientId, setUploadingClientId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [activeMenuClientId, setActiveMenuClientId] = useState<string | null>(
    null,
  );
  const [historyModalClient, setHistoryModalClient] =
    useState<ClientRow | null>(null);
  const [historyRows, setHistoryRows] = useState<
    MonthlyCalculationHistoryRow[]
  >([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadClients = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      try {
        const response = await fetch("/api/clients", { cache: "no-store" });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const payload = (await response.json()) as ClientsResponse;

        if (!response.ok || !payload.success) {
          setError(payload.error || "Erro ao carregar clientes.");
          return;
        }

        setClients(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setError("Erro de comunicação ao carregar clientes.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [router],
  );

  useEffect(() => {
    void loadClients(true);
  }, [loadClients]);

  useEffect(() => {
    function onEsc(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setHistoryModalClient(null);
      setActiveMenuClientId(null);
    }

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  async function handleUpload(clientId: string, file: File) {
    setUploadingClientId(clientId);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/clients/${clientId}/attachment`, {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        setError(payload.error || "Erro ao enviar PDF.");
        return;
      }

      setClients((prev) =>
        prev.map((client) =>
          client.id === clientId
            ? {
                ...client,
                hasAttachment: true,
                canCalculate: true,
              }
            : client,
        ),
      );
    } catch {
      setError("Erro de comunicação ao enviar PDF.");
    } finally {
      setUploadingClientId(null);
    }
  }

  async function openHistoryModal(client: ClientRow) {
    setActiveMenuClientId(null);
    setHistoryModalClient(client);
    setHistoryRows([]);
    setHistoryError(null);
    setIsHistoryLoading(true);

    try {
      const response = await fetch(`/api/clients/${client.id}/calculations`, {
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const payload =
        (await response.json()) as MonthlyCalculationHistoryResponse;

      if (!response.ok || !payload.success) {
        setHistoryError(payload.error || "Erro ao buscar histórico.");
        return;
      }

      setHistoryRows(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setHistoryError("Erro de comunicação ao buscar histórico.");
    } finally {
      setIsHistoryLoading(false);
    }
  }

  function closeHistoryModal() {
    setHistoryModalClient(null);
    setHistoryRows([]);
    setHistoryError(null);
    setIsHistoryLoading(false);
  }

  function openCalculationHistory(calculationId: string) {
    if (!historyModalClient) return;
    router.push(
      `/calculation/history?clientId=${encodeURIComponent(historyModalClient.id)}&calculationId=${encodeURIComponent(calculationId)}`,
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-2">
              Lista de clientes com upload de PDF e acesso ao cálculo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(isRefreshing || isLoading) && (
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            )}
            <SimulationPdfGenerator />
            <SignOutButton />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <div className="col-span-1">UC</div>
            <div className="col-span-2">Nome</div>
            <div className="col-span-2">Contato</div>
            <div className="col-span-1">Venc</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-3">PDF</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>

          {isLoading ? (
            <div className="px-4 py-10 text-center text-gray-500">
              Carregando...
            </div>
          ) : clients.length === 0 ? (
            <div className="px-4 py-10 text-center text-gray-500">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {clients.map((client) => {
                const isUploading = uploadingClientId === client.id;
                const normalizedStatus = normalizeStatus(client.status);

                return (
                  <div
                    key={client.id}
                    className="grid grid-cols-12 items-center gap-3 px-4 py-3"
                  >
                    <div className="col-span-1 text-sm font-medium text-gray-900">
                      {client.uc || "-"}
                    </div>
                    <div
                      className="col-span-2 truncate text-sm text-gray-800"
                      title={client.nome || "-"}
                    >
                      {client.nome || "-"}
                    </div>
                    <div className="col-span-2 text-sm text-gray-700">
                      {formatPhone(client.telefone)}
                    </div>
                    <div className="col-span-1 text-sm text-gray-700">
                      {client.vencimento || "-"}
                    </div>
                    <div className="col-span-1">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold leading-none ${
                          normalizedStatus === "PAGO"
                            ? "bg-emerald-100 text-emerald-800"
                            : normalizedStatus === "VENCIDO"
                              ? "bg-rose-100 text-rose-800"
                            : normalizedStatus === "AGUARD. PAG."
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {formatStatusLabel(client.status)}
                      </span>
                    </div>

                    <div className="col-span-3">
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2">
                        <div className="flex items-center gap-2">
                          {client.hasAttachment ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          )}
                          <span className="whitespace-nowrap text-xs font-semibold text-gray-700">
                            {client.hasAttachment ? "PDF OK" : "Sem PDF"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!client.canUpload && (
                            <span
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700"
                              title="Novo ciclo bloqueado até voltar para PENDENTE."
                            >
                              <Lock className="h-3 w-3" />
                              Bloqueado
                            </span>
                          )}

                          <label
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold ${
                              client.canUpload && !isUploading
                                ? "cursor-pointer border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                            }`}
                          >
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              disabled={isUploading || !client.canUpload}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (!file) return;
                                void handleUpload(client.id, file);
                                event.currentTarget.value = "";
                              }}
                            />
                            <Upload className="h-3.5 w-3.5" />
                            {isUploading
                              ? "Enviando..."
                              : client.hasAttachment
                                ? "Trocar"
                                : "Enviar"}
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 flex justify-end gap-2">
                      <div className="group relative inline-flex">
                        <button
                          disabled={!client.canCalculate}
                          onClick={() =>
                            router.push(
                              `/calculation?clientId=${encodeURIComponent(client.id)}`,
                            )
                          }
                          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                            client.canCalculate
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          Calcular
                        </button>

                        {!client.canCalculate &&
                          normalizedStatus === "PENDENTE" && (
                            <div className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 hidden w-52 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-[11px] text-gray-700 shadow-sm group-hover:block">
                              Envie o PDF da Copel para liberar o cálculo.
                            </div>
                          )}
                      </div>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuClientId((prev) =>
                              prev === client.id ? null : client.id,
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                          aria-label="Abrir ações"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuClientId === client.id && (
                          <div className="absolute right-0 top-10 z-20 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                            <button
                              onClick={() => void openHistoryModal(client)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <CalendarDays className="h-4 w-4 text-gray-500" />
                              Históricos de faturas
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {historyModalClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeHistoryModal}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Histórico de faturas
                </h2>
                <p className="text-sm text-gray-600">
                  {historyModalClient.nome || "Cliente"} (
                  {historyModalClient.uc || "-"})
                </p>
              </div>

              <button
                onClick={closeHistoryModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {isHistoryLoading ? (
                <div className="py-10 text-center text-gray-500">
                  <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-gray-500" />
                  Carregando histórico...
                </div>
              ) : historyError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {historyError}
                </div>
              ) : historyRows.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
                  Nenhum histórico encontrado para este cliente.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {historyRows.map((row) => (
                    <div
                      key={row.id}
                      className={`rounded-xl border p-4 ${
                        canOpenCalculation(row.stage)
                          ? "border-blue-200 bg-blue-50/40"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Mês de referência
                      </p>
                      <p className="mt-1 text-base font-semibold text-gray-900">
                        {formatRefMonthLabel(row.refMonth)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                          Etapa: {formatStageLabel(row.stage)}
                        </div>
                        <div
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getInvoiceStatusBadgeClass(row.invoiceStatus)}`}
                        >
                          Fatura: {formatInvoiceStatusLabel(row.invoiceStatus)}
                        </div>
                      </div>

                      <div className="mt-3">
                        <button
                          disabled={!canOpenCalculation(row.stage)}
                          onClick={() => openCalculationHistory(row.id)}
                          className={`w-full rounded-lg px-3 py-2 text-sm font-semibold ${
                            canOpenCalculation(row.stage)
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "cursor-not-allowed bg-gray-200 text-gray-500"
                          }`}
                        >
                          {canOpenCalculation(row.stage)
                            ? "Visualizar cálculo"
                            : "Cálculo não finalizado"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
