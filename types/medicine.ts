export interface Medicine {
  id: string;
  user_id: string;
  canonical_medicine_id?: string;
  name: string;
  canonical_name?: string;
  generic_name?: string;
  brand_name?: string;
  manufacturer?: string;
  barcode?: string;
  batch_number?: string;
  ndc_code?: string;
  original_quantity?: number;
  current_quantity: number;
  unit_type?: string;
  strength?: string;
  manufacture_date?: string;
  expiry_date?: string;
  opened_date?: string;
  image_path?: string;
  additional_images?: string[];
  storage_instructions?: string;
  medicine_type?: string;
  therapeutic_class?: string;
  tags?: string[];
  dosage_instructions?: string;
  frequency?: string;
  prescribed_by?: string;
  prescription_date?: string;
  status: 'active' | 'expired' | 'consumed' | 'donated' | 'disposed';
  is_shared: boolean;
  is_donated: boolean;
  notes?: string;
  acquisition_source?: string;
  cost?: number;
  intake_times?: string[];
  created_at: string;
  updated_at: string;
}

export interface MedicineFormData {
  name: string;
  generic_name?: string;
  brand_name?: string;
  strength?: string;
  current_quantity: number;
  unit_type?: string;
  expiry_date?: string;
  manufacture_date?: string;
  medicine_type?: string;
  dosage_instructions?: string;
  notes?: string;
  intake_times?: string[];
}

export interface MedicineStats {
  total: number;
  active: number;
  expired: number;
  expiring: number;
}