// // import { ParsedMedicineData, OCRProcessingResult } from '@/types/scan';
// // import * as FileSystem from 'expo-file-system/legacy';

// // /**
// //  * OCR Service for processing medicine images with REAL text recognition
// //  * Uses Google Cloud Vision API and Gemini AI for parsing
// //  */
// // export class OCRService {
// //   private static instance: OCRService;
// //   private geminiApiKey: string;
// //   private visionApiKey: string;

// //   private constructor() {
// //     this.geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
// //     this.visionApiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '';
    
// //     if (!this.geminiApiKey) {
// //       console.warn('⚠️ Gemini API key not found. AI parsing will use fallback.');
// //     }
// //     if (!this.visionApiKey) {
// //       console.warn('⚠️ Google Vision API key not found. OCR will use fallback.');
// //     }
// //   }

// //   public static getInstance(): OCRService {
// //     if (!OCRService.instance) {
// //       OCRService.instance = new OCRService();
// //     }
// //     return OCRService.instance;
// //   }

// //   /**
// //    * Process image using REAL Google Cloud Vision API
// //    */
// //   async processImage(imageUri: string): Promise<OCRProcessingResult> {
// //     try {
// //       console.log('🔍 Starting REAL OCR processing for:', imageUri);
      
// //       // Extract text using Google Cloud Vision API
// //       const rawText = await this.extractTextFromImage(imageUri);
      
// //       if (!rawText || rawText.trim().length === 0) {
// //         return {
// //           success: false,
// //           error: 'No text found in image. Try capturing a clearer image with better lighting.'
// //         };
// //       }

// //       console.log('✅ Raw OCR Text extracted:', rawText.substring(0, 200) + '...');

// //       // Parse the extracted text using Gemini AI
// //       const parsedData = await this.parseTextWithGemini(rawText);
      
// //       console.log('✅ Parsed data:', parsedData);

// //       return {
// //         success: true,
// //         parsed_data: parsedData,
// //         raw_text: rawText,
// //         confidence_score: this.calculateOverallConfidence(parsedData)
// //       };

// //     } catch (error) {
// //       console.error('❌ OCR Processing Error:', error);
// //       return {
// //         success: false,
// //         error: error instanceof Error ? error.message : 'Unknown OCR error'
// //       };
// //     }
// //   }

// //   /**
// //    * Extract text from image using Google Cloud Vision API
// //    */
// //   private async extractTextFromImage(imageUri: string): Promise<string> {
// //     try {
// //       console.log('📸 Starting OCR text extraction...');

// //       if (!this.visionApiKey) {
// //         throw new Error('Google Vision API key not configured. Please add EXPO_PUBLIC_GOOGLE_VISION_API_KEY to your .env file');
// //       }

// //       // Read image as base64 using legacy API
// //       const base64Image = await FileSystem.readAsStringAsync(imageUri, {
// //         encoding: FileSystem.EncodingType.Base64,
// //       });

// //       console.log('📦 Image converted to base64, size:', base64Image.length);

// //       // Call Google Cloud Vision API for text detection
// //       console.log('🌐 Calling Google Cloud Vision API...');
      
// //       const response = await fetch(
// //         `https://vision.googleapis.com/v1/images:annotate?key=${this.visionApiKey}`,
// //         {
// //           method: 'POST',
// //           headers: {
// //             'Content-Type': 'application/json',
// //           },
// //           body: JSON.stringify({
// //             requests: [
// //               {
// //                 image: {
// //                   content: base64Image,
// //                 },
// //                 features: [
// //                   {
// //                     type: 'TEXT_DETECTION',
// //                     maxResults: 1,
// //                   },
// //                 ],
// //               },
// //             ],
// //           }),
// //         }
// //       );

// //       if (!response.ok) {
// //         const errorText = await response.text();
// //         console.error('❌ Vision API Error:', errorText);
// //         throw new Error(`Google Vision API error: ${response.status} - ${errorText}`);
// //       }

// //       const result = await response.json();
// //       console.log('📋 Vision API response received');

// //       if (result.responses && result.responses[0]) {
// //         const firstResponse = result.responses[0];
        
// //         // Check for errors in response
// //         if (firstResponse.error) {
// //           throw new Error(`Vision API error: ${firstResponse.error.message}`);
// //         }

// //         // Get the full text annotation
// //         if (firstResponse.textAnnotations && firstResponse.textAnnotations.length > 0) {
// //           const extractedText = firstResponse.textAnnotations[0].description || '';
// //           console.log('✅ Text successfully extracted:', extractedText.length, 'characters');
// //           return extractedText;
// //         }
// //       }

// //       throw new Error('No text detected in image');

// //     } catch (error) {
// //       console.error('❌ Text extraction error:', error);
// //       throw new Error('Failed to extract text from image');
// //     }
// //   }

// //   /**
// //    * Parse extracted text using REAL Gemini AI
// //    */
// //   private async parseTextWithGemini(text: string): Promise<ParsedMedicineData> {
// //     try {
// //       console.log('🤖 Starting Gemini AI parsing...');

// //       if (!this.geminiApiKey) {
// //         console.log('⚠️ No Gemini API key, using fallback pattern matching');
// //         return this.fallbackPatternParsing(text);
// //       }

