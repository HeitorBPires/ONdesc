"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Loader2, Sparkles, X } from "lucide-react";
import {
  DEFAULT_DESCONTO_PERCENTUAL,
  extractSimulationInputFromForm,
  normalizeIsoDateToBr,
  SimulationFormValues,
} from "@/lib/simulation/simulation-data";

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
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function getTodayIsoDate(): string {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const INITIAL_FORM_VALUES: SimulationFormValues = {
  nomeCliente: "",
  data: getTodayIsoDate(),
  valorMedioFatura: "",
  descontoPercentual: String(DEFAULT_DESCONTO_PERCENTUAL),
  economiaMensal: "",
  economiaAnual: "",
};

const REQUIRED_FIELDS = [
  { key: "nomeCliente", label: "Nome do cliente" },
  { key: "data", label: "Data" },
  { key: "valorMedioFatura", label: "Valor médio da fatura" },
  { key: "descontoPercentual", label: "Desconto percentual" },
] as const;

export function SimulationPdfGenerator() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("simulacao-economia-ondesc.pdf");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SimulationFormValues>(INITIAL_FORM_VALUES);

  const payload = useMemo(() => {
    const normalizedDate = normalizeIsoDateToBr(form.data);
    return extractSimulationInputFromForm({
      ...form,
      data: normalizedDate,
    });
  }, [form]);

  useEffect(() => {
    if (!isOpen) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
    }

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function replacePreviewUrl(nextUrl: string | null) {
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        window.URL.revokeObjectURL(currentUrl);
      }
      return nextUrl;
    });
  }

  function updateFormField(
    field: keyof SimulationFormValues,
    value: string,
  ): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function getMissingRequiredLabels(values: SimulationFormValues): string[] {
    return REQUIRED_FIELDS.filter(({ key }) => !values[key].trim()).map(
      ({ label }) => label,
    );
  }

  async function generatePreview(options?: { shouldDownload?: boolean }) {
    const missingRequired = getMissingRequiredLabels(form);
    if (missingRequired.length > 0) {
      setError(
        `Preencha os campos obrigatórios: ${missingRequired.join(", ")}.`,
      );
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/simulation-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(errorPayload?.error || "Erro ao gerar simulação em PDF.");
        return;
      }

      const contentType = response.headers.get("Content-Type") || "";
      if (!contentType.includes("application/pdf")) {
        setError("Resposta inesperada ao gerar PDF.");
        return;
      }

      const blob = await response.blob();
      const nextFilename = extractFilename(
        response.headers.get("Content-Disposition"),
        "simulacao-economia-ondesc.pdf",
      );
      const nextPreviewUrl = window.URL.createObjectURL(blob);

      setFilename(nextFilename);
      replacePreviewUrl(nextPreviewUrl);

      if (options?.shouldDownload) {
        triggerDownload(blob, nextFilename);
      }
    } catch {
      setError("Falha de comunicação ao gerar PDF.");
    } finally {
      setIsGenerating(false);
    }
  }

  function openModal() {
    setIsOpen(true);
    setError(null);
  }

  function closeModal() {
    setIsOpen(false);
    setError(null);
  }

  function handleDownload() {
    const missingRequired = getMissingRequiredLabels(form);
    if (missingRequired.length > 0) {
      setError(
        `Preencha os campos obrigatórios: ${missingRequired.join(", ")}.`,
      );
      return;
    }

    if (!previewUrl) {
      void generatePreview({ shouldDownload: true });
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = previewUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-lg bg-[#203447] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162636]"
      >
        <Sparkles className="h-4 w-4" />
        Gerar Simulação (PDF)
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6"
          onClick={closeModal}
        >
          <div
            className="grid h-full max-h-[95vh] w-full max-w-6xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl md:grid-cols-[360px_1fr]"
            onClick={(event) => event.stopPropagation()}
          >
            <aside className="overflow-y-auto border-b border-slate-200 bg-slate-50 p-5 md:border-b-0 md:border-r">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#203447]">
                    Simulação de Economia
                  </h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Preencha os dados e gere o PDF.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                  aria-label="Fechar modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nome do cliente *
                  </label>
                  <input
                    type="text"
                    value={form.nomeCliente}
                    onChange={(event) =>
                      updateFormField("nomeCliente", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#203447]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={(event) =>
                      updateFormField("data", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#203447]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Valor médio da fatura (R$) *
                  </label>
                  <input
                    type="text"
                    value={form.valorMedioFatura}
                    onChange={(event) =>
                      updateFormField("valorMedioFatura", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#203447]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Desconto percentual (%) *
                  </label>
                  <input
                    type="text"
                    value={form.descontoPercentual}
                    onChange={(event) =>
                      updateFormField("descontoPercentual", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#203447]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Economia mensal (opcional)
                  </label>
                  <input
                    type="text"
                    value={form.economiaMensal}
                    onChange={(event) =>
                      updateFormField("economiaMensal", event.target.value)
                    }
                    placeholder="Deixe em branco para cálculo automático"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#203447]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Economia anual (opcional)
                  </label>
                  <input
                    type="text"
                    value={form.economiaAnual}
                    onChange={(event) =>
                      updateFormField("economiaAnual", event.target.value)
                    }
                    placeholder="Deixe em branco para cálculo automático"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#203447]"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-5 grid grid-cols-1 gap-2">
                <button
                  onClick={() => void generatePreview()}
                  disabled={isGenerating}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#203447] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162636] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Atualizar preview
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#95be4d] bg-[#95be4d] px-4 py-2 text-sm font-semibold text-[#1f2c11] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </button>
              </div>
            </aside>

            <section className="relative bg-slate-100 p-3">
              <div className="flex h-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                {previewUrl ? (
                  <iframe
                    src={previewUrl}
                    title="Preview da simulação em PDF"
                    className="h-full min-h-[560px] w-full"
                  />
                ) : (
                  <div className="px-6 text-center text-sm text-slate-500">
                    Nenhum preview disponível.
                  </div>
                )}
              </div>

              {isGenerating && (
                <div className="absolute inset-3 flex items-center justify-center rounded-xl bg-white/70">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-[#203447]" />
                    Gerando PDF...
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
