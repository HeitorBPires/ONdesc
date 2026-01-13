export function calcularDesconto(
  energiaInjetadaKwh: number,
  tarifaNovaFatura: number,
  totalFaturaCopel: number,
  totalFaturaCopelSemTaxas: number,
  valorSemDescontoSemtaxa: number
) {
  const valorNovaFatura = energiaInjetadaKwh * tarifaNovaFatura;

  const descontoUsuario =
    valorSemDescontoSemtaxa - (totalFaturaCopelSemTaxas + valorNovaFatura);

  const valorTotal = totalFaturaCopel + valorNovaFatura;
  const porcentagemDesconto = valorSemDescontoSemtaxa
    ? (descontoUsuario / valorSemDescontoSemtaxa) * 100
    : 0;

  return {
    valorNovaFatura,
    descontoUsuario,
    valorTotal,
    porcentagemDesconto,
  };
}
