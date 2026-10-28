-- =====================================================
-- CRÉDITO VECINO, S. A.
-- Proyecto Final - Análisis de Sistemas II
-- Migración 002: Configuración financiera
-- =====================================================

BEGIN;

CREATE TABLE IF NOT EXISTS configuracion_financiera (
    id_configuracion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    version VARCHAR(20) NOT NULL UNIQUE,

    moneda CHAR(3) NOT NULL,

    base_conteo VARCHAR(30) NOT NULL,

    parametros JSONB NOT NULL,

    fecha_registro TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);

COMMIT;