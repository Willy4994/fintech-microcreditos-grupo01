-- =====================================================
-- CREDITO VECINO, S. A.
-- Proyecto Final - Analisis de Sistemas II
-- Migracion 003: Solicitudes de aprobacion MCP
-- =====================================================

BEGIN;

-- Solicitudes de aprobacion humana
CREATE TABLE IF NOT EXISTS solicitudes_aprobacion_mcp (
    id UUID PRIMARY KEY,

    operacion VARCHAR(100) NOT NULL,

    parametros JSONB NOT NULL,

    motivo TEXT NOT NULL,

    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',

    fecha_solicitud TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    fecha_decision TIMESTAMPTZ,

    autorizado_por VARCHAR(150),

    observacion TEXT,

    CONSTRAINT chk_estado_aprobacion
        CHECK (
            estado IN (
                'PENDIENTE',
                'APROBADA',
                'RECHAZADA'
            )
        ),

    CONSTRAINT chk_operacion_no_vacia
        CHECK (LENGTH(TRIM(operacion)) > 0),

    CONSTRAINT chk_motivo_no_vacio
        CHECK (LENGTH(TRIM(motivo)) > 0),

    CONSTRAINT chk_decision_aprobacion
        CHECK (
            (
                estado = 'PENDIENTE'
                AND fecha_decision IS NULL
                AND autorizado_por IS NULL
            )
            OR
            (
                estado IN ('APROBADA', 'RECHAZADA')
                AND fecha_decision IS NOT NULL
                AND autorizado_por IS NOT NULL
            )
        )
);

-- Historial de decisiones
CREATE TABLE IF NOT EXISTS auditoria_aprobaciones_mcp (
    id_auditoria BIGINT GENERATED ALWAYS AS IDENTITY
        PRIMARY KEY,

    id_solicitud UUID NOT NULL
        REFERENCES solicitudes_aprobacion_mcp(id),

    accion VARCHAR(30) NOT NULL,

    responsable VARCHAR(150) NOT NULL,

    observacion TEXT,

    fecha_evento TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_accion_auditoria
        CHECK (
            accion IN (
                'APROBADA',
                'RECHAZADA'
            )
        )
);

-- Indices para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_aprobaciones_estado
    ON solicitudes_aprobacion_mcp(estado);

CREATE INDEX IF NOT EXISTS idx_aprobaciones_fecha
    ON solicitudes_aprobacion_mcp(fecha_solicitud);

CREATE INDEX IF NOT EXISTS idx_auditoria_solicitud
    ON auditoria_aprobaciones_mcp(id_solicitud);

COMMIT;