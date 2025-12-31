import pdfParse from "pdf-parse";
import { ItemFatura, ResultadoFatura } from "../types";
import { isValidNumber } from "../helpers";

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

export function calculateCopelInvoice(
  itens: ItemFatura[],
  tarifaNovaFatura: number
): ResultadoFatura {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error("Itens da fatura inválidos");
  }

  if (!isValidNumber(tarifaNovaFatura) || tarifaNovaFatura <= 0) {
    throw new Error("Tarifa informada é inválida");
  }

  const valorSemDesconto = itens
    .filter((item) => item.valor > 0)
    .reduce((acc, item) => acc + item.valor, 0);

  const totalFaturaCopel = itens.reduce((acc, item) => acc + item.valor, 0);

  const itensEnergiaInjetada = itens.filter((item) =>
    item.descricao.includes("ENERGIA INJ. BAND.")
  );

  const energiaInjetadaKwh = itensEnergiaInjetada.reduce(
    (acc, item) => acc + Math.abs(item.quantidade),
    0
  );

  const valorNovaFatura = energiaInjetadaKwh * tarifaNovaFatura;

  const descontoUsuario =
    valorSemDesconto - (totalFaturaCopel + valorNovaFatura);

  const valorTotal = totalFaturaCopel + valorNovaFatura;

  const porcentagemDesconto = valorSemDesconto
    ? (descontoUsuario / valorSemDesconto) * 100
    : 0;

  return {
    itens,
    energiaInjetadaKwh,
    valorSemDesconto,
    totalFaturaCopel,
    valorNovaFatura,
    descontoUsuario,
    valorTotal,
    porcentagemDesconto,
  };
}
