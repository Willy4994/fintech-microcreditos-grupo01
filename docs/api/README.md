# Contrato de API

El contrato se encuentra en `openapi.yaml`. Esta entrega define únicamente el contrato; no implementa servidor HTTP.

La fuente de validación está en `src/contratos/schemas.ts`. `src/contratos/esquemas-openapi.ts` deriva JSON Schema directamente de esos esquemas mediante `z.toJSONSchema`; en fases posteriores, la generación completa del documento sustituirá el archivo YAML mantenido durante este entregable de diseño. Los mismos esquemas podrán reutilizarse en la API y las herramientas MCP. Los importes viajan como centavos enteros y moneda, nunca como números decimales de punto flotante.

El registro de pagos exige el encabezado `Idempotency-Key`. Repetir una solicitud con la misma clave y el mismo contenido devuelve el resultado previamente registrado sin aplicar un segundo cobro.

Todos los errores siguen la forma `ErrorApi`: código estable, mensaje legible, detalles y un identificador de correlación.
