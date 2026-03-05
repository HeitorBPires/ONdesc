import React from "react";
import {
  Circle,
  Document,
  Path,
  Page,
  Svg,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  formatCurrencyBRL,
  formatNumberPtBr,
  SimulationData,
} from "@/lib/simulation/simulation-data";

const COLORS = {
  blue: "#203447",
  green: "#95be4d",
  text: "#1e293b",
  muted: "#64748b",
  border: "#dbe2ea",
  softBlue: "#f4f7fb",
  softGreen: "#f4faea",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingHorizontal: 30,
    paddingBottom: 26,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,

    overflow: "hidden",
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: COLORS.blue,
  },
  brandSubtitle: {
    marginTop: 1,
    color: COLORS.muted,
    fontSize: 9,
  },
  metaWrap: {
    alignItems: "flex-end",
  },
  metaLabel: {
    color: COLORS.muted,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    marginTop: 2,
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: 700,
  },
  hero: {
    borderWidth: 1,
    borderColor: COLORS.blue,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  heroLabel: {
    color: "#d1e1f2",
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontWeight: 700,
  },
  heroValue: {
    marginTop: 8,
    fontSize: 33,
    color: COLORS.white,
    fontWeight: 800,
    lineHeight: 1.05,
  },
  heroSubRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  heroApproxSymbol: {
    fontFamily: "OndescApproxSymbol",
    fontSize: 14,
    lineHeight: 1,
    color: "#e6eff8",
    fontWeight: 700,
    marginRight: 4,
  },
  heroSubText: {
    fontSize: 13,
    color: "#e6eff8",
    fontWeight: 700,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  card: {
    width: "31.5%",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    backgroundColor: COLORS.white,
  },
  cardSoftBlue: {
    backgroundColor: COLORS.softBlue,
    borderColor: "#dae6f3",
  },
  cardSoftGreen: {
    backgroundColor: COLORS.softGreen,
    borderColor: "#d3e7b3",
  },
  cardTitle: {
    fontSize: 8,
    color: COLORS.muted,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardValue: {
    marginTop: 7,
    fontSize: 17,
    color: COLORS.blue,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  cardSubValue: {
    marginTop: 2,
    fontSize: 9,
    color: COLORS.muted,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 800,
    color: COLORS.blue,
    marginBottom: 9,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  chartRowLast: {
    marginBottom: 0,
  },
  chartLabel: {
    width: 50,
    fontSize: 9,
    color: COLORS.muted,
    fontWeight: 700,
  },
  chartBarTrack: {
    flexGrow: 1,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#ecf2f8",
    overflow: "hidden",
  },
  chartBarFill: {
    height: "100%",
    backgroundColor: COLORS.green,
    borderRadius: 999,
  },
  chartValue: {
    width: 90,
    marginLeft: 9,
    textAlign: "right",
    color: COLORS.blue,
    fontSize: 9,
    fontWeight: 700,
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  splitCol: {
    width: "49%",
  },
  stepsContainer: {
    paddingTop: 2,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 9,
  },
  stepIndex: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: COLORS.blue,
    color: COLORS.white,
    textAlign: "center",
    fontSize: 10,
    fontWeight: 800,
    marginRight: 8,
    paddingTop: 4,
  },
  stepTextWrap: {
    flexGrow: 1,
    paddingTop: 1,
  },
  stepTitle: {
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: 700,
  },
  stepDescription: {
    color: COLORS.muted,
    fontSize: 8.5,
    marginTop: 1,
    lineHeight: 1.3,
  },

  cardGreen: {
    borderColor: "#cfe2b5",
    backgroundColor: COLORS.softGreen,
  },
  checkItem: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "center",
  },
  checkIconWrap: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  checkText: {
    color: "#365426",
    fontSize: 8.8,
    fontWeight: 600,
  },
  footerCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  footerTitle: {
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: 800,
    marginBottom: 8,
  },
  infoList: {
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#e9f0f7",
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#edf3fa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  infoTextWrap: {
    flexGrow: 1,
  },
  infoLabel: {
    fontSize: 7,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.45,
    fontWeight: 700,
  },
  infoValue: {
    marginTop: 1,
    color: COLORS.blue,
    fontSize: 9.5,
    fontWeight: 700,
  },
  observation: {
    marginTop: 7,
    fontSize: 8,
    color: COLORS.muted,
    lineHeight: 1.35,
  },
  contactsBox: {
    marginTop: 6,
    paddingTop: 8,
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  contactsTitle: {
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: 800,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  contactsList: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "32%",
  },
  contactIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#f1f6fb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  contactInlineText: {
    fontSize: 8.2,
    lineHeight: 1.2,
    color: COLORS.blue,
    fontWeight: 700,
  },
  contactInlineLabel: {
    fontSize: 7.2,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.45,
    fontWeight: 700,
  },
});

type SimulationEconomyPdfProps = {
  data: SimulationData & {
    logoSvgMarkup?: string;
    hasApproxSymbolFont?: boolean;
  };
};

function getBarWidthPercent(value: number, max: number): string {
  if (!Number.isFinite(value) || value <= 0 || max <= 0) {
    return "4%";
  }

  const percentage = Math.min(100, Math.max(4, (value / max) * 100));
  return `${percentage}%`;
}

type LogoPath = {
  d: string;
  fill: string;
  opacity?: number;
};

function extractLogoPaths(svgMarkup?: string): LogoPath[] {
  if (!svgMarkup) return [];

  const pathRegex = /<path\b([^>]*?)\/?>/gi;
  const paths: LogoPath[] = [];
  let match: RegExpExecArray | null;

  while ((match = pathRegex.exec(svgMarkup)) !== null) {
    const attributes = match[1];
    const dMatch = attributes.match(/\bd="([\s\S]*?)"/i);
    if (!dMatch?.[1]) continue;

    const fillMatch = attributes.match(/\bfill="([^"]+)"/i);
    const opacityMatch = attributes.match(/\bopacity="([^"]+)"/i);
    const parsedOpacity = opacityMatch ? Number(opacityMatch[1]) : undefined;

    paths.push({
      d: dMatch[1].replace(/\s+/g, " ").trim(),
      fill: fillMatch?.[1] || "#203447",
      opacity:
        parsedOpacity !== undefined && Number.isFinite(parsedOpacity)
          ? parsedOpacity
          : undefined,
    });
  }

  return paths;
}

