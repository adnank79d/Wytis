-- Notify PostgREST to reload the schema cache
-- This is necessary when new columns (like expenses.status) are added but API throws "schema cache" errors
NOTIFY pgrst, 'reload schema';
