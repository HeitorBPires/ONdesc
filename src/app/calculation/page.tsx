"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Settings } from "lucide-react";
import ResultsDisplay from "@/components/ResultsDisplay";
import { ApiResponse, ResultadoFatura } from "../../../types";
import { SignOutButton } from "@/components/auth/SignOutButton";

type CalculationMode = "automatico" | "taxa" | "porcentagem";

export default function CalculationPage() {
  return (
    <Suspense fallback={null}>
      <CalculationPageContent />
    </Suspense>
  );
}

function CalculationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = useMemo(
    () => searchParams.get("clientId")?.trim() || "",
    [searchParams],
  );

  const [apiResponse, setApiResponse] =
    useState<ApiResponse<ResultadoFatura> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [modoCalculo, setModoCalculo] = useState<CalculationMode>("automatico");
  const [taxaEnergia, setTaxaEnergia] = useState<number | undefined>(undefined);
  const [porcentagemDesejada, setPorcentagemDesejada] = useState<
    number | undefined
  >(undefined);
  const [tempTaxa, setTempTaxa] = useState("");
  const [tempPorcentagem, setTempPorcentagem] = useState(13);

  const runCalculation = useCallback(
    async (options?: {
      modoCalculo?: CalculationMode;
      tarifa?: number;
      porcentagem?: number;
    }) => {
      if (!clientId) {
        setApiResponse({
          success: false,
          errors: [
            {
              field: "clientId",
              message: "clientId inválido",
              level: "critical",
            },
          ],
        });
        return;
      }

      setIsProcessing(true);
      setApiResponse(null);

      try {
        const response = await fetch("/api/calculation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId,
            ...options,
          }),
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const result = (await response.json()) as ApiResponse<ResultadoFatura>;
        setApiResponse(result);
      } catch {
        setApiResponse({
          success: false,
          errors: [
            {
              field: "network",
              message: "Erro de comunicação com o servidor",
              level: "critical",
            },
          ],
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [clientId, router],
  );

  useEffect(() => {
    void runCalculation();
  }, [runCalculation]);

  useEffect(() => {
    const data = apiResponse?.data;
    if (!data) return;

    const mode = data.modoCalculo ?? "automatico";
    setModoCalculo(mode);

    if (mode === "taxa" && typeof data.tarifaNovaFatura === "number") {
      setTaxaEnergia(data.tarifaNovaFatura);
      setTempTaxa(String(data.tarifaNovaFatura));
      return;
    }

    if (
      mode === "porcentagem" &&
      typeof data.porcentagemDesejada === "number"
    ) {
      setPorcentagemDesejada(data.porcentagemDesejada);
      setTempPorcentagem(data.porcentagemDesejada);
      return;
    }

    setTaxaEnergia(undefined);
    setPorcentagemDesejada(undefined);
  }, [apiResponse]);

  async function handleRecalculate() {
    if (modoCalculo === "taxa") {
      if (taxaEnergia === undefined || !Number.isFinite(taxaEnergia)) {
        return;
      }

      await runCalculation({
        modoCalculo: "taxa",
        tarifa: taxaEnergia,
      });
      return;
    }

    if (modoCalculo === "porcentagem") {
      if (
        porcentagemDesejada === undefined ||
        !Number.isFinite(porcentagemDesejada)
      ) {
        return;
      }

      await runCalculation({
        modoCalculo: "porcentagem",
        porcentagem: porcentagemDesejada,
      });
      return;
    }

    await runCalculation({
      modoCalculo: "automatico",
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Cálculo</h1>
              <p className="text-gray-600">
                Resultado calculado com base no PDF anexado ao cliente.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfig((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 text-blue-600" />
                Configurar desconto
              </button>
              <button
                onClick={() => router.push("/")}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Voltar
              </button>
              <SignOutButton />
            </div>
          </div>

          {showConfig && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 space-y-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Ajuste do cálculo
              </h3>
              <p className="text-sm text-gray-500">
                Você pode recalcular quantas vezes quiser.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => {
                    setModoCalculo("automatico");
                    setTaxaEnergia(undefined);
                    setPorcentagemDesejada(undefined);
                  }}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    modoCalculo === "automatico"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-semibold text-gray-900">Automático</span>
                  <p className="text-sm text-gray-600 mt-1">
                    Usa regra automática do sistema.
                  </p>
                </div>

                <div
                  onClick={() => {
                    setModoCalculo("porcentagem");
                    setTaxaEnergia(undefined);
                  }}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    modoCalculo === "porcentagem"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-semibold text-gray-900">
                    Escolher desconto
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Defina a porcentagem desejada (12% a 15%).
                  </p>

                  {modoCalculo === "porcentagem" && (
                    <div className="mt-4">
                      <input
                        type="range"
                        min={12}
                        max={15}
                        step={0.1}
                        value={tempPorcentagem}
                        onChange={(e) =>
                          setTempPorcentagem(Number(e.target.value))
                        }
                        className="w-full"
                      />
                      <p className="text-sm font-semibold text-green-700 mt-1">
                        {tempPorcentagem.toFixed(1)}% de desconto
                      </p>

                      <button
                        onClick={() => {
                          setPorcentagemDesejada(tempPorcentagem);
                        }}
                        className="mt-3 w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                      >
                        Aplicar porcentagem
                      </button>
                    </div>
                  )}
                </div>

                <div
                  onClick={() => {
                    setModoCalculo("taxa");
                    setPorcentagemDesejada(undefined);
                  }}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    modoCalculo === "taxa"
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-semibold text-gray-900">
                    Informar taxa
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Defina a tarifa manual.
                  </p>

                  {modoCalculo === "taxa" && (
                    <div className="mt-4 flex gap-2">
                      <input
                        type="text"
                        value={tempTaxa}
                        onChange={(e) => setTempTaxa(e.target.value)}
                        placeholder="0.51"
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button
                        onClick={() => {
                          const value = Number(
                            tempTaxa.replace(",", ".").trim(),
                          );

                          if (!Number.isFinite(value) || value <= 0) {
                            return;
                          }

                          setTaxaEnergia(value);
                        }}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => void handleRecalculate()}
                  disabled={isProcessing}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Recalculando..." : "Recalcular"}
                </button>
              </div>
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-sm text-gray-600">Processando cálculo...</p>
          </div>
        )}

        {apiResponse && <ResultsDisplay response={apiResponse} />}
      </div>
    </main>
  );
}