// //       const prompt = `You are a medicine information extraction expert. Analyze this OCR text from a medicine package and extract relevant information.

// // OCR Text from medicine packaging:
// // "${text}"

// // Extract and return ONLY a valid JSON object with these exact fields (use null if not found):
// // {
// //   "name": "medicine name",
// //   "brand_name": "brand name if different from generic",
// //   "generic_name": "generic/chemical name",
// //   "strength": "dosage strength (e.g., '500mg', '10ml')",
// //   "expiry_date": "expiry date in YYYY-MM-DD format",
// //   "manufacture_date": "manufacture date in YYYY-MM-DD format",
// //   "batch_number": "batch or lot number",
// //   "manufacturer": "manufacturer name",
// //   "barcode": "barcode number if found",
// //   "confidence_scores": {
// //     "name": 0.0-1.0,
// //     "expiry_date": 0.0-1.0,
// //     "batch_number": 0.0-1.0,
// //     "strength": 0.0-1.0
// //   }
// // }

// // IMPORTANT RULES:
// // 1. Return ONLY the JSON object, no markdown code blocks, no explanations
// // 2. Use null for fields you cannot find
// // 3. For dates, convert any format (DD/MM/YYYY, MM/YYYY, etc.) to YYYY-MM-DD
// // 4. Confidence scores: 1.0 = very confident, 0.5 = uncertain, 0.0 = guessed
// // 5. Medicine name should be the primary/main name visible on the package
// // 6. If you see "EXP" or "Expiry" followed by a date, that's the expiry_date
// // 7. If you see "MFG" or "Mfd" followed by a date, that's the manufacture_date
// // 8. Batch/Lot numbers are usually alphanumeric codes after "Batch" or "Lot"`;

// //       console.log('🌐 Calling Gemini API...');

// //       const response = await fetch(
// //         `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
// //         {
// //           method: 'POST',
// //           headers: {
// //             'Content-Type': 'application/json',
// //           },
// //           body: JSON.stringify({
// //             contents: [
// //               {
// //                 parts: [
// //                   {
// //                     text: prompt,
// //                   },
// //                 ],
// //               },
// //             ],
// //             generationConfig: {
// //               temperature: 0.1,
// //               topK: 1,
// //               topP: 1,
// //               maxOutputTokens: 1024,
// //             },
// //           }),
// //         }
// //       );

// //       if (!response.ok) {
// //         const errorText = await response.text();
// //         console.error('❌ Gemini API Error:', errorText);
// //         throw new Error(`Gemini API error: ${response.status}`);
// //       }

// //       const result = await response.json();
// //       console.log('📋 Gemini API response received');

// //       if (!result.candidates || result.candidates.length === 0) {
// //         throw new Error('No response from Gemini AI');
// //       }

// //       const generatedText = result.candidates[0].content.parts[0].text;
      
// //       // Clean the response (remove markdown code blocks if present)
// //       const cleanedText = generatedText
// //         .replace(/```json\n?/g, '')
// //         .replace(/```\n?/g, '')
// //         .trim();

// //       console.log('🧹 Cleaned AI response:', cleanedText.substring(0, 200));

// //       // Parse JSON response
// //       const parsedData = JSON.parse(cleanedText);
// //       console.log('✅ Successfully parsed AI response');

// //       return parsedData;

// //     } catch (error) {
// //       console.error('❌ Gemini AI parsing error:', error);
// //       console.log('⚠️ Falling back to pattern matching');
// //       // Fallback to pattern matching
// //       return this.fallbackPatternParsing(text);
// //     }
// //   }

// //   /**
// //    * Fallback pattern matching if AI parsing fails
// //    */
// //   private fallbackPatternParsing(text: string): ParsedMedicineData {
// //     console.log('🔍 Using fallback pattern matching');
    
// //     return {
// //       name: this.extractMedicineName(text),
// //       strength: this.extractStrength(text),
// //       expiry_date: this.extractExpiryDate(text),
// //       manufacture_date: this.extractManufactureDate(text),
// //       batch_number: this.extractBatchNumber(text),
// //       manufacturer: this.extractManufacturer(text),
// //       confidence_scores: {
// //         name: 0.6,
// //         expiry_date: 0.7,
// //         batch_number: 0.5,
// //         strength: 0.6,
// //       },
// //     };
// //   }

// //   /**
// //    * Extract medicine name using pattern matching
// //    */
// //   private extractMedicineName(text: string): string | undefined {
// //     const lines = text.split('\n').filter(line => line.trim().length > 0);
    
// //     // Common medicine name patterns
// //     const namePatterns = [
// //       /^([A-Z][A-Z\s]+)\s*\d+\s*mg/i,
// //       /^([A-Z][A-Z\s]+)\s*\d+\s*ml/i,
// //       /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\s+(?:Tablets|Capsules|Syrup|Injection)/i,
// //       /^([A-Z][A-Za-z]{2,})/,
// //     ];

// //     for (const line of lines.slice(0, 5)) {
// //       for (const pattern of namePatterns) {
// //         const match = line.match(pattern);
// //         if (match && match[1] && match[1].length > 2) {
// //           return match[1].trim();
// //         }
// //       }
// //     }
    
// //     return undefined;
// //   }

