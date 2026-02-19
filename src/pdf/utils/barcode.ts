import bwipjs from "bwip-js";

export async function generateBarcodeBase64(
  barCodeValue: string,
): Promise<string> {
  const png = await bwipjs.toBuffer({
    bcid: "interleaved2of5", // ✅ recomendado (muito compatível)
    text: barCodeValue,
    scale: 3, // qualidade
    height: 12, // altura das barras
    includetext: false, // texto embaixo? false pq vc já mostra linha digitável
    backgroundcolor: "FFFFFF",
  });

  return `data:image/png;base64,${png.toString("base64")}`;
}
