import { dadosUsuario } from "../types";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateDadosFaturaCopel(
  data: dadosUsuario
): ValidationError[] {
  const errors: ValidationError[] = [];

  // UC
  if (!data.uc) {
    errors.push({ field: "uc", message: "UC não encontrada" });
  } else if (!/^\d{8,15}$/.test(data.uc)) {
    errors.push({
      field: "uc",
      message: "UC inválida (esperado 8 a 15 dígitos)",
    });
  }

  // Mês de referência
  if (!data.mesReferencia) {
    errors.push({
      field: "mesReferencia",
      message: "Mês de referência não encontrado",
    });
  } else if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(data.mesReferencia)) {
    errors.push({
      field: "mesReferencia",
      message: "Formato inválido (MM/YYYY)",
    });
  }

  // Nome
  if (!data.cliente.nome) {
    errors.push({
      field: "cliente.nome",
      message: "Nome do cliente não encontrado",
    });
  }

  // Endereço
  if (!data.cliente.endereco) {
    errors.push({
      field: "cliente.endereco",
      message: "Endereço não encontrado",
    });
  }

  // CEP
  if (!data.cliente.cep) {
    errors.push({
      field: "cliente.cep",
      message: "CEP não encontrado",
    });
  } else if (!/^\d{5}-\d{3}$/.test(data.cliente.cep)) {
    errors.push({
      field: "cliente.cep",
      message: "CEP inválido",
    });
  }

  // Cidade / Estado
  if (!data.cliente.cidade) {
    errors.push({
      field: "cliente.cidade",
      message: "Cidade não encontrada",
    });
  }

  if (!data.cliente.estado) {
    errors.push({
      field: "cliente.estado",
      message: "Estado não encontrado",
    });
  } else if (!/^[A-Z]{2}$/.test(data.cliente.estado)) {
    errors.push({
      field: "cliente.estado",
      message: "UF inválida",
    });
  }

  // CPF
  if (!data.cliente.documento?.valor) {
    errors.push({
      field: "cliente.documento",
      message: "CPF ou CNPJ não encontrado",
    });
  }

  return errors;
}
