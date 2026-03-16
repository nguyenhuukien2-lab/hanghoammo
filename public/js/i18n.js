// Internationalization (i18n) - Multi-language support

const translations = {
    vi: {
        // Common
        'common.welcome': 'Chào mừng',
        'common.loading': 'Đang tải...',
        'common.error': 'Có lỗi xảy ra',
        'common.success': 'Thành công',
        'common.cancel': 'Hủy',
        'common.confirm': 'Xác nhận',
        'common.save': 'Lưu',
        'common.delete': 'Xóa',
        'common.edit': 'Sửa',
        'common.search': 'Tìm kiếm',
        'common.filter': 'Lọc',
        'common.sort': 'Sắp xếp',
        'common.view_more': 'Xem thêm',
        'common.view_less': 'Thu gọn',
        
        // Header
        'header.home': 'Trang chủ',
        'header.products': 'Sản phẩm',
        'header.blog': 'Blog',
        'header.wallet': 'Nạp tiền',
        'header.cart': 'Giỏ hàng',
        'header.login': 'Đăng nhập',
        'header.register': 'Đăng ký',
        'header.profile': 'Tài khoản',
        'header.logout': 'Đăng xuất',
        
        // Products
        'products.title': 'Sản phẩm',
        'products.all': 'Tất cả sản phẩm',
        'products.hot': 'Sản phẩm hot',
        'products.new': 'Sản phẩm mới',
        'products.bestseller': 'Bán chạy nhất',
        'products.price': 'Giá',
        'products.add_to_cart': 'Thêm vào giỏ',
        'products.buy_now': 'Mua ngay',
        'products.out_of_stock': 'Hết hàng',
        'products.in_stock': 'Còn hàng',
        'products.sold': 'Đã bán',
        'products.rating': 'Đánh giá',
        
        // Cart
        'cart.title': 'Giỏ hàng',
        'cart.empty': 'Giỏ hàng trống',
        'cart.total': 'Tổng cộng',
        'cart.checkout': 'Thanh toán',
        'cart.continue_shopping': 'Tiếp tục mua sắm',
        'cart.remove': 'Xóa',
        'cart.quantity': 'Số lượng',
        
        // Auth
        'auth.login': 'Đăng nhập',
        'auth.register': 'Đăng ký',
        'auth.email': 'Email',
        'auth.password': 'Mật khẩu',
        'auth.confirm_password': 'Xác nhận mật khẩu',
        'auth.forgot_password': 'Quên mật khẩu?',
        'auth.remember_me': 'Ghi nhớ đăng nhập',
        'auth.login_success': 'Đăng nhập thành công!',
        'auth.register_success': 'Đăng ký thành công!',
        'auth.logout_success': 'Đăng xuất thành công!',
        
        // Orders
        'orders.title': 'Đơn hàng',
        'orders.my_orders': 'Đơn hàng của tôi',
        'orders.order_id': 'Mã đơn hàng',
        'orders.status': 'Trạng thái',
        'orders.total': 'Tổng tiền',
        'orders.date': 'Ngày đặt',
        'orders.pending': 'Chờ xử lý',
        'orders.processing': 'Đang xử lý',
        'orders.completed': 'Hoàn thành',
        'orders.cancelled': 'Đã hủy',
        
        // Reviews
        'reviews.title': 'Đánh giá',
        'reviews.write_review': 'Viết đánh giá',
        'reviews.rating': 'Đánh giá',
        'reviews.comment': 'Nhận xét',
        'reviews.submit': 'Gửi đánh giá',
        'reviews.helpful': 'Hữu ích',
        
        // Wallet
        'wallet.title': 'Nạp tiền',
        'wallet.balance': 'Số dư',
        'wallet.deposit': 'Nạp tiền',
        'wallet.withdraw': 'Rút tiền',
        'wallet.history': 'Lịch sử giao dịch',
        
        // Footer
        'footer.about': 'Về chúng tôi',
        'footer.contact': 'Liên hệ',
        'footer.terms': 'Điều khoản',
        'footer.privacy': 'Chính sách bảo mật',
        'footer.support': 'Hỗ trợ'
    },
    
    en: {
        // Common
        'common.welcome': 'Welcome',
        'common.loading': 'Loading...',
        'common.error': 'An error occurred',
        'common.success': 'Success',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.sort': 'Sort',
        'common.view_more': 'View more',
        'common.view_less': 'View less',
        
        // Header
        'header.home': 'Home',
        'header.products': 'Products',
        'header.blog': 'Blog',
        'header.wallet': 'Wallet',
        'header.cart': 'Cart',
        'header.login': 'Login',
        'header.register': 'Register',
        'header.profile': 'Profile',
        'header.logout': 'Logout',
        
        // Products
        'products.title': 'Products',
        'products.all': 'All Products',
        'products.hot': 'Hot Products',
        'products.new': 'New Products',
        'products.bestseller': 'Best Sellers',
        'products.price': 'Price',
        'products.add_to_cart': 'Add to Cart',
        'products.buy_now': 'Buy Now',
        'products.out_of_stock': 'Out of Stock',
        'products.in_stock': 'In Stock',
        'products.sold': 'Sold',
        'products.rating': 'Rating',
        
        // Cart
        'cart.title': 'Shopping Cart',
        'cart.empty': 'Your cart is empty',
        'cart.total': 'Total',
        'cart.checkout': 'Checkout',
        'cart.continue_shopping': 'Continue Shopping',
        'cart.remove': 'Remove',
        'cart.quantity': 'Quantity',
        
        // Auth
        'auth.login': 'Login',
        'auth.register': 'Register',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.confirm_password': 'Confirm Password',
        'auth.forgot_password': 'Forgot Password?',
        'auth.remember_me': 'Remember Me',
        'auth.login_success': 'Login successful!',
        'auth.register_success': 'Registration successful!',
        'auth.logout_success': 'Logout successful!',
        
        // Orders
        'orders.title': 'Orders',
        'orders.my_orders': 'My Orders',
        'orders.order_id': 'Order ID',
        'orders.status': 'Status',
        'orders.total': 'Total',
        'orders.date': 'Date',
        'orders.pending': 'Pending',
        'orders.processing': 'Processing',
        'orders.completed': 'Completed',
        'orders.cancelled': 'Cancelled',
        
        // Reviews
        'reviews.title': 'Reviews',
        'reviews.write_review': 'Write a Review',
        'reviews.rating': 'Rating',
        'reviews.comment': 'Comment',
        'reviews.submit': 'Submit Review',
        'reviews.helpful': 'Helpful',
        
        // Wallet
        'wallet.title': 'Wallet',
        'wallet.balance': 'Balance',
        'wallet.deposit': 'Deposit',
        'wallet.withdraw': 'Withdraw',
        'wallet.history': 'Transaction History',
        
        // Footer
        'footer.about': 'About Us',
        'footer.contact': 'Contact',
        'footer.terms': 'Terms',
        'footer.privacy': 'Privacy Policy',
        'footer.support': 'Support'
    }
};

