-- Create blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image VARCHAR(500),
    post_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_categories_status ON blog_categories(status);

-- Create blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_is_featured ON blog_posts(is_featured);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);

-- Create blog tags table
CREATE TABLE IF NOT EXISTS blog_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);

-- Create blog post tags junction table
CREATE TABLE IF NOT EXISTS blog_post_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, tag_id)
);

-- Create indexes
CREATE INDEX idx_blog_post_tags_post_id ON blog_post_tags(post_id);
CREATE INDEX idx_blog_post_tags_tag_id ON blog_post_tags(tag_id);

-- Create blog comments table
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, spam
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX idx_blog_comments_parent_id ON blog_comments(parent_id);
CREATE INDEX idx_blog_comments_status ON blog_comments(status);

-- Create blog likes table
CREATE TABLE IF NOT EXISTS blog_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create indexes
CREATE INDEX idx_blog_likes_post_id ON blog_likes(post_id);
CREATE INDEX idx_blog_likes_user_id ON blog_likes(user_id);

-- Function to update category post count
CREATE OR REPLACE FUNCTION update_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
        UPDATE blog_categories
        SET post_count = post_count + 1
        WHERE id = NEW.category_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'published' AND NEW.status = 'published' THEN
            UPDATE blog_categories
            SET post_count = post_count + 1
            WHERE id = NEW.category_id;
        ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
            UPDATE blog_categories
            SET post_count = GREATEST(post_count - 1, 0)
            WHERE id = OLD.category_id;
        END IF;
        
        IF OLD.category_id != NEW.category_id AND NEW.status = 'published' THEN
            UPDATE blog_categories
            SET post_count = GREATEST(post_count - 1, 0)
            WHERE id = OLD.category_id;
            
            UPDATE blog_categories
            SET post_count = post_count + 1
            WHERE id = NEW.category_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
        UPDATE blog_categories
        SET post_count = GREATEST(post_count - 1, 0)
        WHERE id = OLD.category_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update category post count
CREATE TRIGGER trigger_update_category_post_count
AFTER INSERT OR UPDATE OR DELETE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_category_post_count();

-- Function to update tag post count
CREATE OR REPLACE FUNCTION update_tag_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_tags
        SET post_count = post_count + 1
        WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_tags
        SET post_count = GREATEST(post_count - 1, 0)
        WHERE id = OLD.tag_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tag post count
CREATE TRIGGER trigger_update_tag_post_count
AFTER INSERT OR DELETE ON blog_post_tags
FOR EACH ROW
EXECUTE FUNCTION update_tag_post_count();

-- Function to update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
        UPDATE blog_posts
        SET comment_count = comment_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
            UPDATE blog_posts
            SET comment_count = comment_count + 1
            WHERE id = NEW.post_id;
        ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
            UPDATE blog_posts
            SET comment_count = GREATEST(comment_count - 1, 0)
            WHERE id = OLD.post_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
        UPDATE blog_posts
        SET comment_count = GREATEST(comment_count - 1, 0)
        WHERE id = OLD.post_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update post comment count
CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR UPDATE OR DELETE ON blog_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();

-- Function to update post like count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_posts
        SET like_count = like_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_posts
        SET like_count = GREATEST(like_count - 1, 0)
        WHERE id = OLD.post_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update post like count
CREATE TRIGGER trigger_update_post_like_count
AFTER INSERT OR DELETE ON blog_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_like_count();
