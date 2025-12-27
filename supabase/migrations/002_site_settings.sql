-- Create site_settings table for global site configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);

-- Enable Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policies for site_settings
-- Anyone can view settings (public read)
CREATE POLICY "Anyone can view site settings" ON public.site_settings
    FOR SELECT USING (true);

-- Only admins can insert/update/delete settings
CREATE POLICY "Admins can insert site settings" ON public.site_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update site settings" ON public.site_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete site settings" ON public.site_settings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE TRIGGER set_updated_at_site_settings
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default theme settings
INSERT INTO public.site_settings (key, value) VALUES
    ('theme', 'baked'),
    ('apply_logo_filter', 'true')
ON CONFLICT (key) DO NOTHING;

