/**
 * Extract text content from a PDF file using pdf-parse (v2).
 * Uses dynamic import so the library only loads when a PDF is uploaded.
 * Returns null if extraction fails or the PDF contains no extractable text (e.g., scanned PDFs).
 */
export async function extractPdfText(file: globalThis.File): Promise<string | null> {
  // Dynamic import so it only loads when needed
  const { PDFParse } = await import('pdf-parse');
  let parser: InstanceType<typeof PDFParse> | undefined;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    parser = new PDFParse({ data });
    // Limit to first 50 pages to prevent abuse
    const result = await parser.getText({ first: 1, last: 50 });

    const text = result.text?.trim();
    if (!text || text.length === 0) {
      return null; // Scanned PDF or no extractable text
    }

    return text;
  } catch (error) {
    console.warn('PDF text extraction failed:', error);
    return null;
  } finally {
    // Free worker/document resources
    await parser?.destroy().catch(() => {});
  }
}
