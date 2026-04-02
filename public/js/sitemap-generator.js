// Sitemap Generator for SEO
const API_URL = '/api';

async function generateSitemap() {
    try {
        const sitemap = [];
        const baseUrl = window.location.origin;
        
        // Static pages
        const staticPages = [
            { url: '/', priority: 1.0, changefreq: 'daily' },
            { url: '/products.html', priority: 0.9, changefreq: 'daily' },
            { url: '/blog.html', priority: 0.8, changefreq: 'daily' },
            { url: '/login.html', priority: 0.5, changefreq: 'monthly' },
            { url: '/register.html', priority: 0.5, changefreq: 'monthly' }
        ];
        
        staticPages.forEach(page => {
            sitemap.push({
                loc: baseUrl + page.url,
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: page.changefreq,
                priority: page.priority
            });
        });
        
        // Products
        const productsRes = await fetch(`${API_URL}/products`);
        const productsData = await productsRes.json();
        
        if (productsData.success && productsData.data) {
            productsData.data.forEach(product => {
                sitemap.push({
                    loc: `${baseUrl}/product-detail.html?id=${product.id}`,
                    lastmod: new Date(product.updated_at || product.created_at).toISOString().split('T')[0],
                    changefreq: 'weekly',
                    priority: 0.7
                });
            });
        }
        
        // Blog posts
        const blogRes = await fetch(`${API_URL}/blog/posts?limit=1000`);
        const blogData = await blogRes.json();
        
        if (blogData.success && blogData.data) {
            blogData.data.forEach(post => {
                sitemap.push({
                    loc: `${baseUrl}/blog-post.html?slug=${post.slug}`,
                    lastmod: new Date(post.updated_at).toISOString().split('T')[0],
                    changefreq: 'weekly',
                    priority: 0.6
                });
            });
        }
        
        // Generate XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        sitemap.forEach(item => {
            xml += '  <url>\n';
            xml += `    <loc>${item.loc}</loc>\n`;
            xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
            xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
            xml += `    <priority>${item.priority}</priority>\n`;
            xml += '  </url>\n';
        });
        
        xml += '</urlset>';
        
        return xml;
    } catch (error) {
        console.error('Generate sitemap error:', error);
        return null;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateSitemap };
}
