-- Migration: Create period_configurations table
-- Date: 2026-07-02
-- Description: Creates a table to store customizable start/end dates for each of the three periods of any month.

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.period_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_month DATE NOT NULL, -- Representación mensual (ej: '2026-07-01')
    period TEXT NOT NULL CHECK (period IN ('Periodo 01', 'Periodo 02', 'Periodo 03')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_month_period UNIQUE (target_month, period)
);

-- 2. Disable Row Level Security (RLS)
ALTER TABLE public.period_configurations DISABLE ROW LEVEL SECURITY;
