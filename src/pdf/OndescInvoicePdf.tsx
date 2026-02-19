/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { Font } from "@react-pdf/renderer";

Font.registerHyphenationCallback((word) => [word]);

import {
  formatBarcodeLineForDisplay,
  formatPixForDisplay,
} from "./utils/softBreak";

import { styles } from "./styles";

export type OndescInvoicePdfData = {
  logoBase64: string;
  qrCodeBase64: string;
  barcodeBase64: string;
  pixCopyPaste: string;
  barcodeLine: string;
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
  uc: string;
  valorFatura: string;
  vencimento: string;
  mesReferencia: string;
  porcentagemDesconto: string;
  descontoUsuario: number;
  tarifaCopel: "a calcular";
  tarifaOndesc: number;
  consumoMes: "a calcular";
  energiaInjetada: string;
  valorSemOndesc: string;
  valorTotalComOndesc: string;
};

export default function OndescInvoicePdf({
  data,
}: {
  data: OndescInvoicePdfData;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Image style={styles.logoImage} src={data.logoBase64} />
            </View>

            <View style={styles.brandText}>
              <Text style={styles.brandTitle}>
                <Text>ON</Text>
                <Text style={styles.brandTitleNormal}>desc </Text>
                <Text style={styles.brandEnergy}>energy</Text>
              </Text>
              <Text style={styles.brandUrl}>atendimento@ondesc.com.br</Text>
            </View>
          </View>

          <View style={styles.company}>
            <Text style={styles.companyStrong}>CNPJ: 57.044.775/0001-86</Text>
            <Text>Rua Cristovão Colombo, 1375 – Pioneiros</Text>
            <Text>Catarinenses, Cascavel – PR, 85.805-510</Text>
          </View>
        </View>
        {/* CLIENT */}
        <View style={styles.clientWrap}>
          <View style={styles.client}>
            <Text>
              <Text style={styles.boldInline}>NOME:</Text> {data.cliente.nome}
            </Text>
            <Text>
              <Text style={styles.boldInline}>ENDEREÇO:</Text>{" "}
              {data.cliente.endereco}
            </Text>
            <Text>
              <Text style={styles.boldInline}>CEP:</Text> {data.cliente.cep}
            </Text>
            <Text>
              <Text style={styles.boldInline}>CIDADE:</Text>{" "}
              {data.cliente.cidade}
            </Text>
            <Text>
              <Text style={styles.boldInline}>CNPJ:</Text>{" "}
              {data.cliente.documento.valor}
            </Text>
          </View>

          <View style={styles.uc}>
            <Text style={styles.ucText}>UC: {data.uc}</Text>
          </View>
        </View>
        {/* MAIN LAYOUT */}
        <View style={styles.mainLayout}>
          {/* LEFT COLUMN */}
          <View style={styles.leftColumn}>
            {/* RESUMO */}
            <View style={[styles.card, styles.resumeCard]}>
              <View style={styles.cardTitle}>
                <Text style={styles.cardTitleText}>RESUMO DA COBRANÇA</Text>
              </View>

              <View style={styles.resumeMain}>
                <Text style={styles.resumeLabel}>Valor a Pagar</Text>
                <Text style={styles.resumeValue}>R$ {data.valorFatura}</Text>
              </View>

              <View style={styles.resumeGrid}>
                <View style={styles.rowDate}>
                  <Text>
                    <Text style={styles.bold}>{`Referência:`}</Text>{" "}
                    <Text>{data.mesReferencia}</Text>
                  </Text>
                </View>

                <View style={styles.rowVencimento}>
                  <Text style={styles.bold}>Vencimento:</Text>
                  <Text>{data.vencimento}</Text>
                </View>
              </View>
            </View>
            {/* IMPORTANTE */}
            <View style={styles.importantBox}>
              <Text>
                <Text style={styles.importantStrong}>Importante:</Text> esta
                fatura refere-se ao serviço de compensação de energia (Ondesc
                Energy).
                {"\n"}A fatura da COPEL deverá ser paga separadamente.
              </Text>
            </View>
          </View>

          {/* RIGHT COLUMN */}
          <View style={styles.rightColumn}>
            {/* ECONOMIA */}
            <View style={styles.economyWrap}>
              <View style={styles.economy}>
                <Text style={styles.economyK}>
                  Economia sobre o consumo desse mês:
                  <Text style={styles.footnoteRef}> ¹</Text>
                </Text>

                <View style={styles.economyValueRow}>
                  <Text style={styles.economyV}>R$ {data.descontoUsuario}</Text>
                  {/* <View style={styles.economyPercentPill}>
                    <Text style={styles.economyPercentText}>
                      {data.porcentagemDesconto}%
                    </Text>
                  </View> */}
                </View>
              </View>

              <View style={styles.economyNote}>
                <Text>
                  <Text style={styles.noteNum}>¹ </Text>
                  Valor (R$) calculado com base no consumo (kWh), sem tarifas,
                  taxas e multas por atrasos.
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.fullWidthSection}>
          {/* INFO ROW: TARIFAS + ENERGIA (lado a lado) */}
          <View style={styles.infoRow}>
            {/* CARD 1: TARIFAS */}
            <View style={styles.specCardHalf}>
              <View style={styles.specTitle}>
                <Text style={styles.specTitleText}>Tarifas aplicadas</Text>
              </View>

              <View style={styles.specBodyWide}>
                <View style={styles.tariffsSplit}>
                  {/* COPEL */}
                  <View style={styles.tariffColLeft}>
                    <Text style={styles.tariffHeader}>COPEL</Text>

                    <Text style={styles.tariffBigValue}>
                      R$ {data.tarifaCopel}
                      <Text style={styles.tariffUnit}>/kWh</Text>
                    </Text>

                    <Text style={styles.tariffDesc}>
                      Tarifa da concessionária{"\n"}
                      (sem compensação/injeção).
                    </Text>
                  </View>

                  {/* ONDESC */}
                  <View style={styles.tariffColRight}>
                    <Text
                      style={[styles.tariffHeader, styles.tariffHeaderOndesc]}
                    >
                      ONDESC
                    </Text>

                    <Text
                      style={[
                        styles.tariffBigValue,
                        styles.tariffBigValueOndesc,
                      ]}
                    >
                      R$ {data.tarifaOndesc}
                      <Text style={styles.tariffUnit}>/kWh</Text>
                    </Text>

                    <Text style={styles.tariffDesc}>
                      Tarifa aplicada no serviço de compensação{"\n"}
                      referente a este boleto.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* CARD 2: ENERGIA */}
            <View style={styles.specCardHalf}>
              <View style={styles.specTitle}>
                <Text style={styles.specTitleText}>Energia (kWh)</Text>
              </View>

              <View style={styles.specBodyWide}>
                {/* Linha 1 */}
                <View style={styles.energyLine}>
                  <View style={styles.energyLeft}>
                    <Text style={styles.energyLabel}>Consumo do mês</Text>
                    <Text style={styles.energyDesc}>
                      Energia utilizada na unidade consumidora no período de
                      referência.
                    </Text>
                  </View>

                  <View style={styles.energyRight}>
                    <Text style={styles.energyValue}>
                      {data.consumoMes}
                      <Text style={styles.energyUnit}>kWh</Text>
                    </Text>

                    <View style={styles.energyPill}>
                      <Text style={styles.energyPillText}>consumido</Text>
                    </View>
                  </View>
                </View>

                {/* Linha 2 */}
                <View style={[styles.energyLine, styles.energyLineLast]}>
                  <View style={styles.energyLeft}>
                    <Text style={styles.energyLabel}>
                      Crédito gerado / Injeção
                    </Text>
                    <Text style={styles.energyDesc}>
                      Energia injetada e compensada via Ondesc no mesmo período.
                    </Text>
                  </View>

                  <View style={styles.energyRight}>
                    <Text style={[styles.energyValue, styles.energyValueGreen]}>
                      {data.energiaInjetada}
                      <Text style={styles.energyUnit}>kWh</Text>
                    </Text>

                    <View style={[styles.energyPill, styles.energyPillGood]}>
                      <Text
                        style={[
                          styles.energyPillText,
                          styles.energyPillTextGood,
                        ]}
                      >
                        compensado
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
        {/* COMPARATIVO (slim, largura total) - DISABLED */}
        <View style={styles.compareStrip}>
          <View style={styles.compareStripLeft}>
            <Text style={styles.compareStripTitle}>
              Comparativo do custo total mensal
            </Text>
            <Text style={styles.compareStripSubtitle}>
              Comparação do total do mês, sem Ondesc vs. com Ondesc.
            </Text>
          </View>

          <View style={styles.compareStripRight}>
            <View style={styles.compareStripBox}>
              <Text style={styles.compareStripLabel}>Sem Ondesc</Text>
              <Text style={styles.compareStripValueMuted}>
                R$ {data.valorSemOndesc}
              </Text>
              <Text style={styles.compareStripHint}>COPEL integral</Text>
            </View>

            <View style={[styles.compareStripBox, styles.compareStripBoxGood]}>
              <Text
                style={[styles.compareStripLabel, styles.compareStripLabelGood]}
              >
                Com Ondesc
              </Text>
              <Text
                style={[styles.compareStripValue, styles.compareStripValueGood]}
              >
                R$ {data.valorTotalComOndesc}
              </Text>
              <Text style={styles.compareStripHint}>COPEL + Ondesc</Text>
            </View>
          </View>
        </View>
        {/* CUT LINE */}
        <View style={styles.cutLineWrap}>
          <View style={styles.cutLine} />
          <View style={styles.cutIcon}>
            <Text style={styles.cutIconText}>✂️</Text>
          </View>
        </View>
        {/* PAYMENT */}
        <View style={styles.payment}>
          {/* PIX */}
          <View style={[styles.payCard, styles.payCardPix]}>
            <View style={styles.payHeader}>
              <Text style={styles.payHeaderText}>PAGUE COM PIX</Text>
            </View>

            <View style={styles.payBody}>
              <View style={styles.pixBody}>
                <View style={styles.qr}>
                  <Image style={styles.qrImage} src={data.qrCodeBase64} />
                </View>

                <View style={styles.pixPaymentInfo}>
                  <View style={styles.paymentItem}>
                    <Text style={styles.paymentLabel}>Valor:</Text>
                    <Text style={styles.paymentValue}>
                      R$ {data.valorFatura}
                    </Text>
                  </View>

                  <View style={styles.paymentItem}>
                    <Text style={styles.paymentLabel}>Vencimento:</Text>
                    <Text style={styles.paymentValue}>{data.vencimento}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.pixCopySection}>
                <Text style={styles.pixLabel}>Pix Copia e Cola</Text>
                <View style={styles.pixCopy}>
                  <Text style={styles.pixCopyText}>
                    {formatPixForDisplay(data.pixCopyPaste, 42)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* BARCODE */}
          <View style={[styles.payCard, styles.payCardBarcode]}>
            <View style={styles.payHeader}>
              <Text style={styles.payHeaderText}>
                OU PAGUE COM CÓDIGO DE BARRAS
              </Text>
            </View>

            <View style={styles.payBody}>
              <Text style={styles.barcodeLabel}>Linha digitável</Text>
              <View style={styles.barcodeLine}>
                <Text style={styles.barcodeLineText}>
                  {formatBarcodeLineForDisplay(data.barcodeLine)}
                </Text>
              </View>

              {/* Barcode em PDF: não dá pra fazer repeating-linear-gradient.
                  Aqui fazemos um fake com barras: */}
              <Image style={styles.barcodeImage} src={data.barcodeBase64} />

              <View style={styles.barcodeFooter}>
                <Text>
                  Valor:{" "}
                  <Text style={styles.footerStrong}>R$ {data.valorFatura}</Text>
                </Text>
                <Text>
                  Vencimento:{" "}
                  <Text style={styles.footerStrong}>{data.vencimento}</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* NOTES */}
        <View>
          <View style={styles.notesDividerRow}>
            <View style={styles.notesDivider} />
            <Text style={styles.notesDividerLabel}>OBSERVAÇÕES</Text>
            <View style={styles.notesDivider} />
          </View>

          <Text style={styles.notesTinyText}>
            Pagamentos após o vencimento podem gerar multas. A fatura da COPEL
            deve ser paga separadamente.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
