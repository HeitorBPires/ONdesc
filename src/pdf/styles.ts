import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 15,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111827",
    backgroundColor: "#ffffff",
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#e0e0e0",
  },
  brand: { flexDirection: "row", alignItems: "center" },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#f3f4f6",
  },
  logoImage: { width: "100%", height: "100%", objectFit: "cover" },
  brandText: {},
  brandTitle: { fontSize: 21, fontWeight: 700, lineHeight: 1.05 },
  brandTitleNormal: { fontWeight: 700 },
  brandEnergy: { fontWeight: 300, color: "#666" },
  brandUrl: { marginTop: 3, fontSize: 8, color: "#999" },
  company: { width: 220, textAlign: "right", fontSize: 8, lineHeight: 1.4 },
  companyStrong: { fontWeight: 700 },

  /* CLIENT */
  clientWrap: {
    backgroundColor: "#f3f5f2",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  client: { fontSize: 8, lineHeight: 1.4, color: "#333", width: "74%" },
  boldInline: { fontWeight: 700 },
  uc: {
    backgroundColor: "#236240",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  ucText: { fontSize: 9, color: "#fff", fontWeight: 700 },

  /* LAYOUT */
  mainLayout: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  leftColumn: { width: "52%" },
  rightColumn: { width: "46%" },

  /* CARD */
  card: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },

  resumeCard: { marginBottom: 0 },
  cardTitle: {
    backgroundColor: "#4b5963",
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  cardTitleText: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 8,
    letterSpacing: 0.5,
  },

  /* RESUMO */
  resumeMain: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    padding: 11,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resumeLabel: { fontSize: 11, fontWeight: 500, color: "#333" },
  resumeValue: { fontSize: 12.5, fontWeight: 800, color: "#37474f" },
  resumeGrid: { flexDirection: "row" },
  rowDate: {
    width: "50%",
    paddingVertical: 8,
    paddingHorizontal: 11,
    fontSize: 8.5,
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  rowVencimento: {
    width: "50%",
    paddingVertical: 8,
    paddingHorizontal: 11,
    fontSize: 8.5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bold: { fontWeight: 700, fontSize: 9 },

  /* TABLE */
  tableWrap: { backgroundColor: "#fff" },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tableRowLast: { borderBottomWidth: 0 },

  th: {
    paddingVertical: 7,
    paddingHorizontal: 7,
    fontSize: 7,
    fontWeight: 700,
    color: "#666",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  td: {
    paddingVertical: 7,
    paddingHorizontal: 7,
    fontSize: 7,
    color: "#333",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  colDesc: { width: "60%" },
  colKwh: { width: "18%", textAlign: "right" },
  colTotal: { width: "22%", textAlign: "right", borderRightWidth: 0 },

  /* ECONOMY */
  economyWrap: { marginBottom: 12 },
  economy: {
    backgroundColor: "#ebefe5",
    borderWidth: 1,
    borderColor: "#c5e1a5",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  economyK: {
    color: "#333",
    fontSize: 9,
    fontWeight: 600,
    textAlign: "center",
  },
  footnoteRef: { fontSize: 8, fontWeight: 800, color: "#1b5e20" },
  economyValueRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderColor: "#2e7d321f",
  },
  economyV: {
    fontSize: 18,
    fontWeight: 900,
    color: "#1b5e20",
  },
  economyPercentPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#5B8A70",
    backgroundColor: "#16a34a14",
  },
  economyPercentText: { fontSize: 7.5, fontWeight: 900, color: "#166534" },
  economyNote: {
    marginTop: 8,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#5B8A70",
    fontSize: 7.5,
    color: "#667085",
    lineHeight: 1.35,
  },
  noteNum: { fontWeight: 900, color: "#1b5e20" },

  /* INFO STACK */
  infoStack: { flexDirection: "column", gap: 10 },

  /* SPEC CARDS */
  specCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  specTitle: {
    backgroundColor: "#4b5963",
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  specTitleText: {
    color: "#fff",
    fontWeight: 900,
    fontSize: 7.5,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  specBody: { paddingVertical: 8, paddingHorizontal: 8 },

  /* TARIFF */
  tariffGrid: { flexDirection: "row", gap: 8 },
  tariffBox: {
    width: "50%",
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: "#eef2f7",
    backgroundColor: "#fafafa",
  },
  tariffBoxOndesc: {
    borderColor: "#16a34a38",
    backgroundColor: "rgba(22, 163, 74, 0.06)",
  },
  tTitle: {
    fontSize: 7,
    fontWeight: 900,
    color: "#6b7280",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tTitleOndesc: { color: "#166534" },
  tValue: { marginTop: 7, fontSize: 12, fontWeight: 900, color: "#111827" },
  tValueOndesc: { color: "#166534" },
  tUnit: { fontSize: 8, fontWeight: 800, color: "#64748b" },
  tSub: {
    marginTop: 5,
    fontSize: 5,
    color: "#667085",
    fontWeight: 700,
    lineHeight: 1.25,
  },

  /* ENERGY */
  specLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  specLineLast: { borderBottomWidth: 0 },
  specLeft: { width: "70%" },
  specRight: { width: "30%", alignItems: "flex-end" },
  specLabel: { fontSize: 8, fontWeight: 900, color: "#111827" },
  specDesc: {
    marginTop: 2,
    fontSize: 7,
    color: "#667085",
    fontWeight: 700,
    lineHeight: 1.25,
  },
  specValue: { fontSize: 10.5, fontWeight: 900, color: "#0f172a" },
  specValueGreen: { color: "#166534" },
  specUnit: { fontSize: 7.5, fontWeight: 900, color: "#64748b", marginLeft: 3 },
  specPill: {
    marginTop: 5,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#94a3b840",
    backgroundColor: "rgba(148, 163, 184, 0.12)",
  },
  specPillGood: {
    borderColor: "#16a34a2e",
    backgroundColor: "rgba(22, 163, 74, 0.1)",
  },
  specPillText: { fontSize: 5.5, fontWeight: 900, color: "#64748b" },
  specPillTextGood: { color: "#166534" },

  /* IMPORTANT */
  importantBox: {
    marginTop: 6,
    fontSize: 6.5,
    color: "#666",
    lineHeight: 1.4,
  },
  importantStrong: { color: "#333", fontWeight: 800 },

  /* CUT LINE */
  cutLineWrap: { marginVertical: 14, position: "relative" },
  cutLine: {
    borderTopWidth: 2,
    borderTopColor: "#c0c5d0",
    borderStyle: "dashed",
  },
  cutIcon: {
    position: "absolute",
    left: 0,
    top: -7,
    backgroundColor: "#fff",
    paddingHorizontal: 6,
  },
  cutIconText: { fontSize: 8 },

  /* PAYMENT */
  payment: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  payCard: {
    width: "50%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  payHeader: {
    backgroundColor: "#4b5963",
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  payHeaderText: { color: "#fff", fontWeight: 900, fontSize: 8.5 },
  payBody: { padding: 12 },

  payCardPix: {
    width: "38%", // ou 40%
  },

  payCardBarcode: {
    width: "62%", // ou 60%
  },

  pixBody: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 10,
  },
  qr: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  qrImage: { width: "100%", height: "100%", objectFit: "contain" },

  pixPaymentInfo: {
    flexDirection: "column",
    gap: 10,
    justifyContent: "center",
  },
  paymentItem: { flexDirection: "column", gap: 2 },
  paymentLabel: {
    fontSize: 6.8,
    color: "#666",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  paymentValue: { fontSize: 10.5, color: "#2e7d32", fontWeight: 900 },

  pixCopySection: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  pixLabel: {
    fontSize: 7.8,
    color: "#666",
    marginBottom: 6,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  pixCopy: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#f9f9f9",
    position: "relative",
  },

  pixCopyText: {
    fontSize: 6,
    fontFamily: "Courier",
    color: "#333",
    lineHeight: 1.25,
    whiteSpace: "pre-wrap", // react-pdf respeita \n
  },

  /* BARCODE */
  barcodeLabel: {
    fontSize: 6.8,
    color: "#666",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  barcodeLine: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 8,
  },
  barcodeLineText: {
    fontFamily: "Courier",
    fontSize: 7.2,
    fontWeight: 900,
    letterSpacing: 1,
  },

  barcodeImage: {
    width: "100%",
    height: 62,
    objectFit: "fill",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    padding: 6,
    backgroundColor: "#fff",
    marginBottom: 8,
  },

  barcodeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8.5,
    color: "#666",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  footerStrong: { color: "#333", fontWeight: 900 },

  notesDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  notesDivider: {
    flexGrow: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },

  notesDividerLabel: {
    fontSize: 6.4,
    fontWeight: 900,
    color: "#9ca3af",
    letterSpacing: 1,
    paddingHorizontal: 8,
    textTransform: "uppercase",
  },

  notesTinyText: {
    fontSize: 6.9,
    color: "#94a3b8",
    lineHeight: 1.45,
  },

  /* INFO ROW (Tarifas + Energia lado a lado) */
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },

  specCardHalf: {
    width: "49%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
  },

  specBodyWide: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  /* ===== TARIFAS (layout premium split) ===== */
  tariffsSplit: {
    flexDirection: "row",
  },

  tariffColLeft: {
    width: "50%",
    paddingVertical: 10,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: "#eef2f7",
  },

  tariffColRight: {
    width: "50%",
    paddingVertical: 10,
    paddingLeft: 10,
  },

  tariffHeader: {
    fontSize: 7.5,
    fontWeight: 900,
    color: "#667085",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  tariffHeaderOndesc: {
    color: "#166534",
  },

  tariffBigValue: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: 900,
    color: "#111827",
    letterSpacing: -0.3,
    lineHeight: 1,
  },

  tariffBigValueOndesc: {
    color: "#166534",
  },

  tariffUnit: {
    fontSize: 8,
    fontWeight: 900,
    color: "#64748b",
  },

  tariffDesc: {
    marginTop: 5,
    fontSize: 7,
    fontWeight: 650,
    color: "#667085",
    lineHeight: 1.25,
  },

  /* ===== ENERGIA (layout premium 2 linhas) ===== */
  energyLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },

  energyLineLast: {
    borderBottomWidth: 0,
  },

  energyLeft: {
    width: "66%",
  },

  energyRight: {
    width: "34%",
    alignItems: "flex-end",
  },

  energyLabel: {
    fontSize: 7.5,
    fontWeight: 900,
    color: "#111827",
  },

  energyDesc: {
    marginTop: 3,
    fontSize: 7,
    fontWeight: 650,
    color: "#667085",
    lineHeight: 1.25,
  },

  energyValue: {
    fontSize: 12.5,
    fontWeight: 1000,
    color: "#0f172a",
    whiteSpace: "nowrap",
  },

  energyValueGreen: {
    color: "#166534",
  },

  energyUnit: {
    fontSize: 8,
    fontWeight: 900,
    color: "#64748b",
    marginLeft: 3,
  },

  energyPill: {
    marginTop: 5,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4b5963",
    backgroundColor: "rgba(148, 163, 184, 0.12)",
  },

  energyPillGood: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "#16a34a1A",
  },

  energyPillText: {
    fontSize: 6.5,
    fontWeight: 1000,
    color: "#64748b",
  },

  energyPillTextGood: {
    color: "#166534",
  },

  fullWidthSection: {
    marginBottom: 12,
  },
  /* COMPARATIVO STRIP (slim) */
  compareStrip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "#ffffff",
  },

  compareStripLeft: {
    width: "48%",
    justifyContent: "center",
  },

  compareStripTitle: {
    fontSize: 9.2,
    fontWeight: 1000,
    color: "#111827",
    letterSpacing: -0.2,
  },

  compareStripSubtitle: {
    marginTop: 2,
    fontSize: 7.1,
    fontWeight: 650,
    color: "#64748b",
    lineHeight: 1.25,
  },

  compareStripRight: {
    width: "52%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  compareStripBox: {
    width: "50%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  compareStripBoxGood: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "#16a34a1A",
  },

  compareStripLabel: {
    fontSize: 5.6,
    fontWeight: 1000,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },

  compareStripLabelGood: {
    color: "#236240",
  },

  compareStripValueMuted: {
    marginTop: 3,
    fontSize: 10.2,
    fontWeight: 1000,
    color: "#475569",
    letterSpacing: -0.2,
  },

  compareStripValue: {
    marginTop: 3,
    fontSize: 10.2,
    fontWeight: 1100,
    color: "#111827",
    letterSpacing: -0.2,
  },

  compareStripValueGood: {
    color: "#236240",
  },

  compareStripHint: {
    marginTop: 2,
    fontSize: 6,
    fontWeight: 650,
    color: "#94a3b8",
  },
});
