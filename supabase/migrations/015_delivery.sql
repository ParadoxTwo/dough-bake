-- Delivery integration: per-order delivery records + provider settings.
-- Default provider is Borzo (self-serve API with a sandbox). Porter is available
-- as an additional adapter once a Porter business account/API access exists.

-- ---------------------------------------------------------------------------
-- deliveries: one row per order, tracking the dispatched courier task.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    external_id TEXT,                 -- the provider's delivery/order id
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'created', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed')
    ),
    tracking_url TEXT,
    rider_name TEXT,
    rider_phone TEXT,
    fee DECIMAL(10, 2),
    eta TIMESTAMP WITH TIME ZONE,
    raw JSONB,                        -- last provider payload, for debugging
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- One delivery per order.
CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_order_id ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_external_id ON public.deliveries(external_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Customers can view the delivery for their own orders.
CREATE POLICY "Users can view their own deliveries" ON public.deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.customers c ON c.id = o.customer_id
            WHERE o.id = deliveries.order_id AND c.user_id = auth.uid()
        )
    );

-- Admins can view all deliveries.
CREATE POLICY "Admins can view all deliveries" ON public.deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can insert/update/delete deliveries. (Server-side dispatch and webhook
-- handlers run with the service role and bypass RLS; these policies cover the
-- admin dashboard.)
CREATE POLICY "Admins can insert deliveries" ON public.deliveries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update deliveries" ON public.deliveries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete deliveries" ON public.deliveries
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE TRIGGER set_updated_at_deliveries
    BEFORE UPDATE ON public.deliveries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Default delivery provider settings (stored in site_settings, like payments).
-- Credentials live in delivery_config (JSON) and are managed from the admin UI.
-- ---------------------------------------------------------------------------
INSERT INTO public.site_settings (key, value) VALUES
    ('delivery_provider', 'borzo'),
    ('delivery_config', '{}'),
    ('delivery_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
