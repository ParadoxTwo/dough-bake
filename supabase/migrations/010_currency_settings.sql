-- Add currency settings to site_settings table
-- These will be inserted via the application, but we can set defaults

-- Insert default currency settings
INSERT INTO public.site_settings (key, value) VALUES
    ('currency_mode', 'fixed'),
    ('currency_fixed', 'INR'),
    ('currency_exchange_rates', '{"USD": 0.012, "AUD": 0.018}'),
    ('currency_last_updated', NOW()::text)
ON CONFLICT (key) DO NOTHING;

