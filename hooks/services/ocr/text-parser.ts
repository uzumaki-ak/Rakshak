import { ParsedMedicineData } from '@/types/scan';

export class TextParserService {
  static parseMedicineText(text: string): ParsedMedicineData {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let confidence = 0.7; // Base confidence
    
    const result: ParsedMedicineData = {
      name: '',
      confidence,
    };

    // Medicine name patterns
    const namePatterns = [
      /(paracetamol|ibuprofen|aspirin|amoxicillin|metformin|atorvastatin)/i,
      /([A-Z][a-z]+)\s+([0-9]+(mg|mg\/ml|mcg|IU))/i,
      /([A-Z]{3,})\s+([0-9])/i
    ];

    // Expiry date patterns
    const expiryPatterns = [
      /exp\s*:\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /expiry\s*:\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /use\s*by\s*:\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/
    ];

    // Strength patterns
    const strengthPatterns = [
      /(\d+\s*(mg|mcg|g|ml|IU))\s*(tablet|capsule|ml)?/i,
      /(\d+\s*mg)/i,
      /strength\s*:\s*(\d+\s*(mg|mcg|g|ml))/i
    ];

    // Batch number patterns
    const batchPatterns = [
      /batch\s*:\s*([A-Z0-9]+)/i,
      /lot\s*:\s*([A-Z0-9]+)/i,
      /batch\s*no\s*:\s*([A-Z0-9]+)/i
    ];

    // Parse each line
    lines.forEach(line => {
      // Check for medicine name
      if (!result.name) {
        for (const pattern of namePatterns) {
          const match = line.match(pattern);
          if (match) {
            result.name = match[0];
            confidence += 0.1;
            break;
          }
        }
      }

      // Check for expiry date
      if (!result.expiry_date) {
        for (const pattern of expiryPatterns) {
          const match = line.match(pattern);
          if (match) {
            const date = this.parseDate(match[1]);
            if (date) {
              result.expiry_date = date;
              confidence += 0.1;
            }
            break;
          }
        }
      }

      // Check for strength
      if (!result.strength) {
        for (const pattern of strengthPatterns) {
          const match = line.match(pattern);
          if (match) {
            result.strength = match[1];
            confidence += 0.05;
            break;
          }
        }
      }

      // Check for batch number
      if (!result.batch_number) {
        for (const pattern of batchPatterns) {
          const match = line.match(pattern);
          if (match) {
            result.batch_number = match[1];
            confidence += 0.05;
            break;
          }
        }
      }
    });

    result.confidence = Math.min(confidence, 0.95);
    return result;
  }

  private static parseDate(dateString: string): string | undefined {
    try {
      // Handle different date formats
      const formats = [
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/,
        /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/
      ];

      for (const format of formats) {
        const match = dateString.match(format);
        if (match) {
          let day, month, year;
          
          if (match[3].length === 4) {
            // YYYY-MM-DD format
            year = parseInt(match[1]);
            month = parseInt(match[2]) - 1;
            day = parseInt(match[3]);
          } else {
            // DD/MM/YY or MM/DD/YY format
            day = parseInt(match[1]);
            month = parseInt(match[2]) - 1;
            year = parseInt(match[3]);
            if (year < 100) year += 2000; // Handle 2-digit years
          }

          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }
    } catch (error) {
      console.error('Date parsing error:', error);
    }
    return undefined;
  }
}