// //   /**
// //    * Extract strength/dosage
// //    */
// //   private extractStrength(text: string): string | undefined {
// //     const strengthPatterns = [
// //       /(\d+(?:\.\d+)?\s*mg)/i,
// //       /(\d+(?:\.\d+)?\s*ml)/i,
// //       /(\d+(?:\.\d+)?\s*g)/i,
// //       /(\d+(?:\.\d+)?\s*mcg)/i,
// //       /(\d+(?:\.\d+)?\s*iu)/i,
// //     ];

// //     for (const pattern of strengthPatterns) {
// //       const match = text.match(pattern);
// //       if (match && match[1]) {
// //         return match[1].toLowerCase().replace(/\s+/g, '');
// //       }
// //     }
// //     return undefined;
// //   }

// //   /**
// //    * Extract expiry date
// //    */
// //   private extractExpiryDate(text: string): string | undefined {
// //     const expiryPatterns = [
// //       /exp(?:iry)?(?:\s+date)?[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
// //       /exp(?:iry)?[:\s]+(\d{2}[-\/]\d{4})/i,
// //       /valid\s+(?:until|till)[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
// //       /use\s+before[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
// //     ];

// //     for (const pattern of expiryPatterns) {
// //       const match = text.match(pattern);
// //       if (match && match[1]) {
// //         return this.formatDateString(match[1]);
// //       }
// //     }
// //     return undefined;
// //   }

// //   /**
// //    * Extract manufacture date
// //    */
// //   private extractManufactureDate(text: string): string | undefined {
// //     const mfgPatterns = [
// //       /mfg(?:\s+date)?[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
// //       /manufactured[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
// //       /mfg[:\s]+(\d{2}[-\/]\d{4})/i,
// //     ];

// //     for (const pattern of mfgPatterns) {
// //       const match = text.match(pattern);
// //       if (match && match[1]) {
// //         return this.formatDateString(match[1]);
// //       }
// //     }
// //     return undefined;
// //   }

// //   /**
// //    * Extract batch number
// //    */
// //   private extractBatchNumber(text: string): string | undefined {
// //     const batchPatterns = [
// //       /batch(?:\s+no)?[:\s]+([A-Z0-9]+)/i,
// //       /lot(?:\s+no)?[:\s]+([A-Z0-9]+)/i,
// //       /b\.?no[:\s]+([A-Z0-9]+)/i,
// //     ];

// //     for (const pattern of batchPatterns) {
// //       const match = text.match(pattern);
// //       if (match && match[1]) {
// //         return match[1].toUpperCase();
// //       }
// //     }
// //     return undefined;
// //   }

// //   /**
// //    * Extract manufacturer name
// //    */
// //   private extractManufacturer(text: string): string | undefined {
// //     const mfgPatterns = [
// //       /manufactured\s+by[:\s]+([A-Z][A-Za-z\s&.,]+(?:Ltd|Limited|Inc|Pvt|Pharma|Healthcare|Laboratories)?)/i,
// //       /mfg(?:d)?\s+by[:\s]+([A-Z][A-Za-z\s&.,]+)/i,
// //       /(?:by|from)[:\s]+([A-Z][A-Za-z\s&.,]+(?:Pharma|Healthcare|Laboratories|Ltd|Limited))/i,
// //     ];

// //     for (const pattern of mfgPatterns) {
// //       const match = text.match(pattern);
// //       if (match && match[1]) {
// //         return match[1].trim();
// //       }
// //     }
// //     return undefined;
// //   }

// //   /**
// //    * Format date string to YYYY-MM-DD
// //    */
// //   private formatDateString(dateStr: string): string {
// //     try {
// //       // Handle MM/YYYY or MM-YYYY format
// //       if (dateStr.match(/^\d{2}[\/\-]\d{4}$/)) {
// //         const [month, year] = dateStr.split(/[\/\-]/);
// //         return `${year}-${month.padStart(2, '0')}-01`;
// //       }
      
// //       // Handle DD/MM/YYYY or DD-MM-YYYY format
// //       if (dateStr.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)) {
// //         const [day, month, year] = dateStr.split(/[\/\-]/);
// //         return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
// //       }
      
// //       return dateStr;
// //     } catch (error) {
// //       console.error('Date formatting error:', error);
// //       return dateStr;
// //     }
// //   }

// //   /**
// //    * Calculate overall confidence score
// //    */
// //   private calculateOverallConfidence(parsedData: ParsedMedicineData): number {
// //     const scores = parsedData.confidence_scores;
// //     if (!scores) return 0.5;

// //     const values = Object.values(scores).filter(score => typeof score === 'number');
// //     if (values.length === 0) return 0.5;

// //     const average = values.reduce((sum, score) => sum + score, 0) / values.length;
// //     return Math.round(average * 100) / 100;
// //   }

// //   /**
// //    * Validate extracted medicine data
// //    */
// //   validateParsedData(data: ParsedMedicineData): { isValid: boolean; errors: string[] } {
// //     const errors: string[] = [];

// //     if (!data.name || data.name.trim().length < 2) {
// //       errors.push('Medicine name is required');
// //     }

// //     if (data.expiry_date && !this.isValidDate(data.expiry_date)) {
// //       errors.push('Invalid expiry date format');
// //     }

