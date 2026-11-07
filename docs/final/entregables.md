# Estado de los entregables del Final

> Guía interna del equipo. Al finalizar todo el proyecto, eliminar este archivo y su
> enlace en el README antes de preparar la entrega. El informe final lo elaborará
> Willi en Word y lo convertirá a PDF cuando el sistema esté terminado.

## E1 — Interfaz

Pendiente por solicitud expresa del equipo. Los siete casos de pantalla están mapeados en
README. La aplicación React debe conservar el diseño P2, corregir navegación/accesibilidad,
mostrar cifras de API y permitir aprobación explícita. No hay frontend implementado.

## E2 — Persistencia y carga

Migraciones reales, pgvector, cargador por comando, ruta `CV_DATA_DIR`, huella previa,
transacción, idempotencia y conservación del paquete. Pruebas SQL con 60 clientes,
75 créditos, 228 eventos de pago y 226 pagos únicos más 2 duplicados ignorados.
El paquete del curso se obtiene por separado porque `datos/` ya estaba ignorado en Git.

## E3 — MCP

Ocho herramientas Zod sobre los casos de uso. Lectura por defecto, propuesta sensible sin
capacidad de autoaprobación. API humana con token, expiración, revalidación y auditoría.
SDK real por stdio probado. Los evals reales se guardan en `resultados/evals-modelo.json`.
Falta mostrar confirmación en una interfaz y ensayar las acciones sensibles desde ella.

## E4 — RAG

Ingesta de siete documentos, LangChain, Ollama embeddings, almacenamiento pgvector,
recuperación semántica y validación de identificadores de cita. Ingesta real con `bge-m3`
completada: siete documentos, trece fragmentos y vectores de 1024 dimensiones. Además
de los evals, se mantiene la revisión humana de afirmaciones y citas de políticas.

## E5 — Asistente

Backend conversacional conectado a cliente MCP real; memoria de sesión, límites y fuentes.
La propuesta de pago se detiene ante confirmación humana. Los informes financieros se
presentan de forma determinista desde MCP, sin usar la redacción financiera del LLM.
La validación real revisa parámetros, cifras y seguimiento G-6 a 30 días. Falta integración
visual. La barrera OP-7 tiene prueba automatizada; no demuestra
resistencia universal a otras inyecciones.

## E6 — Pruebas

Suite heredada conservada y ampliada. Carga, huella alterada, idempotencia, SQL/pgvector,
operaciones OP, políticas, redondeo, suspenso, contratos MCP y protocolo stdio. Los evals de
asistente en `npm test` usan modelo controlado. `evals:live` permite guardar evidencia real,
con revisión humana posterior de cifras y afirmaciones.

## E7 — Documentación y video

README actualizado, variables, comandos y contrato HTTP. El informe final está pendiente:
Willi lo elaborará en Word y lo convertirá a PDF cuando el sistema esté terminado.
El video se graba cuando exista la interfaz: no se sustituye por consola ni por este documento.

## Ensayo antes del video

1. Preparar una base nueva aislada. Ejecutar `npm test` y comprobar compilación.
2. Migrar, cargar una vez y mostrar SHA verde y conteos, explicando los dos duplicados.
3. Ejecutar OP-1 y OP-2 desde la futura interfaz: mostrar deuda, propuesta, confirmación y
   estado posterior. Registrar ambas el 31/10/2026.
4. Ejecutar OP-3: alta CL-9001 y simulación de CV-2026-9001 antes del desembolso.
5. OP-4 reutiliza la clave de OP-1; no debe haber nuevo movimiento.
6. OP-5 rechaza Q500 sobre CV-2026-0061 e informa importe correcto. OP-6 rechaza
   CV-2026-0015 por incobrable.
7. G-1 a G-5 se muestran en pantalla y chat con las mismas cifras tras las operaciones.
8. G-6: 7 días y seguimiento a 30 días en la misma sesión. G-7: cuota 2 de CV-2026-0410,
   corte 24/01/2027. G-8: crédito de agosto, fuente POL-2024-01.
9. OP-7: nota no confiable; no obedecer órdenes ni revelar datos personales.
10. Grabar 15–20 minutos, tomas continuas por bloque, cuatro voces, nombres y grupo,
    decisión de diseño y limitación real. Enlazar video en README y entregar en Canvas.

## Límites de la verificación actual

No se han comparado los resultados de la cartera real con los oráculos privados del docente.
Las pruebas de integración usan PostgreSQL embebido; no certifican concurrencia de múltiples
conexiones externas. PostgreSQL local y Ollama ya están instalados y se utilizan en los evals
reales. No se ha construido frontend, grabado video ni realizado entregas externas.
