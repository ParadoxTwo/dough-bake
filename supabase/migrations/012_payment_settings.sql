-- Add payment settings to site_settings table
-- Default to Stripe as the payment provider

-- Insert default payment settings
INSERT INTO public.site_settings (key, value) VALUES
    ('payment_provider', 'stripe'),
    ('payment_config', '{}'),
    ('payment_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

