import pdfParse from "pdf-parse";
import { ItemFatura, ResultadoFatura } from "../types";
import { isValidNumber } from "../helpers";
import { encontrarTarifaIdeal } from "./encontrarTarifaIdeal";
import { calcularDesconto } from "./calcularDesconto";
import {
  calcularMetricas,
  encontrarTarifaPorPorcentagem,
} from "./encontrarTarifaPorPorcentagem";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfData = await pdfParse(buffer);
  return pdfData.text;
}

export function parseCopelItems(text: string): ItemFatura[] {
  if (!text || text.length < 100) {
    throw new Error("Texto do PDF inválido ou muito curto");
  }

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const startIndex = lines.indexOf("ENERGIA ELET CONSUMO");
  const endIndex = lines.indexOf("ICMS");

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error("Bloco de itens da fatura não encontrado");
  }

  const tableLines = lines.slice(startIndex, endIndex);

  const unidadesPossiveis = ["kWh", "UN"];
  const firstUnitIndex = tableLines.findIndex((l) =>
    unidadesPossiveis.includes(l)
  );

  if (firstUnitIndex === -1) {
    throw new Error("Unidades da tabela não encontradas");
  }

  const descricoes = tableLines.slice(0, firstUnitIndex);

  const totalItens = descricoes.length;

  if (totalItens === 0) {
    throw new Error("Nenhum item encontrado na fatura");
  }

  const offset = firstUnitIndex;

  const UNLength = tableLines.filter((iten) => iten === "UN").length;

  const unidades = tableLines.slice(offset, offset + totalItens);
  const quantidades = tableLines.slice(
    offset + totalItens,
    offset + totalItens * 2 - (UNLength || 0)
  );
  const precosUnitarios = tableLines.slice(
    offset + totalItens * 2 - (UNLength || 0),
    offset + totalItens * 3 - (UNLength || 0)
  );
  const valores = tableLines.slice(
    offset + totalItens * 3 - (UNLength || 0),
    offset + totalItens * 4 - (UNLength || 0)
  );

  return descricoes.map((descricao, index) => {
    const quantidade = Number(
      (quantidades[index] ?? "0").replace(/\./g, "").replace(",", ".")
    );
    const precoUnitario = Number(
      (precosUnitarios[index] ?? "0").replace(/\./g, "").replace(",", ".")
    );
    const valor = Number(
      (valores[index] ?? "0").replace(/\./g, "").replace(",", ".")
    );

    if (![quantidade, precoUnitario, valor].every(isValidNumber)) {
      throw new Error(`Valores inválidos no item: ${descricao}`);
    }

    return {
      descricao,
      unidade: unidades[index] ?? "",
      quantidade,
      precoUnitario,
      valor,
    };
  });
}

type CalculateOptions = {
  tarifaNovaFatura?: number;
  porcentagemDesejada?: number;
};

export function calculateCopelInvoice(
  itens: ItemFatura[],
  options?: CalculateOptions
): ResultadoFatura {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error("Itens da fatura inválidos");
  }

  const { tarifaNovaFatura, porcentagemDesejada } = options || {};

  if (
    tarifaNovaFatura !== undefined &&
    (!isValidNumber(tarifaNovaFatura) || tarifaNovaFatura <= 0)
  ) {
    throw new Error("Tarifa informada é inválida");
  }

  if (porcentagemDesejada !== undefined) {
    if (
      !isValidNumber(porcentagemDesejada) ||
      porcentagemDesejada < 12 ||
      porcentagemDesejada > 15
    ) {
      throw new Error("Porcentagem desejada inválida (permitido 12% a 15%)");
    }
  }

  // base
  const valorSemDesconto = itens
    .filter((item) => item.valor > 0)
    .reduce((acc, item) => acc + item.valor, 0);

  const valorSemDescontoSemtaxa = itens
    .filter((item) => {
      if (item.valor <= 0) return false;
      const desc = item.descricao.toUpperCase();

      return !["CONT ILUMIN", "ACRESCIMO", "JUROS", "MULTA"].some((termo) =>
        desc.includes(termo)
      );
    })
    .reduce((acc, item) => acc + item.valor, 0);

  const totalFaturaCopel = itens.reduce((acc, item) => acc + item.valor, 0);

  const totalFaturaCopelSemTaxas = itens
    .filter((item) => {
      const desc = item.descricao.toUpperCase();

      return !["CONT ILUMIN", "ACRESCIMO", "JUROS", "MULTA"].some((termo) =>
        desc.includes(termo)
      );
    })
    .reduce((acc, item) => acc + item.valor, 0);

  const itensEnergiaInjetada = itens.filter((item) =>
    item.descricao.includes("ENERGIA INJ. BAND.")
  );

  const energiaInjetadaKwh = itensEnergiaInjetada.reduce(
    (acc, item) => acc + Math.abs(item.quantidade),
    0
  );

  // determinar modo
  let modoCalculo: "automatico" | "taxa" | "porcentagem" = "automatico";
  let tarifaFinal: number;

  if (tarifaNovaFatura !== undefined) {
    modoCalculo = "taxa";
    tarifaFinal = tarifaNovaFatura;
  } else if (porcentagemDesejada !== undefined) {
    modoCalculo = "porcentagem";
    tarifaFinal = encontrarTarifaPorPorcentagem(
      energiaInjetadaKwh,
      totalFaturaCopel,
      totalFaturaCopelSemTaxas,
      valorSemDescontoSemtaxa,
      porcentagemDesejada
    );
  } else {
    modoCalculo = "automatico";
    tarifaFinal = encontrarTarifaIdeal(
      energiaInjetadaKwh,
      totalFaturaCopel,
      totalFaturaCopelSemTaxas,
      valorSemDesconto,
      valorSemDescontoSemtaxa
    );
  }

  const { valorNovaFatura, descontoUsuario, valorTotal, porcentagemDesconto } =
    calcularMetricas(
      energiaInjetadaKwh,
      tarifaFinal,
      totalFaturaCopel,
      totalFaturaCopelSemTaxas,
      valorSemDescontoSemtaxa
    );

  return {
    itens,
    energiaInjetadaKwh,
    valorSemDesconto,
    totalFaturaCopel,
    valorNovaFatura,
    descontoUsuario,
    valorTotal,
    porcentagemDesconto,

    modoCalculo,
    porcentagemDesejada:
      modoCalculo === "porcentagem" ? porcentagemDesejada : undefined,
    tarifaNovaFatura: tarifaFinal,
  };
}
