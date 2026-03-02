"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import ResultsDisplay from "@/components/ResultsDisplay";
import { ApiResponse, ResultadoFatura } from "../../../../types";

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
          <ResultsDisplay response={response} readOnly />
        ) : null}
      </div>
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
