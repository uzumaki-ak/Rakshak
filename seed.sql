-- RAKSHAK SEED DATA
-- Purpose: Populate the database with sample medicines to test the UI/UX.
-- Instructions: Run this in the Supabase SQL Editor. 
-- Ensure you have at least one user in the 'users' table or update the 'user_id' below.

-- 1. Create a sample user if none exists (Optional)
-- INSERT INTO users (clerk_user_id, email, first_name, last_name)
-- VALUES ('user_test_clerk_id', 'tester@rakshak.ai', 'Rakshak', 'Tester')
-- ON CONFLICT (clerk_user_id) DO NOTHING;

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the first available user
    SELECT id INTO target_user_id FROM users LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        -- 2. Clear existing medicines for clean seed (Optional)
        -- DELETE FROM medicines WHERE user_id = target_user_id;

        -- 3. Insert Sample Medicines
        INSERT INTO medicines (
            user_id, name, generic_name, brand_name, strength, current_quantity, 
            unit_type, expiry_date, medicine_type, dosage_instructions, notes, status
        ) VALUES 
        (
            target_user_id, 'Amoxicillin', 'Amoxicillin Trihydrate', 'Amoxil', '500mg', 15, 
            'capsules', (CURRENT_DATE + INTERVAL '180 days'), 'prescription', 
            'Take one capsule three times a day.', 'Finish the full course.', 'active'
        ),
        (
            target_user_id, 'Paracetamol', 'Acetaminophen', 'Panadol', '500mg', 20, 
            'tablets', (CURRENT_DATE + INTERVAL '2 days'), 'otc', 
            'Two tablets every 6 hours as needed for pain.', 'Do not exceed 8 tablets in 24 hours.', 'active'
        ),
        (
            target_user_id, 'Ibuprofen', 'Ibuprofen', 'Advil', '200mg', 10, 
            'tablets', (CURRENT_DATE - INTERVAL '15 days'), 'otc', 
            'One tablet after food.', 'Avoid taking on an empty stomach.', 'active'
        ),
        (
            target_user_id, 'Cetirizine', 'Cetirizine HCl', 'Zyrtec', '10mg', 30, 
            'tablets', (CURRENT_DATE + INTERVAL '400 days'), 'otc', 
            'One tablet daily at night.', 'May cause drowsiness.', 'active'
        ),
        (
            target_user_id, 'Azithromycin', 'Azithromycin', 'Zithromax', '250mg', 6, 
            'tablets', (CURRENT_DATE + INTERVAL '10 days'), 'prescription', 
            'Two tablets on day 1, then one tablet daily.', 'Antibiotic pack.', 'active'
        );

        RAISE NOTICE '✅ Successfully seeded 5 sample medicines for user %', target_user_id;
    ELSE
        RAISE NOTICE '❌ No user found. Please sign in to the app first to create a user record.';
    END IF;
END $$;
