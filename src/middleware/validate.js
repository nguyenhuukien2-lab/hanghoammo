const { body, param, query, validationResult } = require('express-validator');

// Middleware: trả lỗi nếu validation fail
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

// Auth validators
const validateRegister = [
    body('name').trim().notEmpty().withMessage('Tên không được để trống')
        .isLength({ min: 2, max: 100 }).withMessage('Tên phải từ 2-100 ký tự')
        .escape(), // chống XSS
    body('email').trim().isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail()
        .isLength({ max: 255 }).withMessage('Email quá dài'),
    body('password')
        .isLength({ min: 8, max: 128 }).withMessage('Mật khẩu phải từ 8-128 ký tự')
        .matches(/[A-Z]/).withMessage('Mật khẩu phải có ít nhất 1 chữ hoa')
        .matches(/[a-z]/).withMessage('Mật khẩu phải có ít nhất 1 chữ thường')
        .matches(/[0-9]/).withMessage('Mật khẩu phải có ít nhất 1 số'),
    body('phone').optional().trim()
        .matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Số điện thoại không hợp lệ'),
    handleValidation
];

const validateLogin = [
    body('email').trim().isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail()
        .isLength({ max: 255 }).withMessage('Email quá dài'),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống')
        .isLength({ max: 128 }).withMessage('Mật khẩu quá dài'),
    handleValidation
];

// Product validators
const validateProduct = [
    body('name').trim().notEmpty().withMessage('Tên sản phẩm không được để trống')
        .isLength({ max: 255 }).withMessage('Tên sản phẩm tối đa 255 ký tự')
        .escape(),
    body('category').trim().notEmpty().withMessage('Danh mục không được để trống')
        .isLength({ max: 50 }).withMessage('Danh mục tối đa 50 ký tự')
        .escape(),
    body('price').isFloat({ min: 0, max: 999999999 }).withMessage('Giá phải từ 0 đến 999,999,999'),
    body('description').optional().trim().isLength({ max: 5000 }).withMessage('Mô tả tối đa 5000 ký tự'),
    handleValidation
];

// Order validators
const validateCreateOrder = [
    body('items').isArray({ min: 1, max: 20 }).withMessage('Giỏ hàng phải có 1-20 sản phẩm'),
    body('items.*.product_id').isUUID().withMessage('ID sản phẩm không hợp lệ'),
    body('items.*.quantity').isInt({ min: 1, max: 10 }).withMessage('Số lượng phải từ 1-10'),
    body('total_amount').isFloat({ min: 1, max: 999999999 }).withMessage('Tổng tiền không hợp lệ'),
    body('payment_method').isIn(['wallet', 'cod', 'vnpay', 'momo', 'zalopay'])
        .withMessage('Phương thức thanh toán không hợp lệ'),
    handleValidation
];

// Wallet validators
const validateDeposit = [
    body('amount').isFloat({ min: 10000, max: 50000000 })
        .withMessage('Số tiền nạp phải từ 10,000đ đến 50,000,000đ'),
    body('payment_method').notEmpty().withMessage('Phương thức thanh toán không được để trống')
        .isLength({ max: 50 }).withMessage('Phương thức thanh toán không hợp lệ'),
    body('transaction_code').optional().trim()
        .isLength({ max: 100 }).withMessage('Mã giao dịch tối đa 100 ký tự')
        .escape(),
    body('note').optional().trim()
        .isLength({ max: 500 }).withMessage('Ghi chú tối đa 500 ký tự')
        .escape(),
    handleValidation
];

// UUID param validator
const validateUUIDParam = (paramName = 'id') => [
    param(paramName).isUUID().withMessage(`${paramName} không hợp lệ`),
    handleValidation
];

// Pagination query validator
const validatePagination = [
    query('page').optional().isInt({ min: 1, max: 10000 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit phải từ 1-50'),
    handleValidation
];

module.exports = {
    handleValidation,
    validateRegister,
    validateLogin,
    validateProduct,
    validateCreateOrder,
    validateDeposit,
    validateUUIDParam,
    validatePagination
};
