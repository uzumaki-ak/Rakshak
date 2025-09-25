// -- -- Enable extensions
// -- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
// -- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

// -- -- ========== USERS TABLE (Matches your TypeScript interface) ==========
// -- CREATE TABLE users (
// --   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
// --   clerk_user_id TEXT UNIQUE NOT NULL,
// --   email TEXT UNIQUE NOT NULL,
// --   full_name TEXT,
// --   first_name TEXT,
// --   last_name TEXT,
// --   phone TEXT,
// --   avatar_url TEXT,
// --   country TEXT,
// --   timezone TEXT DEFAULT 'UTC',
// --   date_of_birth DATE,
// --   gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  
// --   -- Notification preferences (matches your interface)
// --   expo_push_token TEXT,
// --   push_notifications_enabled BOOLEAN DEFAULT true,
// --   email_notifications_enabled BOOLEAN DEFAULT true,
// --   reminder_notifications_enabled BOOLEAN DEFAULT true,
  
// --   -- App preferences (matches your interface)
// --   preferred_language TEXT DEFAULT 'en',
// --   temperature_unit TEXT DEFAULT 'celsius',
// --   date_format TEXT DEFAULT 'DD/MM/YYYY',
  
// --   -- Privacy & settings (matches your interface)
// --   data_sharing_consent BOOLEAN DEFAULT false,
// --   analytics_consent BOOLEAN DEFAULT false,
// --   marketing_consent BOOLEAN DEFAULT false,
  
// --   -- Metadata
// --   is_active BOOLEAN DEFAULT true,
// --   last_login_at TIMESTAMPTZ,
// --   created_at TIMESTAMPTZ DEFAULT NOW(),
// --   updated_at TIMESTAMPTZ DEFAULT NOW()
// -- );

// -- -- ========== HEALTH PROFILES ==========
// -- CREATE TABLE user_health_profiles (
// --   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
// --   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
// --   height_cm INTEGER,
// --   weight_kg DECIMAL(5,2),
// --   blood_type TEXT,
// --   known_allergies TEXT[],
// --   chronic_conditions TEXT[],
// --   current_medications TEXT[],
// --   emergency_contact_name TEXT,
// --   emergency_contact_phone TEXT,
// --   emergency_contact_relation TEXT,
  
// --   created_at TIMESTAMPTZ DEFAULT NOW(),
// --   updated_at TIMESTAMPTZ DEFAULT NOW(),
// --   UNIQUE(user_id)
// -- );

// -- -- ========== CANONICAL MEDICINES ==========
// -- CREATE TABLE canonical_medicines (
// --   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
// --   name TEXT UNIQUE NOT NULL,
// --   generic_name TEXT,
// --   brand_names TEXT[],
// --   aliases TEXT[],
// --   therapeutic_class TEXT,
// --   drug_class TEXT,
// --   atc_code TEXT,
// --   controlled_substance_schedule TEXT,
// --   indications TEXT[],
// --   contraindications TEXT[],
// --   side_effects TEXT[],
// --   drug_interactions TEXT[],
// --   typical_adult_dose JSONB,
// --   typical_pediatric_dose JSONB,
// --   max_daily_dose TEXT,
// --   active_ingredients TEXT[],
// --   inactive_ingredients TEXT[],
// --   dosage_forms TEXT[],
// --   strengths TEXT[],
// --   fda_approved BOOLEAN,
// --   prescription_required BOOLEAN,
// --   pregnancy_category TEXT,
// --   storage_instructions TEXT,
// --   shelf_life_months INTEGER,
// --   data_sources TEXT[],
// --   last_verified_at TIMESTAMPTZ,
// --   verification_status TEXT DEFAULT 'unverified',
// --   created_at TIMESTAMPTZ DEFAULT NOW(),
// --   updated_at TIMESTAMPTZ DEFAULT NOW()
// -- );

// -- -- ========== MEDICINES (Matches your TypeScript interface) ==========
// -- CREATE TABLE medicines (
// --   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
// --   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
// --   canonical_medicine_id UUID REFERENCES canonical_medicines(id) ON DELETE SET NULL,
  
