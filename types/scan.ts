// export interface ScanResult {
//   id?: string;
//   user_id: string;
//   medicine_id?: string;
//   scan_type: 'ocr_text' | 'barcode' | 'qr_code' | 'manual';
//   image_path?: string;
//   raw_ocr_text?: string;
//   parsed_data?: {
//     name?: string;
//     generic_name?: string;
//     brand_name?: string;
//     strength?: string;
//     expiry_date?: string;
//     batch_number?: string;
//     manufacturer?: string;
//     confidence?: number;
//   };
//   confidence_score?: number;
//   processing_status: 'pending' | 'processing' | 'completed' | 'failed';
//   error_message?: string;
//   created_at?: string;
// }

// export interface ParsedMedicineData {
//   name: string;
//   generic_name?: string;
//   brand_name?: string;
//   strength?: string;
//   expiry_date?: string;
//   batch_number?: string;
//   manufacturer?: string;
//   confidence: number;
// }

// export interface ScanFormData {
//   name: string;
//   generic_name?: string;
//   brand_name?: string;
//   strength?: string;
//   current_quantity: number;
//   unit_type?: string;
//   expiry_date?: string;
//   manufacture_date?: string;
//   medicine_type?: string;
//   dosage_instructions?: string;
//   notes?: string;
// }


//
export interface ParsedMedicineData {
  name?: string;
  generic_name?: string;
  brand_name?: string;
  strength?: string;
  expiry_date?: string;
  batch_number?: string;
  manufacturer?: string;
  confidence?: number;
  raw_text?: string;
}

export interface ScanResult {
  id?: string;
  user_id?: string;
  scan_type: 'barcode' | 'ocr_text' | 'manual' | 'assistant';
  image_path?: string;
  raw_ocr_text?: string;
  parsed_data?: ParsedMedicineData;
  confidence_score?: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  medicine_id?: string;
  created_at?: string;
  barcode_data?: string;
  barcode_type?: string;
}

export interface ScanFormData {
  name: string;
  generic_name?: string;
  brand_name?: string;
  strength?: string;
  current_quantity: number;
  unit_type: string;
  expiry_date?: string;
  manufacture_date?: string;
  medicine_type: string;
  dosage_instructions?: string;
  notes?: string;
}

export interface GeminiOCRResponse {
  extracted_data: ParsedMedicineData;
  confidence: number;
  raw_analysis: string;
}