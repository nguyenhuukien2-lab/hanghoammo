// Products Page JavaScript
let currentCategory = 'all';
let currentSort = 'newest';
let currentPriceRange = 'all';

function filterByCategory(category) {
    currentCategory = category;
    const tabs = document.querySelectorAll('.category-tab-pill');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.currentTarget.classList.add('active');
    applyFilters();
}

function sortProducts(sort) {
    currentSort = sort;
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(pill => pill.classList.remove('active'));
    event.currentTarget.classList.add('active');
    applyFilters();
}

function filterPrice(range) {
    currentPriceRange = range;
    applyFilters();
}

function applyFilters() {
    let filtered = [...products];

    // Filter by category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }

    // Filter by price
    if (currentPriceRange !== 'all') {
        const [min, max] = currentPriceRange.split('-').map(Number);
        filtered = filtered.filter(p => p.price >= min && p.price <= max);
    }

    // Sort
    switch(currentSort) {
        case 'price-asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'popular':
            filtered.sort((a, b) => (b.sold || 0) - (a.sold || 0));
            break;
        case 'discount':
            filtered.sort((a, b) => (b.sold || 0) - (a.sold || 0));
            break;
    }

    renderProductsExplore(filtered);
    
    const productsCount = document.getElementById('productsCount');
    if (productsCount) {
        productsCount.textContent = filtered.length;
    }
}

function renderProductsExplore(productsToRender) {
    const container = document.getElementById('productsGrid');
    if (!container) return;

    container.innerHTML = '';

    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card-explore';
        const productId = product._id || product.id;
        
        // Calculate discount percentage if oldPrice exists
        let discountBadge = '';
        if (product.oldPrice && product.oldPrice > product.price) {
            const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
            discountBadge = `<span class="price-discount">-${discount}%</span>`;
        }
        
        productCard.innerHTML = `
            <div class="product-image-explore">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                ${product.badge ? `<span class="badge-explore ${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
                <button class="btn-wishlist" onclick="toggleWishlist(event, '${productId}')">
                    <i class="far fa-heart"></i>
                </button>
            </div>
            <div class="product-info-explore">
                <h3 class="product-name-explore">${product.name}</h3>
                <div class="product-price-explore">
                    <span class="price-current">${product.price.toLocaleString('vi-VN')}đ</span>
                    ${product.oldPrice ? `<span class="price-old">${product.oldPrice.toLocaleString('vi-VN')}đ</span>` : ''}
                    ${discountBadge}
                </div>
                <div class="product-meta-explore">
                    <div class="rating-explore">
                        <i class="fas fa-star"></i>
                        <span>${product.rating || '5.0'}</span>
                    </div>
                    <span class="sold-explore">Đã bán ${product.sold || 0}</span>
                </div>
                <div class="product-vendor-explore">
                    <img src="https://ui-avatars.com/api/?name=TH+Agency&background=667eea&color=fff&size=32" alt="Vendor">
                    <span>TH Agency</span>
                </div>
                <div class="product-actions-explore">
                    <button class="btn-add-to-cart-explore" onclick="quickAddToCart(event, '${productId}')">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Thêm giỏ hàng</span>
                    </button>
                    <button class="btn-quick-view-explore" onclick="viewProduct(event, '${productId}')" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Click on card to view details (except buttons)
        productCard.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                window.location.href = `product-detail.html?id=${productId}`;
            }
        });
        
        container.appendChild(productCard);
    });
}

// Wishlist toggle function
function toggleWishlist(event, productId) {
    event.stopPropagation();
    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    
    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        btn.classList.add('active');
        showNotification('Đã thêm vào yêu thích!');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        btn.classList.remove('active');
        showNotification('Đã xóa khỏi yêu thích!');
    }
}

// View product function
function viewProduct(event, productId) {
    event.stopPropagation();
    window.location.href = `product-detail.html?id=${productId}`;
}

// Quick add to cart function
function quickAddToCart(event, productId) {
    event.stopPropagation();
    addToCart(productId);
}

function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
        applyFilters();
        return;
    }

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query)
    );

    renderProductsExplore(filtered);
    
    const productsCount = document.getElementById('productsCount');
    if (productsCount) {
        productsCount.textContent = filtered.length;
    }
}

function changePage(direction) {
    // Pagination logic here
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Toggle keywords in footer
function toggleKeywords() {
    const keywordsList = document.querySelector('.keywords-list');
    const toggleBtn = document.querySelector('.keywords-toggle');
    
    if (keywordsList && toggleBtn) {
        keywordsList.classList.toggle('expanded');
        toggleBtn.textContent = keywordsList.classList.contains('expanded') ? 'Thu gọn' : 'Xem thêm';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    updateCartCount();
    updateUserUI();
    checkLoginStatus();
    
    // Load products from script.js (single source of truth)
    await loadProducts();
    
    // Always render products from the global products array
    renderProductsExplore(products);
    const productsCount = document.getElementById('productsCount');
    if (productsCount) {
        productsCount.textContent = products.length;
    }
});