// //     if (data.manufacture_date && !this.isValidDate(data.manufacture_date)) {
// //       errors.push('Invalid manufacture date format');
// //     }

// //     // Check if expiry date is in the past
// //     if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
// //       errors.push('Medicine appears to be expired');
// //     }

// //     return {
// //       isValid: errors.length === 0,
// //       errors
// //     };
// //   }

// //   /**
// //    * Check if date string is valid
// //    */
// //   private isValidDate(dateStr: string): boolean {
// //     const date = new Date(dateStr);
// //     return !isNaN(date.getTime()) && !!dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
// //   }
// // }


// //

// import { OCRProcessingResult, ParsedMedicineData } from '@/types/scan';
// import Tesseract from 'tesseract.js';

// /**
//  * OCR Service using Tesseract.js (free, no billing required)
//  * Combined with Gemini AI for intelligent parsing
//  */
// export class OCRService {
//   private static instance: OCRService;
//   private geminiApiKey: string;

//   private constructor() {
//     this.geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    
//     if (!this.geminiApiKey) {
//       console.warn('⚠️ Gemini API key not found. AI parsing will use fallback pattern matching.');
//     }
//   }

//   public static getInstance(): OCRService {
//     if (!OCRService.instance) {
//       OCRService.instance = new OCRService();
//     }
//     return OCRService.instance;
//   }

//   /**
//    * Process image using Tesseract.js OCR
//    */
//   async processImage(imageUri: string): Promise<OCRProcessingResult> {
//     try {
//       console.log('📸 Starting Tesseract OCR processing for:', imageUri);
      
//       // Extract text using Tesseract.js
//       const rawText = await this.extractTextFromImage(imageUri);
      
//       if (!rawText || rawText.trim().length === 0) {
//         return {
//           success: false,
//           error: 'No text found in image. Try capturing a clearer image with better lighting.'
//         };
//       }

//       console.log('✅ Raw OCR Text extracted:', rawText.substring(0, 200) + '...');

//       // Parse the extracted text using Gemini AI
//       const parsedData = await this.parseTextWithGemini(rawText);
      
//       console.log('✅ Parsed data:', parsedData);

//       return {
//         success: true,
//         parsed_data: parsedData,
//         raw_text: rawText,
//         confidence_score: this.calculateOverallConfidence(parsedData)
//       };

//     } catch (error) {
//       console.error('❌ OCR Processing Error:', error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : 'Unknown OCR error'
//       };
//     }
//   }

//   /**
//    * Extract text from image using Tesseract.js
//    */
//   private async extractTextFromImage(imageUri: string): Promise<string> {
//     try {
//       console.log('🔍 Starting Tesseract text recognition...');

//       // Use Tesseract.js to recognize text
//       const result = await Tesseract.recognize(
//         imageUri,
//         'eng', // English language
//         {
//           logger: (m) => {
//             if (m.status === 'recognizing text') {
//               console.log(`📊 Progress: ${Math.round(m.progress * 100)}%`);
//             }
//           },
//         }
//       );

//       const extractedText = result.data.text;
//       console.log('✅ Tesseract extraction complete:', extractedText.length, 'characters');
//       console.log('📝 Confidence:', result.data.confidence);

//       if (!extractedText || extractedText.trim().length === 0) {
//         throw new Error('No text detected in image');
//       }

//       return extractedText;

//     } catch (error) {
//       console.error('❌ Tesseract extraction error:', error);
//       throw new Error('Failed to extract text from image. Ensure the image is clear and well-lit.');
//     }
//   }

//   /**
//    * Parse extracted text using Gemini AI
//    */
//   private async parseTextWithGemini(text: string): Promise<ParsedMedicineData> {
//     try {
//       console.log('🤖 Starting Gemini AI parsing...');

//       if (!this.geminiApiKey) {
//         console.log('⚠️ No Gemini API key, using fallback pattern matching');
//         return this.fallbackPatternParsing(text);
//       }

//       const prompt = `You are a medicine information extraction expert. Analyze this OCR text from a medicine package and extract relevant information.

// OCR Text from medicine packaging:
// "${text}"

// Extract and return ONLY a valid JSON object with these exact fields (use null if not found):
// {
//   "name": "medicine name",
//   "brand_name": "brand name if different from generic",
//   "generic_name": "generic/chemical name",
//   "strength": "dosage strength (e.g., '500mg', '10ml')",
//   "expiry_date": "expiry date in YYYY-MM-DD format",
//   "manufacture_date": "manufacture date in YYYY-MM-DD format",
//   "batch_number": "batch or lot number",
//   "manufacturer": "manufacturer name",
//   "barcode": "barcode number if found",
//   "confidence_scores": {
//     "name": 0.0-1.0,
//     "expiry_date": 0.0-1.0,
//     "batch_number": 0.0-1.0,
//     "strength": 0.0-1.0
//   }
// }

