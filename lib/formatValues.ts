export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function formatarKwh(valor: number): string {
  return `${valor.toFixed(2)} kWh`;
}
