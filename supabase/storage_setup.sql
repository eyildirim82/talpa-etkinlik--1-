-- ============================================
-- TALPA Etkinlik Platform - Additional Storage Setup
-- ============================================

-- 1. Create Buckets
-- Note: 'storage.buckets' table manipulation requires extensions/rights usually available to postgres/service_role
-- Attempting to insert if not exists.

-- 'tickets' bucket (Private - for downloadable tickets)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tickets', 'tickets', false, 10485760, ARRAY['application/pdf']) -- 10MB limit
ON CONFLICT (id) DO NOTHING;

-- 'event-banners' bucket (Public - for event images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('event-banners', 'event-banners', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']) -- 5MB limit
ON CONFLICT (id) DO NOTHING;

-- 'temp-uploads' bucket (Private - for ZIP uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('temp-uploads', 'temp-uploads', false, 104857600, ARRAY['application/zip', 'application/x-zip-compressed']) -- 100MB limit
ON CONFLICT (id) DO NOTHING;


-- 2. Storage Policies

-- TICKETS: Only admins can upload/delete. Users can only read their assigned tickets (handled via signed URLs or check against ticket_pool??)
-- Actually, private buckets usually need signed URLs. 
-- But for 'process-zip' function (Service Role) to write, it bypasses RLS.
-- We still need policies for Client-Side direct interactions if any.
-- The prompt said "Browser-side zip upload issues -> move to Server-side".
-- So Client uploads to 'temp-uploads'.

-- Policy: Admins can upload to 'temp-uploads'
CREATE POLICY "Admins can upload to temp-uploads"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'temp-uploads'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Policy: Admins can delete from 'temp-uploads'
CREATE POLICY "Admins can delete from temp-uploads"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'temp-uploads'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- TICKETS Bucket Policies
-- Admins can view all
CREATE POLICY "Admins can all tickets"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'tickets'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- EVENT BANNERS Policies
-- Public read
CREATE POLICY "Public read event-banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-banners');

-- Admins upload/update/delete
CREATE POLICY "Admins manage event-banners"
ON storage.objects FOR ALL
USING (
    bucket_id = 'event-banners' 
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
