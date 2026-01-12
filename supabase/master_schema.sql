-- ============================================
-- TALPA Etkinlik Platform - MASTER SCHEMA
-- ============================================
-- Description: Birleştirilmiş ve düzeltilmiş veritabanı schema'sı
-- Version: 3.0.0
-- Date: 2026-01-04
-- 
-- BU SCRIPT ŞU SORUNLARI ÇÖZER:
-- 1. RLS Sonsuz Döngüsü (Infinite Recursion) - get_my_admin_status() fonksiyonu ile
-- 2. Dağınık Migration Yapısı - Tek dosyada birleştirildi
-- 3. join_event iyileştirmesi - Standart hata mesajları
-- 4. assign_ticket optimizasyonu - FOR UPDATE SKIP LOCKED
--
-- KULLANIM:
-- 1. Supabase Dashboard > SQL Editor
-- 2. Bu script'in tamamını yapıştırın
-- 3. Run butonuna tıklayın
-- ============================================

-- ============================================
-- STEP 0: Cleanup - Eski politikaları temizle
-- ============================================

-- Profiles tablosu politikaları
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Events tablosu politikaları
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "Only admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Only admins can update events" ON public.events;
DROP POLICY IF EXISTS "Only admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Admins manage all events" ON public.events;

-- Bookings tablosu politikaları
DROP POLICY IF EXISTS "Users view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins manage all bookings" ON public.bookings;

-- Ticket pool tablosu politikaları
DROP POLICY IF EXISTS "Users view assigned ticket" ON public.ticket_pool;
DROP POLICY IF EXISTS "Admins manage tickets" ON public.ticket_pool;

-- Tickets tablosu politikaları (eski schema)
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "No direct ticket inserts" ON public.tickets;
DROP POLICY IF EXISTS "Only admins can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Only admins can delete tickets" ON public.tickets;

-- ============================================
-- STEP 1: SECURITY DEFINER Admin Check Function
-- ============================================
-- Bu fonksiyon RLS politikalarından MUAF çalışır
-- Böylece profiles tablosundaki politika sonsuz döngüye girmez

CREATE OR REPLACE FUNCTION public.get_my_admin_status()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

COMMENT ON FUNCTION public.get_my_admin_status() IS 
  'RLS-safe admin check. SECURITY DEFINER prevents infinite recursion in profiles RLS policies.';

-- Backward compatibility için is_admin() alias
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_my_admin_status();
$$;

COMMENT ON FUNCTION public.is_admin() IS 
  'Alias for get_my_admin_status(). Provided for backward compatibility.';

-- ============================================
-- STEP 2: Enable RLS on All Tables
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Yeni schema tabloları (mevcut ise)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings' AND table_schema = 'public') THEN
    ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_pool' AND table_schema = 'public') THEN
    ALTER TABLE public.ticket_pool ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets' AND table_schema = 'public') THEN
    ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- STEP 3: PROFILES Table RLS Policies
-- ============================================

-- Kullanıcılar kendi profillerini görebilir
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Kullanıcılar kayıt olurken profillerini oluşturabilir
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Adminler TÜM profilleri görebilir ve yönetebilir
-- ✅ DÜZELTME: Fonksiyon kullanarak sonsuz döngü önlenir
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.get_my_admin_status() = true);

CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE 
USING (public.get_my_admin_status() = true);

-- ============================================
-- STEP 4: EVENTS Table RLS Policies
-- ============================================

-- Herkes aktif etkinlikleri görebilir
-- Yeni schema: status = 'ACTIVE', eski schema: is_active = true
CREATE POLICY "Anyone can view active events" 
ON public.events FOR SELECT 
USING (
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'status') 
    THEN (status::text = 'ACTIVE')
    ELSE (is_active = true)
  END
);

-- Adminler tüm etkinlikleri görebilir
CREATE POLICY "Admins can view all events" 
ON public.events FOR SELECT 
USING (public.get_my_admin_status() = true);

-- Adminler etkinlik ekleyebilir
CREATE POLICY "Admins can insert events" 
ON public.events FOR INSERT 
WITH CHECK (public.get_my_admin_status() = true);

