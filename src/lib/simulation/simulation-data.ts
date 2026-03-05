export const DEFAULT_DESCONTO_PERCENTUAL = 15;
export const DEFAULT_WHATSAPP = "(41) 99179-9897";
export const DEFAULT_SITE = "www.ondesc.com.br";
export const DEFAULT_INSTAGRAM = "@ondescenergy";

export type SimulationData = {
  nomeCliente: string;
  data: string;
  valorMedioFatura: number;
  descontoPercentual: number;
  economiaMensal: number;
  economiaAnual: number;
  whatsappContato: string;
  siteContato: string;
  instagramContato: string;
};

export type SimulationDataInput = Partial<
  Record<keyof SimulationData, unknown>
>;

export type SimulationFormValues = {
  nomeCliente: string;
  data: string;
  valorMedioFatura: string;
  descontoPercentual: string;
  economiaMensal: string;
  economiaAnual: string;
};

function roundTo2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function parseNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .replace(/[R$\s]/gi, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function isValidBrDate(value: string): boolean {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function formatBrDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function normalizeDate(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (isValidBrDate(trimmed)) {
      return trimmed;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split("-");
      const parsed = new Date(Number(year), Number(month) - 1, Number(day));

      if (!Number.isNaN(parsed.getTime())) {
        return formatBrDate(parsed);
      }
    }
  }

  return formatBrDate(new Date());
}

function normalizeName(value: unknown): string {
  if (typeof value !== "string") return "Cliente não informado";
  const trimmed = value.trim();
  if (!trimmed) return "Cliente não informado";
  return trimmed;
}

function normalizeContact(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed;
}

export function buildSimulationData(
  input: SimulationDataInput,
): SimulationData {
  const valorMedioFaturaRaw = parseNumericValue(input.valorMedioFatura);
  const descontoPercentualRaw = parseNumericValue(input.descontoPercentual);
  const economiaMensalRaw = parseNumericValue(input.economiaMensal);
  const economiaAnualRaw = parseNumericValue(input.economiaAnual);

  const valorMedioFatura = Math.max(0, roundTo2(valorMedioFaturaRaw ?? 0));
  const descontoPercentual = Math.max(
    0,
    roundTo2(descontoPercentualRaw ?? DEFAULT_DESCONTO_PERCENTUAL),
  );

  const economiaMensalCalculada = roundTo2(
    valorMedioFatura * (descontoPercentual / 100),
  );
  const economiaMensal = Math.max(
    0,
    roundTo2(economiaMensalRaw ?? economiaMensalCalculada),
  );
  const economiaAnual = Math.max(
    0,
    roundTo2(economiaAnualRaw ?? economiaMensal * 12),
  );

  return {
    nomeCliente: normalizeName(input.nomeCliente),
    data: normalizeDate(input.data),
    valorMedioFatura,
    descontoPercentual,
    economiaMensal,
    economiaAnual,
    whatsappContato: normalizeContact(input.whatsappContato, DEFAULT_WHATSAPP),
    siteContato: normalizeContact(input.siteContato, DEFAULT_SITE),
    instagramContato: normalizeContact(
      input.instagramContato,
      DEFAULT_INSTAGRAM,
    ),
  };
}

function parseBrDateToDate(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function normalizeBrDateToIso(value: string): string {
  const parsed = parseBrDateToDate(value);
  if (!parsed) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeIsoDateToBr(value: string): string {
  if (!value) return formatBrDate(new Date());
  return normalizeDate(value);
}

export function extractSimulationInputFromForm(
  values: SimulationFormValues,
): SimulationDataInput {
  return {
    nomeCliente: values.nomeCliente,
    data: values.data,
    valorMedioFatura: values.valorMedioFatura,
    descontoPercentual: values.descontoPercentual,
    economiaMensal: values.economiaMensal || undefined,
    economiaAnual: values.economiaAnual || undefined,
  };
}

export function sanitizeSimulationFilename(nomeCliente: string): string {
  const normalized = nomeCliente
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) return "simulacao-economia-energia-ondesc.pdf";
  return `simulacao-economia-${normalized}.pdf`;
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatNumberPtBr(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
