// OCR API Route - enable when tesseract.js is installed
// Run: npm install tesseract.js

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const language = (formData.get('language') as string) || 'eng';

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Dynamic require when needed so OCR remains optional.
    let Tesseract: any;
    try {
      const optionalRequire = eval('require') as NodeRequire;
      Tesseract = optionalRequire('tesseract.js');
    } catch {
      return NextResponse.json({ 
        error: 'OCR not configured. Run: npm install tesseract.js' 
      }, { status: 501 });
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await Tesseract.recognize(buffer, language, {
      logger: (m: any) => console.log('OCR:', m.status),
    });

    const words = result.data.words.map((word: any) => ({
      text: word.text,
      confidence: word.confidence,
      bbox: word.bbox,
    }));

    return NextResponse.json({
      text: result.data.text,
      confidence: result.data.confidence,
      words,
      language: result.data.language,
    });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json({ error: 'OCR processing failed' }, { status: 500 });
  }
}