// --   -- Basic medicine info (matches your interface)
// --   name TEXT NOT NULL,
// --   canonical_name TEXT,
// --   generic_name TEXT,
// --   brand_name TEXT,
// --   manufacturer TEXT,
// --   barcode TEXT,
// --   batch_number TEXT,
// --   ndc_code TEXT,
// --   original_quantity INTEGER,
// --   current_quantity INTEGER DEFAULT 1,
// --   unit_type TEXT,
// --   strength TEXT,
// --   manufacture_date DATE,
// --   expiry_date DATE,
// --   opened_date DATE,
// --   image_path TEXT,
// --   additional_images TEXT[],
// --   storage_instructions TEXT,
// --   medicine_type TEXT,
// --   therapeutic_class TEXT,
// --   tags TEXT[],
// --   dosage_instructions TEXT,
// --   frequency TEXT,
// --   prescribed_by TEXT,
// --   prescription_date DATE,
// --   status TEXT DEFAULT 'active',
// --   is_shared BOOLEAN DEFAULT false,
// --   is_donated BOOLEAN DEFAULT false,
// --   notes TEXT,
// --   acquisition_source TEXT,
// --   cost DECIMAL(10,2),
// --   currency TEXT DEFAULT 'USD',
  
// --   created_at TIMESTAMPTZ DEFAULT NOW(),
// --   updated_at TIMESTAMPTZ DEFAULT NOW()
// -- );

// -- -- ========== REMINDERS ==========
// -- CREATE TABLE reminders (
// --   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
// --   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
// --   medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  
// --   title TEXT NOT NULL,
// --   message TEXT,
// --   reminder_type TEXT NOT NULL,
// --   remind_at TIMESTAMPTZ NOT NULL,
// --   timezone TEXT,
// --   repeat_pattern TEXT,
// --   repeat_until DATE,
// --   push_notification BOOLEAN DEFAULT true,
// --   email_notification BOOLEAN DEFAULT false,
// --   sms_notification BOOLEAN DEFAULT false,
// --   is_delivered BOOLEAN DEFAULT false,
// --   delivered_at TIMESTAMPTZ,
// --   is_acknowledged BOOLEAN DEFAULT false,
// --   acknowledged_at TIMESTAMPTZ,
// --   snooze_count INTEGER DEFAULT 0,
// --   snoozed_until TIMESTAMPTZ,
  
// --   created_at TIMESTAMPTZ DEFAULT NOW(),
// --   updated_at TIMESTAMPTZ DEFAULT NOW()
// -- );

// -- -- ========== SCANS ==========
// -- CREATE TABLE scans (
// --   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
// --   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
// --   medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
  
// --   scan_type TEXT,
// --   image_path TEXT,
// --   raw_ocr_text TEXT,
// --   parsed_data JSONB,
// --   confidence_score DECIMAL(3,2),
// --   processing_status TEXT DEFAULT 'pending',
// --   error_message TEXT,
  
// --   created_at TIMESTAMPTZ DEFAULT NOW()
// -- );

// -- -- ========== MEDICAL REPORTS ==========
// -- CREATE TABLE medical_reports (
// --   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
// --   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
// --   title TEXT,
// --   report_type TEXT,
// --   report_date DATE,
// --   healthcare_provider TEXT,
// --   doctor_name TEXT,
// --   file_path TEXT NOT NULL,
// --   file_type TEXT NOT NULL,
// --   file_size_bytes BIGINT,
// --   raw_ocr_text TEXT,
// --   parsed_results JSONB,
// --   ai_summary TEXT,
// --   key_findings TEXT[],
// --   abnormal_values JSONB,
// --   processing_status TEXT DEFAULT 'pending',
// --   ai_processing_status TEXT DEFAULT 'pending',
// --   privacy_level TEXT DEFAULT 'private',
// --   shared_with TEXT[],
// --   tags TEXT[],
// --   notes TEXT,
  
// --   created_at TIMESTAMPTZ DEFAULT NOW(),
// --   updated_at TIMESTAMPTZ DEFAULT NOW()
// -- );

// -- -- ========== AI CHAT SESSIONS ==========
// -- CREATE TABLE ai_chat_sessions (
// --   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
// --   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
// --   medical_report_id UUID REFERENCES medical_reports(id) ON DELETE SET NULL,
  
// --   title TEXT,
// --   session_type TEXT DEFAULT 'general',
// --   context_data JSONB,
// --   is_active BOOLEAN DEFAULT true,
// --   last_message_at TIMESTAMPTZ,
  
// --   created_at TIMESTAMPTZ DEFAULT NOW(),
// --   updated_at TIMESTAMPTZ DEFAULT now()
// -- );

