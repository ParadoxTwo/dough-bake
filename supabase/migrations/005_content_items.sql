-- Create content_items table for editable text content
CREATE TABLE IF NOT EXISTS public.content_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    page TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_items_key ON public.content_items(key);
CREATE INDEX IF NOT EXISTS idx_content_items_page ON public.content_items(page);

-- Enable Row Level Security
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Policies for content_items
-- Anyone can view content (public read)
CREATE POLICY "Anyone can view content items" ON public.content_items
    FOR SELECT USING (true);

-- Only admins can insert/update/delete content
CREATE POLICY "Admins can insert content items" ON public.content_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update content items" ON public.content_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete content items" ON public.content_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE TRIGGER set_updated_at_content_items
    BEFORE UPDATE ON public.content_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default content items
INSERT INTO public.content_items (key, value, page, description) VALUES
    ('hero_title', 'Freshly home baked from the finest ingredients', 'home', 'Main hero title on homepage'),
    ('hero_description', 'Handcrafted daily with premium, locally-sourced ingredients. Recipes that meet modern care, delivering the warmth and authenticity of truly homemade baked goods fresh to your door.', 'home', 'Hero section description on homepage'),
    ('featured_products_subtitle', 'Our most popular items, loved by customers', 'home', 'Subtitle for featured products section'),
    ('logo_tagline', 'Freshly home baked from the finest ingredients', 'footer', 'Tagline shown in footer below logo'),
    ('service_fresh_ingredients_title', 'Fresh Ingredients', 'home', 'Title for fresh ingredients service'),
    ('service_fresh_ingredients_description', 'We use only the finest organic ingredients sourced locally', 'home', 'Description for fresh ingredients service'),
    ('service_expert_bakers_title', 'Expert Bakers', 'home', 'Title for expert bakers service'),
    ('service_expert_bakers_description', 'Handcrafted by experienced artisan bakers with decades of skill', 'home', 'Description for expert bakers service'),
    ('service_fast_delivery_title', 'Fast Delivery', 'home', 'Title for fast delivery service'),
    ('service_fast_delivery_description', 'Same-day delivery available for orders placed before noon', 'home', 'Description for fast delivery service')
ON CONFLICT (key) DO NOTHING;

