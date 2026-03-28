import { ParsedMedicineData, OCRProcessingResult } from '@/types/scan';
import * as FileSystem from 'expo-file-system';

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
      const rawText = await this.extractTextFromImage(imageUri);
      
      if (!rawText || rawText.trim().length === 0) {
        return { success: false, error: 'No readable text was detected.' };
      }

      const parsedData = await this.parseTextWithGemini(rawText);
      
      return {
        success: true,
        parsed_data: parsedData,
        raw_text: rawText,
        confidence_score: this.calculateOverallConfidence(parsedData)
      };
    } catch (error) {
      console.error('OCR Error:', error);
      return { success: false, error: 'An unexpected error occurred.' };
    }
  }

  private async extractTextFromImage(imageUri: string): Promise<string> {
    if (!this.visionApiKey) throw new Error('Vision API key missing.');

    try {
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.visionApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: base64Image },
              features: [{ type: 'TEXT_DETECTION' }]
            }]
          }),
        }
      );

      const result = await response.json();
      return result.responses?.[0]?.textAnnotations?.[0]?.description || '';
    } catch (error) {
      throw error;
    }
  }

  private async parseTextWithGemini(text: string): Promise<ParsedMedicineData> {
    if (!this.geminiApiKey) return this.fallbackPatternParsing(text);

    try {
      const prompt = `Extract medicine data: name, generic_name, strength, expiry_date (YYYY-MM-DD), batch_number, manufacturer from "${text}". Return pure JSON.`;
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, response_mime_type: "application/json" }
          }),
        }
      );

      const result = await response.json();
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(generatedText.trim());
    } catch (error) {
      console.warn('Gemini OCR parsing failed, trying Eurian fallback...');
      return this.parseTextWithEuri(text);
    }
  }

  private async parseTextWithEuri(text: string): Promise<ParsedMedicineData> {
    if (!this.euriApiKey) return this.fallbackPatternParsing(text);

    try {
      const prompt = `Extract medicine data: name, generic_name, strength, expiry_date (YYYY-MM-DD), batch_number, manufacturer from "${text}". Return pure JSON.`;
      
      const response = await fetch(this.euriUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.euriApiKey}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-4.1-nano',
          temperature: 0.1,
        }),
      });

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      if (!content) throw new Error('Euri empty response');
      
      const cleaned = content.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Eurian fallback also failed:', error);
      return this.fallbackPatternParsing(text);
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