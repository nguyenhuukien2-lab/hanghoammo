// Affiliate Routes
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');

// Generate unique referral code
function generateReferralCode(userId) {
    const hash = crypto.createHash('md5').update(userId + Date.now()).digest('hex');
    return hash.substring(0, 8).toUpperCase();
}

// Register as affiliate
router.post('/register', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        // Check if already registered
        const { data: existing } = await supabase
            .from('affiliates')
            .select('*')
            .eq('user_id', user_id)
            .single();
        
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bạn đã đăng ký affiliate rồi' 
            });
        }
        
        // Generate unique referral code
        let referralCode;
        let isUnique = false;
        
        while (!isUnique) {
            referralCode = generateReferralCode(user_id);
            const { data } = await supabase
                .from('affiliates')
                .select('id')
                .eq('referral_code', referralCode)
                .single();
            
            if (!data) isUnique = true;
        }
        
        // Create affiliate account
        const { data: affiliate, error } = await supabase
            .from('affiliates')
            .insert({
                user_id,
                referral_code: referralCode,
                commission_rate: 10.00 // Default 10%
            })
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ 
            success: true, 
            data: affiliate, 
            message: 'Đăng ký affiliate thành công!' 
        });
    } catch (error) {
        console.error('Register affiliate error:', error);
        res.status(500).json({ success: false, message: 'Lỗi đăng ký affiliate' });
    }
});

// Get affiliate info
router.get('/info', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        const { data: affiliate, error } = await supabase
            .from('affiliates')
            .select('*')
            .eq('user_id', user_id)
            .single();
        
        if (error) throw error;
        
        if (!affiliate) {
            return res.status(404).json({ 
                success: false, 
                message: 'Chưa đăng ký affiliate' 
            });
        }
        
        res.json({ success: true, data: affiliate });
    } catch (error) {
        console.error('Get affiliate info error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy thông tin affiliate' });
    }
});

// Get affiliate statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        // Get affiliate
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id')
            .eq('user_id', user_id)
            .single();
        
        if (!affiliate) {
            return res.status(404).json({ 
                success: false, 
                message: 'Chưa đăng ký affiliate' 
            });
        }
        
        // Get referrals count
        const { count: totalReferrals } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_id', affiliate.id);
        
        const { count: activeReferrals } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_id', affiliate.id)
            .eq('status', 'active');
        
        // Get commissions
        const { data: commissions } = await supabase
            .from('affiliate_commissions')
            .select('commission_amount, status')
            .eq('affiliate_id', affiliate.id);
        
        const stats = {
            totalReferrals,
            activeReferrals,
            totalCommissions: commissions?.length || 0,
            pendingCommissions: commissions?.filter(c => c.status === 'pending').length || 0,
            approvedCommissions: commissions?.filter(c => c.status === 'approved').length || 0,
            paidCommissions: commissions?.filter(c => c.status === 'paid').length || 0,
            totalEarnings: commissions?.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0) || 0
        };
        
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Get affiliate stats error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy thống kê affiliate' });
    }
});

// Get referrals list
router.get('/referrals', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        // Get affiliate
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id')
            .eq('user_id', user_id)
            .single();
        
        if (!affiliate) {
            return res.status(404).json({ 
                success: false, 
                message: 'Chưa đăng ký affiliate' 
            });
        }
        
        // Get referrals
        const { data: referrals, error } = await supabase
            .from('referrals')
            .select(`
                *,
                users:referred_user_id (name, email, created_at)
            `)
            .eq('affiliate_id', affiliate.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (error) throw error;
        
        // Get total count
        const { count } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_id', affiliate.id);
        
        res.json({
            success: true,
            data: referrals,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get referrals error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách giới thiệu' });
    }
});

// Get commissions list
router.get('/commissions', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;
        
        // Get affiliate
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id')
            .eq('user_id', user_id)
            .single();
        
        if (!affiliate) {
            return res.status(404).json({ 
                success: false, 
                message: 'Chưa đăng ký affiliate' 
            });
        }
        
        // Build query
        let query = supabase
            .from('affiliate_commissions')
            .select(`
                *,
                orders:order_id (id, total_amount, created_at),
                referrals:referral_id (
                    users:referred_user_id (name, email)
                )
            `)
            .eq('affiliate_id', affiliate.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data: commissions, error } = await query;
        
        if (error) throw error;
        
        // Get total count
        let countQuery = supabase
            .from('affiliate_commissions')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_id', affiliate.id);
        
        if (status) {
            countQuery = countQuery.eq('status', status);
        }
        
        const { count } = await countQuery;
        
        res.json({
            success: true,
            data: commissions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get commissions error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách hoa hồng' });
    }
});

// Request withdrawal
router.post('/withdraw', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        const { amount, payment_method, payment_info } = req.body;
        
        // Get affiliate
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('*')
            .eq('user_id', user_id)
            .single();
        
        if (!affiliate) {
            return res.status(404).json({ 
                success: false, 
                message: 'Chưa đăng ký affiliate' 
            });
        }
        
        // Validate amount
        if (amount < 100000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Số tiền rút tối thiểu là 100,000đ' 
            });
        }
        
        if (amount > affiliate.available_balance) {
            return res.status(400).json({ 
                success: false, 
                message: 'Số dư không đủ' 
            });
        }
        
        // Create withdrawal request
        const { data: withdrawal, error } = await supabase
            .from('affiliate_withdrawals')
            .insert({
                affiliate_id: affiliate.id,
                amount,
                payment_method,
                payment_info
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Update available balance
        await supabase
            .from('affiliates')
            .update({
                available_balance: affiliate.available_balance - amount
            })
            .eq('id', affiliate.id);
        
        res.json({ 
            success: true, 
            data: withdrawal, 
            message: 'Yêu cầu rút tiền thành công!' 
        });
    } catch (error) {
        console.error('Withdraw error:', error);
        res.status(500).json({ success: false, message: 'Lỗi yêu cầu rút tiền' });
    }
});

// Get withdrawal history
router.get('/withdrawals', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        // Get affiliate
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id')
            .eq('user_id', user_id)
            .single();
        
        if (!affiliate) {
            return res.status(404).json({ 
                success: false, 
                message: 'Chưa đăng ký affiliate' 
            });
        }
        
        const { data: withdrawals, error } = await supabase
            .from('affiliate_withdrawals')
            .select('*')
            .eq('affiliate_id', affiliate.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({ success: true, data: withdrawals });
    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử rút tiền' });
    }
});

// Validate referral code (public)
router.get('/validate/:code', async (req, res) => {
    try {
        const { code } = req.params;
        
        const { data: affiliate, error } = await supabase
            .from('affiliates')
            .select('id, referral_code, status')
            .eq('referral_code', code.toUpperCase())
            .eq('status', 'active')
            .single();
        
        if (error || !affiliate) {
            return res.json({ success: false, valid: false });
        }
        
        res.json({ success: true, valid: true, data: affiliate });
    } catch (error) {
        console.error('Validate referral code error:', error);
        res.status(500).json({ success: false, message: 'Lỗi xác thực mã giới thiệu' });
    }
});

module.exports = router;
