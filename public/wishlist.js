// Wishlist functionality

// Toggle wishlist
async function toggleWishlist(productId, button) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Vui lòng đăng nhập để thêm vào yêu thích!', 'error');
        openAuthModal('login');
        return;
    }
    
    try {
        // Check if already in wishlist
        const checkResponse = await fetch(`/api/wishlist/check/${productId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const checkData = await checkResponse.json();
        
        if (checkData.inWishlist) {
            // Remove from wishlist
            const response = await fetch(`/api/wishlist/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                showNotification('Đã xóa khỏi yêu thích!');
                if (button) {
                    button.classList.remove('active');
                    button.innerHTML = '<i class="far fa-heart"></i>';
                }
                updateWishlistCount();
            }
        } else {
            // Add to wishlist
            const response = await fetch('/api/wishlist', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ product_id: productId })
            });
            
            const data = await response.json();
            if (data.success) {
                showNotification('Đã thêm vào yêu thích!');
                if (button) {
                    button.classList.add('active');
                    button.innerHTML = '<i class="fas fa-heart"></i>';
                }
                updateWishlistCount();
            } else {
                showNotification(data.message || 'Có lỗi xảy ra', 'error');
            }
        }
    } catch (error) {
        console.error('Toggle wishlist error:', error);
        showNotification('Có lỗi xảy ra', 'error');
    }
}

// Update wishlist count
async function updateWishlistCount() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    
    try {
        const response = await fetch('/api/wishlist/count', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            const badge = document.getElementById('wishlistCount');
            if (badge) {
                badge.textContent = data.count;
                badge.style.display = data.count > 0 ? 'block' : 'none';
            }
        }
    } catch (error) {
        console.error('Update wishlist count error:', error);
    }
}

// Load wishlist page
async function loadWishlistPage() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const response = await fetch('/api/wishlist', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            displayWishlist(data.data);
        }
    } catch (error) {
        console.error('Load wishlist error:', error);
    }
}

// Display wishlist
function displayWishlist(items) {
    const container = document.getElementById('wishlistContainer');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-wishlist">
                <i class="fas fa-heart"></i>
                <p>Chưa có sản phẩm yêu thích</p>
                <a href="products.html" class="btn-primary">Khám phá sản phẩm</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => {
        const product = item.products;
        return `
            <div class="wishlist-item">
                <div class="wishlist-item-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="wishlist-item-info">
                    <h3>${product.name}</h3>
                    <div class="wishlist-item-price">${product.price.toLocaleString('vi-VN')}đ</div>
                    <div class="wishlist-item-actions">
                        <button class="btn-add-cart" onclick="addToCart('${product.id}')">
                            <i class="fas fa-cart-plus"></i> Thêm vào giỏ
                        </button>
                        <button class="btn-remove" onclick="toggleWishlist('${product.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Check wishlist status for product
async function checkWishlistStatus(productId) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return false;
    
    try {
        const response = await fetch(`/api/wishlist/check/${productId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        return data.inWishlist;
    } catch (error) {
        console.error('Check wishlist error:', error);
        return false;
    }
}
