-- Migration: Create dev_commitments table and setup public storage bucket
-- Date: 2026-07-02
-- Description: Creates the detailed table for developer commitments, disables RLS, and sets up a public storage bucket 'attachments' with open policies.

-- 1. Create dev_commitments table
CREATE TABLE IF NOT EXISTS public.dev_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_number TEXT NOT NULL,
    priority INTEGER NOT NULL, -- Prioridad numérica (1, 2, 3, etc.)
    developer_name TEXT NOT NULL, -- Recurso asignado
    period TEXT NOT NULL CHECK (period IN ('Periodo 01', 'Periodo 02', 'Periodo 03')),
    target_month DATE NOT NULL, -- Representación mensual (ej: '2026-07-01')
    delivery_date DATE, -- Fecha de entrega a QA (null si está pendiente)
    notes TEXT,
    attachment_url TEXT, -- URL pública del adjunto en Supabase Storage
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Disable Row Level Security (RLS)
ALTER TABLE public.dev_commitments DISABLE ROW LEVEL SECURITY;

-- 3. Initialize Public Storage Bucket 'attachments'
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Public Storage upload/download policies for the 'attachments' bucket
-- (This ensures the frontend client can upload images anonymously)

CREATE POLICY "Allow public read access to attachments" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'attachments');

CREATE POLICY "Allow public insert access to attachments" 
ON storage.objects 
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Allow public update access to attachments" 
ON storage.objects 
FOR UPDATE 
TO public 
USING (bucket_id = 'attachments');

CREATE POLICY "Allow public delete access to attachments" 
ON storage.objects 
FOR DELETE 
TO public 
USING (bucket_id = 'attachments');
