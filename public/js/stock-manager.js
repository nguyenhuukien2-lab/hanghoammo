// =====================================================
// STOCK MANAGEMENT & UX IMPROVEMENTS
// =====================================================

class StockManager {
    constructor() {
        this.countdownTimers = new Map();
        this.stockUpdateInterval = null;
        this.init();
    }

    init() {
        this.startStockUpdates();
        // this.initLiveChat(); // Disabled - chat feature removed
        this.initPreviewModals();
    }

    // =====================================================
    // STOCK REAL-TIME UPDATES
    // =====================================================

    startStockUpdates() {
        // Update stock every 30 seconds
        this.stockUpdateInterval = setInterval(() => {
            this.updateAllStockDisplays();
        }, 30000);
    }

    async updateAllStockDisplays() {
        try {
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/stock/products?limit=100', { headers });
            const result = await response.json();

            if (result.success) {
                result.data.forEach(product => {
                    this.updateProductStockDisplay(product);
                });
            }
        } catch (error) {
            console.error('Error updating stock:', error);
        }
    }

    updateProductStockDisplay(product) {
        const productCards = document.querySelectorAll(`[data-product-id="${product.id}"]`);
        
        productCards.forEach(card => {
            // Update stock indicator
            const stockIndicator = card.querySelector('.stock-indicator');
            if (stockIndicator) {
                stockIndicator.className = `stock-indicator ${product.stock_class}`;
                stockIndicator.innerHTML = this.getStockIcon(product.stock_class) + product.stock_display;
            }

            // Update urgency badge
            this.updateUrgencyBadge(card, product);

            // Update flash sale countdown
            if (product.has_active_flash_sale) {
                this.updateFlashSaleCountdown(card, product);
            }
        });
    }

    getStockIcon(stockClass) {
        switch (stockClass) {
            case 'in-stock':
                return '<i class="fas fa-check-circle"></i> ';
            case 'low-stock':
                return '<i class="fas fa-exclamation-triangle"></i> ';
            case 'out-of-stock':
                return '<i class="fas fa-times-circle"></i> ';
            default:
                return '<i class="fas fa-box"></i> ';
        }
    }

    updateUrgencyBadge(card, product) {
        let urgencyBadge = card.querySelector('.product-urgency');
        
        if (product.stock_class === 'low-stock' && product.stock <= 3) {
            if (!urgencyBadge) {
                urgencyBadge = document.createElement('div');
                urgencyBadge.className = 'product-urgency';
                card.querySelector('.product-image').appendChild(urgencyBadge);
            }
            urgencyBadge.textContent = `Chỉ còn ${product.stock}!`;
        } else if (urgencyBadge) {
            urgencyBadge.remove();
        }
    }

    // =====================================================
    // FLASH SALE COUNTDOWN
    // =====================================================

    initFlashSaleCountdown(endTime, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const timerId = setInterval(() => {
            const timeLeft = this.calculateTimeLeft(endTime);
            
            if (timeLeft.total <= 0) {
                clearInterval(timerId);
                this.onFlashSaleEnded(container);
                return;
            }

            this.updateCountdownDisplay(container, timeLeft);
        }, 1000);

        this.countdownTimers.set(containerId, timerId);
        return timerId;
    }

