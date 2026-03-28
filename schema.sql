-- SQL Schema for Rakshak (Medicine Assistant)
-- Run this in your Supabase SQL Editor

-- 1. Create Users table (Syncs with Clerk)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    country TEXT DEFAULT 'IN',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    date_of_birth DATE,
    gender TEXT,
    expo_push_token TEXT,
    push_notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    reminder_notifications_enabled BOOLEAN DEFAULT TRUE,
    preferred_language TEXT DEFAULT 'en',
    temperature_unit TEXT DEFAULT 'C',
    date_format TEXT DEFAULT 'YYYY-MM-DD',
    data_sharing_consent BOOLEAN DEFAULT FALSE,
    analytics_consent BOOLEAN DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Medicines table
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    canonical_name TEXT,
    generic_name TEXT,
    brand_name TEXT,
    manufacturer TEXT,
    barcode TEXT,
    batch_number TEXT,
    ndc_code TEXT,
    original_quantity NUMERIC,
    current_quantity NUMERIC DEFAULT 0,
    unit_type TEXT DEFAULT 'tablets',
    strength TEXT,
    manufacture_date DATE,
    expiry_date DATE,
    opened_date DATE,
    image_path TEXT,
    additional_images TEXT[],
    storage_instructions TEXT,
    medicine_type TEXT, -- e.g., 'tablet', 'capsule', 'syrup'
    therapeutic_class TEXT,
    tags TEXT[],
    dosage_instructions TEXT,
    frequency TEXT,
    prescribed_by TEXT,
    prescription_date DATE,
    status TEXT DEFAULT 'active', -- 'active', 'archived', 'finished'
    is_shared BOOLEAN DEFAULT FALSE,
    is_donated BOOLEAN DEFAULT FALSE,
    notes TEXT,
    acquisition_source TEXT,
    cost NUMERIC,
    currency TEXT DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Scans table (History of OCR/Scan actions)
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE SET NULL,
    scan_type TEXT NOT NULL, -- 'ocr_text', 'barcode', 'qr_code', 'manual'
    image_path TEXT,
    raw_ocr_text TEXT,
    parsed_data JSONB,
    confidence_score NUMERIC,
    processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Medication Logs (Tracking usage)
CREATE TABLE IF NOT EXISTS public.medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE,
    dose_amount NUMERIC,
    taken_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Health Profiles
CREATE TABLE IF NOT EXISTS public.user_health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    known_allergies TEXT[],
    chronic_conditions TEXT[],
    current_medications TEXT[], -- IDs of medicines from 'medicines' table
    blood_group TEXT,
    weight NUMERIC,
    height NUMERIC,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT, -- 'expiry', 'dosage', 'system'
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_medicines_updated_at ON public.medicines;
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON public.medicines FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_profiles_updated_at ON public.user_health_profiles;
CREATE TRIGGER update_health_profiles_updated_at BEFORE UPDATE ON public.user_health_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
