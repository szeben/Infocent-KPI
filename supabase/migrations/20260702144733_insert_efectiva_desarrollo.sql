-- Migration: Insert 'Efectiva Desarrollo' KPI
-- Date: 2026-07-02
-- Description: Inserts the new KPI for tracking development effectiveness against assigned demand commitments.

INSERT INTO public.kpis (unit_id, name, description, unit_of_measure, target_value, frequency)
VALUES (
    '22222222-2222-2222-2222-222222222222', -- Desarrollo Unit ID
    'Efectiva Desarrollo',
    'Mide la cantidad de casos entregados por un desarrollador a Calidad versus la cantidad asignada por el comité de Gestión de la Demanda durante un periodo mensual (3 periodos de 10 días).',
    'Porcentaje',
    90,
    'Mensual'
)
ON CONFLICT (unit_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    unit_of_measure = EXCLUDED.unit_of_measure,
    target_value = EXCLUDED.target_value,
    frequency = EXCLUDED.frequency;
