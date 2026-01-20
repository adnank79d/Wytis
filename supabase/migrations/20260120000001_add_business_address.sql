-- Migration: 20260120000001_add_business_address
-- Description: Add address columns to businesses table for GST integration.

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS address_line1 text,
ADD COLUMN IF NOT EXISTS address_line2 text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS pincode text;
