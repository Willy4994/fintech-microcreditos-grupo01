BEGIN;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS rag_fragmentos (
  id TEXT PRIMARY KEY, documento TEXT NOT NULL, titulo TEXT NOT NULL,
  contenido TEXT NOT NULL, hash TEXT NOT NULL, modelo TEXT NOT NULL,
  embedding vector NOT NULL
);
CREATE INDEX IF NOT EXISTS rag_documento ON rag_fragmentos(documento);
COMMIT;
