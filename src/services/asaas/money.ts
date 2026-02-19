export function brMoneyToNumber(value: string): number {
  // remove espaços
  let normalized = value.trim();

  // remove separadores de milhar (.)
  normalized = normalized.replace(/\./g, "");

  // troca vírgula por ponto
  normalized = normalized.replace(",", ".");

  const n = Number(normalized);

  if (Number.isNaN(n)) {
    throw new Error(`Valor inválido: "${value}"`);
  }

  return n;
}
