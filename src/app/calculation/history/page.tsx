"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Eye, Loader2, X } from "lucide-react";
import ResultsDisplay from "@/components/ResultsDisplay";
import { ApiResponse, ResultadoFatura } from "../../../../types";

function extractFilename(
  contentDisposition: string | null,
  fallback: string,
): string {
  if (!contentDisposition) return fallback;
  const match = contentDisposition.match(/filename="(.+)"/);
  if (!match?.[1]) return fallback;
  return match[1];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function HistoryCalculationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = useMemo(
    () => searchParams.get("clientId")?.trim() || "",
    [searchParams],
  );
  const calculationId = useMemo(
    () => searchParams.get("calculationId")?.trim() || "",
    [searchParams],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [response, setResponse] = useState<ApiResponse<ResultadoFatura> | null>(
    null,
  );
  const [isCopelDownloading, setIsCopelDownloading] = useState(false);
  const [isOndescModalOpen, setIsOndescModalOpen] = useState(false);
  const [isOndescLoading, setIsOndescLoading] = useState(false);
  const [ondescViewerError, setOndescViewerError] = useState<string | null>(
    null,
  );
  const [ondescPdfUrl, setOndescPdfUrl] = useState<string | null>(null);
  const [ondescFilename, setOndescFilename] = useState("fatura-ondesc.pdf");
  const [documentActionError, setDocumentActionError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function loadCalculation() {
      if (!clientId || !calculationId) {
        setResponse({
          success: false,
          errors: [
            {
              field: "params",
              message: "Parâmetros inválidos para visualizar histórico.",
              level: "critical",
            },
          ],
          data: null,
        });
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/clients/${encodeURIComponent(clientId)}/calculations/${encodeURIComponent(calculationId)}`,
          { cache: "no-store" },
        );

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        const payload = (await res.json()) as
          | ApiResponse<ResultadoFatura>
          | { success?: boolean; error?: string };

        if (!res.ok) {
          const errorMessage =
            "error" in payload
              ? payload.error || "Erro ao carregar histórico."
              : "Erro ao carregar histórico.";

          setResponse({
            success: false,
            errors: [
              {
                field: "history",
                message: errorMessage,
                level: "critical",
              },
            ],
            data: null,
          });
          return;
        }

        setResponse(payload as ApiResponse<ResultadoFatura>);
      } catch {
        setResponse({
          success: false,
          errors: [
            {
              field: "network",
              message: "Erro de comunicação ao carregar histórico.",
              level: "critical",
            },
          ],
          data: null,
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadCalculation();
  }, [calculationId, clientId, router]);

  useEffect(() => {
    return () => {
      if (ondescPdfUrl) {
        window.URL.revokeObjectURL(ondescPdfUrl);
      }
    };
  }, [ondescPdfUrl]);

  function replaceOndescUrl(nextUrl: string | null) {
    setOndescPdfUrl((currentUrl) => {
      if (currentUrl) {
        window.URL.revokeObjectURL(currentUrl);
      }

      return nextUrl;
    });
  }

  async function handleDownloadCopel() {
    if (!clientId || !calculationId) return;

    setDocumentActionError(null);
    setIsCopelDownloading(true);

    try {
      const res = await fetch(
        `/api/clients/${encodeURIComponent(clientId)}/calculations/${encodeURIComponent(calculationId)}/copel-pdf`,
      );

      if (res.status === 401) {
        router.replace("/login");
        setIsCopelDownloading(false);
        return;
      }

      const contentType = res.headers.get("Content-Type") || "";

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        const message = payload?.error || "Erro ao baixar fatura Copel.";
        setIsCopelDownloading(false);
        setDocumentActionError(message);
        return;
      }

      if (!contentType.includes("application/pdf")) {
        setIsCopelDownloading(false);
        setDocumentActionError("Resposta inesperada ao baixar fatura Copel.");
        return;
      }

      const blob = await res.blob();
      const filename = extractFilename(
        res.headers.get("Content-Disposition"),
        "fatura-copel.pdf",
      );
      triggerDownload(blob, filename);
      setIsCopelDownloading(false);
    } catch {
      setIsCopelDownloading(false);
      setDocumentActionError("Erro inesperado ao baixar fatura Copel.");
    }
  }

  async function handleOpenOndescModal() {
    if (!clientId || !calculationId) return;

    setDocumentActionError(null);
    setIsOndescModalOpen(true);
    setIsOndescLoading(true);
    setOndescViewerError(null);

    try {
      const res = await fetch(
        `/api/clients/${encodeURIComponent(clientId)}/calculations/${encodeURIComponent(calculationId)}/ondesc-pdf`,
      );

      if (res.status === 401) {
        router.replace("/login");
        setIsOndescLoading(false);
        return;
      }

      const contentType = res.headers.get("Content-Type") || "";

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setOndescViewerError(payload?.error || "Erro ao carregar fatura ONDESC.");
        setIsOndescLoading(false);
        return;
      }

      if (!contentType.includes("application/pdf")) {
        setOndescViewerError("Resposta inesperada ao carregar fatura ONDESC.");
        setIsOndescLoading(false);
        return;
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const filename = extractFilename(
        res.headers.get("Content-Disposition"),
        "fatura-ondesc.pdf",
      );

      replaceOndescUrl(blobUrl);
      setOndescFilename(filename);
      setIsOndescLoading(false);
    } catch {
      setOndescViewerError("Erro inesperado ao carregar fatura ONDESC.");
      setIsOndescLoading(false);
    }
  }

  function closeOndescModal() {
    setIsOndescModalOpen(false);
    setIsOndescLoading(false);
    setOndescViewerError(null);
    replaceOndescUrl(null);
  }

  function handleDownloadOndescFromModal() {
    if (!ondescPdfUrl) return;

    const a = document.createElement("a");
    a.href = ondescPdfUrl;
    a.download = ondescFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const historyData = response?.data || null;
  const referenciaLabel = historyData?.dadosUsuario?.mesReferencia || "Competência";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Histórico de cálculo
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Visualização dos dados já calculados para o mês selecionado.
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />
            <p className="mt-3 text-sm text-gray-600">Carregando cálculo...</p>
          </div>
        ) : response ? (
          <>
            {historyData && (
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Documentos da competência
                    </h3>
                    <p className="text-sm text-slate-600">
                      Baixe a fatura Copel ou visualize a fatura ONDESC.
                    </p>
                    {documentActionError && (
                      <p className="mt-2 text-sm font-medium text-red-700">
                        {documentActionError}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => void handleDownloadCopel()}
                      disabled={isCopelDownloading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCopelDownloading ? (
                        <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Baixar Fatura Copel
                    </button>

                    <button
                      onClick={() => void handleOpenOndescModal()}
                      disabled={isOndescLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isOndescLoading ? (
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      Fatura ONDESC
                    </button>
                  </div>
                </div>
              </div>
            )}

            <ResultsDisplay response={response} readOnly />
          </>
        ) : null}
      </div>

      {isOndescModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 px-3 py-3 md:px-6 md:py-6"
          onClick={closeOndescModal}
        >
          <div
            className="mx-auto flex h-full w-full max-w-6xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Fatura ONDESC - {referenciaLabel}
                </h2>
                <p className="text-sm text-slate-600">
                  Preview do PDF salvo no storage.
                </p>
              </div>

              <button
                onClick={closeOndescModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-100 px-4 py-4 md:px-6">
              <div className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {isOndescLoading ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-600">
                    <span className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
                    <p className="text-sm font-medium">Carregando PDF...</p>
                  </div>
                ) : ondescViewerError ? (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <p className="text-sm font-semibold text-red-700">
                      Não foi possível carregar a fatura ONDESC.
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{ondescViewerError}</p>
                    <button
                      onClick={() => void handleOpenOndescModal()}
                      className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : ondescPdfUrl ? (
                  <iframe
                    src={ondescPdfUrl}
                    title="Preview fatura ONDESC"
                    className="h-full w-full"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    PDF indisponível para visualização.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                onClick={closeOndescModal}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Fechar
              </button>
              <button
                onClick={handleDownloadOndescFromModal}
                disabled={!ondescPdfUrl || isOndescLoading || Boolean(ondescViewerError)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function HistoryCalculationPage() {
  return (
    <Suspense fallback={null}>
      <HistoryCalculationPageContent />
    </Suspense>
  );
}
