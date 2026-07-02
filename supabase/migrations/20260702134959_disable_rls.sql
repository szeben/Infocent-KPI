-- Migration: Disable RLS for Anonymous Access
-- Date: 2026-07-02
-- Description: Disables Row Level Security (RLS) on all public tables to allow reading and writing data without authentication.

-- Disable RLS on the tables
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_entries DISABLE ROW LEVEL SECURITY;

-- Note: Since RLS is disabled, any client with the Project URL and Anon Key can now perform read/write operations.
