-- Fix set_active_event function parameter name
-- Run this in Supabase SQL Editor if migration hasn't been run yet

-- Drop old function if exists (UUID version)
DROP FUNCTION IF EXISTS public.set_active_event(UUID) CASCADE;

-- Create/Update function with correct parameter name
CREATE OR REPLACE FUNCTION public.set_active_event(p_event_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_event_exists BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Bu işlem için yetkiniz yok.'
    );
  END IF;
  
  -- Check if event exists
  SELECT EXISTS (
    SELECT 1 FROM public.events WHERE id = p_event_id
  ) INTO v_event_exists;
  
  IF NOT v_event_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Etkinlik bulunamadı.'
    );
  END IF;
  
  -- Deactivate all events first (atomic transaction)
  UPDATE public.events SET status = 'ARCHIVED' WHERE status = 'ACTIVE';
  
  -- Activate the selected event
  UPDATE public.events 
  SET status = 'ACTIVE' 
  WHERE id = p_event_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Etkinlik aktif edildi.'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Etkinlik aktif edilirken hata oluştu: ' || SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.set_active_event IS 'Set an event as active (admin only, ensures single active event)';

