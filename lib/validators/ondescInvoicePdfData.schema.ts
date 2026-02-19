import { z } from "zod";

export const OndescInvoicePdfDataSchema = z.object({
  logoBase64: z.string().min(1, "logoBase64 é obrigatório"),
  qrCodeBase64: z.string().min(1, "qrCodeBase64 é obrigatório"),
  barcodeBase64: z.string().min(1, "barcodeBase64 é obrigatório"),
  pixCopyPaste: z.string().min(1, "pixCopyPaste é obrigatório"),
  barcodeLine: z.string().min(1, "barcodeLine é obrigatório"),

  cliente: z.object({
    nome: z.string().min(1, "cliente.nome é obrigatório"),
    endereco: z.string().min(1, "cliente.endereco é obrigatório"),
    cep: z.string().min(1, "cliente.cep é obrigatório"),
    cidade: z.string().min(1, "cliente.cidade é obrigatório"),
    estado: z.string().min(1, "cliente.estado é obrigatório"),

    documento: z.object({
      tipo: z.enum(["CPF", "CNPJ"]),
      valor: z.string().min(1, "cliente.documento.valor é obrigatório"),
    }),
  }),

  uc: z.string().min(1, "uc é obrigatório"),
  valorFatura: z.string().min(1, "valorFatura é obrigatório"),
  vencimento: z.string().min(1, "vencimento é obrigatório"),
  mesReferencia: z.string().min(1, "mesReferencia é obrigatório"),
  porcentagemDesconto: z.string().min(1, "porcentagemDesconto é obrigatório"),

  descontoUsuario: z.number(),

  tarifaCopel: z.literal("a calcular"),
  tarifaOndesc: z.number(),

  consumoMes: z.literal("a calcular"),
  energiaInjetada: z.string().min(1, "energiaInjetada é obrigatório"),
});

export type OndescInvoicePdfDataValidated = z.infer<
  typeof OndescInvoicePdfDataSchema
>;
