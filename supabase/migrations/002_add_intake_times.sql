-- Migration 002: Add intake_times to medicines table
-- Purpose: Supports daily dose reminders by storing scheduled times in a JSONB array.

ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS intake_times JSONB DEFAULT '[]'::jsonb;

-- Update existing records to have empty array instead of null
UPDATE public.medicines 
SET intake_times = '[]'::jsonb 
WHERE intake_times IS NULL;
