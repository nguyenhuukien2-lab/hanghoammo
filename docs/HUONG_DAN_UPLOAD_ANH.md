# Hướng Dẫn Upload Ảnh Sản Phẩm

## 1. Tạo Bucket trên Supabase

### Bước 1: Truy cập Supabase Dashboard
- Vào: https://supabase.com/dashboard
- Đăng nhập và chọn project của bạn

### Bước 2: Tạo Storage Bucket
1. Click vào **Storage** ở menu bên trái
2. Click **New bucket**
3. Điền thông tin:
   - **Name**: `product-images`
   - **Public bucket**: ✅ Bật ON
   - **File size limit**: 5MB (hoặc tùy chỉnh)
4. Click **Create bucket**

### Bước 3: Cấu hình Policies (Quyền truy cập)
Sau khi tạo bucket, cần set policies:

1. Click vào bucket `product-images`
2. Vào tab **Policies**
3. Click **New policy**
4. Chọn template **Allow public read access**
5. Click **Review** và **Save policy**

## 2. Upload Ảnh Qua Supabase Dashboard

### Cách 1: Upload trực tiếp
1. Vào **Storage** > **product-images**
2. Click **Upload file**
3. Chọn ảnh từ máy tính
4. Sau khi upload, click vào ảnh
5. Copy **Public URL**
6. Dùng URL này cho sản phẩm

### Cách 2: Tạo folder theo danh mục
```
product-images/
  ├── ai/
  │   ├── chatgpt.jpg
  │   └── midjourney.jpg
  ├── entertainment/
  │   ├── netflix.jpg
  │   └── spotify.jpg
  └── email/
      └── gmail.jpg
```

## 3. Upload Ảnh Qua Code (Admin)

### Tạo trang upload cho Admin
File: `public/admin-upload-image.html`

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Upload Ảnh Sản Phẩm</title>
</head>
<body>
    <h1>Upload Ảnh Sản Phẩm</h1>
    
    <input type="file" id="imageFile" accept="image/*">
    <button onclick="uploadImage()">Upload</button>
    
    <div id="result"></div>
    
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
        const supabase = window.supabase.createClient(
            'YOUR_SUPABASE_URL',
            'YOUR_SUPABASE_ANON_KEY'
        );
        
        async function uploadImage() {
            const fileInput = document.getElementById('imageFile');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Chọn ảnh trước!');
                return;
            }
            
            // Tạo tên file unique
            const fileName = `${Date.now()}-${file.name}`;
            
            // Upload
            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(fileName, file);
            
            if (error) {
                document.getElementById('result').innerHTML = 
                    `<p style="color:red">Lỗi: ${error.message}</p>`;
                return;
            }
            
            // Lấy public URL
            const { data: urlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);
            
            document.getElementById('result').innerHTML = 
                `<p style="color:green">Upload thành công!</p>
                 <p>URL: <input type="text" value="${urlData.publicUrl}" style="width:500px"></p>
                 <img src="${urlData.publicUrl}" style="max-width:300px">`;
        }
    </script>
</body>
</html>
```

## 4. Lấy URL Ảnh

### Format URL:
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/product-images/[FILE_NAME]
```

### Ví dụ:
```
https://abcxyz.supabase.co/storage/v1/object/public/product-images/chatgpt.jpg
```

## 5. Cập Nhật Ảnh Sản Phẩm

### Trong Admin Panel:
1. Vào trang sản phẩm
2. Paste URL ảnh vào field **Image URL**
3. Save

### Hoặc update trực tiếp database:
```sql
UPDATE products 
SET image = 'https://[PROJECT_ID].supabase.co/storage/v1/object/public/product-images/chatgpt.jpg'
WHERE id = 1;
```

## 6. Tips

### Tối ưu ảnh trước khi upload:
- **Kích thước**: 800x600px hoặc 1200x800px
- **Format**: JPG (nén tốt) hoặc PNG (chất lượng cao)
- **Dung lượng**: < 500KB
- **Tool**: TinyPNG.com, Squoosh.app

### Đặt tên file:
- Dùng tên có ý nghĩa: `chatgpt-pro.jpg`
- Không dùng tiếng Việt có dấu
- Dùng `-` thay vì space

### Backup:
- Lưu ảnh gốc ở local
- Export danh sách URL từ database

## 7. Troubleshooting

### Lỗi: "Access denied"
→ Kiểm tra policies của bucket

### Lỗi: "File too large"
→ Giảm kích thước ảnh hoặc tăng limit

### Ảnh không hiển thị
→ Kiểm tra URL có đúng không
→ Kiểm tra bucket có public không

## 8. Checklist

- [ ] Đã tạo bucket `product-images`
- [ ] Đã bật Public bucket
- [ ] Đã set policy cho public read
- [ ] Đã test upload 1 ảnh
- [ ] Đã lấy được public URL
- [ ] Đã update vào database
- [ ] Ảnh hiển thị đúng trên web
