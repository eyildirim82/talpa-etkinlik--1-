-- ============================================
-- TALPA Etkinlik Platform - Storage Configuration
-- ============================================
-- Description: Configure storage buckets for event images
-- Version: 1.0.0
-- Date: 2025-12-29

-- ============================================
-- 1. CREATE STORAGE BUCKET
-- ============================================
-- Note: This is typically done via Supabase Dashboard or CLI
-- SQL statement for reference:

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. STORAGE POLICIES
-- ============================================

-- Policy: Anyone can view/download event images (public read)
CREATE POLICY "Public read access for event images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-images');

-- Policy: Only admins can upload event images
CREATE POLICY "Only admins can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'event-images'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Only admins can update event images
CREATE POLICY "Only admins can update event images"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'event-images'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Only admins can delete event images
CREATE POLICY "Only admins can delete event images"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'event-images'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- Storage Configuration Notes
-- ============================================
-- 
-- BUCKET SETTINGS (Configure in Supabase Dashboard):
-- - Bucket Name: event-images
-- - Public: Yes (for direct image access)
-- - File Size Limit: 5MB
-- - Allowed MIME Types: image/jpeg, image/png, image/webp
-- 
-- USAGE:
-- Upload: supabase.storage.from('event-images').upload(path, file)
-- Get URL: supabase.storage.from('event-images').getPublicUrl(path)
-- Delete: supabase.storage.from('event-images').remove([path])
-- 
-- ============================================
