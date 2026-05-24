/**
 * OCR utility for scanned PDFs
 *
 * Pipeline:
 * 1. Try pdf-parse first (fast, works for text-based PDFs)
 * 2. If text is too short (< 100 chars), fall back to:
 *    a. Puppeteer renders PDF page as screenshot
 *    b. tesseract.js OCR extracts text from the image
 *
 * Uso:
 * import { extrairTextoComFallback } from "./utils/ocr";
 * const texto = await extrairTextoComFallback(url);
 */

import puppeteer from "puppeteer";
import Tesseract from "tesseract.js";

const pdfParse = require("pdf-parse");

// Cache do browser (reusa entre chamadas)
let browser: import("puppeteer").Browser | null = null;

async function getBrowser(): Promise<import("puppeteer").Browser> {
  if (browser && browser.connected) return browser;

  if (browser) {
    try {
      await browser.close();
    } catch {}
  }

  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    timeout: 30000,
  });

  return browser;
}

/**
 * Tenta extrair texto do PDF com pdf-parse (rápido, PDFs com texto)
 */
async function extrairTextoComPDF(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const pdf = await pdfParse(buffer);
    return (pdf.text || "").trim();
  } catch {
    return null;
  }
}

/**
 * Extrai texto via OCR: renderiza PDF com Puppeteer + OCR com tesseract.js
 */
async function extrairTextoComOCR(url: string): Promise<string | null> {
  let page: import("puppeteer").Page | null = null;

  try {
    const b = await getBrowser();
    page = await b.newPage();
    await page.setViewport({ width: 1200, height: 1600 });

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Aguarda renderização do PDF
    await new Promise((r) => setTimeout(r, 2000));

    // Captura screenshot da página
    const screenshot = await page.screenshot({ type: "png" });

    if (!screenshot || screenshot.length < 1000) {
      return null;
    }

    // OCR na imagem
    const result = await Tesseract.recognize(Buffer.from(screenshot), "por", {
      logger: () => {}, // Silencia logs do Tesseract
    });

    return (result.data.text || "").trim();
  } catch (err: any) {
    console.log(`  ⚠ OCR error: ${err.message.slice(0, 100)}`);
    return null;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

/**
 * Função principal: tenta pdf-parse primeiro, depois OCR como fallback.
 * Se o texto extraído for muito curto (< 100 chars), considera falha e tenta OCR.
 *
 * @param url URL do PDF
 * @param usarOCR Se true, tenta OCR como fallback (default: true)
 * @returns Texto extraído ou null
 */
export async function extrairTextoComFallback(
  url: string,
  usarOCR = true
): Promise<string | null> {
  // 1. Tenta pdf-parse (rápido)
  const textoPDF = await extrairTextoComPDF(url);

  if (textoPDF && textoPDF.length >= 100) {
    return textoPDF;
  }

  // 2. Se texto curto ou vazio, tenta OCR
  if (usarOCR) {
    console.log("  ℹ PDF sem texto extraível, tentando OCR...");
    const textoOCR = await extrairTextoComOCR(url);

    if (textoOCR && textoOCR.length >= 50) {
      console.log(`  ✅ OCR extraiu ${textoOCR.length} caracteres`);
      return textoOCR;
    }

    console.log("  ⚠ OCR não produziu texto suficiente");
  }

  // 3. Retorna o que tiver (mesmo que pouco)
  return textoPDF || null;
}

/**
 * Fecha o browser do Puppeteer (chamar ao final do script)
 */
export async function fecharBrowser(): Promise<void> {
  if (browser) {
    try {
      await browser.close();
    } catch {}
    browser = null;
  }
}
