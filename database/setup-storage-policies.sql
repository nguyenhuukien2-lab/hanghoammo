-- Setup Storage Policies cho bucket product-images
-- Chạy trong Supabase SQL Editor

-- 1. Tạo bucket nếu chưa có (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Policy: Cho phép public đọc ảnh (không cần đăng nhập)
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 3. Policy: Cho phép authenticated users upload
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 4. Policy: Cho phép authenticated users xóa ảnh của mình
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 5. Policy: Cho phép service_role (server-side) upload không giới hạn
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;
CREATE POLICY "Service role full access"
ON storage.objects
TO service_role
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');