class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'vi';
        this.translations = translations;
    }
    
    // Get translation
    t(key, params = {}) {
        let text = this.translations[this.currentLang]?.[key] || key;
        
        // Replace parameters
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });
        
        return text;
    }
    
    // Set language
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('language', lang);
            this.updatePageTranslations();
            return true;
        }
        return false;
    }
    
    // Get current language
    getLanguage() {
        return this.currentLang;
    }
    
    // Get available languages
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
    
    // Update all translations on page
    updatePageTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        });
        
        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang;
        
        // Trigger custom event
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: this.currentLang } 
        }));
    }
    
    // Format number based on locale
    formatNumber(number, options = {}) {
        const locales = {
            'vi': 'vi-VN',
            'en': 'en-US'
        };
        
        return new Intl.NumberFormat(locales[this.currentLang], options).format(number);
    }
    
    // Format currency
    formatCurrency(amount, currency = 'VND') {
        const locales = {
            'vi': 'vi-VN',
            'en': 'en-US'
        };
        
        return new Intl.NumberFormat(locales[this.currentLang], {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
    
    // Format date
    formatDate(date, options = {}) {
        const locales = {
            'vi': 'vi-VN',
            'en': 'en-US'
        };
        
        return new Intl.DateTimeFormat(locales[this.currentLang], options).format(new Date(date));
    }
}

// Create global instance
const i18n = new I18n();

// Auto-translate on page load
document.addEventListener('DOMContentLoaded', () => {
    i18n.updatePageTranslations();
});

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18n;
}
