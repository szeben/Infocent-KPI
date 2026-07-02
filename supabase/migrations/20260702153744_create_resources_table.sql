-- Migration: Create resources table and seed developer resources
-- Date: 2026-07-02
-- Description: Creates the resources table for developer list, disables RLS, and inserts default developers.

-- 1. Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Disable Row Level Security (RLS)
ALTER TABLE public.resources DISABLE ROW LEVEL SECURITY;

-- 3. Seed resources
INSERT INTO public.resources (name) VALUES
('Diana Salas'),
('Hendira Alvis'),
('Gerald Aguilera'),
('Andres Beltran'),
('Gabriel Paz'),
('Luzardo Paredes'),
('Adriana Ramirez - Prov'),
('Eleazar Gonzalez - Prov'),
('Luis Mercado - Prov'),
('Melody Toro')
ON CONFLICT (name) DO NOTHING;
