import { ParsedMedicineData, OCRProcessingResult } from '@/types/scan';

/**
 * OCR Service for processing medicine images and extracting text
 * Uses Google ML Kit for text recognition and Gemini AI for intelligent parsing
 */
export class OCRService {
  private static instance: OCRService;

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Process image using Expo Image Manipulator and ML Kit Text Recognition
   */
  async processImage(imageUri: string): Promise<OCRProcessingResult> {
    try {
      // First, let's extract text using a mock OCR (in production, use ML Kit)
      const rawText = await this.extractTextFromImage(imageUri);
      
      if (!rawText || rawText.trim().length === 0) {
        return {
          success: false,
          error: 'No text found in image'
        };
      }

      // Parse the extracted text using AI
      const parsedData = await this.parseTextWithAI(rawText);
      
      return {
        success: true,
        parsed_data: parsedData,
        raw_text: rawText,
        confidence_score: this.calculateOverallConfidence(parsedData)
      };

    } catch (error) {
      console.error('OCR Processing Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown OCR error'
      };
    }
  }

  /**
   * Extract text from image using ML Kit (mocked for now)
   * In production, integrate with @react-native-ml-kit/text-recognition
   */
  private async extractTextFromImage(imageUri: string): Promise<string> {
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock OCR result - in production, replace with actual ML Kit call
    const mockTexts = [
      'PARACETAMOL 500mg\nExp: 12/2025\nMFG: 01/2024\nBatch: ABC123\nManufactured by: XYZ Pharma',
      'IBUPROFEN 400mg\nExpiry Date: 06/2025\nMfg Date: 06/2023\nLot: DEF456\nBy: ABC Healthcare',
      'AMOXICILLIN 250mg\nEXP 03/2026\nMFG 03/2024\nBatch No: GHI789\nXYZ Pharmaceuticals'
    ];
    
    return mockTexts[Math.floor(Math.random() * mockTexts.length)];
  }

  /**
   * Parse extracted text using Gemini AI to identify medicine information
   */
  private async parseTextWithAI(text: string): Promise<ParsedMedicineData> {
    try {
      const prompt = `
        You are a medicine information extraction expert. Analyze this text from a medicine package and extract relevant information.
        
        Text: "${text}"
        
        Please extract and return JSON with these fields (use null if not found):
        - name: medicine name
        - brand_name: brand name if different from generic name
        - generic_name: generic/chemical name
        - strength: dosage strength (e.g., "500mg", "10ml")
        - expiry_date: expiry date in YYYY-MM-DD format
        - manufacture_date: manufacture date in YYYY-MM-DD format  
        - batch_number: batch/lot number
        - manufacturer: manufacturer name
        - barcode: any barcode number found
        
        Also provide confidence_scores (0.0-1.0) for each extracted field.
        
        Return only valid JSON without markdown formatting.
      `;

      // Mock AI response - in production, replace with actual Gemini API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate AI parsing based on mock text patterns
      const mockParsedData: ParsedMedicineData = {
        name: this.extractMedicineName(text),
        strength: this.extractStrength(text),
        expiry_date: this.extractExpiryDate(text),
        manufacture_date: this.extractManufactureDate(text),
        batch_number: this.extractBatchNumber(text),
        manufacturer: this.extractManufacturer(text),
        confidence_scores: {
          name: 0.85,
          expiry_date: 0.92,
          batch_number: 0.78,
          strength: 0.88
        }
      };

      return mockParsedData;

    } catch (error) {
      console.error('AI Parsing Error:', error);
      return {};
    }
  }

