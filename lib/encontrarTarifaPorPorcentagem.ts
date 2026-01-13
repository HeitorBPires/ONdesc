export function calcularMetricas(
  energiaInjetadaKwh: number,
  tarifaNovaFatura: number,
  totalFaturaCopel: number,
  totalFaturaCopelSemTaxas: number,
  valorSemDesconto: number,
  valorSemDescontoSemtaxa: number
) {
  const valorNovaFatura = energiaInjetadaKwh * tarifaNovaFatura;

  const descontoUsuario =
    valorSemDesconto - (totalFaturaCopelSemTaxas + valorNovaFatura);

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

export function encontrarTarifaPorPorcentagem(
  energiaInjetadaKwh: number,
  totalFaturaCopel: number,
  totalFaturaCopelSemTaxas: number,
  valorSemDesconto: number,
  valorSemDescontoSemtaxa: number,
  porcentagemDesejada: number
) {
  const tarifaMinima = 0.01;
  const tarifaMaxima = 1.5;

  let low = tarifaMinima;
  let high = tarifaMaxima;

  let melhorTarifa = 0.51;
  let melhorDiff = Infinity;

  // tolerância de % (pra não travar tentando “exato”)
  const tolerancia = 0.05;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;

    const { porcentagemDesconto } = calcularMetricas(
      energiaInjetadaKwh,
      mid,
      totalFaturaCopel,
      totalFaturaCopelSemTaxas,
      valorSemDesconto,
      valorSemDescontoSemtaxa
    );

    const diff = Math.abs(porcentagemDesconto - porcentagemDesejada);

    if (diff < melhorDiff) {
      melhorDiff = diff;
      melhorTarifa = mid;
    }

    // Encontrou dentro da tolerância
    if (diff <= tolerancia) {
      break;
    }

    /**
     * IMPORTANTE:
     * - Se tarifa aumenta → valorNovaFatura sobe → desconto cai
     * - Se tarifa diminui → valorNovaFatura desce → desconto sobe
     */
    if (porcentagemDesconto > porcentagemDesejada) {
      // desconto ainda alto demais → aumentar tarifa
      low = mid;
    } else {
      // desconto baixo demais → diminuir tarifa
      high = mid;
    }
  }

  // arredonda para 2 casas, como tarifa real
  return Math.round(melhorTarifa * 100) / 100;
}
