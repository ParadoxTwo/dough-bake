-- Delivery dispatch prerequisites:
--   * allow the `create_delivery` job type in job_queue
--   * add retry tracking columns used by the queue drainer
--   * seed the bakery pickup address setting (managed from the admin UI)

-- Extend the job_type CHECK constraint to include create_delivery.
ALTER TABLE public.job_queue DROP CONSTRAINT IF EXISTS job_queue_job_type_check;
ALTER TABLE public.job_queue ADD CONSTRAINT job_queue_job_type_check
    CHECK (job_type IN ('create_product', 'update_product', 'process_images', 'create_delivery'));

-- Retry tracking for the queue drainer.
ALTER TABLE public.job_queue ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.job_queue ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 5;

-- Bakery pickup address used when dispatching deliveries. JSON shape:
--   { "address", "lat", "lng", "contactName", "contactPhone", "note" }
INSERT INTO public.site_settings (key, value) VALUES
    ('delivery_pickup', '{}')
ON CONFLICT (key) DO NOTHING;
