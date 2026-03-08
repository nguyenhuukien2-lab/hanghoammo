const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware xác thực JWT
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Token không hợp lệ hoặc đã hết hạn'
                });
            }

            // Lấy thông tin user từ database
            try {
                const user = await db.getUserById(decoded.userId);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'Người dùng không tồn tại'
                    });
                }

                req.user = user;
                next();
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi xác thực người dùng'
                });
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// Middleware kiểm tra admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin
};
