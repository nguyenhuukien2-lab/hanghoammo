// SEO Service - Meta tags, structured data, etc.

class SEOService {
    // Generate meta tags for product
    generateProductMeta(product) {
        const title = `${product.name} - HangHoaMMO`;
        const description = product.description?.substring(0, 160) || `Mua ${product.name} giá rẻ tại HangHoaMMO`;
        const image = product.image || '/images/default-product.jpg';
        const url = `${process.env.BASE_URL}/product-detail.html?id=${product.id}`;
        
        return {
            title,
            description,
            keywords: `${product.name}, mua ${product.name}, ${product.category}, MMO`,
            ogTitle: title,
            ogDescription: description,
            ogImage: image,
            ogUrl: url,
            ogType: 'product',
            twitterCard: 'summary_large_image',
            twitterTitle: title,
            twitterDescription: description,
            twitterImage: image
        };
    }
    
    // Generate structured data for product
    generateProductStructuredData(product) {
        return {
            '@context': 'https://schema.org/',
            '@type': 'Product',
            'name': product.name,
            'image': product.image,
            'description': product.description,
            'sku': product.id,
            'brand': {
                '@type': 'Brand',
                'name': 'HangHoaMMO'
            },
            'offers': {
                '@type': 'Offer',
                'url': `${process.env.BASE_URL}/product-detail.html?id=${product.id}`,
                'priceCurrency': 'VND',
                'price': product.price,
                'availability': product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                'seller': {
                    '@type': 'Organization',
                    'name': 'HangHoaMMO'
                }
            },
            'aggregateRating': product.average_rating ? {
                '@type': 'AggregateRating',
                'ratingValue': product.average_rating,
                'reviewCount': product.review_count
            } : undefined
        };
    }
    
    // Generate meta tags for blog post
    generateBlogMeta(post) {
        const title = `${post.title} - Blog HangHoaMMO`;
        const description = post.excerpt || post.content?.substring(0, 160) || '';
        const image = post.featured_image || '/images/default-blog.jpg';
        const url = `${process.env.BASE_URL}/blog-post.html?slug=${post.slug}`;
        
        return {
            title: post.meta_title || title,
            description: post.meta_description || description,
            keywords: post.meta_keywords || post.title,
            ogTitle: title,
            ogDescription: description,
            ogImage: image,
            ogUrl: url,
            ogType: 'article',
            articlePublishedTime: post.published_at,
            articleModifiedTime: post.updated_at,
            articleAuthor: post.author?.name,
            twitterCard: 'summary_large_image',
            twitterTitle: title,
            twitterDescription: description,
            twitterImage: image
        };
    }
    
    // Generate structured data for blog post
    generateBlogStructuredData(post, author) {
        return {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            'headline': post.title,
            'image': post.featured_image,
            'datePublished': post.published_at,
            'dateModified': post.updated_at,
            'author': {
                '@type': 'Person',
                'name': author?.name || 'HangHoaMMO'
            },
            'publisher': {
                '@type': 'Organization',
                'name': 'HangHoaMMO',
                'logo': {
                    '@type': 'ImageObject',
                    'url': `${process.env.BASE_URL}/images/logo.png`
                }
            },
            'description': post.excerpt || post.content?.substring(0, 160),
            'mainEntityOfPage': {
                '@type': 'WebPage',
                '@id': `${process.env.BASE_URL}/blog-post.html?slug=${post.slug}`
            }
        };
    }
    
    // Generate breadcrumb structured data
    generateBreadcrumb(items) {
        return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': items.map((item, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'name': item.name,
                'item': item.url
            }))
        };
    }
    
    // Generate organization structured data
    generateOrganization() {
        return {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            'name': 'HangHoaMMO',
            'url': process.env.BASE_URL,
            'logo': `${process.env.BASE_URL}/images/logo.png`,
            'description': 'Chợ MMO uy tín #1 Việt Nam',
            'contactPoint': {
                '@type': 'ContactPoint',
                'telephone': '+84-879-06-2222',
                'contactType': 'Customer Service',
                'areaServed': 'VN',
                'availableLanguage': 'Vietnamese'
            },
            'sameAs': [
                'https://t.me/hanghoammo',
                'https://facebook.com/hanghoammo'
            ]
        };
    }
    
    // Generate website structured data
    generateWebsite() {
        return {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            'name': 'HangHoaMMO',
            'url': process.env.BASE_URL,
            'potentialAction': {
                '@type': 'SearchAction',
                'target': `${process.env.BASE_URL}/products.html?search={search_term_string}`,
                'query-input': 'required name=search_term_string'
            }
        };
    }
    
    // Generate FAQ structured data
    generateFAQ(faqs) {
        return {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': faqs.map(faq => ({
                '@type': 'Question',
                'name': faq.question,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': faq.answer
                }
            }))
        };
    }
    
    // Generate review structured data
    generateReview(review, product) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Review',
            'itemReviewed': {
                '@type': 'Product',
                'name': product.name
            },
            'reviewRating': {
                '@type': 'Rating',
                'ratingValue': review.rating,
                'bestRating': 5
            },
            'author': {
                '@type': 'Person',
                'name': review.user?.name || 'Anonymous'
            },
            'reviewBody': review.comment,
            'datePublished': review.created_at
        };
    }
}

module.exports = new SEOService();
