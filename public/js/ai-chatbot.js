class AIChatbot {
    constructor() {
        this.conversationId = null;
        this.isOpen = false;
        this.isTyping = false;
        this.init();
    }

    init() {
        this.createChatbotHTML();
        this.bindEvents();
        this.showWelcomeMessage();
    }

    createChatbotHTML() {
        const chatbotHTML = `
            <div class="ai-chatbot">
                <button class="chatbot-toggle" id="chatbot-toggle">
                    🤖
                </button>
                <div class="chatbot-window" id="chatbot-window">
                    <div class="chatbot-header">
                        <h3>🤖 Tư vấn sản phẩm</h3>
                        <button class="chatbot-close" id="chatbot-close">×</button>
                    </div>
                    <div class="chatbot-messages" id="chatbot-messages">
                        <div class="welcome-message">
                            Xin chào! Tôi là AI tư vấn của HangHoaMMO 👋<br>
                            Tôi có thể giúp bạn:<br>
                            • 🎯 Tìm sản phẩm phù hợp<br>
                            • 💰 Tư vấn giá cả chi tiết<br>
                            • 🛒 Hướng dẫn mua hàng<br>
                            • 📞 Hỗ trợ 24/7
                        </div>
                    </div>
                    <div class="chatbot-input">
                        <div class="input-group">
                            <input type="text" id="chatbot-input" placeholder="Hỏi về sản phẩm..." maxlength="500">
                            <button class="send-button" id="send-button">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    bindEvents() {
        const toggle = document.getElementById('chatbot-toggle');
        const close = document.getElementById('chatbot-close');
        const input = document.getElementById('chatbot-input');
        const sendButton = document.getElementById('send-button');

        toggle.addEventListener('click', () => this.toggleChat());
        close.addEventListener('click', () => this.closeChat());
        sendButton.addEventListener('click', () => this.sendMessage());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Quick actions
        this.addQuickActions();
    }

    toggleChat() {
        const window = document.getElementById('chatbot-window');
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            window.classList.add('active');
            document.getElementById('chatbot-input').focus();
        } else {
            window.classList.remove('active');
        }
    }

    closeChat() {
        const window = document.getElementById('chatbot-window');
        window.classList.remove('active');
        this.isOpen = false;
    }

    showWelcomeMessage() {
        // Add quick action buttons after welcome message
        setTimeout(() => {
            this.addQuickActions();
        }, 1000);
    }

    addQuickActions() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const existingActions = messagesContainer.querySelector('.quick-actions');
        
        if (!existingActions) {
            const quickActionsHTML = `
                <div class="quick-actions">
                    <button class="quick-action" onclick="aiChatbot.sendQuickMessage('Tôi muốn tìm tài khoản Netflix, giá bao nhiêu?')">🎬 Netflix</button>
                    <button class="quick-action" onclick="aiChatbot.sendQuickMessage('ChatGPT Plus có gì đặc biệt? Giá cả như thế nào?')">🤖 ChatGPT</button>
                    <button class="quick-action" onclick="aiChatbot.sendQuickMessage('Spotify Premium giá bao nhiêu? Có những gói nào?')">🎵 Spotify</button>
                    <button class="quick-action" onclick="aiChatbot.sendQuickMessage('Canva Pro có những tính năng gì? Giá cả ra sao?')">🎨 Canva Pro</button>
                    <button class="quick-action" onclick="aiChatbot.sendQuickMessage('VPN nào tốt nhất? Giá cả và tính năng?')">🛡️ VPN</button>
                    <button class="quick-action" onclick="aiChatbot.sendQuickMessage('Có những sản phẩm AI nào hot? Giá cả như thế nào?')">🔥 AI Hot</button>
                    <button class="quick-action" onclick="aiChatbot.sendQuickMessage('Bảng giá tất cả sản phẩm hiện có')">💰 Bảng giá</button>
                    <button class="quick-action" onclick="aiChatbot.sendQuickMessage('Làm sao để mua hàng và thanh toán?')">🛒 Cách mua</button>
                </div>
            `;
            messagesContainer.insertAdjacentHTML('beforeend', quickActionsHTML);
        }
    }

    sendQuickMessage(message) {
        document.getElementById('chatbot-input').value = message;
        this.sendMessage();
    }

    async sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        
        if (!message || this.isTyping) return;

        // Clear input
        input.value = '';
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTyping();
        
        try {
            const response = await fetch('/api/ai-chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    conversation_id: this.conversationId
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.conversationId = data.conversation_id;
                this.addMessage(data.reply, 'bot');
                
                if (data.fallback) {
                    // Show fallback notice
                    setTimeout(() => {
                        this.addMessage('💡 Tip: Bạn có thể xem sản phẩm tại trang Products hoặc liên hệ admin qua Telegram!', 'bot');
                    }, 1000);
                }
            } else {
                throw new Error(data.message || 'Lỗi khi gửi tin nhắn');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage('Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ admin! 😅', 'bot');
        } finally {
            this.hideTyping();
        }
    }

    addMessage(content, sender) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageHTML = `
            <div class="message ${sender}">
                ${sender === 'bot' ? '<div class="message-avatar">🤖</div>' : ''}
                <div class="message-content">${this.formatMessage(content)}</div>
                ${sender === 'user' ? '<div class="message-avatar">👤</div>' : ''}
            </div>
        `;
        
        // Remove quick actions when first message is sent
        const quickActions = messagesContainer.querySelector('.quick-actions');
        if (quickActions && sender === 'user') {
            quickActions.remove();
        }
        
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessage(content) {
        // Convert line breaks to <br>
        content = content.replace(/\n/g, '<br>');
        
        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        content = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        // Format product information better
        content = this.formatProductInfo(content);
        
        return content;
    }

    formatProductInfo(content) {
        // Enhanced product formatting with better visual presentation
        
        // Format price patterns (number + đ)
        content = content.replace(/(\d{1,3}(?:\.\d{3})*(?:,\d{3})*)\s*đ/g, '<span style="color: #667eea; font-weight: bold; font-size: 16px;">$1đ</span>');
        
        // Format product names with ** bold **
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #333; font-size: 16px;">$1</strong>');
        
        // Format emoji bullets and create product cards
        const productPattern = /([🎬🎵🤖🎨🛡️📺🎮💻🔧⚡🌟💎🎯🔥💰]+)\s*\*\*(.*?)\*\*\s*-\s*([\d,\.]+đ[^<\n]*)/g;
        
        content = content.replace(productPattern, (match, emoji, name, priceAndDesc) => {
            const parts = priceAndDesc.split(/(?=\d)/);
            const price = parts[0].match(/([\d,\.]+đ)/)?.[1] || '';
            const desc = priceAndDesc.replace(price, '').replace(/^\s*-?\s*/, '').trim();
            
            return `
                <div class="chat-product-card">
                    <div class="chat-product-header">
                        <div class="chat-product-icon">${emoji}</div>
                        <div class="chat-product-name">${name}</div>
                    </div>
                    <div class="chat-product-price">${price}</div>
                    <div class="chat-product-desc">${desc}</div>
                    <div class="chat-product-actions">
                        <button class="chat-product-btn primary" onclick="this.openProductDetail('${name}')">
                            <i class="fas fa-eye"></i> Xem chi tiết
                        </button>
                        <button class="chat-product-btn secondary" onclick="this.addToCart('${name}')">
                            <i class="fas fa-cart-plus"></i> Thêm giỏ hàng
                        </button>
                    </div>
                </div>
            `;
        });
        
        // Format section headers
        content = content.replace(/🔥\s*\*\*(.*?)\*\*/g, '<div style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 8px 12px; border-radius: 8px; font-weight: bold; margin: 10px 0;"><i class="fas fa-fire"></i> $1</div>');
        content = content.replace(/💰\s*\*\*(.*?)\*\*/g, '<div style="background: linear-gradient(135deg, #f39c12, #e67e22); color: white; padding: 8px 12px; border-radius: 8px; font-weight: bold; margin: 10px 0;"><i class="fas fa-tags"></i> $1</div>');
        content = content.replace(/🎯\s*\*\*(.*?)\*\*/g, '<div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 8px 12px; border-radius: 8px; font-weight: bold; margin: 10px 0;"><i class="fas fa-bullseye"></i> $1</div>');
        
        // Format numbered lists
        content = content.replace(/(\d+)\.\s*([^\n<]+)/g, '<div style="display: flex; align-items: flex-start; margin: 8px 0;"><span style="background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 10px; flex-shrink: 0;">$1</span><span>$2</span></div>');
        
        return content;
    }

    // Helper methods for product actions
    openProductDetail(productName) {
        // In a real implementation, this would open product detail page
        console.log('Opening product detail for:', productName);
        if (typeof viewProductDetail === 'function') {
            // If the main site has this function, use it
            viewProductDetail(productName);
        } else {
            // Otherwise, redirect to products page
            window.open('/products.html', '_blank');
        }
    }

    addToCart(productName) {
        // In a real implementation, this would add to cart
        console.log('Adding to cart:', productName);
        if (typeof addToCart === 'function') {
            // If the main site has this function, use it
            addToCart(productName);
        } else {
            // Show a message
            this.addMessage(`Để mua "${productName}", vui lòng đăng ký tài khoản và thêm vào giỏ hàng trên trang sản phẩm! 🛒`, 'bot');
        }
    }

    showTyping() {
        this.isTyping = true;
        const messagesContainer = document.getElementById('chatbot-messages');
        const typingHTML = `
            <div class="message bot" id="typing-message">
                <div class="message-avatar">🤖</div>
                <div class="typing-indicator">
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Disable send button
        document.getElementById('send-button').disabled = true;
    }

    hideTyping() {
        this.isTyping = false;
        const typingMessage = document.getElementById('typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
        
        // Enable send button
        document.getElementById('send-button').disabled = false;
    }

    // Public method to integrate with other parts of the website
    openChatWithMessage(message) {
        if (!this.isOpen) {
            this.toggleChat();
        }
        
        setTimeout(() => {
            document.getElementById('chatbot-input').value = message;
            this.sendMessage();
        }, 300);
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if OpenAI API key is configured
    fetch('/api/ai-chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'test' })
    }).then(response => {
        if (response.status !== 500) {
            window.aiChatbot = new AIChatbot();
        } else {
            console.log('AI Chatbot not available - OpenAI API key not configured');
        }
    }).catch(() => {
        // Still create chatbot with fallback responses
        window.aiChatbot = new AIChatbot();
    });
});

// Utility function to trigger chatbot from other pages
function openAIChatbot(message = '') {
    if (window.aiChatbot) {
        if (message) {
            window.aiChatbot.openChatWithMessage(message);
        } else {
            window.aiChatbot.toggleChat();
        }
    }
}