// IMPORTANT RULES:
// 1. Return ONLY the JSON object, no markdown code blocks, no explanations
// 2. Use null for fields you cannot find
// 3. For dates, convert any format (DD/MM/YYYY, MM/YYYY, etc.) to YYYY-MM-DD
// 4. Confidence scores: 1.0 = very confident, 0.5 = uncertain, 0.0 = guessed
// 5. Medicine name should be the primary/main name visible on the package
// 6. If you see "EXP" or "Expiry" followed by a date, that's the expiry_date
// 7. If you see "MFG" or "Mfd" followed by a date, that's the manufacture_date
// 8. Batch/Lot numbers are usually alphanumeric codes after "Batch" or "Lot"
// 9. Handle OCR errors gracefully (e.g., "0" might be "O", "1" might be "I")`;

//       console.log('🌐 Calling Gemini API...');

//       const response = await fetch(
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             contents: [
//               {
//                 parts: [
//                   {
//                     text: prompt,
//                   },
//                 ],
//               },
//             ],
//             generationConfig: {
//               temperature: 0.1,
//               topK: 1,
//               topP: 1,
//               maxOutputTokens: 1024,
//             },
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('❌ Gemini API Error:', errorText);
//         throw new Error(`Gemini API error: ${response.status}`);
//       }

//       const result = await response.json();
//       console.log('📋 Gemini API response received');

//       if (!result.candidates || result.candidates.length === 0) {
//         throw new Error('No response from Gemini AI');
//       }

//       const generatedText = result.candidates[0].content.parts[0].text;
      
//       // Clean the response (remove markdown code blocks if present)
//       const cleanedText = generatedText
//         .replace(/```json\n?/g, '')
//         .replace(/```\n?/g, '')
//         .trim();

//       console.log('🧹 Cleaned AI response:', cleanedText.substring(0, 200));

//       // Parse JSON response
//       const parsedData = JSON.parse(cleanedText);
//       console.log('✅ Successfully parsed AI response');

//       return parsedData;

//     } catch (error) {
//       console.error('❌ Gemini AI parsing error:', error);
//       console.log('⚠️ Falling back to pattern matching');
//       return this.fallbackPatternParsing(text);
//     }
//   }

//   /**
//    * Fallback pattern matching if AI parsing fails
//    */
//   private fallbackPatternParsing(text: string): ParsedMedicineData {
//     console.log('🔍 Using fallback pattern matching');
    
//     return {
//       name: this.extractMedicineName(text),
//       strength: this.extractStrength(text),
//       expiry_date: this.extractExpiryDate(text),
//       manufacture_date: this.extractManufactureDate(text),
//       batch_number: this.extractBatchNumber(text),
//       manufacturer: this.extractManufacturer(text),
//       confidence_scores: {
//         name: 0.6,
//         expiry_date: 0.7,
//         batch_number: 0.5,
//         strength: 0.6,
//       },
//     };
//   }

//   /**
//    * Extract medicine name using pattern matching
//    */
//   private extractMedicineName(text: string): string | undefined {
//     const lines = text.split('\n').filter(line => line.trim().length > 0);
    
//     // Common medicine name patterns
//     const namePatterns = [
//       /^([A-Z][A-Z\s]+)\s*\d+\s*mg/i,
//       /^([A-Z][A-Z\s]+)\s*\d+\s*ml/i,
//       /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\s+(?:Tablets|Capsules|Syrup|Injection)/i,
//       /^([A-Z][A-Za-z]{2,})/,
//     ];

//     for (const line of lines.slice(0, 5)) {
//       for (const pattern of namePatterns) {
//         const match = line.match(pattern);
//         if (match && match[1] && match[1].length > 2) {
//           return match[1].trim();
//         }
//       }
//     }
    
//     return undefined;
//   }

//   /**
//    * Extract strength/dosage
//    */
//   private extractStrength(text: string): string | undefined {
//     const strengthPatterns = [
//       /(\d+(?:\.\d+)?\s*mg)/i,
//       /(\d+(?:\.\d+)?\s*ml)/i,
//       /(\d+(?:\.\d+)?\s*g)/i,
//       /(\d+(?:\.\d+)?\s*mcg)/i,
//       /(\d+(?:\.\d+)?\s*iu)/i,
//     ];

//     for (const pattern of strengthPatterns) {
//       const match = text.match(pattern);
//       if (match && match[1]) {
//         return match[1].toLowerCase().replace(/\s+/g, '');
//       }
//     }
//     return undefined;
//   }

//   /**
//    * Extract expiry date
//    */
//   private extractExpiryDate(text: string): string | undefined {
//     const expiryPatterns = [
//       /exp(?:iry)?(?:\s+date)?[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
//       /exp(?:iry)?[:\s]+(\d{2}[-\/]\d{4})/i,
//       /valid\s+(?:until|till)[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
//       /use\s+before[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
//       /(\d{2}[-\/]\d{4})/i, // Generic date pattern as fallback
//     ];

//     for (const pattern of expiryPatterns) {
//       const match = text.match(pattern);
//       if (match && match[1]) {
//         return this.formatDateString(match[1]);
//       }
//     }
//     return undefined;
//   }

//   /**
//    * Extract manufacture date
//    */
//   private extractManufactureDate(text: string): string | undefined {
//     const mfgPatterns = [
//       /mfg(?:\s+date)?[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
//       /manufactured[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
//       /mfg[:\s]+(\d{2}[-\/]\d{4})/i,
//       /mfd[:\s]+(\d{2}[-\/]\d{4})/i,
//     ];

//     for (const pattern of mfgPatterns) {
//       const match = text.match(pattern);
//       if (match && match[1]) {
//         return this.formatDateString(match[1]);
//       }
//     }
//     return undefined;
//   }

//   /**
//    * Extract batch number
//    */
//   private extractBatchNumber(text: string): string | undefined {
//     const batchPatterns = [
//       /batch(?:\s+no)?[:\s]+([A-Z0-9]+)/i,
//       /lot(?:\s+no)?[:\s]+([A-Z0-9]+)/i,
//       /b\.?no[:\s]+([A-Z0-9]+)/i,
//       /lot[:\s]?([A-Z0-9]{4,})/i,
//     ];

//     for (const pattern of batchPatterns) {
//       const match = text.match(pattern);
//       if (match && match[1]) {
//         return match[1].toUpperCase();
//       }
//     }
//     return undefined;
//   }

//   /**
//    * Extract manufacturer name
//    */
//   private extractManufacturer(text: string): string | undefined {
//     const mfgPatterns = [
//       /manufactured\s+by[:\s]+([A-Z][A-Za-z\s&.,]+(?:Ltd|Limited|Inc|Pvt|Pharma|Healthcare|Laboratories)?)/i,
//       /mfg(?:d)?\s+by[:\s]+([A-Z][A-Za-z\s&.,]+)/i,
//       /(?:by|from)[:\s]+([A-Z][A-Za-z\s&.,]+(?:Pharma|Healthcare|Laboratories|Ltd|Limited))/i,
//     ];

//     for (const pattern of mfgPatterns) {
//       const match = text.match(pattern);
//       if (match && match[1]) {
//         return match[1].trim();
//       }
//     }
//     return undefined;
//   }

//   /**
//    * Format date string to YYYY-MM-DD
//    */
//   private formatDateString(dateStr: string): string {
//     try {
//       // Handle MM/YYYY or MM-YYYY format
//       if (dateStr.match(/^\d{2}[\/\-]\d{4}$/)) {
//         const [month, year] = dateStr.split(/[\/\-]/);
//         return `${year}-${month.padStart(2, '0')}-01`;
//       }
      
//       // Handle DD/MM/YYYY or DD-MM-YYYY format
//       if (dateStr.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)) {
//         const [day, month, year] = dateStr.split(/[\/\-]/);
//         return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
//       }
      
//       return dateStr;
//     } catch (error) {
//       console.error('Date formatting error:', error);
//       return dateStr;
//     }
//   }

//   /**
//    * Calculate overall confidence score
//    */
//   private calculateOverallConfidence(parsedData: ParsedMedicineData): number {
//     const scores = parsedData.confidence_scores;
//     if (!scores) return 0.5;

//     const values = Object.values(scores).filter(score => typeof score === 'number');
//     if (values.length === 0) return 0.5;

//     const average = values.reduce((sum, score) => sum + score, 0) / values.length;
//     return Math.round(average * 100) / 100;
//   }

//   /**
//    * Validate extracted medicine data
//    */
//   validateParsedData(data: ParsedMedicineData): { isValid: boolean; errors: string[] } {
//     const errors: string[] = [];

//     if (!data.name || data.name.trim().length < 2) {
//       errors.push('Medicine name is required');
//     }

//     if (data.expiry_date && !this.isValidDate(data.expiry_date)) {
//       errors.push('Invalid expiry date format');
//     }

//     if (data.manufacture_date && !this.isValidDate(data.manufacture_date)) {
//       errors.push('Invalid manufacture date format');
//     }

//     // Check if expiry date is in the past
//     if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
//       errors.push('Medicine appears to be expired');
//     }

//     return {
//       isValid: errors.length === 0,
//       errors
//     };
//   }

//   /**
//    * Check if date string is valid
//    */
//   private isValidDate(dateStr: string): boolean {
//     const date = new Date(dateStr);
//     return !isNaN(date.getTime()) && !!dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
//   }
// }



//
import { OCRProcessingResult, ParsedMedicineData } from '@/types/scan';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * OCR Service using device text recognition and AI analysis
 */
export class OCRService {
  private static instance: OCRService;
  private euriApiKey: string;
  private apiBaseUrl: string = 'https://api.euron.one/api/v1/euri/chat/completions';

  private constructor() {
    this.euriApiKey = process.env.EXPO_PUBLIC_EURI_API_KEY || 'euri';
    
    if (!this.euriApiKey) {
      console.warn('⚠️ Euron API key not found. OCR will not work.');
    }
  }

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Process image using text extraction and AI analysis
   */
  async processImage(imageUri: string): Promise<OCRProcessingResult> {
    try {
      console.log('📸 Starting OCR processing for:', imageUri);

      if (!this.euriApiKey) {
        return {
          success: false,
          error: 'Euron API key not configured. Please add EXPO_PUBLIC_EURI_API_KEY to .env'
        };
      }

      // First extract text using device OCR or fallback
      const rawText = await this.extractTextFromImage(imageUri);
      
      if (!rawText || rawText.trim().length === 0) {
        return {
          success: false,
          error: 'No text found in image. Try a clearer photo.'
        };
      }

      console.log('📝 Extracted text:', rawText);

      // Use AI to parse the extracted text
      const parsedData = await this.parseTextWithAI(rawText);

      if (!parsedData.name) {
        return {
          success: false,
          error: 'Could not identify medicine from image. Try a clearer photo.'
        };
      }

      console.log('✅ Medicine data extracted:', parsedData);

      return {
        success: true,
        parsed_data: parsedData,
        raw_text: rawText,
        confidence_score: this.calculateOverallConfidence(parsedData)
      };

    } catch (error) {
      console.error('❌ OCR processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process image'
      };
    }
  }

  /**
   * Extract text from image using device capabilities
   */
  private async extractTextFromImage(imageUri: string): Promise<string> {
    try {
      // For React Native, we can use Google Cloud Vision API or device OCR
      // Since we don't have direct OCR, let's use a combination of techniques
      
      // Option 1: Try using Google Cloud Vision API if you have the key
      const visionText = await this.tryGoogleVisionOCR(imageUri);
      if (visionText) return visionText;

      // Option 2: Use device text recognition (if available)
      const deviceText = await this.tryDeviceOCR(imageUri);
      if (deviceText) return deviceText;

      // Option 3: Fallback - process image and use AI directly
      return await this.fallbackImageProcessing(imageUri);

    } catch (error) {
      console.error('Text extraction error:', error);
      return "";
    }
  }

  /**
   * Try Google Cloud Vision OCR
   */
  private async tryGoogleVisionOCR(imageUri: string): Promise<string | null> {
    try {
      const visionApiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
      if (!visionApiKey) return null;

      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image,
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 1,
                  },
                ],
              },
            ],
          }),
        }
      );

      const result = await response.json();

      if (result.responses && result.responses[0].textAnnotations) {
        return result.responses[0].textAnnotations[0].description || '';
      }

      return null;
    } catch (error) {
      console.log('Google Vision OCR failed, trying other methods...');
      return null;
    }
  }

  /**
   * Try device OCR capabilities
   */
  private async tryDeviceOCR(imageUri: string): Promise<string | null> {
    try {
      // For React Native, you can use libraries like:
      // - react-native-text-recognition
      // - @react-native-ml-kit/text-recognition
      // Since we don't have these installed, we'll return null
      
      // If you want to add device OCR, install one of these packages:
      // npm install react-native-text-recognition
      // or
      // npm install @react-native-ml-kit/text-recognition
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fallback image processing when OCR is not available
   */
  private async fallbackImageProcessing(imageUri: string): Promise<string> {
    try {
      // Optimize image for better processing
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 800 } }, // Resize for faster processing
          { crop: { originX: 0, originY: 0, width: 800, height: 600 } },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Convert to base64 for potential future use
      const base64Image = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // For now, return a message that we need manual input
      // In a real app, you'd use a proper OCR service here
      return "Medicine packaging detected. Please ensure text is clear and retry, or enter details manually.";
      
    } catch (error) {
      console.error('Fallback image processing error:', error);
      return "Unable to extract text automatically. Please enter medicine details manually.";
    }
  }

  /**
   * Parse extracted text using Euron AI
   */
  private async parseTextWithAI(text: string): Promise<ParsedMedicineData> {
    try {
      console.log('🤖 Calling Euron AI for text analysis...');

      const prompt = `You are a medicine information extraction expert. Analyze this text from a medicine package and extract relevant information.

Text from medicine packaging:
"${text}"

Extract and return ONLY a valid JSON object with these exact fields (use null if not found):
{
  "name": "medicine name",
  "brand_name": "brand name if different from generic",
  "generic_name": "generic/chemical name",
  "strength": "dosage strength (e.g., '500mg', '10ml')",
  "expiry_date": "expiry date in YYYY-MM-DD format",
  "manufacture_date": "manufacture date in YYYY-MM-DD format",
  "batch_number": "batch or lot number",
  "manufacturer": "manufacturer name",
  "barcode": "barcode number if found",
  "confidence_scores": {
    "name": 0.0-1.0,
    "expiry_date": 0.0-1.0,
    "batch_number": 0.0-1.0,
    "strength": 0.0-1.0
  }
}

Rules:
1. Return ONLY the JSON object, no markdown, no explanations
2. Use null for fields you cannot find
3. For dates, convert any format to YYYY-MM-DD
4. Confidence scores: 1.0 = very confident, 0.5 = uncertain, 0.0 = guessed
5. Medicine name should be the primary/main name on the package
6. If the text seems incomplete or unclear, make your best educated guess`;

      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.euriApiKey}`
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'gpt-4.1-nano',
          max_tokens: 1024,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Euron API Error:', errorText);
        throw new Error(`Euron API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 Euron AI response received');

      if (!result.choices || result.choices.length === 0) {
        throw new Error('No response from AI');
      }

      const generatedText = result.choices[0].message.content;
      
      // Clean response
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      console.log('🧹 Cleaned response:', cleanedText.substring(0, 200));

      const parsedData = JSON.parse(cleanedText);
      console.log('✅ Successfully parsed AI response');

      return parsedData;

    } catch (error) {
      console.error('❌ AI parsing error:', error);
      // Fallback to pattern matching
      return this.fallbackPatternParsing(text);
    }
  }

  /**
   * Fallback pattern matching if AI parsing fails
   */
  private fallbackPatternParsing(text: string): ParsedMedicineData {
    return {
      name: this.extractMedicineName(text) as any,
      brand_name: null as any,
      generic_name: null as any,
      strength: this.extractStrength(text) as any,
      expiry_date: this.extractExpiryDate(text) as any,
      manufacture_date: this.extractManufactureDate(text) as any,
      batch_number: this.extractBatchNumber(text) as any,
      manufacturer: this.extractManufacturer(text) as any,
      barcode: this.extractBarcode(text) as any,
      confidence_scores: {
        name: 0.6,
        expiry_date: 0.7,
        batch_number: 0.5,
        strength: 0.6,
      },
    };
  }

  /**
   * Extract medicine name using pattern matching
   */
  private extractMedicineName(text: string): string | null {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Common medicine name patterns
    const namePatterns = [
      /^([A-Z][A-Z\s]+)\s*\d+\s*mg/i,
      /^([A-Z][A-Z\s]+)\s*\d+\s*ml/i,
      /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\s+(?:Tablets|Capsules|Syrup|Injection)/i,
      /^([A-Z][A-Za-z]+)/,
    ];

    for (const line of lines.slice(0, 5)) {
      for (const pattern of namePatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].length > 2) {
          return match[1].trim();
        }
      }
    }
    
    return null;
  }

  /**
   * Extract strength/dosage using pattern matching
   */
  private extractStrength(text: string): string | null {
    const strengthPatterns = [
      /(\d+(?:\.\d+)?\s*mg)/i,
      /(\d+(?:\.\d+)?\s*ml)/i,
      /(\d+(?:\.\d+)?\s*g)/i,
      /(\d+(?:\.\d+)?\s*mcg)/i,
      /(\d+(?:\.\d+)?\s*iu)/i,
    ];

    for (const pattern of strengthPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase().replace(/\s+/g, '');
      }
    }
    return null;
  }

  /**
   * Extract expiry date using multiple date patterns
   */
  private extractExpiryDate(text: string): string | null {
    const expiryPatterns = [
      /exp(?:iry)?(?:\s+date)?[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
      /exp(?:iry)?[:\s]+(\d{2}[-\/]\d{4})/i,
      /valid\s+(?:until|till)[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
      /use\s+before[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
      /(\d{2}[-\/]\d{2}[-\/]\d{4})/,
    ];

    for (const pattern of expiryPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.formatDateString(match[1]);
      }
    }
    return null;
  }

  /**
   * Extract manufacture date
   */
  private extractManufactureDate(text: string): string | null {
    const mfgPatterns = [
      /mfg(?:\s+date)?[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
      /manufactured[:\s]+(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
      /mfg[:\s]+(\d{2}[-\/]\d{4})/i,
    ];

    for (const pattern of mfgPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.formatDateString(match[1]);
      }
    }
    return null;
  }

  /**
   * Extract batch number
   */
  private extractBatchNumber(text: string): string | null {
    const batchPatterns = [
      /batch(?:\s+no)?[:\s]+([A-Z0-9]+)/i,
      /lot(?:\s+no)?[:\s]+([A-Z0-9]+)/i,
      /b\.?no[:\s]+([A-Z0-9]+)/i,
    ];

    for (const pattern of batchPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
    return null;
  }

  /**
   * Extract manufacturer name
   */
  private extractManufacturer(text: string): string | null {
    const mfgPatterns = [
      /manufactured\s+by[:\s]+([A-Z][A-Za-z\s&.,]+(?:Ltd|Limited|Inc|Pvt|Pharma|Healthcare|Laboratories)?)/i,
      /mfg(?:d)?\s+by[:\s]+([A-Z][A-Za-z\s&.,]+)/i,
      /(?:by|from)[:\s]+([A-Z][A-Za-z\s&.,]+(?:Pharma|Healthcare|Laboratories|Ltd|Limited))/i,
    ];

    for (const pattern of mfgPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Extract barcode number
   */
  private extractBarcode(text: string): string | null {
    const barcodePatterns = [
      /barcode[:\s]+([A-Z0-9]+)/i,
      /code[:\s]+([A-Z0-9]{8,14})/i,
      /(\d{12,14})/,
    ];

    for (const pattern of barcodePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Format date string to YYYY-MM-DD
   */
  private formatDateString(dateStr: string): string {
    try {
      // Handle MM/YYYY or MM-YYYY format
      if (dateStr.match(/^\d{2}[\/\-]\d{4}$/)) {
        const [month, year] = dateStr.split(/[\/\-]/);
        return `${year}-${month.padStart(2, '0')}-01`;
      }
      
      // Handle DD/MM/YYYY or DD-MM-YYYY format
      if (dateStr.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)) {
        const [day, month, year] = dateStr.split(/[\/\-]/);
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      return dateStr;
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateStr;
    }
  }

  /**
   * Calculate overall confidence
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
   * Validate extracted data
   */
  validateParsedData(data: ParsedMedicineData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Medicine name is required');
    }

    if (data.expiry_date && !this.isValidDate(data.expiry_date)) {
      errors.push('Invalid expiry date format');
    }

    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      errors.push('Medicine appears to be expired');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && !!dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  }
}