/**
 * Real-time Chat via WebSocket
 * Dùng cho cả user và admin
 */
class RealtimeChat {
    constructor(options = {}) {
        this.onMessage = options.onMessage || (() => {});
        this.onConnect = options.onConnect || (() => {});
        this.onDisconnect = options.onDisconnect || (() => {});
        this.ws = null;
        this.reconnectTimer = null;
        this.reconnectDelay = 3000;
        this.maxReconnects = 5;
        this.reconnectCount = 0;
    }

    connect(token) {
        if (!token) return;
        this.token = token;

        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${location.host}/ws/chat?token=${encodeURIComponent(token)}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('💬 Chat connected');
            this.reconnectCount = 0;
            this.onConnect();
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'message') this.onMessage(data.data);
            } catch (e) { console.error('WS parse error:', e); }
        };

        this.ws.onclose = () => {
            console.log('💬 Chat disconnected');
            this.onDisconnect();
            this._scheduleReconnect();
        };

        this.ws.onerror = (err) => console.error('WS error:', err);
    }

    send(message, targetUserId = null) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
        this.ws.send(JSON.stringify({
            type: 'message',
            message,
            target_user_id: targetUserId
        }));
        return true;
    }

    disconnect() {
        clearTimeout(this.reconnectTimer);
        if (this.ws) { this.ws.close(); this.ws = null; }
    }

    _scheduleReconnect() {
        if (this.reconnectCount >= this.maxReconnects) return;
        this.reconnectCount++;
        this.reconnectTimer = setTimeout(() => {
            console.log(`💬 Reconnecting... (${this.reconnectCount}/${this.maxReconnects})`);
            this.connect(this.token);
        }, this.reconnectDelay * this.reconnectCount);
    }
}

// Auto-init nếu user đã đăng nhập
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    window.realtimeChat = new RealtimeChat({
        onMessage: (msg) => {
            // Dispatch event để các page khác lắng nghe
            document.dispatchEvent(new CustomEvent('chat:newMessage', { detail: msg }));

            // Cập nhật badge unread nếu có
            const badge = document.getElementById('chatUnreadBadge');
            if (badge && msg.sender_type !== 'user') {
                const current = parseInt(badge.textContent) || 0;
                badge.textContent = current + 1;
                badge.style.display = 'inline-block';
            }
        },
        onConnect: () => {
            document.dispatchEvent(new CustomEvent('chat:connected'));
        },
        onDisconnect: () => {
            document.dispatchEvent(new CustomEvent('chat:disconnected'));
        }
    });

    window.realtimeChat.connect(token);
});
