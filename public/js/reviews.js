// Reviews functionality for product detail page

// Load reviews for product
async function loadReviews(productId) {
    try {
        const response = await fetch(`/api/reviews/product/${productId}`);
        const data = await response.json();
        
        if (data.success) {
            displayReviews(data.data);
            loadReviewStats(productId);
        }
    } catch (error) {
        console.error('Load reviews error:', error);
    }
}

// Load review statistics
async function loadReviewStats(productId) {
    try {
        const response = await fetch(`/api/reviews/product/${productId}/stats`);
        const data = await response.json();
        
        if (data.success) {
            displayReviewStats(data.data);
        }
    } catch (error) {
        console.error('Load review stats error:', error);
    }
}

// Display reviews
function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;
    
    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="empty-reviews">
                <i class="fas fa-star"></i>
                <p>Chưa có đánh giá nào</p>
                <button class="btn-write-review" onclick="openReviewModal()">
                    Viết đánh giá đầu tiên
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <div class="review-user">
                    <div class="review-avatar">
                        ${review.users?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div class="review-user-info">
                        <div class="review-user-name">${review.users?.name || 'Anonymous'}</div>
                        <div class="review-date">${new Date(review.created_at).toLocaleDateString('vi-VN')}</div>
                    </div>
                </div>
                <div class="review-rating">
                    ${generateStars(review.rating)}
                </div>
            </div>
            <div class="review-content">
                ${review.comment || ''}
            </div>
            ${review.images && review.images.length > 0 ? `
                <div class="review-images">
                    ${review.images.map(img => `
                        <img src="${img}" alt="Review image" onclick="viewImage('${img}')">
                    `).join('')}
                </div>
            ` : ''}
            <div class="review-actions">
                <button class="btn-helpful" onclick="markHelpful('${review.id}')">
                    <i class="fas fa-thumbs-up"></i>
                    Hữu ích (${review.helpful_count || 0})
                </button>
            </div>
        </div>
    `).join('');
}

// Display review statistics
function displayReviewStats(stats) {
    const container = document.getElementById('reviewStats');
    if (!container) return;
    
    container.innerHTML = `
        <div class="review-stats-summary">
            <div class="review-average">
                <div class="review-average-score">${stats.average}</div>
                <div class="review-average-stars">${generateStars(Math.round(stats.average))}</div>
                <div class="review-average-count">${stats.total} đánh giá</div>
            </div>
            <div class="review-distribution">
                ${[5,4,3,2,1].map(star => {
                    const count = stats.distribution[star] || 0;
                    const percentage = stats.total > 0 ? (count / stats.total * 100) : 0;
                    return `
                        <div class="review-dist-row">
                            <span class="review-dist-star">${star} <i class="fas fa-star"></i></span>
                            <div class="review-dist-bar">
                                <div class="review-dist-fill" style="width: ${percentage}%"></div>
                            </div>
                            <span class="review-dist-count">${count}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Generate star icons
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// Open review modal
function openReviewModal() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Vui lòng đăng nhập để viết đánh giá!', 'error');
        openAuthModal('login');
        return;
    }
    
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close review modal
function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('reviewForm').reset();
    }
}

// Submit review
async function submitReview(event) {
    event.preventDefault();
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Vui lòng đăng nhập!', 'error');
        return;
    }
    
    const productId = new URLSearchParams(window.location.search).get('id');
    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    const comment = document.getElementById('reviewComment').value;
    
    if (!rating) {
        showNotification('Vui lòng chọn số sao!', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId,
                rating: parseInt(rating),
                comment
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Đánh giá thành công!');
            closeReviewModal();
            loadReviews(productId);
        } else {
            showNotification(data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Submit review error:', error);
        showNotification('Có lỗi xảy ra', 'error');
    }
}

// Mark review as helpful
async function markHelpful(reviewId) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Vui lòng đăng nhập!', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const productId = new URLSearchParams(window.location.search).get('id');
            loadReviews(productId);
        }
    } catch (error) {
        console.error('Mark helpful error:', error);
    }
}