    calculateTimeLeft(endTime) {
        const total = Date.parse(endTime) - Date.parse(new Date());
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));

        return { total, days, hours, minutes, seconds };
    }

    updateCountdownDisplay(container, timeLeft) {
        const countdownTimer = container.querySelector('.countdown-timer');
        if (!countdownTimer) return;

        countdownTimer.innerHTML = `
            ${timeLeft.days > 0 ? `
                <div class="countdown-item">
                    <span class="countdown-number">${timeLeft.days}</span>
                    <span class="countdown-label">Ngày</span>
                </div>
            ` : ''}
            <div class="countdown-item">
                <span class="countdown-number">${timeLeft.hours.toString().padStart(2, '0')}</span>
                <span class="countdown-label">Giờ</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-number">${timeLeft.minutes.toString().padStart(2, '0')}</span>
                <span class="countdown-label">Phút</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-number">${timeLeft.seconds.toString().padStart(2, '0')}</span>
                <span class="countdown-label">Giây</span>
            </div>
        `;
    }

    onFlashSaleEnded(container) {
        const banner = container.closest('.flash-sale-banner');
        if (banner) {
            banner.style.opacity = '0.5';
            banner.innerHTML = `
                <div class="flash-sale-header">
                    <h3 class="flash-sale-title">Flash Sale đã kết thúc</h3>
                </div>
                <p>Cảm ơn bạn đã quan tâm! Hãy theo dõi để không bỏ lỡ deal tiếp theo.</p>
            `;
        }
    }

    updateFlashSaleCountdown(card, product) {
        if (!product.flash_sale_end) return;

        const countdownContainer = card.querySelector('.flash-sale-countdown');
        if (countdownContainer) {
            const timeLeft = this.calculateTimeLeft(product.flash_sale_end);
            if (timeLeft.total > 0) {
                this.updateCountdownDisplay(countdownContainer, timeLeft);
            }
        }
    }

    // =====================================================
    // PRODUCT PREVIEWS
    // =====================================================

    initPreviewModals() {
        // Create preview modal
        this.createPreviewModal();
        
        // Add click handlers to preview thumbnails
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('preview-thumbnail')) {
                this.openPreviewModal(e.target);
            }
        });
    }

    createPreviewModal() {
        const modal = document.createElement('div');
        modal.id = 'previewModal';
        modal.className = 'preview-modal';
        modal.innerHTML = `
            <div class="preview-modal-content">
                <div class="preview-modal-header">
                    <h3 class="preview-modal-title">Preview sản phẩm</h3>
                    <button class="preview-close-btn" onclick="stockManager.closePreviewModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="preview-modal-body">
                    <div class="preview-content"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePreviewModal();
            }
        });
    }

    openPreviewModal(thumbnail) {
        const modal = document.getElementById('previewModal');
        const content = modal.querySelector('.preview-content');
        const title = modal.querySelector('.preview-modal-title');
        
        const previewData = JSON.parse(thumbnail.dataset.preview || '{}');
        
        title.textContent = previewData.title || 'Preview sản phẩm';
        
        let previewHTML = '';
        if (previewData.type === 'video') {
            previewHTML = `
                <video class="preview-image" controls>
                    <source src="${previewData.url}" type="video/mp4">
                    Trình duyệt không hỗ trợ video.
                </video>
            `;
        } else {
            const blurClass = previewData.is_blurred ? 'blurred' : '';
            previewHTML = `
                <div style="position: relative;">
                    <img src="${previewData.url}" alt="${previewData.title}" class="preview-image ${blurClass}">
                    ${previewData.is_blurred ? `
                        <div class="preview-unlock-overlay">
                            <i class="fas fa-lock" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                            <p>Mua sản phẩm để xem rõ</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        if (previewData.description) {
            previewHTML += `<p class="preview-description">${previewData.description}</p>`;
        }
        
        content.innerHTML = previewHTML;
        modal.classList.add('active');
    }

    closePreviewModal() {
        const modal = document.getElementById('previewModal');
        modal.classList.remove('active');
    }

    // =====================================================
    // LIVE CHAT
    // =====================================================

    initLiveChat() {
        this.createLiveChatButton();
        this.checkUnreadMessages();
    }

    // Live chat button removed - feature disabled

    checkUnreadMessages() {
        // Check for unread messages every minute
        setInterval(async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await fetch('/api/chat/unread-count', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                
                if (result.success && result.count > 0) {
                    const button = document.querySelector('.live-chat-button');
                    if (button) {
                        button.classList.add('has-unread');
                    }
                }
            } catch (error) {
                console.error('Error checking unread messages:', error);
            }
        }, 60000);
    }

    // =====================================================
    // UTILITY FUNCTIONS
    // =====================================================

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message);
        } else {
            alert(message);
        }
    }

    destroy() {
        // Clear all intervals
        if (this.stockUpdateInterval) {
            clearInterval(this.stockUpdateInterval);
        }
        
        this.countdownTimers.forEach(timer => clearInterval(timer));
        this.countdownTimers.clear();
    }
}

// Initialize stock manager
let stockManager;
document.addEventListener('DOMContentLoaded', () => {
    stockManager = new StockManager();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (stockManager) {
        stockManager.destroy();
    }
});