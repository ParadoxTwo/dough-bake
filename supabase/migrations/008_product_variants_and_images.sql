-- Add stock management to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_type TEXT DEFAULT 'unlimited' CHECK (stock_type IN ('unlimited', 'limited')),
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price_adjustment DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock_type TEXT DEFAULT 'unlimited' CHECK (stock_type IN ('unlimited', 'limited')),
    stock_quantity INTEGER DEFAULT NULL CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
    available BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(product_id, slug)
);

-- Create index for variant lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_slug ON public.product_variants(slug);

-- Create product_images table
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    original_url TEXT NOT NULL,
    large_url TEXT NOT NULL,
    medium_url TEXT NOT NULL,
    small_url TEXT NOT NULL,
    og_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CHECK (variant_id IS NULL OR product_id IS NOT NULL)
);

-- Create indexes for image lookups
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_variant_id ON public.product_images(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON public.product_images(product_id, display_order);

-- Create job_queue table for async product creation
CREATE TABLE IF NOT EXISTS public.job_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_type TEXT NOT NULL CHECK (job_type IN ('create_product', 'update_product', 'process_images')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payload JSONB NOT NULL,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for job queue lookups
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON public.job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON public.job_queue(job_type);
CREATE INDEX IF NOT EXISTS idx_job_queue_created_at ON public.job_queue(created_at);

-- Enable RLS on new tables
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

-- Product variants policies (public read, admin write)
CREATE POLICY "Anyone can view available product variants" ON public.product_variants
    FOR SELECT USING (
        available = true AND
        EXISTS (
            SELECT 1 FROM public.products
            WHERE id = product_variants.product_id AND available = true
        )
    );

CREATE POLICY "Admins can view all product variants" ON public.product_variants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert product variants" ON public.product_variants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update product variants" ON public.product_variants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete product variants" ON public.product_variants
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Product images policies (public read, admin write)
CREATE POLICY "Anyone can view product images" ON public.product_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE id = product_images.product_id AND available = true
        )
    );

CREATE POLICY "Admins can view all product images" ON public.product_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert product images" ON public.product_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update product images" ON public.product_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete product images" ON public.product_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Job queue policies (admin only)
CREATE POLICY "Admins can view all jobs" ON public.job_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert jobs" ON public.job_queue
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update jobs" ON public.job_queue
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add updated_at trigger for new tables
CREATE TRIGGER set_updated_at_product_variants
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_product_images
    BEFORE UPDATE ON public.product_images
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_job_queue
    BEFORE UPDATE ON public.job_queue
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

