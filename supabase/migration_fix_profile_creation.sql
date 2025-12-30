-- ============================================
-- MIGRATION: Fix Profile Creation Issue
-- ============================================
-- Date: 2025-12-30
-- Description: Add auto-profile creation trigger to fix RLS timing issue
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- 4. Test signup flow in your application

-- ============================================
-- 1. CREATE AUTO-PROFILE TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, talpa_sicil_no, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        COALESCE(NEW.raw_user_meta_data->>'talpa_sicil_no', NULL),
        'member'
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically create profile when new user signs up';

-- ============================================
-- 2. CREATE TRIGGER ON AUTH.USERS
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if trigger was created successfully
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Should return 1 row with:
-- trigger_name: on_auth_user_created
-- event_object_table: users
-- action_statement: EXECUTE FUNCTION public.handle_new_user()

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- You can now test the signup flow in your application.
-- Profiles will be created automatically when users sign up.