function extractLogoViewBox(svgMarkup?: string): string {
  if (!svgMarkup) return "0 0 687 687";
  const viewBoxMatch = svgMarkup.match(/\bviewBox="([^"]+)"/i);
  return viewBoxMatch?.[1]?.trim() || "0 0 687 687";
}

type PdfIconName =
  | "energy"
  | "invoice"
  | "discount"
  | "check"
  | "whatsapp"
  | "site"
  | "instagram";

function PdfIcon({
  name,
  color = "#203447",
}: {
  name: PdfIconName;
  color?: string;
}) {
  if (name === "energy") {
    return (
      <Svg viewBox="0 0 24 24" width={14} height={14}>
        <Path
          d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  }

  if (name === "invoice") {
    return (
      <Svg viewBox="0 0 24 24" width={14} height={14}>
        <Path
          d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2z"
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path d="M9 8h6M9 12h6M9 16h4" stroke={color} strokeWidth={1.6} />
      </Svg>
    );
  }

  if (name === "discount") {
    return (
      <Svg viewBox="0 0 24 24" width={14} height={14}>
        <Path d="M18 6L6 18" stroke={color} strokeWidth={1.8} />
        <Circle
          cx={8}
          cy={8}
          r={2.5}
          stroke={color}
          strokeWidth={1.8}
          fill="none"
        />
        <Circle
          cx={16}
          cy={16}
          r={2.5}
          stroke={color}
          strokeWidth={1.8}
          fill="none"
        />
      </Svg>
    );
  }

  if (name === "check") {
    return (
      <Svg viewBox="0 0 24 24" width={14} height={14}>
        <Path
          d="M5 12.5l4.2 4.2L19 7.1"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  }

  if (name === "whatsapp") {
    return (
      <Svg viewBox="0 0 24 24" width={14} height={14}>
        <Path
          d="M6.014 8.00613C6.12827 7.1024 7.30277 5.87414 8.23488 6.01043L8.23339 6.00894C9.14051 6.18132 9.85859 7.74261 10.2635 8.44465C10.5504 8.95402 10.3641 9.4701 10.0965 9.68787C9.7355 9.97883 9.17099 10.3803 9.28943 10.7834C9.5 11.5 12 14 13.2296 14.7107C13.695 14.9797 14.0325 14.2702 14.3207 13.9067C14.5301 13.6271 15.0466 13.46 15.5548 13.736C16.3138 14.178 17.0288 14.6917 17.69 15.27C18.0202 15.546 18.0977 15.9539 17.8689 16.385C17.4659 17.1443 16.3003 18.1456 15.4542 17.9421C13.9764 17.5868 8 15.27 6.08033 8.55801C5.97237 8.24048 5.99955 8.12044 6.014 8.00613Z"
          fill={color}
        />
        <Path
          d="M12 23C10.7764 23 10.0994 22.8687 9 22.5L6.89443 23.5528C5.56462 24.2177 4 23.2507 4 21.7639V19.5C1.84655 17.492 1 15.1767 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23ZM6 18.6303L5.36395 18.0372C3.69087 16.4772 3 14.7331 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C11.0143 21 10.552 20.911 9.63595 20.6038L8.84847 20.3397L6 21.7639V18.6303Z"
          fillRule="evenodd"
          fill={color}
        />
      </Svg>
    );
  }

  if (name === "site") {
    return (
      <Svg viewBox="0 0 24 24" width={14} height={14}>
        <Circle
          cx={12}
          cy={12}
          r={8.2}
          stroke={color}
          strokeWidth={1.6}
          fill="none"
        />
        <Path
          d="M3.8 12h16.4M12 3.8c2.3 2.2 3.5 5.1 3.5 8.2S14.3 18 12 20.2M12 3.8C9.7 6 8.5 8.9 8.5 12s1.2 6 3.5 8.2"
          stroke={color}
          strokeWidth={1.4}
          fill="none"
        />
      </Svg>
    );
  }

  return (
    <Svg viewBox="0 0 32 32" width={14} height={14}>
      <Path
        d="M22.3,8.4c-0.8,0-1.4,0.6-1.4,1.4c0,0.8,0.6,1.4,1.4,1.4c0.8,0,1.4-0.6,1.4-1.4C23.7,9,23.1,8.4,22.3,8.4z"
        fill={color}
      />
      <Path
        d="M16,10.2c-3.3,0-5.9,2.7-5.9,5.9s2.7,5.9,5.9,5.9s5.9-2.7,5.9-5.9S19.3,10.2,16,10.2z M16,19.9c-2.1,0-3.8-1.7-3.8-3.8   c0-2.1,1.7-3.8,3.8-3.8c2.1,0,3.8,1.7,3.8,3.8C19.8,18.2,18.1,19.9,16,19.9z"
        fill={color}
      />
      <Path
        d="M20.8,4h-9.5C7.2,4,4,7.2,4,11.2v9.5c0,4,3.2,7.2,7.2,7.2h9.5c4,0,7.2-3.2,7.2-7.2v-9.5C28,7.2,24.8,4,20.8,4z M25.7,20.8   c0,2.7-2.2,5-5,5h-9.5c-2.7,0-5-2.2-5-5v-9.5c0-2.7,2.2-5,5-5h9.5c2.7,0,5,2.2,5,5V20.8z"
        fill={color}
      />
    </Svg>
  );
}

export default function SimulationEconomyPdf({
  data,
}: SimulationEconomyPdfProps) {
  const valorHojeCopel = Math.max(0, data.valorMedioFatura);
  const economiaMensal = Math.max(0, data.economiaMensal);
  const economiaAnual = Math.max(0, data.economiaAnual);
  const valorComOndesc = Math.max(0, valorHojeCopel - economiaMensal);

  const acumulado = [
    { label: "3 meses", value: economiaMensal * 3 },
    { label: "6 meses", value: economiaMensal * 6 },
    { label: "12 meses", value: economiaAnual || economiaMensal * 12 },
  ];
  const maxAcumulado =
    acumulado.reduce((max, item) => Math.max(max, item.value), 0) || 1;
  const logoPaths = extractLogoPaths(data.logoSvgMarkup);
  const logoViewBox = extractLogoViewBox(data.logoSvgMarkup);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandWrap}>
            <View style={styles.brandBadge}>
              {logoPaths.length > 0 ? (
                <Svg viewBox={logoViewBox} width="100%" height="100%">
                  {logoPaths.map((logoPath, index) => (
                    <Path
                      key={`${logoPath.fill}-${index}`}
                      d={logoPath.d}
                      fill={logoPath.fill}
                      opacity={logoPath.opacity ?? 1}
                    />
                  ))}
                </Svg>
              ) : null}
            </View>
            <View>
              <Text style={styles.brandTitle}>Ondesc</Text>
              <Text style={styles.brandSubtitle}>
                Simulação de Economia de Energia
              </Text>
            </View>
          </View>

          <View style={styles.metaWrap}>
            <Text style={styles.metaLabel}>Cliente</Text>
            <Text style={styles.metaValue}>{data.nomeCliente}</Text>
            <Text style={[styles.metaLabel, { marginTop: 5 }]}>Data</Text>
            <Text style={styles.metaValue}>{data.data}</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Economia Estimada</Text>
          <Text style={styles.heroValue}>
            {formatCurrencyBRL(economiaAnual)}/ano
          </Text>
          <View style={styles.heroSubRow}>
            <Text
              style={
                data.hasApproxSymbolFont
                  ? styles.heroApproxSymbol
                  : styles.heroSubText
              }
            >
              ≈
            </Text>
            <Text
              style={[
                styles.heroSubText,
                { marginLeft: data.hasApproxSymbolFont ? 0 : 2 },
              ]}
            >
              {formatCurrencyBRL(economiaMensal)}/mês
            </Text>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <View style={[styles.card, styles.cardSoftBlue]}>
            <Text style={styles.cardTitle}>Hoje (Copel)</Text>
            <Text style={styles.cardValue}>
              {formatCurrencyBRL(valorHojeCopel)}
            </Text>
            <Text style={styles.cardSubValue}>Custo médio mensal atual</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Com Ondesc</Text>
            <Text style={styles.cardValue}>
              {formatCurrencyBRL(valorComOndesc)}
            </Text>
            <Text style={styles.cardSubValue}>Média mensal estimada</Text>
          </View>

          <View style={[styles.card, styles.cardSoftGreen]}>
            <Text style={styles.cardTitle}>Economia Estimada</Text>
            <Text style={styles.cardValue}>
              {formatCurrencyBRL(economiaMensal)}
            </Text>
            <Text style={styles.cardSubValue}>
              Mensal | {formatCurrencyBRL(economiaAnual)}/ano
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            Economia acumulada ao longo do tempo
          </Text>

          {acumulado.map((item, index) => (
            <View
              key={item.label}
              style={
                index === acumulado.length - 1
                  ? [styles.chartRow, styles.chartRowLast]
                  : styles.chartRow
              }
            >
              <Text style={styles.chartLabel}>{item.label}</Text>
              <View style={styles.chartBarTrack}>
                <View
                  style={[
                    styles.chartBarFill,
                    { width: getBarWidthPercent(item.value, maxAcumulado) },
                  ]}
                />
              </View>
              <Text style={styles.chartValue}>
                {formatCurrencyBRL(item.value)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.splitRow}>
          <View style={[styles.splitCol, styles.sectionCard]}>
            <Text style={styles.sectionTitle}>Como funciona</Text>

            <View style={styles.stepsContainer}>
              <View style={styles.stepItem}>
                <Text style={styles.stepIndex}>1</Text>
                <View style={styles.stepTextWrap}>
                  <Text style={styles.stepTitle}>Adesão Digital</Text>
                  <Text style={styles.stepDescription}>
                    Contratação simples, online e sem burocracia.
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <Text style={styles.stepIndex}>2</Text>
                <View style={styles.stepTextWrap}>
                  <Text style={styles.stepTitle}>Recebimento de Créditos</Text>
                  <Text style={styles.stepDescription}>
                    Créditos de energia compensam seu consumo mensal.
                  </Text>
                </View>
              </View>

              <View style={[styles.stepItem, { marginBottom: 0 }]}>
                <Text style={styles.stepIndex}>3</Text>
                <View style={styles.stepTextWrap}>
                  <Text style={styles.stepTitle}>Desconto na Fatura</Text>
                  <Text style={styles.stepDescription}>
                    Redução recorrente com previsibilidade de economia.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.splitCol, styles.sectionCard, styles.cardGreen]}>
            <Text style={styles.sectionTitle}>Sem Complicação</Text>

            <View style={{ marginTop: 4 }}>
              <View style={styles.checkItem}>
                <View style={styles.checkIconWrap}>
                  <PdfIcon name="check" color="#4f7f2a" />
                </View>
                <Text style={styles.checkText}>Sem investimento inicial</Text>
              </View>
              <View style={styles.checkItem}>
                <View style={styles.checkIconWrap}>
                  <PdfIcon name="check" color="#4f7f2a" />
                </View>
                <Text style={styles.checkText}>
                  Sem instalação de equipamentos
                </Text>
              </View>
              <View style={styles.checkItem}>
                <View style={styles.checkIconWrap}>
                  <PdfIcon name="check" color="#4f7f2a" />
                </View>
                <Text style={styles.checkText}>
                  Sem alterar estrutura elétrica
                </Text>
              </View>
              <View style={[styles.checkItem, { marginBottom: 0 }]}>
                <View style={styles.checkIconWrap}>
                  <PdfIcon name="check" color="#4f7f2a" />
                </View>
                <Text style={styles.checkText}>
                  Mesma unidade consumidora e titularidade
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Dados utilizados na simulação</Text>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <PdfIcon name="invoice" />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Valor Médio Fatura</Text>
                <Text style={styles.infoValue}>
                  {formatCurrencyBRL(data.valorMedioFatura)}
                </Text>
              </View>
            </View>

            <View style={[styles.infoRow, styles.infoRowLast]}>
              <View style={styles.infoIconWrap}>
                <PdfIcon name="discount" />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Desconto Estimado</Text>
                <Text style={styles.infoValue}>
                  {formatNumberPtBr(data.descontoPercentual)}%
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.observation}>
            Observação: Valores apresentados são estimativas. Para confirmação e
            maior precisão, é necessária uma análise mais detalhada do perfil de
            consumo e da fatura.
          </Text>
        </View>

        <View style={styles.contactsBox}>
          <Text style={styles.contactsTitle}>Canais de Atendimento</Text>
          <View style={styles.contactsList}>
            <View style={styles.contactRow}>
              <View style={styles.contactIconWrap}>
                <PdfIcon name="whatsapp" color="#25D366" />
              </View>
              <Text style={styles.contactInlineText}>
                <Text style={styles.contactInlineLabel}>WhatsApp: </Text>
                {data.whatsappContato}
              </Text>
            </View>

            <View style={styles.contactRow}>
              <View style={styles.contactIconWrap}>
                <PdfIcon name="site" color="#2563EB" />
              </View>
              <Text style={styles.contactInlineText}>
                <Text style={styles.contactInlineLabel}>Site: </Text>
                {data.siteContato}
              </Text>
            </View>

            <View style={styles.contactRow}>
              <View style={styles.contactIconWrap}>
                <PdfIcon name="instagram" color="#8A3AB9" />
              </View>
              <Text style={styles.contactInlineText}>
                <Text style={styles.contactInlineLabel}>Instagram: </Text>
                {data.instagramContato}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
