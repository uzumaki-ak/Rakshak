import { ParsedMedicineData, OCRProcessingResult } from '@/types/scan';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * OCR Service for processing medicine images.
 * Integrates Google Cloud Vision API for text extraction and 
 * Gemini AI for intelligent parsing.
 */
export class OCRService {
  private static instance: OCRService;
  private geminiApiKey: string;
  private visionApiKey: string;

  private constructor() {
    this.geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    this.visionApiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '';
    this.euriApiKey = process.env.EXPO_PUBLIC_EURI_API_KEY || '';
  }

  private euriApiKey: string;
  private euriUrl: string = 'https://api.euron.one/api/v1/euri/chat/completions';

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  async processImage(imageUri: string): Promise<OCRProcessingResult> {
    try {
      const parsedData = await this.extractAndParseWithGemini(imageUri);
      
      return {
        success: true,
        parsed_data: parsedData,
        raw_text: JSON.stringify(parsedData), // Combine into one
        confidence_score: this.calculateOverallConfidence(parsedData)
      };
    } catch (error) {
      console.error('OCR Error:', error);
      return { success: false, error: 'An unexpected error occurred.' };
    }
  }

  private async extractAndParseWithGemini(imageUri: string): Promise<ParsedMedicineData> {
    if (!this.geminiApiKey) {
      throw new Error("Gemini API key is missing. Ensure EXPO_PUBLIC_GEMINI_API_KEY is set.");
    }

    try {
      const base64Image = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
      
      const prompt = `Analyze this medicine strip, box, or packaging. Strictly extract the following data into pure JSON format:
{
  "name": "", // Wait, CRITICAL RULE: If the Marketing Brand Name is hidden (e.g. you're looking at the back of the box), logically INFER a descriptive name based on the active ingredients (e.g., "Paracetamol & Aceclofenac Tablets") so this field is NEVER empty string.
  "generic_name": "", // Comma separated list of active ingredients
  "strength": "", // Total strength of ingredients
  "expiry_date": "YYYY-MM-DD",
  "batch_number": "",
  "manufacturer": "", // CRITICAL: Look very closely at the small text at the bottom for "Manufactured by", "Marketed by", or company logos.
  "confidence_scores": {
    "name": 0.9,
    "expiry_date": 0.8,
    "strength": 0.9
  }
}
If a value truly cannot be found or inferred, use null. Return ONLY the raw JSON object. Never use markdown backticks.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: base64Image } }
              ]
            }],
            generationConfig: { 
              temperature: 0.1, 
              response_mime_type: "application/json" 
            }
          }),
        }
      );

      const result = await response.json();
      if (result.error) throw new Error(result.error.message);

      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) throw new Error("Empty AI response");

      return JSON.parse(generatedText.trim());
    } catch (error) {
      console.warn('Gemini OCR parsing failed, trying dummy fallback...', error);
      return this.fallbackPatternParsing("Unknown Medicine\nNo readable data");
    }
  }


  private fallbackPatternParsing(text: string): ParsedMedicineData {
    const strengthPattern = /(\d+\s*(?:mg|ml|mcg|g|iu))/i;
    const datePattern = /(\d{2}[-\/]\d{2}[-\/]\d{4}|\d{2}[-\/]\d{4})/;

    return {
      name: text.split('\n')[0] || 'Unknown Medicine',
      strength: text.match(strengthPattern)?.[1] || undefined,
      expiry_date: this.formatDate(text.match(datePattern)?.[1]),
      confidence_scores: { name: 0.4, expiry_date: 0.5, strength: 0.5 }
    };
  }

  private formatDate(dateStr: string | undefined): string | undefined {
    if (!dateStr) return undefined;
    try {
      const parts = dateStr.split(/[-\/]/);
      if (parts.length === 2) return `${parts[1]}-${parts[0].padStart(2, '0')}-01`;
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      return dateStr;
    } catch { return undefined; }
  }

  private calculateOverallConfidence(data: ParsedMedicineData): number {
    const scores = Object.values(data.confidence_scores || {}) as number[];
    if (scores.length === 0) return 0.5;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  public validateParsedData(data: ParsedMedicineData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data.name || data.name === "Unknown Medicine") errors.push("Medicine name missing");
    if (!data.expiry_date) errors.push("Expiry date missing");
    if (!data.strength) errors.push("Strength not detected");
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}