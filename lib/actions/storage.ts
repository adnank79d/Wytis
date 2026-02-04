'use server'

import { createClient } from "@/lib/supabase/server";

export async function getStorageUsage(businessId: string): Promise<{ totalBytes: number; formatted: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('storage_files')
        .select('size_bytes')
        .eq('business_id', businessId);

    if (error) {
        console.error('Error fetching storage usage:', error);
        return { totalBytes: 0, formatted: '0 GB' };
    }

    const totalBytes = data.reduce((acc, file) => acc + (file.size_bytes || 0), 0);

    // Format to GB or MB
    let formatted = '0 GB';
    if (totalBytes > 1024 * 1024 * 1024) {
        formatted = `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (totalBytes > 1024 * 1024) {
        formatted = `${(totalBytes / (1024 * 1024)).toFixed(0)} MB`; // Cleaner integer for MB if small
    } else {
        formatted = `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    return { totalBytes, formatted };
}

export async function recordFileUpload(businessId: string, bucketId: string, filePath: string, sizeBytes: number, contentType?: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('storage_files')
        .insert({
            business_id: businessId,
            bucket_id: bucketId,
            file_path: filePath,
            size_bytes: sizeBytes,
            content_type: contentType
        });

    if (error) {
        console.error('Error recording file upload:', error);
        throw new Error('Failed to track file usage');
    }
}
