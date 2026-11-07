# Crédito Vecino — Sistema de microcrédito y asistente gerencial

Sistema de microcréditos desarrollado por el grupo 01 para Análisis de Sistemas II (037),
construido de forma incremental durante las fases de arquitectura, diseño e implementación.

La aplicación permite registrar clientes, simular y desembolsar créditos, consultar cuotas
y mora, registrar pagos con confirmación humana y consultar indicadores y cierres. Incluye
un asistente gerencial para consultar información financiera y políticas institucionales.

La interfaz está desarrollada con React y Vite y se conecta a una API financiera con
PostgreSQL, un servidor MCP y un servicio RAG con pgvector y modelos locales de Ollama.
El diseño conserva la identidad azul y celeste y los recorridos del prototipo de la segunda fase.

## Requisitos

- Node.js 22 LTS o superior y npm.
- PostgreSQL instalado y en ejecución, con la extensión pgvector disponible.
- pgAdmin para administrar el servidor y revisar la base de datos.
- Ollama para ejecutar embeddings y el modelo conversacional.
- Paquete canónico original en `datos/datos-proyecto-final`, o ruta mediante `CV_DATA_DIR`.
  Debe contener `eventos.jsonl`, `eventos.sha256`, CSV, `politicas.json` y los siete documentos
  `corpus/*.md`. La carpeta `datos/` está ignorada por Git: un clon nuevo debe obtener el
  paquete original del curso, extraerlo sin modificaciones y configurar su ruta.

## Instalación y arranque

```bash
npm ci
npm --prefix frontend ci
openssl rand -hex 32
```

Si todavía no existe `.env`, crearlo con `cp .env.example .env`. Si ya existe, conservarlo.
Pegar el token generado en `HUMAN_API_TOKEN` dentro de `.env`. No publicar ese archivo.

### Conectar con PostgreSQL desde pgAdmin

pgAdmin administra el servidor PostgreSQL; el sistema se conecta directamente a ese
servidor mediante las credenciales de `.env`.

1. En pgAdmin, conectar con el servidor PostgreSQL de la instalación.
2. Revisar **Properties → Connection** del servidor para consultar host, puerto y usuario.
3. Comprobar que exista la base `credito_vecino`. Si ya existe, conservarla. Si no existe,
   crearla desde **Databases → Create → Database** y elegir el propietario correspondiente.
4. Ajustar `.env` con los datos de conexión de la instalación:

```dotenv
PGHOST=localhost
PGPORT=5432
PGDATABASE=credito_vecino
PGUSER=usuario_postgresql
PGPASSWORD=contraseña_postgresql
```

La contraseña es la del usuario de PostgreSQL, que puede ser distinta de la contraseña
maestra de pgAdmin. El usuario debe tener permisos para crear tablas en esa base.

5. Abrir **Query Tool** sobre `credito_vecino` y comprobar si pgvector está disponible:

```sql
SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name = 'vector';
```

Si aparece una fila, la extensión está disponible. Las migraciones intentan activarla
con `CREATE EXTENSION IF NOT EXISTS vector`; si el usuario configurado no tiene permiso, un
administrador debe ejecutar esa sentencia en la misma base desde Query Tool.
Si no aparece ninguna fila, primero hay que instalar pgvector para la versión de
PostgreSQL que utiliza ese servidor. Las migraciones no instalan extensiones en el sistema.

### Preparar la base e iniciar la aplicación

Con el servidor PostgreSQL iniciado y `.env` configurado:

```bash
npm run build:all
npm run db:migrate
npm run data:load
```

La carga verifica SHA-256 antes de escribir y muestra la verificación en verde. Conserva
363 eventos: 60 clientes, 75 desembolsos y 228 eventos de pago. Se aplican **226 pagos
únicos y se ignoran 2 duplicados**. Volver a ejecutarla no duplica la cartera.

Con Ollama instalado y su servicio iniciado:

```bash
ollama pull bge-m3
ollama pull qwen3:8b
npm run rag:ingest
npm start
```

La aplicación completa y la API están disponibles en **http://127.0.0.1:3000**.
Después de compilar, Express sirve `frontend/dist` desde el mismo origen.

En la pantalla de acceso se introduce el nombre, el perfil Asesor o Gerencia y la clave
configurada en `HUMAN_API_TOKEN`. La clave se usa para abrir una sesión y no se guarda
en localStorage ni se incluye en el bundle. La sesión usa una cookie HttpOnly y dura
ocho horas. Gerencia dispone de tablero, cierres y asistente; el asesor accede a
originación y cobro. El acceso está diseñado para ejecución local con una clave compartida y selección de perfil;
no incluye administración individual de cuentas.

