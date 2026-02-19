import { PDFDocument } from "pdf-lib";

export async function mergePdfBuffers(
  pdfA: ArrayBuffer,
  pdfB: ArrayBuffer,
): Promise<Uint8Array> {
  const docA = await PDFDocument.load(pdfA);
  const docB = await PDFDocument.load(pdfB);

  const copiedPages = await docA.copyPages(docB, docB.getPageIndices());
  copiedPages.forEach((page) => docA.addPage(page));

  return await docA.save();
}
