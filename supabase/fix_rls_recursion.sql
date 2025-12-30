-- Fix recursive RLS policies by using SECURITY DEFINER function

-- 1. Ensure is_admin function exists and is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing recursive policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- 3. Re-create policies using is_admin()
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.is_admin());

-- 4. Fix policies on EVENTS table (to be safe and consistent)
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "Only admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Only admins can update events" ON public.events;
DROP POLICY IF EXISTS "Only admins can delete events" ON public.events;

CREATE POLICY "Admins can view all events"
ON public.events
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Only admins can insert events"
ON public.events
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update events"
ON public.events
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Only admins can delete events"
ON public.events
FOR DELETE
USING (public.is_admin());

-- 5. Fix policies on TICKETS table
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Only admins can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Only admins can delete tickets" ON public.tickets;

CREATE POLICY "Admins can view all tickets"
ON public.tickets
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Only admins can update tickets"
ON public.tickets
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Only admins can delete tickets"
ON public.tickets
FOR DELETE
USING (public.is_admin());
