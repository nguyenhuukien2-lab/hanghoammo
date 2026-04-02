const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const crypto = require('crypto');

// =====================================================
// PUBLIC ROUTES - Xem thông tin tier
// =====================================================

// GET /api/reseller/tiers - Lấy danh sách các cấp bậc
router.get('/tiers', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tier_config')
            .select('*')
            .order('min_spent', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get tiers error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin cấp bậc',
            error: error.message
        });
    }
});

// =====================================================
// PROTECTED ROUTES - Yêu cầu đăng nhập
// =====================================================

// GET /api/reseller/my-tier - Xem tier hiện tại của mình
router.get('/my-tier', authenticateToken, async (req, res) => {
    try {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('user_tier, total_spent')
            .eq('id', req.user.id)
            .single();

        if (userError) throw userError;

        const { data: tierData, error: tierError } = await supabase
            .from('tier_config')
            .select('*')
            .eq('tier_name', userData.user_tier)
            .single();

        if (tierError) throw tierError;

        // Tìm tier tiếp theo
        const { data: nextTier } = await supabase
            .from('tier_config')
            .select('*')
            .gt('min_spent', userData.total_spent)
            .order('min_spent', { ascending: true })
            .limit(1)
            .single();

        res.json({
            success: true,
            data: {
                current_tier: tierData,
                total_spent: userData.total_spent,
                next_tier: nextTier,
                progress: nextTier ? {
                    current: userData.total_spent,
                    required: nextTier.min_spent,
                    remaining: nextTier.min_spent - userData.total_spent,
                    percent: Math.min(100, (userData.total_spent / nextTier.min_spent) * 100)
                } : null
            }
        });
    } catch (error) {
        console.error('Get my tier error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin tier',
            error: error.message
        });
    }
});

// GET /api/reseller/upgrade-history - Lịch sử nâng cấp
router.get('/upgrade-history', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tier_upgrade_history')
            .select('*')
            .eq('user_id', req.user.id)
            .order('upgraded_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get upgrade history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử nâng cấp',
            error: error.message
        });
    }
});

// =====================================================
// API KEYS MANAGEMENT
// =====================================================

// GET /api/reseller/api-keys - Lấy danh sách API keys
router.get('/api-keys', authenticateToken, async (req, res) => {
    try {
        // Check if user can use API
        const { data: userData } = await supabase
            .from('users')
            .select('user_tier')
            .eq('id', req.user.id)
            .single();

        const { data: tierData } = await supabase
            .from('tier_config')
            .select('can_use_api')
            .eq('tier_name', userData.user_tier)
            .single();

        if (!tierData.can_use_api) {
            return res.status(403).json({
                success: false,
                message: 'Bạn cần nâng cấp lên Reseller hoặc Agency để sử dụng API'
            });
        }

        const { data, error } = await supabase
            .from('api_keys')
            .select('id, name, api_key, is_active, calls_today, last_call_at, created_at, expires_at')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get API keys error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách API keys',
            error: error.message
        });
    }
});

// POST /api/reseller/api-keys - Tạo API key mới
router.post('/api-keys', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;

        // Check if user can use API
        const { data: userData } = await supabase
            .from('users')
            .select('user_tier')
            .eq('id', req.user.id)
            .single();

        const { data: tierData } = await supabase
            .from('tier_config')
            .select('can_use_api')
            .eq('tier_name', userData.user_tier)
            .single();

        if (!tierData.can_use_api) {
            return res.status(403).json({
                success: false,
                message: 'Bạn cần nâng cấp lên Reseller hoặc Agency để sử dụng API'
            });
        }

        // Generate API key and secret
        const apiKey = 'hhmmo_' + crypto.randomBytes(24).toString('hex');
        const apiSecret = crypto.randomBytes(32).toString('hex');
        const hashedSecret = crypto.createHash('sha256').update(apiSecret).digest('hex');

        const { data, error } = await supabase
            .from('api_keys')
            .insert({
                user_id: req.user.id,
                api_key: apiKey,
                api_secret: hashedSecret,
                name: name || 'API Key',
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Tạo API key thành công',
            data: {
                ...data,
                api_secret: apiSecret // Chỉ hiển thị 1 lần duy nhất
            },
            warning: 'Lưu API Secret ngay! Bạn sẽ không thể xem lại.'
        });
    } catch (error) {
        console.error('Create API key error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo API key',
            error: error.message
        });
    }
});

// DELETE /api/reseller/api-keys/:id - Xóa API key
router.delete('/api-keys/:id', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('api_keys')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Xóa API key thành công'
        });
    } catch (error) {
        console.error('Delete API key error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa API key',
            error: error.message
        });
    }
});

