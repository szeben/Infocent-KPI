-- Migration: Seed dev commitments for testing
-- Date: 2026-07-02
-- Description: Seeds the list of dev commitments provided by the user.

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
('798058', -1, 'Hendira Alvis', 'Periodo 01', '2026-07-01', TRUE, TRUE, 'Error en SPI | INFOCENT | Fabrica'),
('795741', -1, 'Hendira Alvis', 'Periodo 01', '2026-07-01', TRUE, TRUE, 'Error en SPI | ADMINISTRACION GD MARGARITA, C.A | Fabrica'),
('796452', -1, 'Hendira Alvis', 'Periodo 01', '2026-07-01', FALSE, TRUE, 'Error en SPI | INFOCENT | Fabrica'),
('796469', -1, 'Hendira Alvis', 'Periodo 01', '2026-07-01', FALSE, TRUE, 'Error en SPI | INFOCENT | Fabrica'),
('789253', -1, 'Hendira Alvis', 'Periodo 01', '2026-07-01', FALSE, TRUE, 'Error en SPI | FARMATODO - VENEZUELA | Fabrica'),
('798118', -1, 'Hendira Alvis', 'Periodo 01', '2026-07-01', FALSE, TRUE, 'Error en SPI | INFOCENT | Fabrica'),
('794135', -1, 'Hendira Alvis', 'Periodo 01', '2026-07-01', FALSE, TRUE, 'Error en SPI | AGROPA, C.A. | Fabrica'),
('792603', 1, 'Hendira Alvis', 'Periodo 01', '2026-07-01', FALSE, TRUE, 'Error en SPI | INFOCENT | Fabrica'),
('798287', 2, 'Hendira Alvis', 'Periodo 01', '2026-07-01', FALSE, TRUE, 'Estándar SPI | CLINICA CALICANTO, CA. | Fabrica'),
('798093', 3, 'Hendira Alvis', 'Periodo 01', '2026-07-01', FALSE, TRUE, 'Error en SPI | LABORATORIO COFASA, S.A. | Fabrica'),
('792764', 4, 'Hendira Alvis', 'Periodo 01', '2026-07-01', FALSE, TRUE, 'Error en SPI | CENTRAL EL PALMAR, S.A. | Fabrica'),
('796471', 5, 'Hendira Alvis', 'Periodo 01', '2026-07-01', FALSE, TRUE, 'Error en SPI | INFOCENT | Fabrica');
