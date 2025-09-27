// import { supabase } from '@/config/SupabaseConfig';
// import { ParsedMedicineData, ScanFormData, ScanResult } from '@/types/scan';
// import { useUser } from '@clerk/clerk-expo';
// import { useCallback, useState } from 'react';

// import { OCRService } from './services/ocr/tesseract';
// import { TextParserService } from './services/ocr/text-parser';

// export const useScanning = () => {
//   const { user } = useUser();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const processImage = useCallback(async (imageUri: string): Promise<ParsedMedicineData> => {
//     setLoading(true);
//     setError(null);

//     try {
//       // Extract text using OCR
//       const extractedText = await OCRService.extractTextFromImage(imageUri);
      
//       // Parse the extracted text
//       const parsedData = TextParserService.parseMedicineText(extractedText);
      
//       // Get confidence score
//       const confidence = await OCRService.getConfidenceScore(imageUri);
//       parsedData.confidence = Math.max(parsedData.confidence, confidence);

//       return parsedData;
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'OCR processing failed';
//       setError(errorMessage);
//       throw new Error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const saveScan = useCallback(async (
//     scanData: Omit<ScanResult, 'id' | 'created_at'>
//   ): Promise<ScanResult> => {
//     if (!user) throw new Error('User not authenticated');

//     try {
//       // Get user UUID from database
//       const { data: userData, error: userError } = await supabase
//         .from('users')
//         .select('id')
//         .eq('clerk_user_id', user.id)
//         .single();

//       if (userError || !userData) {
//         throw new Error('User not found in database');
//       }

//       const scanRecord = {
//         ...scanData,
//         user_id: userData.id,
//         processing_status: 'completed' as const,
//         created_at: new Date().toISOString(),
//       };

//       const { data, error } = await supabase
//         .from('scans')
//         .insert([scanRecord])
//         .select()
//         .single();

//       if (error) throw error;
//       return data;
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'Failed to save scan';
//       setError(errorMessage);
//       throw new Error(errorMessage);
//     }
//   }, [user]);

//   const saveMedicineFromScan = useCallback(async (
//     formData: ScanFormData,
//     scanId: string
//   ) => {
//     if (!user) throw new Error('User not authenticated');

//     try {
//       // Get user UUID from database
//       const { data: userData, error: userError } = await supabase
//         .from('users')
//         .select('id')
//         .eq('clerk_user_id', user.id)
//         .single();

//       if (userError || !userData) {
//         throw new Error('User not found in database');
//       }

//       const medicineData = {
//         user_id: userData.id,
//         name: formData.name.trim(),
//         generic_name: formData.generic_name?.trim(),
//         brand_name: formData.brand_name?.trim(),
//         strength: formData.strength?.trim(),
//         current_quantity: formData.current_quantity,
//         unit_type: formData.unit_type || 'tablets',
//         expiry_date: formData.expiry_date,
//         manufacture_date: formData.manufacture_date,
//         medicine_type: formData.medicine_type || 'otc',
//         dosage_instructions: formData.dosage_instructions?.trim(),
//         notes: formData.notes?.trim(),
//         status: 'active' as const,
//         is_shared: false,
//         is_donated: false,
//         currency: 'USD',
//       };

//       const { data: medicine, error: medicineError } = await supabase
//         .from('medicines')
//         .insert([medicineData])
//         .select()
//         .single();

//       if (medicineError) throw medicineError;

//       // Update scan record with medicine ID
//       await supabase
//         .from('scans')
//         .update({ medicine_id: medicine.id })
//         .eq('id', scanId);

//       return medicine;
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'Failed to save medicine';
//       setError(errorMessage);
//       throw new Error(errorMessage);
//     }
//   }, [user]);

//   return {
//     processImage,
//     saveScan,
//     saveMedicineFromScan,
//     loading,
//     error,
//     clearError: () => setError(null),
//   };
// };

//
import { useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '@/config/SupabaseConfig';
import { ScanResult, ParsedMedicineData, ScanFormData, GeminiOCRResponse } from '@/types/scan';

// Gemini API Service
class GeminiOCRService {
  private static readonly API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY; // Add this to your .env
  private static readonly API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

  static async extractMedicineData(imageUri: string): Promise<GeminiOCRResponse> {
    if (!this.API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Convert image to base64
      const imageResponse = await fetch(imageUri);
      const blob = await imageResponse.blob();
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data:image/... prefix
        };
        reader.readAsDataURL(blob);
      });

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `Analyze this medicine label image and extract the following information in JSON format:
                {
                  "name": "medicine name",
                  "generic_name": "generic name if available",
                  "brand_name": "brand name if available",
                  "strength": "e.g., 500mg, 10ml",
                  "expiry_date": "YYYY-MM-DD format",
                  "batch_number": "if visible",
                  "manufacturer": "manufacturer name",
                  "confidence": 0.8
                }
                
                Return only valid JSON. If information is not available, use null.`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }
        ]
      };

      const geminiResponse = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
      }

      const data = await geminiResponse.json();
      
      // Extract the JSON from Gemini's response
      const textResponse = data.candidates[0].content.parts[0].text;
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Could not parse Gemini response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      return {
        extracted_data: parsedData,
        confidence: parsedData.confidence || 0.7,
        raw_analysis: textResponse
      };
    } catch (error) {
      console.error('Gemini OCR error:', error);
      throw new Error('Failed to process image with AI');
    }
  }
}

export const useScanning = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (imageUri: string): Promise<ParsedMedicineData> => {
    setLoading(true);
    setError(null);

    try {
      const result = await GeminiOCRService.extractMedicineData(imageUri);
      console.log('Gemini extraction result:', result);
      return result.extracted_data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI processing failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveScan = useCallback(async (
    scanData: Omit<ScanResult, 'id' | 'created_at'>
  ): Promise<ScanResult> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('User not found in database');
      }

      const scanRecord = {
        ...scanData,
        user_id: userData.id,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('scans')
        .insert([scanRecord])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save scan';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const saveMedicineFromScan = useCallback(async (
    formData: ScanFormData,
    scanId: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('User not found in database');
      }

      const medicineData = {
        user_id: userData.id,
        name: formData.name.trim(),
        generic_name: formData.generic_name?.trim(),
        brand_name: formData.brand_name?.trim(),
        strength: formData.strength?.trim(),
        current_quantity: formData.current_quantity,
        unit_type: formData.unit_type || 'tablets',
        expiry_date: formData.expiry_date,
        manufacture_date: formData.manufacture_date,
        medicine_type: formData.medicine_type || 'otc',
        dosage_instructions: formData.dosage_instructions?.trim(),
        notes: formData.notes?.trim(),
        status: 'active',
        is_shared: false,
        is_donated: false,
        currency: 'USD',
      };

      const { data: medicine, error: medicineError } = await supabase
        .from('medicines')
        .insert([medicineData])
        .select()
        .single();

      if (medicineError) throw medicineError;

      // Update scan record with medicine ID
      await supabase
        .from('scans')
        .update({ medicine_id: medicine.id })
        .eq('id', scanId);

      return medicine;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save medicine';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  return {
    processImage,
    saveScan,
    saveMedicineFromScan,
    loading,
    error,
    clearError: () => setError(null),
  };
};