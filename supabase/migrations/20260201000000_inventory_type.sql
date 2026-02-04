-- Add type column to inventory_products
ALTER TABLE inventory_products 
ADD COLUMN "type" text NOT NULL DEFAULT 'goods' CHECK (type IN ('goods', 'service'));

-- Index on type for faster filtering
CREATE INDEX idx_inventory_products_type ON inventory_products("type");
