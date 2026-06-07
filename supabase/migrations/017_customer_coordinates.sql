-- Optional drop-off coordinates captured at checkout. Improves courier accuracy;
-- delivery providers still geocode from the text address when these are null.
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
