-- Migration: Seed dev commitments for testing
-- Date: 2026-07-02
-- Description: Seeds the list of dev commitments for Hendira Alvis targeting May 2026 with no observations.

INSERT INTO public.dev_commitments (
    report_number,
    priority,
    developer_name,
    period,
    target_month,
    delivery_committed,
    measured_for_kpi,
    notes
) VALUES
('798058', -1, 'Hendira Alvis', 'Periodo 01', '2026-05-01', TRUE, TRUE, NULL),
('795741', -1, 'Hendira Alvis', 'Periodo 01', '2026-05-01', TRUE, TRUE, NULL),
('796452', -1, 'Hendira Alvis', 'Periodo 01', '2026-05-01', FALSE, TRUE, NULL),
('796469', -1, 'Hendira Alvis', 'Periodo 01', '2026-05-01', FALSE, TRUE, NULL),
('789253', -1, 'Hendira Alvis', 'Periodo 01', '2026-05-01', FALSE, TRUE, NULL),
('798118', -1, 'Hendira Alvis', 'Periodo 01', '2026-05-01', FALSE, TRUE, NULL),
('794135', -1, 'Hendira Alvis', 'Periodo 01', '2026-05-01', FALSE, TRUE, NULL),
('792603', 1, 'Hendira Alvis', 'Periodo 01', '2026-05-01', FALSE, TRUE, NULL),
('798287', 2, 'Hendira Alvis', 'Periodo 01', '2026-05-01', FALSE, TRUE, NULL),
('798093', 3, 'Hendira Alvis', 'Periodo 01', '2026-05-01', FALSE, TRUE, NULL),
('792764', 4, 'Hendira Alvis', 'Periodo 01', '2026-05-01', FALSE, TRUE, NULL),
('796471', 5, 'Hendira Alvis', 'Periodo 01', '2026-05-01', FALSE, TRUE, NULL);
