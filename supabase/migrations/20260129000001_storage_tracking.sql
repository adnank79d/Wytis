-- Create storage_files table to track file usage
CREATE TABLE IF NOT EXISTS public.storage_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    bucket_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    content_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS Policies
ALTER TABLE public.storage_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files from their business"
    ON public.storage_files
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.user_id = auth.uid()
            AND memberships.business_id = storage_files.business_id
        )
    );

CREATE POLICY "Users can insert files for their business"
    ON public.storage_files
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.user_id = auth.uid()
            AND memberships.business_id = storage_files.business_id
        )
    );

CREATE POLICY "Users can delete files from their business"
    ON public.storage_files
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.user_id = auth.uid()
            AND memberships.business_id = storage_files.business_id
        )
    );

-- Index for fast aggregation
CREATE INDEX idx_storage_files_business_size ON public.storage_files(business_id, size_bytes);
