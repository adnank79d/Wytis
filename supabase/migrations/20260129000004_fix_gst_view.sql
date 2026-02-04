-- Re-create GST Summary View now that gst_records table exists
CREATE OR REPLACE VIEW public.gst_summary_view WITH (security_invoker = on) AS
SELECT
  business_id,
  tax_period,
  gst_type,
  SUM(amount) as total_payable
FROM public.gst_records
GROUP BY business_id, tax_period, gst_type;
