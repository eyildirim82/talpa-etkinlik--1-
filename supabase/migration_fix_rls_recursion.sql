-- Refactor Admin Authorization: Fix Recursive RLS

-- 1. Create a function to check admin status with SECURITY DEFINER
-- This bypasses RLS, preventing the recursion loop when querying profiles table within a profiles policy
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$;

-- 2. Drop existing policies to be safe (re-runnable)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 3. Re-create Admin policies using the function
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (
  public.is_admin() = true
);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  public.is_admin() = true
);

-- Note: "Public profiles are viewable by everyone" (USING true) already covers viewing, 
-- but "Admins can view all profiles" ensures explicit access if the public one is ever restricted. 
-- However, having two overlapping SELECT policies is fine (OR logic).
