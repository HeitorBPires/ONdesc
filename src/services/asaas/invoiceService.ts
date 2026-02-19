import { asaasFetch } from "./asaasClient";
import { brMoneyToNumber } from "./money";
import type {
  AsaasCustomerResponse,
  AsaasCreatePaymentResponse,
  AsaasIdentificationFieldResponse,
  AsaasPixQrCodeResponse,
} from "./types";

type Data = {
  asaasCustomerId: string;
  vencimento: string;
  valor: string;
};

export function brDateToAsaasDate(brDate: string): string {
  const match = brDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    throw new Error(`Data inválida (esperado dd/MM/yyyy). Recebido: ${brDate}`);
  }

  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

export async function fetchInvoiceDataAsaas(data: Data) {
  const customerId = data.asaasCustomerId?.trim();
  if (!customerId) {
    throw new Error("Cliente sem asaas_customer_id configurado.");
  }

  const dueDate = brDateToAsaasDate(data.vencimento);

  const value = brMoneyToNumber(data.valor);

  try {
    const customer = await asaasFetch<AsaasCustomerResponse>(
      `/customers/${encodeURIComponent(customerId)}`,
      { method: "GET" },
    );

    if (!customer?.id) {
      throw new Error("Resposta inválida ao consultar cliente no Asaas.");
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao consultar cliente no Asaas.";
    throw new Error(`Cliente Asaas não encontrado para id "${customerId}". ${message}`);
  }

  const chargePayload = {
    customer: customerId,
    billingType: "BOLETO",
    dueDate: dueDate,
    value,
    interest: { value: 1 },
    fine: { value: 2, type: "PERCENTAGE" },
  };

  const payment = await asaasFetch<AsaasCreatePaymentResponse>(`/payments`, {
    method: "POST",
    body: JSON.stringify(chargePayload),
  });

  const paymentId = payment.id;

  const [pixData, identificationFieldData] = await Promise.all([
    asaasFetch<AsaasPixQrCodeResponse>(`/payments/${paymentId}/pixQrCode`, {
      method: "GET",
    }),
    asaasFetch<AsaasIdentificationFieldResponse>(
      `/payments/${paymentId}/identificationField`,
      { method: "GET" },
    ),
  ]);

  return {
    payment,
    customerId,
    PixData: pixData,
    IdentificationFieldData: identificationFieldData,
  };
}
