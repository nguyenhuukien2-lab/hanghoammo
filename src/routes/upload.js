const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// Upload image to Supabase Storage
router.post('/upload-image', async (req, res) => {
    try {
        const file = req.files?.file;
        
        if (!file) {
            return res.status(400).json({ success: false, message: 'Không có file được upload' });
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({ success: false, message: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)' });
        }

        if (file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: 'File ảnh không được vượt quá 5MB' });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { data, error } = await supabaseAdmin.storage
            .from('product-images')
            .upload(filePath, file.data, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return res.status(500).json({ success: false, message: 'Lỗi upload ảnh: ' + error.message });
        }

        const { data: urlData } = supabaseAdmin.storage
            .from('product-images')
            .getPublicUrl(filePath);

        res.json({ success: true, url: urlData.publicUrl, message: 'Upload ảnh thành công' });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
});

module.exports = router;
