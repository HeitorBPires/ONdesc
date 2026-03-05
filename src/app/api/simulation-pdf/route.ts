import React from "react";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { Font, pdf } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";

import { requireUser } from "@/lib/auth/require-user";
import SimulationEconomyPdf from "@/pdf/SimulationEconomyPdf";
import {
  buildSimulationData,
  sanitizeSimulationFilename,
  SimulationDataInput,
} from "@/lib/simulation/simulation-data";

export const runtime = "nodejs";

const APPROX_SYMBOL_FONT_FAMILY = "OndescApproxSymbol";
const APPROX_SYMBOL_FONT_PATH = path.join(
  process.cwd(),
  "public",
  "fonts",
  "Arial.ttf",
);
let approxSymbolFontRegistered = false;

function ensureApproxSymbolFont(): boolean {
  if (approxSymbolFontRegistered) return true;

  if (!fsSync.existsSync(APPROX_SYMBOL_FONT_PATH)) return false;

  Font.register({
    family: APPROX_SYMBOL_FONT_FAMILY,
    src: APPROX_SYMBOL_FONT_PATH,
  });
  approxSymbolFontRegistered = true;

  return true;
}

export async function POST(req: Request) {
  const { unauthorizedResponse } = await requireUser();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  let body: SimulationDataInput = {};

  try {
    body = (await req.json()) as SimulationDataInput;
  } catch {
    body = {};
  }

  try {
    const hasApproxSymbolFont = ensureApproxSymbolFont();
    const simulationData = buildSimulationData(body);
    const logoSvgMarkup = await fs.readFile(
      path.join(process.cwd(), "public", "img", "logoon.svg"),
      "utf8",
    );

    const doc = React.createElement(SimulationEconomyPdf, {
      data: {
        ...simulationData,
        logoSvgMarkup,
        hasApproxSymbolFont,
      },
    }) as ReactElement<DocumentProps>;

    const instance = pdf(doc);
    const resultBlob = await instance.toBlob();
    const resultBuffer = await resultBlob.arrayBuffer();
    const filename = sanitizeSimulationFilename(simulationData.nomeCliente);

    return new NextResponse(resultBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao gerar simulação de economia.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
