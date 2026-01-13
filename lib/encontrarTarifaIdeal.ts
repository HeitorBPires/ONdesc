import { calcularDesconto } from "./calcularDesconto";

export function encontrarTarifaIdeal(
  energiaInjetadaKwh: number,
  totalFaturaCopel: number,
  totalFaturaCopelSemTaxas: number,
  valorSemDesconto: number,
  valorSemDescontoSemtaxa: number
) {
  let tarifa = 0.53;
  const passo = 0.01;
  const descontoMin = 12;
  const descontoMax = 15;
  const tarifaMinima = 0.45;
  const tarifaMaxima = 0.9;
  const maxIteracoes = 1000;

  for (let i = 0; i < maxIteracoes; i++) {
    const { porcentagemDesconto } = calcularDesconto(
      energiaInjetadaKwh,
      tarifa,
      totalFaturaCopel,
      totalFaturaCopelSemTaxas,
      valorSemDescontoSemtaxa
    );

    if (
      porcentagemDesconto >= descontoMin &&
      porcentagemDesconto <= descontoMax
    ) {
      return tarifa;
    }

    if (porcentagemDesconto < descontoMin) {
      tarifa -= passo;
    } else {
      tarifa += passo;
    }

    if (tarifa <= tarifaMinima) {
      tarifa = tarifaMinima;
      break;
    }

    if (tarifa >= tarifaMaxima) {
      tarifa = tarifaMaxima;
      break;
    }
  }

  return tarifa;
}