// -- -- ========== CHAT MESSAGES ==========
// -- CREATE TABLE chat_messages (
// --   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
// --   session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  
// --   sender TEXT NOT NULL,
// --   content TEXT NOT NULL,
// --   message_type TEXT DEFAULT 'text',
// --   model_used TEXT,
// --   tokens_used INTEGER,
// --   processing_time_ms INTEGER,
// --   confidence_score DECIMAL(3,2),
// --   metadata JSONB,
// --   attachments TEXT[],
// --   is_flagged BOOLEAN DEFAULT false,
// --   flag_reason TEXT,
  
// --   created_at TIMESTAMPTZ DEFAULT NOW()
// -- );

// -- -- ========== MEDICINE DONATIONS ==========
// -- CREATE TABLE medicine_donations (
// --   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
// --   donor_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
// --   recipient_user_id UUID REFERENCES users(id),
// --   medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  
// --   quantity_offered INTEGER NOT NULL,
// --   quantity_remaining INTEGER,
// --   expiry_date DATE,
// --   condition_description TEXT,
// --   pickup_location TEXT,
// --   delivery_available BOOLEAN DEFAULT false,
// --   shipping_cost DECIMAL(10,2),
// --   status TEXT DEFAULT 'available',
// --   reserved_until TIMESTAMPTZ,
// --   donor_notes TEXT,
// --   recipient_notes TEXT,
// --   is_verified BOOLEAN DEFAULT false,
// --   verified_by TEXT,
// --   safety_warnings TEXT[],
  
// --   created_at TIMESTAMPTZ DEFAULT NOW(),
// --   updated_at TIMESTAMPTZ DEFAULT NOW()
// -- );

// -- -- ========== USER ACTIVITIES ==========
// -- CREATE TABLE user_activities (
// --   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
// --   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
// --   activity_type TEXT NOT NULL,
// --   activity_data JSONB,
// --   session_id TEXT,
// --   ip_address TEXT,
// --   user_agent TEXT,
// --   app_version TEXT,
// --   platform TEXT,
  
// --   created_at TIMESTAMPTZ DEFAULT NOW()
// -- );

// -- -- ========== USER FEEDBACK ==========
// -- CREATE TABLE user_feedback (
// --   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
// --   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
// --   feedback_type TEXT,
// --   subject TEXT,
// --   description TEXT NOT NULL,
// --   rating INTEGER,
// --   screenshots TEXT[],
// --   logs JSONB,
// --   status TEXT DEFAULT 'open',
// --   admin_response TEXT,
// --   resolved_at TIMESTAMPTZ,
  
// --   created_at TIMESTAMPTZ DEFAULT NOW()
// -- );

// -- -- ========== INDEXES ==========
// -- CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
// -- CREATE INDEX idx_users_email ON users(email);
// -- CREATE INDEX idx_medicines_user_id ON medicines(user_id);
// -- CREATE INDEX idx_medicines_expiry_date ON medicines(expiry_date);
// -- CREATE INDEX idx_medicines_status ON medicines(status);
// -- CREATE INDEX idx_reminders_user_id ON reminders(user_id);
// -- CREATE INDEX idx_reminders_remind_at ON reminders(remind_at);
// -- CREATE INDEX idx_scans_user_id ON scans(user_id);
// -- CREATE INDEX idx_medical_reports_user_id ON medical_reports(user_id);
// -- CREATE INDEX idx_chat_sessions_user_id ON ai_chat_sessions(user_id);
// -- CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

// -- -- ========== UPDATED_AT TRIGGERS ==========
// -- CREATE OR REPLACE FUNCTION update_updated_at_column()
// -- RETURNS TRIGGER AS $$
// -- BEGIN
// --     NEW.updated_at = NOW();
// --     RETURN NEW;
// -- END;
// -- $$ language 'plpgsql';

// -- CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
// -- CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
// -- CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
// -- CREATE TRIGGER update_medical_reports_updated_at BEFORE UPDATE ON medical_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
// -- CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON ai_chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
// -- CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON medicine_donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
// -- CREATE TRIGGER update_health_profiles_updated_at BEFORE UPDATE ON user_health_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

// -- -- ========== RLS POLICIES (Clerk-compatible) ==========
// -- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
// -- ALTER TABLE user_health_profiles ENABLE ROW LEVEL SECURITY;
// -- ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
// -- ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
// -- ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
// -- ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
// -- ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
// -- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
// -- ALTER TABLE medicine_donations ENABLE ROW LEVEL SECURITY;
// -- ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
// -- ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

// -- -- Since we're using Clerk, we'll use a different RLS approach
// -- -- Users can only access their own data based on clerk_user_id
// -- CREATE POLICY "Users can view own data" ON users FOR SELECT USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
// -- CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

