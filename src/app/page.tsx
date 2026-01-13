"use client";

import { useState } from "react";
import ResultsDisplay from "@/components/ResultsDisplay";

import { Loader2, Settings } from "lucide-react";
import PDFUploader from "@/components/PDFUploader";
import { ApiResponse, ResultadoFatura } from "../../types";

export default function Home() {
  const [apiResponse, setApiResponse] =
    useState<ApiResponse<ResultadoFatura> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modoCalculo, setModoCalculo] = useState<
    "automatico" | "taxa" | "porcentagem"
  >("automatico");

  const [taxaEnergia, setTaxaEnergia] = useState<number | undefined>(undefined);
  const [porcentagemDesejada, setPorcentagemDesejada] = useState<
    number | undefined
  >(undefined);
  const [showConfig, setShowConfig] = useState(false);

  const [tempTaxa, setTempTaxa] = useState("");
  const [tempPorcentagem, setTempPorcentagem] = useState(13);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setApiResponse(null);

    const formData = new FormData();
    formData.append("file", file);

    if (modoCalculo === "taxa" && taxaEnergia !== undefined) {
      formData.append("tarifa", taxaEnergia.toString());
    }

    if (modoCalculo === "porcentagem" && porcentagemDesejada !== undefined) {
      formData.append("porcentagem", porcentagemDesejada.toString());
    }

    try {
      const response = await fetch("/api/copel", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
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
  };

  const handleSaveTaxa = () => {
    if (!tempTaxa) return;
    const newTaxa = parseFloat(tempTaxa.replace(",", "."));
    if (!isNaN(newTaxa) && newTaxa > 0) {
      setTaxaEnergia(newTaxa);
      setShowConfig(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Calculadora de Fatura Copel
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl">
                Calcule a fatura com energia solar compensada e veja quanto os
                resultados.
              </p>
            </div>

            {/* Botão de Configuração */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition shadow-sm"
            >
              <Settings className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">
                Configurar desconto
              </span>
            </button>
          </div>

          {/* Painel de Configuração da Taxa */}
          {showConfig && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 space-y-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Como você quer definir o desconto?
              </h3>
              <p className="text-sm text-gray-500">
                Escolha a opção que faz mais sentido para você
              </p>

              {/* GRID DE OPÇÕES */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* AUTOMÁTICO */}
                <div
                  onClick={() => {
                    setModoCalculo("automatico");
                    setTaxaEnergia(undefined);
                    setPorcentagemDesejada(undefined);
                  }}
                  className={`cursor-pointer rounded-xl border p-4 transition
          ${
            modoCalculo === "automatico"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      Automático
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Calculamos automaticamente a melhor tarifa (12% a 15% de
                    desconto).
                  </p>
                </div>

                {/* PORCENTAGEM */}
                <div
                  onClick={() => {
                    setModoCalculo("porcentagem");
                    setTaxaEnergia(undefined);
                  }}
                  className={`cursor-pointer rounded-xl border p-4 transition
          ${
            modoCalculo === "porcentagem"
              ? "border-green-500 bg-green-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
                >
                  <span className="font-semibold text-gray-900">
                    Escolher desconto
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Defina quanto quer economizar (entre 1% e 15%).
                  </p>

                  {modoCalculo === "porcentagem" && (
                    <div className="mt-4">
                      <input
                        type="range"
                        min={1}
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
                          setShowConfig(false);
                        }}
                        className="mt-3 w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                      >
                        Aplicar desconto
                      </button>
                    </div>
                  )}
                </div>

                {/* TAXA */}
                <div
                  onClick={() => {
                    setModoCalculo("taxa");
                    setPorcentagemDesejada(undefined);
                  }}
                  className={`cursor-pointer rounded-xl border p-4 transition
          ${
            modoCalculo === "taxa"
              ? "border-yellow-500 bg-yellow-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
                >
                  <span className="font-semibold text-gray-900">
                    Informar taxa
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Opção avançada para quem já sabe a taxa exata.
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
                          const v = parseFloat(tempTaxa.replace(",", "."));
                          if (!isNaN(v) && v > 0) {
                            setTaxaEnergia(v);
                            setShowConfig(false);
                          }
                        }}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-10 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Envie sua fatura da Copel
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            O arquivo deve estar em PDF.
          </p>

          <PDFUploader
            onFileSelect={handleFileSelect}
            isProcessing={isProcessing}
          />
        </div>

        {/* Loading */}
        {isProcessing && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-700 font-medium">Calculando fatura...</p>
              <p className="text-sm text-gray-500 mt-1">
                Isso leva apenas alguns segundos
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {apiResponse && !isProcessing && (
          <ResultsDisplay response={apiResponse} />
        )}

        {/* Instruções Iniciais */}
        {!apiResponse && !isProcessing && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Como funciona?</h3>
            <ol className="text-left text-gray-600 space-y-2 max-w-2xl mx-auto">
              <li className="flex gap-2">
                <span className="font-semibold text-blue-500">1.</span>
                <span>Faça upload do PDF da sua fatura da Copel</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-500">2.</span>
                <span>
                  A ferramenta extrai automaticamente os dados da fatura
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-500">3.</span>
                <span>
                  Calcula o novo valor considerando a energia solar compensada
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-500">4.</span>
                <span>Mostra o desconto obtido com a energia injetada</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </main>
  );
}
