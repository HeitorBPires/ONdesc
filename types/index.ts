// // types/index.ts

// export interface ItemFatura {
//   descricao: string;
//   unidade: string;
//   quantidade: number;
//   precoUnitario: number;
//   valor: number;
// }

// export interface FaturaData {
//   itens: ItemFatura[];
//   valorSemDesconto: number;
//   energiaInjetadaKwh: number;
//   valorNovaFatura: number;
//   totalOriginal: number;
//   desconto: number;
//   taxaEnergia: number;
// }

// export interface CalculationResult {
//   success: boolean;
//   data?: FaturaData;
//   error?: string;
// }

export interface ItemFatura {
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  valor: number;
}

export interface dadosUsuario {
  uc: string;
  mesReferencia: string; // MM/YYYY
  cliente: {
    nome: string;
    endereco: string;
    cep: string;
    cidade: string;
    estado: string;
    documento: {
      tipo: "CPF" | "CNPJ";
      valor: string;
    };
  };
}

export interface ResultadoFatura {
  itens: ItemFatura[];

  energiaInjetadaKwh: number;

  valorSemDesconto: number;
  totalFaturaCopel: number;
  valorNovaFatura: number;
  descontoUsuario: number;
  taxaEnergia?: number;
  valorTotal: number;
  porcentagemDesconto: number;
  dadosUsuario?: dadosUsuario;
}

export type ErrorLevel = "critical" | "warning";

export interface ApiError {
  field: string;
  message: string;
  level: ErrorLevel;
}

export interface ApiResponse<T> {
  success: boolean;
  errors?: ApiError[];
  data?: T | null;
}