// -- -- For other tables, we'll use a function to get user_id from clerk_user_id
// -- CREATE OR REPLACE FUNCTION get_user_id()
// -- RETURNS UUID AS $$
// -- DECLARE
// --   user_clerk_id TEXT;
// --   user_uuid UUID;
// -- BEGIN
// --   user_clerk_id := current_setting('request.jwt.claims', true)::json->>'sub';
// --   SELECT id INTO user_uuid FROM users WHERE clerk_user_id = user_clerk_id;
// --   RETURN user_uuid;
// -- END;
// -- $$ LANGUAGE plpgsql SECURITY DEFINER;

// -- -- Policies for other tables using the function
// -- CREATE POLICY "Users can view own health profiles" ON user_health_profiles FOR SELECT USING (user_id = get_user_id());
// -- CREATE POLICY "Users can manage own health profiles" ON user_health_profiles FOR ALL USING (user_id = get_user_id());

// -- CREATE POLICY "Users can view own medicines" ON medicines FOR SELECT USING (user_id = get_user_id());
// -- CREATE POLICY "Users can manage own medicines" ON medicines FOR ALL USING (user_id = get_user_id());

// -- CREATE POLICY "Users can view own reminders" ON reminders FOR SELECT USING (user_id = get_user_id());
// -- CREATE POLICY "Users can manage own reminders" ON reminders FOR ALL USING (user_id = get_user_id());

// -- CREATE POLICY "Users can view own scans" ON scans FOR SELECT USING (user_id = get_user_id());
// -- CREATE POLICY "Users can manage own scans" ON scans FOR ALL USING (user_id = get_user_id());

// -- CREATE POLICY "Users can view own medical reports" ON medical_reports FOR SELECT USING (user_id = get_user_id());
// -- CREATE POLICY "Users can manage own medical reports" ON medical_reports FOR ALL USING (user_id = get_user_id());

// -- CREATE POLICY "Users can view own chat sessions" ON ai_chat_sessions FOR SELECT USING (user_id = get_user_id());
// -- CREATE POLICY "Users can manage own chat sessions" ON ai_chat_sessions FOR ALL USING (user_id = get_user_id());

// -- CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (session_id IN (SELECT id FROM ai_chat_sessions WHERE user_id = get_user_id()));
// -- CREATE POLICY "Users can manage own chat messages" ON chat_messages FOR ALL USING (session_id IN (SELECT id FROM ai_chat_sessions WHERE user_id = get_user_id()));

// -- CREATE POLICY "Users can view own activities" ON user_activities FOR SELECT USING (user_id = get_user_id());
// -- CREATE POLICY "Users can manage own activities" ON user_activities FOR ALL USING (user_id = get_user_id());

// -- CREATE POLICY "Users can view own feedback" ON user_feedback FOR SELECT USING (user_id = get_user_id());
// -- CREATE POLICY "Users can manage own feedback" ON user_feedback FOR ALL USING (user_id = get_user_id());

// -- -- For donations, users can view their own donations and available donations
// -- CREATE POLICY "Users can view own donations" ON medicine_donations FOR SELECT USING (donor_user_id = get_user_id() OR recipient_user_id = get_user_id());
// -- CREATE POLICY "Users can view available donations" ON medicine_donations FOR SELECT USING (status = 'available');
// -- CREATE POLICY "Users can manage own donations" ON medicine_donations FOR ALL USING (donor_user_id = get_user_id());

// -- -- for one table
// -- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

// -- -- or many tables
// -- ALTER TABLE public.medicines DISABLE ROW LEVEL SECURITY;
// -- ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;
// -- -- repeat for each table you need

// -- dev only: enable permissive insert, seed, then remove
// -- CREATE POLICY "dev_allow_insert_user_health_profiles" ON user_health_profiles FOR INSERT WITH CHECK (true);

// -- -- run your INSERTs here via psql / supabase admin client

// -- DROP POLICY "dev_allow_insert_user_health_profiles" ON user_health_profiles;

// -- DEV ONLY: allow full access to users and user_health_profiles while you finish integration
// CREATE POLICY dev_allow_all_on_users
//   ON public.users
//   FOR ALL
//   USING (true)
//   WITH CHECK (true);

// CREATE POLICY dev_allow_all_on_user_health_profiles
//   ON public.user_health_profiles
//   FOR ALL
//   USING (true)
//   WITH CHECK (true);
