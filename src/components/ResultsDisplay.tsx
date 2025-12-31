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

import { formatarKwh, formatarMoeda } from "../../lib/formatValues";
import { ClienteCard } from "./ClientCard";
import { ValidationAlert } from "./ValidationAlert";
import { CriticalErrorState } from "./CriticalErrorState";
import { CopyableCard } from "./CopyableCard";
import { CopyButton } from "./CopyButton";

interface ResultsDisplayProps {
  response: ApiResponse<ResultadoFatura>;
}

function splitErrors(errors: ApiError[] = []) {
  return {
    critical: errors.filter((e) => e.level === "critical"),
    warning: errors.filter((e) => e.level === "warning"),
  };
}

export default function ResultsDisplay({ response }: ResultsDisplayProps) {
  const { critical, warning } = splitErrors(response.errors);

  // ❌ ERRO CRÍTICO → bloqueia tela
  if (critical.length > 0 || !response.data) {
    return (
      <CriticalErrorState
        message={critical.map((e) => e.message).join(" • ")}
      />
    );
  }

  // ✅ DADOS DISPONÍVEIS
  const data = response.data;

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
          </div>
        )}

      {/* Dados do Cliente */}
      {data.dadosUsuario?.cliente && (
        <ClienteCard cliente={data.dadosUsuario.cliente} />
      )}

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
    </div>
  );
}
