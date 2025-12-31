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
  const [taxaEnergia, setTaxaEnergia] = useState(0.51);
  const [showTaxaConfig, setShowTaxaConfig] = useState(false);
  const [tempTaxa, setTempTaxa] = useState("0.51");

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setApiResponse(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tarifa", taxaEnergia.toString());

    try {
      const response = await fetch("/api/copel", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      console.log("📥 Resposta da API:", result);

      setApiResponse(result);
    } catch (err) {
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
    const newTaxa = parseFloat(tempTaxa.replace(",", "."));
    if (!isNaN(newTaxa) && newTaxa > 0) {
      setTaxaEnergia(newTaxa);
      setShowTaxaConfig(false);
      // Se já tem dados, reprocessar com nova taxa
      if (apiResponse?.data) {
        setApiResponse({
          ...apiResponse,
          data: {
            ...apiResponse.data,
            taxaEnergia: newTaxa,
          },
        });
      }
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Calculadora Copel
              </h1>
              <p className="text-gray-600">
                Calcule o valor da fatura com energia solar compensada
              </p>
            </div>

            {/* Botão de Configuração da Taxa */}
            <button
              onClick={() => setShowTaxaConfig(!showTaxaConfig)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Configurar taxa de energia"
            >
              <Settings className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Taxa: R$ {taxaEnergia.toFixed(2)}
              </span>
            </button>
          </div>

          {/* Painel de Configuração da Taxa */}
          {showTaxaConfig && (
            <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Configurar Taxa de Energia (R$/kWh)
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={tempTaxa}
                  onChange={(e) => setTempTaxa(e.target.value)}
                  className="flex-1 px-3 text-gray-700 placeholder:text-yellow-50 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.51"
                />
                <button
                  onClick={handleSaveTaxa}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setShowTaxaConfig(false);
                    setTempTaxa(taxaEnergia.toString());
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use ponto (.) ou vírgula (,) como separador decimal
              </p>
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="mb-8">
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
              <p className="text-gray-600 font-medium">Processando fatura...</p>
              <p className="text-sm text-gray-500 mt-1">
                Extraindo dados e calculando valores
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
