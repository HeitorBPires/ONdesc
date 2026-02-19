"use client";

import {
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Hash,
  TrendingUp,
  Zap,
} from "lucide-react";

import { ApiResponse, ApiError, ResultadoFatura } from "../../types";

import {
  formatarKwh,
  formatarMoeda,
  formatarNumeroBR,
} from "../../lib/formatValues";
import { ClienteCard } from "./ClientCard";
import { ValidationAlert } from "./ValidationAlert";
import { CriticalErrorState } from "./CriticalErrorState";
import { CopyableCard } from "./CopyableCard";
import { CopyButton } from "./CopyButton";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/navigation";

interface ResultsDisplayProps {
  response: ApiResponse<ResultadoFatura>;
}

function splitErrors(errors: ApiError[] = []) {
  return {
    critical: errors.filter((e) => e.level === "critical"),
    warning: errors.filter((e) => e.level === "warning"),
  };
}

function errorToast(message: string) {
  toast(
    () => (
      <div className="flex flex-col">
        <span className="font-semibold">Erro</span>
        <span className="text-sm">{message}</span>
      </div>
    ),
    {
      type: "error",
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "light",
    },
  );
}

export default function ResultsDisplay({
  response,
}: ResultsDisplayProps) {
  const router = useRouter();
  const { critical, warning } = splitErrors(response.errors);
  const [isGenerating, setIsGenerating] = useState(false);

  if (critical.length > 0 || !response.data) {
    return (
      <CriticalErrorState
        message={critical.map((e) => e.message).join(" • ")}
      />
    );
  }

  const data = response.data;

  async function handleGenerateBoleto() {
    try {
      setIsGenerating(true);
      if (!data.clientId) {
        errorToast("clientId inválido para gerar boleto.");
        setIsGenerating(false);
        return;
      }

      const formData = new FormData();
      formData.append("clientId", data.clientId);
      formData.append(
        "monthlyCalculationId",
        data.monthlyCalculationId ? String(data.monthlyCalculationId) : "",
      );

      formData.append(
        "data",
        JSON.stringify({
          cliente: data.dadosUsuario?.cliente,
          uc: data.dadosUsuario?.uc,
          valorFatura: formatarNumeroBR(data.valorNovaFatura),
          vencimento: data.dadosUsuario?.vencimento,
          mesReferencia: data.dadosUsuario?.mesReferencia,
          porcentagemDesconto: formatarNumeroBR(data.porcentagemDesconto),
          descontoUsuario: formatarNumeroBR(data.descontoUsuario),
          tarifaCopel: formatarNumeroBR(data.tarifaCopel),
          tarifaOndesc: formatarNumeroBR(data.tarifaNovaFatura as number),
          consumoMes: data.consumoMes.toFixed(0),
          energiaInjetada: data.energiaInjetadaKwh.toFixed(0),
          valorSemOndesc: formatarNumeroBR(data.valorSemDesconto),
          valorTotalComOndesc: formatarNumeroBR(data.valorTotal),
        }),
      );

      const res = await fetch("/api/ondesc-invoice", {
        method: "POST",
        body: formData,
      });

      if (res.status === 401) {
        router.replace("/login");
        setIsGenerating(false);
        return;
      }

      const contentType = res.headers.get("Content-Type") || "";

      // ✅ Se deu erro no backend (400/422/500 etc)
      if (!res.ok) {
        let errorMessage = "Erro ao gerar PDF.";
        try {
          if (contentType.includes("application/json")) {
            const errJson = await res.json();
            errorMessage = errJson?.error || errorMessage;
            console.error("Erro backend:", errJson);
          } else {
            const errText = await res.text();
            console.error("Erro backend (text):", errText);
            errorMessage = errText || errorMessage;
          }
        } catch (e) {
          console.error("Falha ao ler resposta de erro:", e);
        }

        errorToast(errorMessage);
        setIsGenerating(false);
        return;
      }

      if (!contentType.includes("application/pdf")) {
        const text = await res.text().catch(() => "");
        console.error("Resposta inesperada:", contentType, text);
        errorToast("Resposta inesperada do servidor. Não veio PDF.");
        setIsGenerating(false);
        return;
      }

      const blob = await res.blob();

      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = "arquivo.pdf";

      if (contentDisposition) {
        // pega o filename="..."
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match?.[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      setIsGenerating(false);
      router.push("/");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      errorToast("Erro inesperado ao gerar PDF.");
      setIsGenerating(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* ⚠️ Warnings */}
      {warning.length > 0 && <ValidationAlert errors={warning} />}

      {/* Header - Metadados da Fatura */}
      {data.dadosUsuario &&
        (data.dadosUsuario.uc || data.dadosUsuario.mesReferencia) && (
          <div className="flex flex-wrap gap-4">
            {data.dadosUsuario.uc && (
              <div className="flex items-center gap-3 bg-white rounded-lg px-5 py-4 border border-gray-200">
                <div className="bg-blue-50 rounded-md p-2">
                  <Hash className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                    Unidade Consumidora
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {data.dadosUsuario.uc}
                  </p>
                </div>
              </div>
            )}

            {data.dadosUsuario.mesReferencia && (
              <div className="flex items-center gap-3 bg-white rounded-lg px-5 py-4 border border-gray-200">
                <div className="bg-purple-50 rounded-md p-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                    Mês de Referência
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {data.dadosUsuario.mesReferencia}
                  </p>
                </div>
              </div>
            )}
            {data.dadosUsuario?.vencimento && (
              <div className="flex items-center gap-3 bg-white rounded-lg px-5 py-4 border border-gray-200 w-max">
                <div className="bg-green-50 rounded-md p-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                    Vencimento
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {data.dadosUsuario.vencimento}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Dados do Cliente */}
      {data.dadosUsuario?.cliente && (
        <ClienteCard cliente={data.dadosUsuario.cliente} />
      )}

      {/* Tarifa aplicada + modo do cálculo (unificado) */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-slate-50 to-white px-5 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Esquerda - Tarifa aplicada */}
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-lg p-2 border border-blue-200">
              <Zap className="h-5 w-5 text-blue-700" />
            </div>

            <div>
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                Tarifa aplicada
              </p>

              <div className="mt-0.5 flex flex-wrap items-end gap-2">
                <p className="text-2xl font-bold text-blue-950 leading-none">
                  {formatarMoeda(
                    data.tarifaNovaFatura ? data.tarifaNovaFatura : 0,
                  )}
                </p>

                <span className="text-sm font-semibold text-blue-700 mb-[2px]">
                  / kWh
                </span>
              </div>

              <p className="mt-1 text-[11px] text-blue-700/80 leading-snug">
                Base de cálculo utilizada na energia injetada.
              </p>
            </div>
          </div>

          {/* Direita - Resumo do cálculo */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Resumo do cálculo
            </p>

            <div className="flex flex-wrap gap-2">
              {/* Chip Modo */}
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm">
                <span className="text-slate-500">Modo:</span>{" "}
                <span className="font-semibold text-slate-800">
                  {data.modoCalculo === "automatico" && "Automático"}
                  {data.modoCalculo === "porcentagem" && "Desconto desejado"}
                  {data.modoCalculo === "taxa" && "Taxa manual"}
                </span>
              </span>

              {/* Chip porcentagem (somente se existir) */}
              {!!data.porcentagemDesejada &&
                data.modoCalculo === "porcentagem" && (
                  <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs text-green-800 shadow-sm">
                    <span className="text-green-700/70">Desconto:</span>{" "}
                    <span className="font-bold text-green-900">
                      {data.porcentagemDesejada.toFixed(1)}%
                    </span>
                  </span>
                )}
            </div>
          </div>
        </div>

        {/* Linha inferior - info curta */}
        <div className="mt-4 border-t border-blue-100 pt-3">
          <p className="text-[11px] leading-snug text-slate-500">
            A tarifa é definida automaticamente para obter o melhor resultado
            dentro das regras do cálculo.
          </p>
        </div>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CopyableCard valueToCopy={formatarMoeda(data.valorNovaFatura)}>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Fatura ONDesc</h3>
            </div>
            <p className="text-4xl font-bold mb-1">
              {formatarMoeda(data.valorNovaFatura)}
            </p>
            <p className="text-blue-100 text-sm">
              Valor calculado com energia injetada
            </p>
          </div>
        </CopyableCard>

        <CopyableCard
          valueToCopy={formatarMoeda(Math.abs(data.descontoUsuario))}
        >
          <div className="rounded-xl p-6 text-white shadow-lg bg-linear-to-br from-green-500 to-green-600">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Desconto</h3>
            </div>
            <p className="text-4xl font-bold mb-1">
              {formatarMoeda(Math.abs(data.descontoUsuario))}
            </p>
            <p className="text-sm font-medium text-green-100">
              {data.porcentagemDesconto.toFixed(1)}% de Economia
            </p>
          </div>
        </CopyableCard>

        <CopyableCard valueToCopy={formatarMoeda(data.valorTotal)}>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Total a Pagar</h3>
            </div>
            <p className="text-4xl font-bold mb-1">
              {formatarMoeda(data.valorTotal)}
            </p>
            <p className="text-purple-100 text-sm">
              Fatura ONdesc + Fatura Copel
            </p>
          </div>
        </CopyableCard>
      </div>

      {/* Cards Informativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h4 className="font-medium text-gray-700">Energia Injetada</h4>

            <CopyButton value={formatarKwh(data.energiaInjetadaKwh)} />
          </div>

          <p className="text-2xl font-bold text-gray-900">
            {formatarKwh(data.energiaInjetadaKwh)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <h4 className="font-medium text-gray-700">Fatura Copel</h4>
            <CopyButton value={formatarMoeda(data.totalFaturaCopel)} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatarMoeda(data.totalFaturaCopel)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-purple-500" />
            <h4 className="font-medium text-gray-700">Sem Compensação</h4>
            <CopyButton value={formatarMoeda(data.valorSemDesconto)} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatarMoeda(data.valorSemDesconto)}
          </p>
        </div>
      </div>

      {/* CTA - Gerar Boleto (principal) */}
      {/* Ação principal */}
      <button
        onClick={handleGenerateBoleto}
        disabled={isGenerating}
        className={[
          "w-full",
          "inline-flex items-center justify-center gap-2",
          "rounded-xl px-6 py-4",
          "text-base font-semibold",
          "text-white",
          "bg-linear-to-r from-blue-600 to-indigo-600",
          "shadow-lg shadow-indigo-600/20",
          "hover:brightness-110 transition",
          "active:scale-[0.99]",
          "focus:outline-none focus:ring-4 focus:ring-indigo-500/25",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        {isGenerating ? (
          <>
            <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Gerando boleto...
          </>
        ) : (
          <>
            <FileText className="h-5 w-5" />
            Gerar boleto com estes valores
          </>
        )}
      </button>

      {/* Tabela de Itens */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            Detalhamento da Fatura
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Unid.
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Quant.
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Preço Unit.
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Valor
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {data.itens.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.descricao}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">
                    {item.unidade}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {item.quantidade.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {formatarMoeda(item.precoUnitario)}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm font-medium text-right ${
                      item.valor < 0 ? "text-green-600" : "text-gray-900"
                    }`}
                  >
                    {formatarMoeda(item.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
