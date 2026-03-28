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
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_url?: string;
  metadata?: any;
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