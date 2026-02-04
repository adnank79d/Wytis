-- Direct SQL to create membership for the logged-in user
-- Run this in Supabase SQL Editor

-- First, check what businesses exist
SELECT id, name FROM businesses;

-- Then insert membership (replace business_id with the one that has data)
INSERT INTO memberships (user_id, business_id, role)
VALUES (
  '77130221-4bc4-45f3-a0f1-7296eb108794',
  '3c82b7cd-3c51-4141-9d72-6b583eaf0fbd',  -- JS Trading Company (has the ledger data)
  'owner'
)
ON CONFLICT (user_id, business_id) DO UPDATE
SET role = 'owner';

-- Verify it was created
SELECT * FROM memberships WHERE user_id = '77130221-4bc4-45f3-a0f1-7296eb108794';
