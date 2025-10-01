export interface AIChatSession {
  id: string;
  user_id: string;
  medical_report_id?: string;
  title: string;
  session_type: 'general' | 'medicine_teller' | 'medicine_suggester' | 'barcode_inspector' | 'report_analyzer' | 'custom';
  context_data?: any;
  is_active: boolean;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  message_type: 'text' | 'image' | 'file' | 'suggestion' | 'warning';
  model_used?: string;
  tokens_used?: number;
  processing_time_ms?: number;
  confidence_score?: number;
  metadata?: any;
  attachments?: string[];
  is_flagged: boolean;
  flag_reason?: string;
  created_at: string;
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'predefined' | 'custom';
  category: 'medicine' | 'analysis' | 'assistance' | 'custom';
  system_prompt: string;
  input_type: 'text' | 'image' | 'barcode' | 'file' | 'mixed';
  output_type: 'text' | 'structured' | 'medicine_form' | 'report';
  created_at?: string;
  user_id?: string;
}

export interface MedicineSuggestion {
  name: string;
  generic_name?: string;
  strength?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  precautions?: string[];
  contraindications?: string[];
}

export interface BarcodeResult {
  product_name?: string;
  manufacturer?: string;
  active_ingredients?: string[];
  strength?: string;
  dosage_form?: string;
  package_size?: string;
  regulatory_status?: string;
  found: boolean;
}

export interface LabReportAnalysis {
  summary: string;
  abnormal_values: Array<{
    test_name: string;
    value: string;
    unit: string;
    reference_range: string;
    significance: string;
  }>;
  recommendations: string[];
  red_flags: string[];
  confidence_score: number;
  sources?: string[];
}