Para desarrollar con recarga automática, mantener `npm start` en una terminal y ejecutar
`npm run frontend:dev` en otra. La interfaz de desarrollo se abre en la URL de Vite
(normalmente http://localhost:5173).
El proxy conserva el origen y envía las peticiones a la API local.

La API escucha en `http://127.0.0.1:3000`. El asistente inicia su servidor MCP por stdio
cuando lo necesita. Para usar MCP desde otro cliente, ejecutar `npm run mcp`; no se escribe
texto de diagnóstico en stdout del protocolo.

Los comandos `start`, `mcp`, `db:migrate`, `data:load`, `rag:ingest` y `evals:live` leen `.env`.
Recompilar después de modificar TypeScript. `npm test` compila automáticamente.

## Variables

| Variable | Uso / valor de ejemplo |
|---|---|
| `HOST`, `PORT` | API local; `127.0.0.1`, `3000` |
| `PGHOST`, `PGPORT` | PostgreSQL; `127.0.0.1`, `5432` |
| `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Base y credenciales; ver `.env.example` |
| `CV_DATA_DIR` | Ruta del paquete; por defecto `datos/datos-proyecto-final` |
| `OLLAMA_URL` | Servicio de modelos; `http://localhost:11434` |
| `LLM_MODEL` | Modelo con soporte de herramientas; `qwen3:8b` |
| `EMBEDDING_MODEL` | Embeddings multilingües; `bge-m3` |
| `HUMAN_API_TOKEN` | Token privado de al menos 24 caracteres para operaciones humanas y chat |

## API de la interfaz

Todas las fechas de negocio son explícitas. Los escenarios de validación utilizan
`2026-10-31`, excepto G-7 (`2027-01-24`). Los cálculos utilizan la fecha de corte
indicada en la consulta, sin sustituirla por la fecha del sistema operativo.

| Método y ruta | Función |
|---|---|
| `GET /api/health` | Disponibilidad de la API |
| `GET /api/creditos` | Catálogo de créditos |
| `GET /api/creditos/:id?fecha=...` | Estado completo, cuotas y próxima cuota |
| `GET /api/creditos/:id/estado-cuenta?fecha=...` | Alias del estado completo |
| `GET /api/creditos/:id/amortizacion?fecha=...` | Cuotas con obligaciones a la fecha |
| `GET /api/creditos/:id/mora/:cuota?fecha=...` | Desglose de una cuota y mora por tramo |
| `GET /api/cartera?fecha=...` | Activa, mora, riesgo por tramo e incobrables del mes |
| `GET /api/morosos?fecha=...&tramo=MORA_3` | Morosos por tramo |
| `GET /api/vencimientos?fecha=...&dias=7` | Ventana de próximos vencimientos |
| `GET /api/cierres?desde=...&hasta=...` | Cierre persistido o consulta calculada del período |
| `POST /api/simulaciones` | Plan financiero antes de confirmar |
| `POST /api/originaciones` | Alta de cliente y desembolso atómicos; requiere token humano |
| `POST /api/pagos/propuestas` | Solicita confirmación, sin aplicar dinero |
| `GET /api/aprobaciones` | Solicitudes para revisión; requiere token humano |
| `POST /api/aprobaciones/:id/decision` | Aprobar o rechazar; requiere token humano |
| `POST /api/cierres` | Congela un período idempotentemente; requiere token humano |
| `POST /api/chat` | Asistente con memoria, MCP y fuentes; requiere token humano |

Peticiones de ejemplo y condiciones de error: [contrato del backend](docs/final/api.md).
Los errores incluyen `codigo`, `mensaje`, `detalles` cuando aplica y `correlacionId`.
Contrato generado: [OpenAPI Final](docs/api/openapi-final.json), y
[esquemas MCP](docs/api/herramientas-mcp.json). Regenerar con `npm run contracts`.
El OpenAPI histórico de `docs/api/openapi.yaml` describe P1; el contrato del backend final
está documentado por separado y sus esquemas de herramientas se generan desde Zod.

## MCP, RAG y aprobación

MCP ofrece consultas de crédito, deuda de cuota, mora, morosos, vencimientos, cartera,
cierres y búsqueda de políticas. `proponer_pago` solo crea una solicitud PENDIENTE.
**No existe herramienta MCP para aprobar pagos.** Una persona confirma por la API humana;
se revalida el monto, el estado del crédito, el período y la idempotencia en una transacción.
La interfaz muestra el desglose y un diálogo de confirmación explícita antes de registrar el pago.

RAG usa LangChain.js, fragmentos de 1000 caracteres con solapamiento de 150, embeddings
`bge-m3` mediante Ollama y cinco vecinos por distancia coseno en pgvector. El solapamiento
conserva contexto en políticas cortas y el modelo multilingüe permite trabajar en español.
Se guardan fuente, identificador de fragmento, hash y modelo. Cambiar de modelo requiere
reingesta. Cuando se indica la fecha o el mes de otorgamiento, la recuperación consulta
las vigencias de PostgreSQL, prioriza la política aplicable y excluye otras versiones de
mora. El mes completo debe corresponder a una sola política; si no, se exige fecha exacta.
Las citas del texto deben corresponder a fragmentos recuperados.

El corpus se trata como dato no confiable. Las consultas sobre `NOTA-CAMPO-07` reciben un
rechazo determinista de sus instrucciones incrustadas. No se exponen DPI ni teléfonos en
herramientas del asistente. Esta protección específica no demuestra resistencia universal
a todas las inyecciones posibles.

La respuesta del chat contiene `respuesta`, `sesion`, `evidencias` y `fuentes`. Los reportes
financieros se redactan mediante presentación determinista de los resultados MCP: importes
en quetzales, con dos decimales, sin fórmulas ni conversiones redactadas por el modelo.
El modelo selecciona herramientas y explica políticas con RAG; el texto de políticas aún
requiere revisión semántica. La interfaz muestra las evidencias y las fuentes de cada respuesta.

## Pruebas

```bash
npm test
npm run check
npm run test:integration
npm run test:evals
```

La suite incluye P1/P2, carga con huella, SQL con PGlite y pgvector, pagos con aprobación,
rechazos, idempotencia, originación, cierres, políticas configurables y MCP real por stdio.
No requiere PostgreSQL externo ni Ollama. Los datos originales sí deben estar disponibles.

Para evaluar el modelo real con base cargada e ingesta terminada:

```bash
npm run evals:live
```

Guarda resultados en `docs/final/resultados/evals-modelo.json`. La versión 2 comprueba
herramientas y parámetros esperados, compara los datos con consultas MCP directas, verifica
la presentación financiera, exige citas recuperadas de la política correcta y ejecuta el
seguimiento G-6 de 7 a 30 días en la misma sesión. Muestra `VALIDACIÓN OK` o los fallos
concretos. Esto no sustituye la comparación con los oráculos privados ni la revisión
semántica de cada afirmación del RAG. Los evals de `npm test` usan un modelo controlado.

## Pruebas de interfaz

```bash
npx playwright install chromium
npm run test:ui
```

Los diez escenarios de navegador cubren escritorio y móvil (390 px): acceso, consulta
de mora, monto incorrecto, aprobación de pago, comprobante, reintento, simulación,
confirmación, desembolso, cierre y fuentes del chat con memoria. Usan respuestas API
de prueba para no alterar la cartera real. La suite del backend verifica las operaciones
SQL con PGlite y las cookies y perfiles mediante HTTP local.

La navegación funciona con teclado; los diálogos conservan el foco y se cierran con Escape.
El sistema avisa al perder conexión; no promete registrar pagos sin conexión. La clave del
último pago se conserva en el navegador para reintentar sin duplicar, pero los saldos
y confirmaciones siempre se consultan al servidor.

## Pantallas y funciones

| Pantalla implementada | Caso de uso / backend |
|---|---|
| Inicio de sesión | Acceso con perfil Asesor o Gerencia |
| Búsqueda y listado de créditos | Consultar y filtrar la cartera |
| Solicitud de crédito, alta del cliente incluida | Simular y originar |
| Detalle del crédito | Consultar crédito |
| Registro de pago | Proponer, revisar desglose y decidir |
| Plan de amortización | Simular / consultar cuotas |
| Detalle de la mora | Explicar mora de cuota |
| Tablero gerencial | Cartera y morosos por tramo |
| Cierre diario / mensual | Consultar y generar cierre |
| Asistente gerencial | Consultar información mediante MCP y políticas mediante RAG |

La solicitud se organiza en cinco pasos: alta del cliente, condiciones del crédito,
simulación, confirmación y desembolso confirmado. Las vistas de plan, mora y pago
se abren desde el detalle del crédito.

## Documentación

- [Resultados de validación](docs/final/validacion.md).
- [Contrato HTTP y ejemplos](docs/final/api.md).
- [Decisiones históricas](docs/adr/ADR-001-arquitectura-hexagonal.md).
- [Impacto SOLID de P2](docs/informe-impacto-solid.md).

## Alcance y limitaciones

El sistema está preparado para ejecución local; no se incluye un despliegue en la nube.
La originación integra simulación, revisión y desembolso en una operación atómica.
La bandeja independiente de evaluación de solicitudes del prototipo de la segunda fase
no está implementada.

Las evaluaciones automatizadas verifican los escenarios incluidos en el repositorio.
Sus resultados no equivalen a una validación contra los oráculos privados de evaluación.
Las respuestas del asistente sobre políticas requieren revisión semántica, además de
la comprobación de las fuentes recuperadas.

## Uso de IA

Se utilizaron ChatGPT y Codex como herramientas de apoyo para el análisis de requisitos,
la revisión de arquitectura, la implementación, la documentación y la preparación de pruebas.
