export type AsaasCustomerResponse = {
  id: string;
  name?: string;
};

export type AsaasCreatePaymentResponse = {
  id: string;
  status?: string;
  value?: number;
  dueDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
};

export type AsaasPixQrCodeResponse = {
  encodedImage: string; // base64 png
  payload: string; // copia e cola
};

export type AsaasIdentificationFieldResponse = {
  identificationField: string; // linha digitável
  barCode: string; // código barras numérico
};
