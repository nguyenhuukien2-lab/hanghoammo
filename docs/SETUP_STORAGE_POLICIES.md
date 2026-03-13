# Setup Storage Policies cho Product Images

## Bước 1: Vào Policies

1. Click vào bucket **product-images**
2. Click tab **Policies** (bên cạnh Configuration)
3. Bạn sẽ thấy "No policies created yet"

## Bước 2: Tạo Policy cho Public Read

### Option 1: Dùng Template (Dễ nhất)

1. Click **New policy**
2. Chọn template: **"Allow public read access"**
3. Sẽ tự động điền:
   ```
   Policy name: Public read access
   Allowed operation: SELECT
   Target roles: public
   ```
4. Click **Review**
5. Click **Save policy**

### Option 2: Tạo Custom Policy

Nếu không có template, tạo policy thủ công:

1. Click **New policy**
2. Điền thông tin:

**Policy name**: `Public read access`

**Allowed operation**: `SELECT` (chỉ đọc)

**Target roles**: `public`

**Policy definition** (SQL):
```sql
(bucket_id = 'product-images'::text)
```

3. Click **Review** và **Save policy**

## Bước 3: Tạo Policy cho Admin Upload (Optional)

Nếu muốn admin có thể upload qua code:

1. Click **New policy** 
2. Chọn template: **"Allow authenticated users to upload"**
3. Hoặc tạo custom:

**Policy name**: `Authenticated users can upload`

**Allowed operation**: `INSERT`

**Target roles**: `authenticated`

**Policy definition**:
```sql
(bucket_id = 'product-images'::text)
```

## Bước 4: Kiểm tra

### Test upload ảnh:
1. Vào bucket **product-images**
2. Click **Upload file**
3. Chọn 1 ảnh bất kỳ
4. Upload thành công

### Test public URL:
1. Click vào ảnh vừa upload
2. Copy **Public URL**
3. Mở URL trong tab mới
4. Nếu thấy ảnh → Thành công! ✅

## Bước 5: Upload Ảnh Sản Phẩm

### Cách 1: Upload trực tiếp qua Dashboard

1. Vào **Storage** > **product-images**
2. Click **Upload file**
3. Chọn nhiều ảnh cùng lúc
4. Đặt tên file theo sản phẩm:
   - `chatgpt.jpg`
   - `netflix.jpg`
   - `spotify.jpg`
   - `canva.jpg`
   - etc.

### Cách 2: Tạo folder theo category

```
product-images/
  ├── ai/
  │   ├── chatgpt.jpg
  │   ├── midjourney.jpg
  │   └── github-copilot.jpg
  ├── entertainment/
  │   ├── netflix.jpg
  │   ├── spotify.jpg
  │   └── youtube.jpg
  ├── email/
  │   ├── gmail.jpg
  │   └── outlook.jpg
  └── design/
      ├── canva.jpg
      ├── figma.jpg
      └── adobe.jpg
```

## Bước 6: Lấy URL và Update Database

### Format URL:
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/product-images/[FILE_NAME]
```

### Ví dụ:
```
https://abcxyz.supabase.co/storage/v1/object/public/product-images/chatgpt.jpg
```

### Update vào database:
```sql
-- Update 1 sản phẩm
UPDATE products 
SET image = 'https://[PROJECT_ID].supabase.co/storage/v1/object/public/product-images/chatgpt.jpg'
WHERE name LIKE '%ChatGPT%';

-- Update nhiều sản phẩm
UPDATE products SET image = 'https://[PROJECT_ID].supabase.co/storage/v1/object/public/product-images/netflix.jpg' WHERE name LIKE '%Netflix%';
UPDATE products SET image = 'https://[PROJECT_ID].supabase.co/storage/v1/object/public/product-images/spotify.jpg' WHERE name LIKE '%Spotify%';
UPDATE products SET image = 'https://[PROJECT_ID].supabase.co/storage/v1/object/public/product-images/canva.jpg' WHERE name LIKE '%Canva%';
```

## Checklist

- [ ] Đã tạo bucket `product-images` ✅
- [ ] Bucket đã set PUBLIC ✅
- [ ] Đã tạo policy "Public read access"
- [ ] Đã test upload 1 ảnh
- [ ] Đã test public URL
- [ ] Đã upload ảnh cho các sản phẩm chính
- [ ] Đã update URL vào database
- [ ] Ảnh hiển thị đúng trên website

## Lưu ý

- File size limit mặc định: 50MB
- Nên resize ảnh về 800x600 hoặc 1200x800
- Format khuyên dùng: JPG (nhẹ) hoặc PNG (đẹp)
- Nén ảnh trước khi upload: https://tinypng.com
