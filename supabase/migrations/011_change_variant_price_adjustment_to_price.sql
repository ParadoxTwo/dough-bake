-- Change variant price_adjustment to price
-- This migration converts the price adjustment model to absolute price model

-- Step 1: Add new price column
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);

-- Step 2: Migrate existing data: price = base_product_price + price_adjustment
UPDATE public.product_variants pv
SET price = (
  SELECT p.price + COALESCE(pv.price_adjustment, 0)
  FROM public.products p
  WHERE p.id = pv.product_id
);

-- Step 3: Set price to NOT NULL with default (for any edge cases)
ALTER TABLE public.product_variants 
ALTER COLUMN price SET NOT NULL,
ALTER COLUMN price SET DEFAULT 0;

-- Step 4: Drop the old price_adjustment column
ALTER TABLE public.product_variants 
DROP COLUMN IF EXISTS price_adjustment;

