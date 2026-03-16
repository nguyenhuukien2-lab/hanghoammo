// =====================================================
// RESELLER DASHBOARD JAVASCRIPT
// =====================================================

let currentTierData = null;
let tiersData = [];
let apiKeysData = [];
let referralData = null;
let commissionsData = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    initializeTabs();
    loadAllData();
});

// Check if user is logged in
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login-new.html';
        return;
    }
}

// Initialize tabs
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
}

// Switch tab
function switchTab(tabId) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');

    // Load data for specific tabs
    if (tabId === 'api') {
        loadAPIKeys();
    } else if (tabId === 'referral') {
        loadReferralData();
    } else if (tabId === 'commission') {
        loadCommissions();
    }
}

// Load all initial data
async function loadAllData() {
    try {
        await Promise.all([
            loadMyTier(),
            loadTiers(),
            loadOverviewStats()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Lỗi khi tải dữ liệu', 'error');
    }
}

// Load current user tier
async function loadMyTier() {
    try {
        const response = await fetch('/api/reseller/my-tier', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        if (result.success) {
            currentTierData = result.data;
            updateTierDisplay();
        }
    } catch (error) {
        console.error('Error loading tier:', error);
    }
}

// Update tier display
function updateTierDisplay() {
    if (!currentTierData) return;

    const { current_tier, total_spent, next_tier, progress } = currentTierData;

    // Update tier badge
    document.getElementById('currentTierName').textContent = current_tier.display_name;
    document.getElementById('discountBenefit').innerHTML = `<i class="fas fa-percent"></i> Giảm ${current_tier.discount_percent}%`;
    document.getElementById('commissionBenefit').innerHTML = `<i class="fas fa-coins"></i> Hoa hồng ${current_tier.commission_percent}%`;

    // Update progress
    document.getElementById('totalSpent').textContent = formatCurrency(total_spent);
    
    if (next_tier && progress) {
        document.getElementById('nextTierInfo').innerHTML = `Cần <strong>${formatCurrency(progress.remaining)}</strong> để lên <strong>${next_tier.display_name}</strong>`;
        document.getElementById('progressFill').style.width = `${progress.percent}%`;
        document.getElementById('progressPercent').textContent = `${Math.round(progress.percent)}%`;
    } else {
        document.getElementById('nextTierInfo').textContent = 'Bạn đã đạt cấp cao nhất!';
        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('progressPercent').textContent = '100%';
    }
}

// Load all tiers
async function loadTiers() {
    try {
        const response = await fetch('/api/reseller/tiers');
        const result = await response.json();
        
        if (result.success) {
            tiersData = result.data;
            renderTiers();
        }
    } catch (error) {
        console.error('Error loading tiers:', error);
    }
}

// Render tiers
function renderTiers() {
    const tiersGrid = document.getElementById('tiersGrid');
    if (!tiersGrid) return;

    tiersGrid.innerHTML = tiersData.map(tier => {
        const isCurrent = currentTierData && currentTierData.current_tier.tier_name === tier.tier_name;
        const benefits = tier.benefits?.features || [];
        
        return `
            <div class="tier-card ${isCurrent ? 'current' : ''}">
                <h3 class="tier-name">${tier.display_name}</h3>
                <p class="tier-min-spent">Từ ${formatCurrency(tier.min_spent)}</p>
                <ul class="tier-features">
                    <li><i class="fas fa-check"></i> Giảm ${tier.discount_percent}% tất cả sản phẩm</li>
                    <li><i class="fas fa-check"></i> Hoa hồng ${tier.commission_percent}% khi giới thiệu</li>
                    ${tier.can_use_api ? '<li><i class="fas fa-check"></i> Sử dụng API tự động</li>' : ''}
                    ${tier.priority_support ? '<li><i class="fas fa-check"></i> Hỗ trợ ưu tiên</li>' : ''}
                    ${benefits.map(benefit => `<li><i class="fas fa-check"></i> ${benefit}</li>`).join('')}
                </ul>
            </div>
        `;
    }).join('');
}

// Load overview stats
async function loadOverviewStats() {
    try {
        // Mock data for now - you can implement real API endpoints
        document.getElementById('totalOrders').textContent = '0';
        document.getElementById('totalRevenue').textContent = formatCurrency(currentTierData?.total_spent || 0);
        document.getElementById('totalReferrals').textContent = '0';
        document.getElementById('totalCommission').textContent = '0đ';
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load API keys
async function loadAPIKeys() {
    try {
        const response = await fetch('/api/reseller/api-keys', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        if (result.success) {
            apiKeysData = result.data;
            renderAPIKeys();
        } else {
            // User doesn't have API access
            document.getElementById('apiKeysList').innerHTML = `
                <div class="api-info-box" style="background: #fff3cd; border-color: #ffeaa7; color: #856404;">
                    <i class="fas fa-lock"></i>
                    <div>
                        <strong>Cần nâng cấp:</strong> Bạn cần nâng cấp lên Reseller hoặc Agency để sử dụng API.
                        <br><a href="#" onclick="switchTab('tiers')" style="color: #667eea;">Xem các cấp bậc</a>
                    </div>
                </div>
            `;
            document.getElementById('createAPIBtn').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading API keys:', error);
    }
}

// Render API keys
function renderAPIKeys() {
    const apiKeysList = document.getElementById('apiKeysList');
    if (!apiKeysList) return;

    if (apiKeysData.length === 0) {
        apiKeysList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-key" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <p>Chưa có API key nào. Tạo API key đầu tiên của bạn!</p>
            </div>
        `;
        return;
    }

    apiKeysList.innerHTML = apiKeysData.map(key => `
        <div class="api-key-item">
            <div class="api-key-header">
                <span class="api-key-name">${key.name}</span>
                <span class="api-key-status ${key.is_active ? 'active' : 'inactive'}">
                    ${key.is_active ? 'Hoạt động' : 'Tạm dừng'}
                </span>
            </div>
            <div class="api-key-details">
                <div>
                    <div class="api-key-info">${key.api_key}</div>
                    <small style="color: #666;">
                        Tạo: ${formatDate(key.created_at)} | 
                        Calls hôm nay: ${key.calls_today} | 
                        Lần cuối: ${key.last_call_at ? formatDate(key.last_call_at) : 'Chưa sử dụng'}
                    </small>
                </div>
                <div class="api-key-actions">
                    <button class="btn-toggle" onclick="toggleAPIKey(${key.id})" title="Bật/Tắt">
                        <i class="fas fa-power-off"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteAPIKey(${key.id})" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Create API key
function createAPIKey() {
    document.getElementById('apiKeyModal').classList.add('active');
}

// Close API key modal
function closeAPIKeyModal() {
    document.getElementById('apiKeyModal').classList.remove('active');
    document.getElementById('apiKeyName').value = '';
}

// Confirm create API key
async function confirmCreateAPIKey() {
    const name = document.getElementById('apiKeyName').value.trim();
    if (!name) {
        showNotification('Vui lòng nhập tên API key', 'error');
        return;
    }

    try {
        const response = await fetch('/api/reseller/api-keys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name })
        });

        const result = await response.json();
        if (result.success) {
            closeAPIKeyModal();
            
            // Show API secret modal
            document.getElementById('newAPIKey').value = result.data.api_key;
            document.getElementById('newAPISecret').value = result.data.api_secret;
            document.getElementById('apiSecretModal').classList.add('active');
            
            // Reload API keys
            loadAPIKeys();
            showNotification('Tạo API key thành công!', 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error creating API key:', error);
        showNotification('Lỗi khi tạo API key', 'error');
    }
}

// Close API secret modal
function closeAPISecretModal() {
    document.getElementById('apiSecretModal').classList.remove('active');
    document.getElementById('newAPIKey').value = '';
    document.getElementById('newAPISecret').value = '';
}

// Toggle API key
async function toggleAPIKey(keyId) {
    try {
        const response = await fetch(`/api/reseller/api-keys/${keyId}/toggle`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        if (result.success) {
            showNotification(result.message, 'success');
            loadAPIKeys();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error toggling API key:', error);
        showNotification('Lỗi khi thay đổi trạng thái API key', 'error');
    }
}

// Delete API key
async function deleteAPIKey(keyId) {
    if (!confirm('Bạn có chắc muốn xóa API key này?')) return;

    try {
        const response = await fetch(`/api/reseller/api-keys/${keyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        if (result.success) {
            showNotification('Xóa API key thành công', 'success');
            loadAPIKeys();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting API key:', error);
        showNotification('Lỗi khi xóa API key', 'error');
    }
}

// Load referral data
async function loadReferralData() {
    try {
        // Load referral code
        const codeResponse = await fetch('/api/reseller/referral-code', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const codeResult = await codeResponse.json();
        
        if (codeResult.success) {
            document.getElementById('referralCode').value = codeResult.data.referral_code;
            document.getElementById('referralLink').value = codeResult.data.referral_link;
        }

        // Load referrals list
        const listResponse = await fetch('/api/reseller/referrals', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const listResult = await listResponse.json();
        
        if (listResult.success) {
            renderReferrals(listResult.data);
        }
    } catch (error) {
        console.error('Error loading referral data:', error);
    }
}

// Render referrals
function renderReferrals(referrals) {
    const referralsList = document.getElementById('referralsList');
    if (!referralsList) return;

    if (referrals.length === 0) {
        referralsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <p>Chưa có ai đăng ký qua link của bạn. Hãy chia sẻ để nhận hoa hồng!</p>
            </div>
        `;
        return;
    }

    referralsList.innerHTML = referrals.map(ref => `
        <div class="referral-item">
            <div class="referral-info">
                <div class="referral-avatar">
                    ${ref.referred.full_name ? ref.referred.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div class="referral-details">
                    <h4>${ref.referred.full_name || 'User'}</h4>
                    <p>Đăng ký: ${formatDate(ref.referred.created_at)}</p>
                </div>
            </div>
            <div class="referral-commission">
                +${formatCurrency(ref.commission_earned)}
            </div>
        </div>
    `).join('');
}

// Load commissions
async function loadCommissions() {
    try {
        const response = await fetch('/api/reseller/commissions', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        if (result.success) {
            commissionsData = result.data;
            updateCommissionSummary(result.summary);
            renderCommissions();
        }
    } catch (error) {
        console.error('Error loading commissions:', error);
    }
}

// Update commission summary
function updateCommissionSummary(summary) {
    document.getElementById('commissionTotal').textContent = formatCurrency(summary.total);
    document.getElementById('commissionPending').textContent = formatCurrency(summary.pending);
    document.getElementById('commissionPaid').textContent = formatCurrency(summary.paid);
}

// Render commissions
function renderCommissions() {
    const tbody = document.getElementById('commissionTableBody');
    if (!tbody) return;

    if (commissionsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-coins" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    Chưa có hoa hồng nào. Hãy giới thiệu bạn bè để nhận hoa hồng!
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = commissionsData.map(comm => `
        <tr>
            <td>${formatDate(comm.created_at)}</td>
            <td>${comm.referred.full_name || comm.referred.email}</td>
            <td>#${comm.order.id}</td>
            <td>${formatCurrency(comm.order_amount)}</td>
            <td>${comm.commission_percent}%</td>
            <td>${formatCurrency(comm.commission_amount)}</td>
            <td>
                <span class="status-badge ${comm.status}">
                    ${comm.status === 'pending' ? 'Đang chờ' : 'Đã nhận'}
                </span>
            </td>
        </tr>
    `).join('');
}

// Copy referral code
function copyReferralCode() {
    const input = document.getElementById('referralCode');
    input.select();
    document.execCommand('copy');
    showNotification('Đã copy mã giới thiệu!', 'success');
}

// Copy referral link
function copyReferralLink() {
    const input = document.getElementById('referralLink');
    input.select();
    document.execCommand('copy');
    showNotification('Đã copy link giới thiệu!', 'success');
}

// Copy text from input
function copyText(inputId) {
    const input = document.getElementById(inputId);
    input.select();
    document.execCommand('copy');
    showNotification('Đã copy!', 'success');
}

// Share to social media
function shareToFacebook() {
    const link = document.getElementById('referralLink').value;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

function shareToTelegram() {
    const link = document.getElementById('referralLink').value;
    const text = `Tham gia HangHoaMMO - Shop tài khoản uy tín #1! ${link}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function shareToTwitter() {
    const link = document.getElementById('referralLink').value;
    const text = `Tham gia HangHoaMMO - Shop tài khoản uy tín #1!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount || 0);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'info') {
    // Use existing notification system from script.js
    if (typeof window.showNotification === 'function') {
        window.showNotification(message);
    } else {
        alert(message);
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});