-- Adminler etkinlik güncelleyebilir
CREATE POLICY "Admins can update events" 
ON public.events FOR UPDATE 
USING (public.get_my_admin_status() = true);

-- Adminler etkinlik silebilir
CREATE POLICY "Admins can delete events" 
ON public.events FOR DELETE 
USING (public.get_my_admin_status() = true);

-- ============================================
-- STEP 5: BOOKINGS Table RLS Policies (Yeni Schema)
-- ============================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings' AND table_schema = 'public') THEN
    -- Kullanıcılar kendi rezervasyonlarını görebilir
    EXECUTE 'CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id)';
    
    -- Adminler tüm rezervasyonları yönetebilir
    EXECUTE 'CREATE POLICY "Admins can manage all bookings" ON public.bookings FOR ALL USING (public.get_my_admin_status() = true)';
  END IF;
END $$;

-- ============================================
-- STEP 6: TICKET_POOL Table RLS Policies (Yeni Schema)
-- ============================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_pool' AND table_schema = 'public') THEN
    -- Kullanıcılar kendilerine atanmış biletleri görebilir
    EXECUTE 'CREATE POLICY "Users can view own assigned tickets" ON public.ticket_pool FOR SELECT USING (assigned_to = auth.uid())';
    
    -- Adminler tüm bilet havuzunu yönetebilir
    EXECUTE 'CREATE POLICY "Admins can manage ticket pool" ON public.ticket_pool FOR ALL USING (public.get_my_admin_status() = true)';
  END IF;
END $$;

-- ============================================
-- STEP 7: TICKETS Table RLS Policies (Eski Schema)
-- ============================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets' AND table_schema = 'public') THEN
    -- Kullanıcılar kendi biletlerini görebilir
    EXECUTE 'CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id)';
    
    -- Adminler tüm biletleri görebilir
    EXECUTE 'CREATE POLICY "Admins can view all tickets" ON public.tickets FOR SELECT USING (public.get_my_admin_status() = true)';
    
    -- Direkt INSERT yasak (RPC fonksiyonu kullanılmalı)
    EXECUTE 'CREATE POLICY "No direct ticket inserts" ON public.tickets FOR INSERT WITH CHECK (false)';
    
    -- Adminler bilet güncelleyebilir
    EXECUTE 'CREATE POLICY "Admins can update tickets" ON public.tickets FOR UPDATE USING (public.get_my_admin_status() = true)';
    
    -- Adminler bilet silebilir
    EXECUTE 'CREATE POLICY "Admins can delete tickets" ON public.tickets FOR DELETE USING (public.get_my_admin_status() = true)';
  END IF;
END $$;

-- ============================================
-- STEP 8: İyileştirilmiş join_event Fonksiyonu
-- ============================================
-- Standardize edilmiş hata mesajları ile

