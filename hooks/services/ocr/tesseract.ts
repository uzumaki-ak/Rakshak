import Tesseract from 'tesseract.js';

export class OCRService {
  static async extractTextFromImage(imageUri: string): Promise<string> {
    try {
      const result = await Tesseract.recognize(imageUri, 'eng', {
        logger: m => console.log(m),
      });
      
      return result.data.text;
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  static async getConfidenceScore(imageUri: string): Promise<number> {
    try {
      const result = await Tesseract.recognize(imageUri, 'eng');
      return result.data.confidence / 100; // Normalize to 0-1
    } catch (error) {
      return 0.5; // Default confidence
    }
  }
}