// Debug script - Paste this in browser console

console.clear();
console.log('=== DEBUG PRODUCTS ===');

// Check current products array
console.log('1. Current products array:', products ? products.length : 'undefined');
if (products && products.length > 0) {
    console.log('First product:', products[0]);
    console.log('Last product:', products[products.length - 1]);
}

// Check localStorage cache
const cache = localStorage.getItem('adminProducts');
if (cache) {
    try {
        const data = JSON.parse(cache);
        if (data.products) {
            console.log('2. Cache (new format):', data.products.length, 'products');
            console.log('Cache timestamp:', new Date(data.timestamp).toLocaleString());
            console.log('First cached product:', data.products[0]);
        } else if (Array.isArray(data)) {
            console.log('2. Cache (old format):', data.length, 'products');
            console.log('First cached product:', data[0]);
        }
    } catch (e) {
        console.error('Cache parse error:', e);
    }
} else {
    console.log('2. No cache found');
}

// Check if getSampleProducts exists
if (typeof getSampleProducts === 'function') {
    const samples = getSampleProducts();
    console.log('3. Sample products available:', samples.length);
    console.log('First sample:', samples[0]);
} else {
    console.log('3. getSampleProducts not found');
}

// Test API
console.log('4. Testing API...');
fetch('/api/products')
    .then(r => r.json())
    .then(result => {
        if (result.success && result.data) {
            console.log('API returned:', result.data.length, 'products');
            console.log('First API product:', result.data[0]);
        } else {
            console.log('API returned empty or error:', result);
        }
    })
    .catch(err => {
        console.error('API error:', err);
    });

console.log('=== END DEBUG ===');