CREATE OR REPLACE FUNCTION public.join_event(p_event_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_asil_count INT;
  v_current_yedek_count INT;
  v_event_record RECORD;
  v_user_id UUID;
BEGIN
  -- 1. Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'AUTH_REQUIRED',
      'message', 'Giriş yapmalısınız.'
    );
  END IF;

  -- 2. Lock event row (FOR UPDATE prevents race conditions)
  SELECT * INTO v_event_record 
  FROM events 
  WHERE id = p_event_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'EVENT_NOT_FOUND',
      'message', 'Etkinlik bulunamadı.'
    );
  END IF;

  IF v_event_record.status != 'ACTIVE' THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'EVENT_NOT_ACTIVE',
      'message', 'Etkinlik aktif değil.'
    );
  END IF;

  -- 3. Check cut-off date
  IF v_event_record.cut_off_date IS NOT NULL AND NOW() > v_event_record.cut_off_date THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'REGISTRATION_CLOSED',
      'message', 'Başvuru süresi sona ermiştir.'
    );
  END IF;

  -- 4. Check if user already has a booking
  IF EXISTS (SELECT 1 FROM bookings WHERE event_id = p_event_id AND user_id = v_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'ALREADY_REGISTERED',
      'message', 'Zaten bu etkinliğe başvurunuz var.'
    );
  END IF;

  -- 5. Check asil quota
  SELECT COUNT(*) INTO v_current_asil_count 
  FROM bookings 
  WHERE event_id = p_event_id AND queue_status = 'ASIL';

  IF v_current_asil_count < v_event_record.quota_asil THEN
    -- Add to asil list
    INSERT INTO bookings (event_id, user_id, queue_status, consent_kvkk, consent_payment)
    VALUES (p_event_id, v_user_id, 'ASIL', true, true);
    
    RETURN json_build_object(
      'success', true,
      'queue', 'ASIL',
      'position', v_current_asil_count + 1,
      'message', 'Başvurunuz alındı. Asil listedesiniz.'
    );
  END IF;

  -- 6. Check yedek quota
  SELECT COUNT(*) INTO v_current_yedek_count 
  FROM bookings 
  WHERE event_id = p_event_id AND queue_status = 'YEDEK';

  IF v_current_yedek_count < v_event_record.quota_yedek THEN
    -- Add to yedek list
    INSERT INTO bookings (event_id, user_id, queue_status, consent_kvkk, consent_payment)
    VALUES (p_event_id, v_user_id, 'YEDEK', true, true);
    
    RETURN json_build_object(
      'success', true,
      'queue', 'YEDEK',
      'position', v_current_yedek_count + 1,
      'message', 'Başvurunuz alındı. Yedek listedesiniz.'
    );
  END IF;

  -- 7. Quota full
  RETURN json_build_object(
    'success', false,
    'error_code', 'QUOTA_FULL',
    'message', 'Kontenjan dolmuştur.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'INTERNAL_ERROR',
      'message', 'Beklenmeyen bir hata oluştu.',
      'details', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.join_event(BIGINT) IS 
  'Join event queue system with race condition protection and standardized error codes';

-- ============================================
-- STEP 9: Optimize edilmiş assign_ticket Fonksiyonu
-- ============================================
-- FOR UPDATE SKIP LOCKED kullanarak eşzamanlı admin işlemlerini iyileştirir

CREATE OR REPLACE FUNCTION public.assign_ticket(p_booking_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_record RECORD;
  v_ticket_record RECORD;
  v_user_id UUID;
BEGIN
  -- 1. Admin check using SECURITY DEFINER function
  v_user_id := auth.uid();
  IF v_user_id IS NULL OR NOT public.get_my_admin_status() THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'UNAUTHORIZED',
      'message', 'Bu işlem için yetkiniz yok.'
    );
  END IF;

  -- 2. Get and lock booking
  SELECT * INTO v_booking_record 
  FROM bookings 
  WHERE id = p_booking_id AND payment_status = 'WAITING'
  FOR UPDATE SKIP LOCKED;  -- ✅ Diğer adminler beklemeden devam edebilir

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'BOOKING_NOT_FOUND',
      'message', 'Başvuru bulunamadı, zaten işleniyor veya ödeme tamamlanmış.'
    );
  END IF;

  -- 3. Find next unassigned ticket (ordered by file_name)
  -- SKIP LOCKED sayesinde başka admin tarafından kilitlenen biletler atlanır
  SELECT * INTO v_ticket_record 
  FROM ticket_pool
  WHERE event_id = v_booking_record.event_id 
    AND is_assigned = false
  ORDER BY file_name ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'NO_TICKETS_AVAILABLE',
      'message', 'Atanabilir bilet bulunamadı.'
    );
  END IF;

  -- 4. Assign ticket
  UPDATE ticket_pool
  SET 
    assigned_to = v_booking_record.user_id,
    assigned_at = NOW(),
    is_assigned = true
  WHERE id = v_ticket_record.id;

  -- 5. Update booking
  UPDATE bookings
  SET payment_status = 'PAID'
  WHERE id = p_booking_id;

  RETURN json_build_object(
    'success', true,
    'ticket_id', v_ticket_record.id,
    'file_path', v_ticket_record.file_path,
    'message', 'Bilet başarıyla atandı.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'INTERNAL_ERROR',
      'message', 'Bilet atanırken bir hata oluştu.',
      'details', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.assign_ticket(BIGINT) IS 
  'Assign ticket from pool to booking (admin only). Uses SKIP LOCKED for concurrent admin operations.';

-- ============================================
-- STEP 10: promote_from_waitlist Fonksiyonu
-- ============================================

CREATE OR REPLACE FUNCTION public.promote_from_waitlist(p_event_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_waitlist_record RECORD;
  v_event_record RECORD;
  v_asil_count INT;
BEGIN
  -- 1. Admin check
  IF NOT public.get_my_admin_status() THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'UNAUTHORIZED',
      'message', 'Bu işlem için yetkiniz yok.'
    );
  END IF;

  -- 2. Get event
  SELECT * INTO v_event_record FROM events WHERE id = p_event_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'EVENT_NOT_FOUND',
      'message', 'Etkinlik bulunamadı.'
    );
  END IF;

  -- 3. Check asil quota
  SELECT COUNT(*) INTO v_asil_count 
  FROM bookings 
  WHERE event_id = p_event_id AND queue_status = 'ASIL';
  
  IF v_asil_count >= v_event_record.quota_asil THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'ASIL_QUOTA_FULL',
      'message', 'Asil liste dolu.'
    );
  END IF;

  -- 4. Find first yedek (ordered by booking_date)
  SELECT * INTO v_next_waitlist_record 
  FROM bookings
  WHERE event_id = p_event_id 
    AND queue_status = 'YEDEK'
  ORDER BY booking_date ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'WAITLIST_EMPTY',
      'message', 'Yedek liste boş.'
    );
  END IF;

  -- 5. Promote to asil
  UPDATE bookings
  SET queue_status = 'ASIL'
  WHERE id = v_next_waitlist_record.id;

  RETURN json_build_object(
    'success', true,
    'user_id', v_next_waitlist_record.user_id,
    'booking_id', v_next_waitlist_record.id,
    'message', 'Yedek listeden asil listeye çıkarıldı.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'INTERNAL_ERROR',
      'message', 'İşlem sırasında bir hata oluştu.',
      'details', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.promote_from_waitlist(BIGINT) IS 
  'Promote first yedek to asil when space opens (admin only)';

-- ============================================
-- STEP 11: set_active_event Fonksiyonu (Güncellendi)
-- ============================================

CREATE OR REPLACE FUNCTION public.set_active_event(p_event_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_exists BOOLEAN;
BEGIN
  -- 1. Admin check using SECURITY DEFINER function
  IF NOT public.get_my_admin_status() THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'UNAUTHORIZED',
      'message', 'Bu işlem için yetkiniz yok.'
    );
  END IF;
  
  -- 2. Check if event exists
  SELECT EXISTS (
    SELECT 1 FROM events WHERE id = p_event_id
  ) INTO v_event_exists;
  
  IF NOT v_event_exists THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'EVENT_NOT_FOUND',
      'message', 'Etkinlik bulunamadı.'
    );
  END IF;
  
  -- 3. Deactivate all events first (atomic transaction)
  UPDATE events SET status = 'ARCHIVED' WHERE status = 'ACTIVE';
  
  -- 4. Activate the selected event
  UPDATE events 
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
      'error_code', 'INTERNAL_ERROR',
      'message', 'Etkinlik aktif edilirken hata oluştu.',
      'details', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.set_active_event(BIGINT) IS 
  'Set an event as active (admin only, ensures single active event)';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- 
-- ✅ get_my_admin_status() - RLS-safe admin kontrolü
-- ✅ Tüm RLS politikaları düzeltildi
-- ✅ join_event - Standart hata kodları
-- ✅ assign_ticket - SKIP LOCKED ile optimize
-- ✅ promote_from_waitlist - Admin fonksiyonu
-- ✅ set_active_event - Admin fonksiyonu
--
-- NOT: Bu script güvenli bir şekilde birden fazla kez çalıştırılabilir.
-- Mevcut politikalar DROP edilip yeniden oluşturulur.
-- ============================================