  /**
   * Extract medicine name using pattern matching
   */
  private extractMedicineName(text: string): string | undefined {
    const namePatterns = [
      /^([A-Z][A-Z\s]+)\s*\d+mg/i,
      /^([A-Z][A-Z\s]+)\s*\d+ml/i,
      /^([A-Z][A-Z\s]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }
    return undefined;
  }

  /**
   * Extract strength/dosage using pattern matching
   */
  private extractStrength(text: string): string | undefined {
    const strengthPatterns = [
      /(\d+(?:\.\d+)?\s*mg)/i,
      /(\d+(?:\.\d+)?\s*ml)/i,
      /(\d+(?:\.\d+)?\s*g)/i,
      /(\d+(?:\.\d+)?\s*mcg)/i
    ];

    for (const pattern of strengthPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }
    return undefined;
  }

  /**
   * Extract expiry date using multiple date patterns
   */
  private extractExpiryDate(text: string): string | undefined {
    const expiryPatterns = [
      /exp(?:iry)?:?\s*(\d{2}\/\d{4})/i,
      /exp(?:iry)?:?\s*(\d{2}\/\d{2}\/\d{4})/i,
      /exp(?:iry)?\s+date:?\s*(\d{2}\/\d{4})/i,
      /(\d{2}\/\d{4})/i // fallback pattern
    ];

    for (const pattern of expiryPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.formatDateString(match[1]);
      }
    }
    return undefined;
  }

  /**
   * Extract manufacture date using multiple date patterns
   */
  private extractManufactureDate(text: string): string | undefined {
    const mfgPatterns = [
      /mfg:?\s*(\d{2}\/\d{4})/i,
      /mfg:?\s*(\d{2}\/\d{2}\/\d{4})/i,
      /mfg\s+date:?\s*(\d{2}\/\d{4})/i,
      /manufactured:?\s*(\d{2}\/\d{4})/i
    ];

    for (const pattern of mfgPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.formatDateString(match[1]);
      }
    }
    return undefined;
  }

  /**
   * Extract batch number using pattern matching
   */
  private extractBatchNumber(text: string): string | undefined {
    const batchPatterns = [
      /batch:?\s*([A-Z0-9]+)/i,
      /lot:?\s*([A-Z0-9]+)/i,
      /batch\s+no:?\s*([A-Z0-9]+)/i
    ];

    for (const pattern of batchPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
    return undefined;
  }

  /**
   * Extract manufacturer name
   */
  private extractManufacturer(text: string): string | undefined {
    const mfgPatterns = [
      /manufactured\s+by:?\s*([A-Z][A-Za-z\s&.]+)/i,
      /by:?\s*([A-Z][A-Za-z\s&.]+(?:pharma|healthcare|labs?))/i,
      /([A-Z][A-Za-z\s&.]+(?:pharma|healthcare|labs?))/i
    ];

    for (const pattern of mfgPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  /**
   * Format date string to YYYY-MM-DD format
   */
  private formatDateString(dateStr: string): string {
    try {
      // Handle MM/YYYY format
      if (dateStr.match(/^\d{2}\/\d{4}$/)) {
        const [month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-01`;
      }
      
      // Handle DD/MM/YYYY format
      if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      return dateStr;
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateStr;
    }
  }

  /**
   * Calculate overall confidence score based on individual field confidence scores
   */
  private calculateOverallConfidence(parsedData: ParsedMedicineData): number {
    const scores = parsedData.confidence_scores;
    if (!scores) return 0.5;

    const values = Object.values(scores).filter(score => typeof score === 'number');
    if (values.length === 0) return 0.5;

    const average = values.reduce((sum, score) => sum + score, 0) / values.length;
    return Math.round(average * 100) / 100;
  }

  /**
   * Validate extracted medicine data
   */
  validateParsedData(data: ParsedMedicineData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Medicine name is required and must be at least 2 characters');
    }

    if (data.expiry_date && !this.isValidDate(data.expiry_date)) {
      errors.push('Invalid expiry date format');
    }

    if (data.manufacture_date && !this.isValidDate(data.manufacture_date)) {
      errors.push('Invalid manufacture date format');
    }

    // Check if expiry date is in the past
    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      errors.push('Medicine appears to be expired');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if date string is valid
   */
  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && !!dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  }
}