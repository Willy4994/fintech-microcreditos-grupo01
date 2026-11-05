# Resultado de validación del backend

Revisión local: 3 de noviembre de 2026 (America/Guatemala).

| Comprobación | Resultado observado |
|---|---|
| `npm test` (incluye compilación) | 35 archivos y 156 pruebas aprobados |
| `npm run check` | Sin errores TypeScript |
| `git diff --check` | Sin errores de espacios |
| `npm run evals:live`, evaluación versión 2 | 10 casos aprobados con Ollama y PostgreSQL locales; incluye G-6-30 en la misma sesión |
| SDK MCP por stdio | Descubrimiento real y rechazo de fecha inválida aprobados |
| PostgreSQL embebido + pgvector | Migraciones, carga repetida, propuestas, decisiones, rechazos, originación, cierre e ingesta aprobados |
| HTTP local, `/api/health` | 200 |
| HTTP local, simulación Q10,000 / 36 % / 12 meses | 200; 12 cuotas; última 100463 centavos; saldo cero |
| HTTP local, chat sin configuración humana | 503 `CONFIGURACION_HUMANA`; no se invocó el modelo |

La suite histórica no se modificó para ocultar regresiones. Los tests nuevos de SQL usan
PGlite y vectores deterministas; los evals de asistente usan un modelo controlado.
La prueba MCP por stdio ejecuta el SDK y proceso reales, pero la prueba de protocolo
no consulta una base externa.

PostgreSQL local y Ollama ya se están utilizando. La ingesta real de `bge-m3` cargó
siete documentos y trece fragmentos de 1024 dimensiones. Los resultados del modelo real
se guardan en `resultados/evals-modelo.json`; la evaluación versión 2 comprueba períodos,
parámetros, datos contra consulta directa y presentación monetaria determinista, además
de citas de la política correcta y el seguimiento de 7 a 30 días.

Pendiente: revisión semántica de cada afirmación del RAG, concurrencia de múltiples
conexiones PostgreSQL, comparación con oráculos privados del docente, frontend y video.

El README y la guía interna de entregables describen el alcance y los pendientes.

## Correcciones verificadas con el modelo real

- G-2 presenta quetzales: desembolsos Q41,000.00, sin etiquetarlos como centavos.
- G-3 consulta exclusivamente el 31/10/2026, no el mes completo.
- G-5 muestra capital pendiente y pagado por separado, y la base Actual/360 del núcleo.
- G-6-30 conserva la sesión de G-6 y cambia únicamente la ventana de vencimientos.
- G-7 usa el corte 24/01/2027. G-8 cita un fragmento recuperado de POL-2024-01.
- OP-7 rechaza la nota sin invocar herramientas de datos de clientes.

Estos resultados corresponden a la base local durante el ensayo, antes de registrar
las operaciones nuevas del guion. No son oráculos independientes del docente.

## Regresión RAG por vigencia — 4 de noviembre de 2026

Una paráfrasis de G-8 seleccionó incorrectamente POL-2026-10 para agosto, aunque la
consulta anterior del guion había pasado. Ahora se preserva la pregunta original y se
filtran las políticas por sus vigencias de PostgreSQL, no por su similitud vectorial.
Las pruebas SQL fuerzan deliberadamente un vector que favorece otra política y verifican
que se excluya. Se rechazan respuestas que mencionan otra versión de mora.

La pregunta exacta del fallo fue repetida con Ollama y PostgreSQL: respondió política
plana, 24 % nominal anual, Actual/360, con citas POL-2024-01:1 y POL-2024-01:2.
Evidencia: `resultados/evals-regresion-rag.json`. El guion completo añade este caso como
G-8-regresion. No se ha repetido toda la suite de evals reales tras este ajuste; sí se
repitieron la suite automatizada y la pregunta exacta con el modelo real.