// PUT /api/reseller/api-keys/:id/toggle - Bật/tắt API key
router.put('/api-keys/:id/toggle', authenticateToken, async (req, res) => {
    try {
        const { data: keyData } = await supabase
            .from('api_keys')
            .select('is_active')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        const { error } = await supabase
            .from('api_keys')
            .update({ is_active: !keyData.is_active })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.json({
            success: true,
            message: `API key đã ${!keyData.is_active ? 'bật' : 'tắt'}`
        });
    } catch (error) {
        console.error('Toggle API key error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thay đổi trạng thái API key',
            error: error.message
        });
    }
});

// =====================================================
// REFERRAL SYSTEM
// =====================================================

// GET /api/reseller/referral-code - Lấy mã giới thiệu của mình
router.get('/referral-code', authenticateToken, async (req, res) => {
    try {
        let { data: referralData } = await supabase
            .from('referrals')
            .select('referral_code')
            .eq('referrer_id', req.user.id)
            .limit(1)
            .single();

        // Nếu chưa có, tạo mã mới
        if (!referralData) {
            const code = 'REF' + crypto.randomBytes(4).toString('hex').toUpperCase();
            
            const { data: newReferral, error } = await supabase
                .from('referrals')
                .insert({
                    referrer_id: req.user.id,
                    referral_code: code
                })
                .select()
                .single();

            if (error) throw error;
            referralData = newReferral;
        }

        res.json({
            success: true,
            data: {
                referral_code: referralData.referral_code,
                referral_link: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/register-new.html?ref=${referralData.referral_code}`
            }
        });
    } catch (error) {
        console.error('Get referral code error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy mã giới thiệu',
            error: error.message
        });
    }
});

// GET /api/reseller/referrals - Danh sách người được giới thiệu
router.get('/referrals', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('referrals')
            .select(`
                *,
                referred:users!referrals_referred_id_fkey(id, email, full_name, created_at)
            `)
            .eq('referrer_id', req.user.id)
            .not('referred_id', 'is', null);

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get referrals error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách giới thiệu',
            error: error.message
        });
    }
});

// GET /api/reseller/commissions - Lịch sử hoa hồng
router.get('/commissions', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('commission_history')
            .select(`
                *,
                referred:users!commission_history_referred_id_fkey(email, full_name),
                order:orders(id, total_amount, created_at)
            `)
            .eq('referrer_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Tính tổng hoa hồng
        const totalCommission = data.reduce((sum, item) => sum + parseFloat(item.commission_amount), 0);
        const pendingCommission = data.filter(item => item.status === 'pending')
            .reduce((sum, item) => sum + parseFloat(item.commission_amount), 0);
        const paidCommission = data.filter(item => item.status === 'paid')
            .reduce((sum, item) => sum + parseFloat(item.commission_amount), 0);

        res.json({
            success: true,
            data: data,
            summary: {
                total: totalCommission,
                pending: pendingCommission,
                paid: paidCommission
            }
        });
    } catch (error) {
        console.error('Get commissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử hoa hồng',
            error: error.message
        });
    }
});

// POST /api/reseller/apply-referral - Áp dụng mã giới thiệu (khi đăng ký)
router.post('/apply-referral', authenticateToken, async (req, res) => {
    try {
        const { referral_code } = req.body;

        if (!referral_code) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mã giới thiệu'
            });
        }

        // Tìm referrer
        const { data: referralData, error: findError } = await supabase
            .from('referrals')
            .select('referrer_id')
            .eq('referral_code', referral_code.toUpperCase())
            .single();

        if (findError || !referralData) {
            return res.status(404).json({
                success: false,
                message: 'Mã giới thiệu không hợp lệ'
            });
        }

        // Không thể tự giới thiệu mình
        if (referralData.referrer_id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Không thể sử dụng mã giới thiệu của chính mình'
            });
        }

        // Check xem user đã được giới thiệu chưa
        const { data: existingRef } = await supabase
            .from('referrals')
            .select('id')
            .eq('referred_id', req.user.id)
            .single();

        if (existingRef) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã được giới thiệu bởi người khác'
            });
        }

        // Cập nhật referred_id
        const { error: updateError } = await supabase
            .from('referrals')
            .update({ referred_id: req.user.id })
            .eq('referral_code', referral_code.toUpperCase());

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: 'Áp dụng mã giới thiệu thành công'
        });
    } catch (error) {
        console.error('Apply referral error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi áp dụng mã giới thiệu',
            error: error.message
        });
    }
});

module.exports = router;
