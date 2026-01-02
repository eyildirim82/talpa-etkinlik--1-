-- Refactor Admin Authorization: Switch from 'role' to 'is_admin'

-- 0. Drop conflicting policies on legacy tables (requests, tickets)
-- These are blocking the DROP COLUMN role
DROP POLICY IF EXISTS "Admins can view all requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can update requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can delete requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can delete tickets" ON public.tickets;

-- Also check for any generic "Admins..." policies
-- (We use separate statements to avoid failure if table doesn't exist, though strictly SQL would error if table missing. 
-- Assuming tables exist per error message.)

-- 1. Ensure is_admin column exists and is populated correctly
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Update is_admin based on existing role if needed
UPDATE public.profiles
SET is_admin = true
WHERE role = 'admin';

-- 2. Drop the 'role' column setup
DROP INDEX IF EXISTS idx_profiles_role;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Drop the column
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS role;

-- 3. Update RLS Policies to use is_admin
-- Drop and recreate for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- 4. Update Triggers (handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, talpa_sicil_no, is_admin)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        COALESCE(NEW.raw_user_meta_data->>'talpa_sicil_no', NULL),
        false -- Default to false
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
