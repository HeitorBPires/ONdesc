import { dadosUsuario } from "../types";

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function extractUC(text: string): string | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const prev = lines[i - 1] ?? "";
    const curr = lines[i];
    const next = lines[i + 1] ?? "";

    const isOnlyDigits = /^\d{8,15}$/.test(curr);
    const prevHasDate = /\d{2}\/\d{2}\/\d{4}/.test(prev);
    const nextHasMesRef = /\d{2}\/\d{4}/.test(next);

    if (isOnlyDigits && prevHasDate && nextHasMesRef) {
      return curr;
    }
  }

  for (const line of lines) {
    if (/^\d{8,15}$/.test(line) && !line.includes("UC ")) {
      return line;
    }
  }

  return null;
}

function extractMesReferencia(text: string): string | null {
  const regex = /\b(0[1-9]|1[0-2])\/\d{4}(?=\d{2}\/\d{2}\/\d{4}R\$)/;
  const match = text.match(regex);
  return match ? match[0] : null;
}

function extractVencimento(text: string): string | null {
  const regex = /(0[1-9]|1[0-2])\/\d{4}(\d{2}\/\d{2}\/\d{4})R\$/;

  const match = text.match(regex);
  return match ? match[2] : null;
}

function extractNome(text: string): string | null {
  const match = text.match(/Nome:\s*(.+)/);
  return match ? match[1].trim() : null;
}

function extractEndereco(text: string): string | null {
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("Endereço:")) {
      let endereco = lines[i].replace("Endereço:", "").trim();

      // Se a próxima linha não for outro campo, concatena
      if (lines[i + 1] && !/^(CEP|Cidade|CPF|Nome):/.test(lines[i + 1])) {
        endereco += " " + lines[i + 1].trim();
      }

      return endereco;
    }
  }
  return null;
}

function extractCEP(text: string): string | null {
  const match = text.match(/CEP:\s*(\d{5}-\d{3})/);
  return match ? match[1] : null;
}

function extractCidadeEstado(
  text: string
): { cidade: string; estado: string } | null {
  const match = text.match(/Cidade:\s*(.+?)\s*-\s*Estado:\s*([A-Z]{2})/);
  if (!match) return null;

  return {
    cidade: match[1].trim(),
    estado: match[2].trim(),
  };
}

function extractDocumento(text: string): {
  tipo: "CPF" | "CNPJ";
  valor: string;
} | null {
  const cpfMatch = text.match(/CPF:\s*([*\.\d-]+)/);
  if (cpfMatch) {
    return { tipo: "CPF", valor: cpfMatch[1].trim() };
  }

  const cnpjMatch = text.match(/CNPJ:\s*([\d./-]+)/);
  if (cnpjMatch) {
    return { tipo: "CNPJ", valor: cnpjMatch[1].trim() };
  }

  return null;
}

export function extractDadosFaturaCopel(rawText: string): dadosUsuario {
  const text = normalizeText(rawText);

  const cidadeEstado = extractCidadeEstado(text);

  return {
    uc: extractUC(text) ?? "",
    mesReferencia: extractMesReferencia(text) ?? "",
    vencimento: extractVencimento(text) ?? "",
    cliente: {
      nome: extractNome(text) ?? "",
      endereco: extractEndereco(text) ?? "",
      cep: extractCEP(text) ?? "",
      cidade: cidadeEstado?.cidade ?? "",
      estado: cidadeEstado?.estado ?? "",
      documento: extractDocumento(text) ?? {
        tipo: "CPF",
        valor: "",
      },
    },
  };
}
