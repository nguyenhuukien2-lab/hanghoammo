const jwt = require('jsonwebtoken');
const db = require('../config/database');

// In-memory token blacklist (logout tokens)
// Production nên dùng Redis, nhưng đây đủ cho scale hiện tại
const tokenBlacklist = new Set();

// Tự dọn blacklist mỗi giờ để tránh memory leak
setInterval(() => {
    // Xóa hết vì tokens expire sau 7 ngày, dọn mỗi giờ là đủ
    if (tokenBlacklist.size > 10000) tokenBlacklist.clear();
}, 60 * 60 * 1000);

// Middleware xác thực JWT - đọc từ httpOnly cookie hoặc Authorization header
const authenticateToken = async (req, res, next) => {
    try {
        const token = req.cookies?.authToken ||
            (req.headers['authorization']?.split(' ')[1]);

        if (!token) {
            return res.status(401).json({ success: false, message: 'Không tìm thấy token xác thực' });
        }

        // Kiểm tra token đã bị blacklist (logout) chưa
        if (tokenBlacklist.has(token)) {
            return res.status(401).json({ success: false, message: 'Token đã hết hiệu lực, vui lòng đăng nhập lại' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
            }

            try {
                const user = await db.getUserById(decoded.userId);
                if (!user) {
                    return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
                }

                // Kiểm tra tài khoản bị khóa
                if (user.status === 'banned' || user.status === 'disabled') {
                    return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
                }

                req.user = user;
                req.token = token; // lưu token để logout có thể blacklist
                next();
            } catch (error) {
                return res.status(500).json({ success: false, message: 'Lỗi xác thực người dùng' });
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Middleware kiểm tra admin
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập' });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    tokenBlacklist
};
