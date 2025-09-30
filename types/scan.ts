export interface ScanResult {
  id: string;
  user_id: string;
  medicine_id?: string;
  scan_type: 'ocr_text' | 'barcode' | 'qr_code' | 'manual';
  image_path?: string;
  raw_ocr_text?: string;
  parsed_data?: ParsedMedicineData;
  confidence_score?: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface ParsedMedicineData {
  name?: string;
  brand_name?: string;
  generic_name?: string;
  strength?: string;
  expiry_date?: string;
  manufacture_date?: string;
  batch_number?: string;
  manufacturer?: string;
  barcode?: string;
  confidence_scores?: {
    name?: number;
    expiry_date?: number;
    batch_number?: number;
    strength?: number;
  };
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
  batch_number?: string;
  manufacturer?: string;
  barcode?: string;
}

export interface CameraPermissions {
  camera: boolean;
  mediaLibrary: boolean;
}

export interface ScanMode {
  id: 'camera' | 'barcode' | 'gallery' | 'manual';
  title: string;
  description: string;
  icon: string;
  available: boolean;
}

export interface OCRProcessingResult {
  success: boolean;
  parsed_data?: ParsedMedicineData;
  raw_text?: string;
  confidence_score?: number;
  error?: string;
}