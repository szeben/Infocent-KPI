-- Migration: Initial Schema Setup for KPI Control System (Infocent-KPI)
-- Date: 2026-07-02
-- Description: Creates units, kpis, and kpi_entries tables, sets up Row Level Security (RLS), and seeds initial data.

-- 1. Create Units Table
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create KPIs Table
CREATE TABLE IF NOT EXISTS public.kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    unit_of_measure TEXT NOT NULL, -- e.g., 'Porcentaje', 'Cantidad', 'Horas', 'Días'
    target_value NUMERIC NOT NULL,
    frequency TEXT NOT NULL, -- e.g., 'Diario', 'Semanal', 'Mensual'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(unit_id, name)
);

-- 3. Create KPI Entries Table
CREATE TABLE IF NOT EXISTS public.kpi_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES public.kpis(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT check_dates CHECK (period_start <= period_end)
);

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_entries ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Allow all authenticated users to read and modify data.
-- (This can be restricted further later, e.g., based on user roles or department access)

CREATE POLICY "Enable all actions for authenticated users" 
ON public.units 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all actions for authenticated users" 
ON public.kpis 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all actions for authenticated users" 
ON public.kpi_entries 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Allow public read access to units and kpis if needed for login/dashboard previews (Optional)
CREATE POLICY "Enable read access for anonymous users" 
ON public.units 
FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "Enable read access for anonymous users" 
ON public.kpis 
FOR SELECT 
TO anon 
USING (true);

-- 6. Seed Initial Data
-- Insert standard units
INSERT INTO public.units (id, name, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Requerimientos', 'Unidad encargada de levantar, analizar y definir las necesidades y requerimientos de los proyectos.'),
    ('22222222-2222-2222-2222-222222222222', 'Desarrollo', 'Unidad encargada de la construcción, codificación e implementación técnica del software.'),
    ('33333333-3333-3333-3333-333333333333', 'Calidad', 'Unidad encargada del aseguramiento de la calidad, pruebas, control de calidad y verificación del software.')
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description;

-- Insert initial standard KPIs
INSERT INTO public.kpis (unit_id, name, description, unit_of_measure, target_value, frequency) VALUES
    -- Requerimientos
    ('11111111-1111-1111-1111-111111111111', 'Tasa de Cambio de Requerimientos', 'Porcentaje de requerimientos modificados después de su aprobación formal.', 'Porcentaje', 10, 'Mensual'),
    ('11111111-1111-1111-1111-111111111111', 'Requerimientos Definidos', 'Cantidad total de requerimientos analizados y aprobados listos para desarrollo.', 'Cantidad', 20, 'Mensual'),
    
    -- Desarrollo
    ('22222222-2222-2222-2222-222222222222', 'Tiempo de Ciclo (Cycle Time)', 'Tiempo promedio (en días) transcurrido desde que inicia el desarrollo hasta que se despliega.', 'Días', 5, 'Mensual'),
    ('22222222-2222-2222-2222-222222222222', 'Frecuencia de Despliegue', 'Número de despliegues exitosos realizados a ambientes de prueba o producción.', 'Cantidad', 4, 'Semanal'),
    
    -- Calidad
    ('33333333-3333-3333-3333-333333333333', 'Densidad de Defectos', 'Número de defectos reportados por cada mil líneas de código o por módulo crítico.', 'Defectos', 2, 'Mensual'),
    ('33333333-3333-3333-3333-333333333333', 'Cobertura de Pruebas Unitarias', 'Porcentaje mínimo de cobertura de código alcanzado mediante pruebas automáticas.', 'Porcentaje', 80, 'Mensual')
ON CONFLICT (unit_id, name) DO NOTHING;
