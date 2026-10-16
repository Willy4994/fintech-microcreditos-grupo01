-- =====================================================
-- CRÉDITO VECINO, S. A.
-- Proyecto Final - Análisis de Sistemas II
-- Migración 001: Esquema inicial
-- =====================================================

BEGIN;

-- 1. Registro de cargas canónicas
CREATE TABLE IF NOT EXISTS cargas_canonicas (
    id_carga BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_archivo VARCHAR(255) NOT NULL,
    sha256_esperado CHAR(64) NOT NULL,
    sha256_calculado CHAR(64) NOT NULL,
    verificado BOOLEAN NOT NULL,
    fecha_carga TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bitácora de eventos originales
CREATE TABLE IF NOT EXISTS eventos_canonicos (
    seq INTEGER PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL
        CHECK (tipo IN ('CLIENTE', 'DESEMBOLSO', 'PAGO')),
    datos JSONB NOT NULL,
    id_carga BIGINT NOT NULL
        REFERENCES cargas_canonicas(id_carga)
);

-- 3. Catálogo de asesores
CREATE TABLE IF NOT EXISTS asesores (
    id_asesor VARCHAR(20) PRIMARY KEY,
    nombre_completo VARCHAR(200) NOT NULL
);

-- 4. Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente VARCHAR(20) PRIMARY KEY,
    nombre_completo VARCHAR(200) NOT NULL,
    dpi VARCHAR(30) NOT NULL UNIQUE,
    telefono VARCHAR(30),
    municipio VARCHAR(100),
    fecha_alta DATE NOT NULL
);

-- 5. Políticas de mora versionadas
CREATE TABLE IF NOT EXISTS politicas_mora (
    id_politica VARCHAR(30) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(30) NOT NULL
        CHECK (tipo IN ('plana', 'escalonada')),
    vigencia_desde DATE,
    vigencia_hasta DATE,
    configuracion JSONB NOT NULL
);

-- 6. Créditos
CREATE TABLE IF NOT EXISTS creditos (
    id_credito VARCHAR(30) PRIMARY KEY,
    id_cliente VARCHAR(20) NOT NULL
        REFERENCES clientes(id_cliente),
    id_asesor VARCHAR(20) NOT NULL
        REFERENCES asesores(id_asesor),
    id_politica VARCHAR(30) NOT NULL
        REFERENCES politicas_mora(id_politica),
    fecha_desembolso DATE NOT NULL,
    capital_centavos BIGINT NOT NULL
        CHECK (capital_centavos > 0),
    plazo_meses INTEGER NOT NULL
        CHECK (plazo_meses > 0),
    tna_bps INTEGER NOT NULL
        CHECK (tna_bps >= 0),
    reestructurado BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7. Pagos únicos
CREATE TABLE IF NOT EXISTS pagos (
    id_pago BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clave_idempotencia VARCHAR(100) NOT NULL UNIQUE,
    id_credito VARCHAR(30) NOT NULL
        REFERENCES creditos(id_credito),
    fecha DATE NOT NULL,
    monto_centavos BIGINT NOT NULL
        CHECK (monto_centavos > 0),
    canal VARCHAR(50) NOT NULL,
    seq_evento INTEGER NOT NULL UNIQUE
        REFERENCES eventos_canonicos(seq)
);

-- 8. Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_eventos_tipo
    ON eventos_canonicos(tipo);

CREATE INDEX IF NOT EXISTS idx_creditos_cliente
    ON creditos(id_cliente);

CREATE INDEX IF NOT EXISTS idx_creditos_asesor
    ON creditos(id_asesor);

CREATE INDEX IF NOT EXISTS idx_pagos_credito
    ON pagos(id_credito);

COMMIT;