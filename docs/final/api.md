# Contrato HTTP del backend final

Base local: `http://127.0.0.1:3000`. JSON. Dinero: centavos enteros, GTQ.
Fechas: `YYYY-MM-DD` reales. Operaciones humanas: `Authorization: Bearer <HUMAN_API_TOKEN>`.

## Simulación y originación

`POST /api/simulaciones` recibe:

```json
{"capital_centavos":1000000,"plazo_meses":12,"tna_bps":3600,"fecha":"2026-10-31"}
```

Responde las cuotas del motor financiero. Cuotas 1–11: 100462 centavos; última: 100463;
saldo final cero. No escribe datos.

`POST /api/originaciones` requiere token humano y recibe:

```json
{
  "cliente": {
    "id_cliente":"CL-9001",
    "nombre_completo":"Gerencia Demostración Gálvez",
    "dpi":"DPI-FICT-009001",
    "municipio":"Guatemala"
  },
  "id_credito":"CV-2026-9001",
  "id_asesor":"AS-01",
  "fecha":"2026-10-31",
  "capital_centavos":1000000,
  "plazo_meses":12,
  "tna_bps":3600
}
```

Devuelve 201 con crédito, estado y plan. Alta y desembolso son atómicos. El asesor debe
existir. Un identificador repetido produce 409; no se sobreescribe el cliente original.
Para este flujo de demostración se registra un cliente nuevo; no hay bandeja intermedia
de evaluación ni endpoint para desembolsar a un cliente existente.

## Pago y aprobación humana

1. Consultar `GET /api/creditos/CV-2026-0043?fecha=2026-10-31`.
2. Seleccionar la primera cuota exigible no pagada. El monto se obtiene del campo
   `total_exigible_centavos`; no se escribe una cifra de ejemplo como monto real.
3. `POST /api/pagos/propuestas` con:

```json
{
  "id_credito":"CV-2026-0043",
  "cuota":1,
  "fecha":"2026-10-31",
  "monto_centavos":56187,
  "clave_idempotencia":"demo-op1-2026-10-31"
}
```

El importe anterior ilustra el formato y debe sustituirse por la respuesta vigente del
núcleo. Devuelve 202, identificador de aprobación, parámetros y desglose; no aplica dinero.
Una clave previamente aplicada devuelve `YA_REGISTRADO` si coincide el pago; si cambian
crédito, fecha o importe, devuelve `CONFLICTO_IDEMPOTENCIA`.

4. Una persona revisa el desglose. `POST /api/aprobaciones/<id>/decision` con token:

```json
{"aprobar":true,"actor":"gerencia"}
```

Rechazar utiliza `aprobar:false`. La aprobación vence a los 15 minutos. Al confirmar se
valida otra vez la deuda exacta. Si cambió, se exige una propuesta nueva. Repetir una decisión
resuelta devuelve su resultado previo sin volver a registrar dinero. El modelo no puede
llamar este endpoint mediante MCP.

Errores de negocio: `CUOTA_PAGADA`, `CUOTA_NO_EXIGIBLE`, `ORDEN_CUOTAS`,
`CREDITO_INCOBRABLE`, `MONTO_NO_EXACTO` (incluye `monto_correcto_centavos`),
`APROBACION_EXPIRADA`, `CONFLICTO_IDEMPOTENCIA`, `PAGO_RETROACTIVO`, `PERIODO_CERRADO`.

## Cierres

`GET /api/cierres?desde=2026-10-01&hasta=2026-10-31` consulta sin escribir. Si existe un
cierre persistido devuelve sus cifras congeladas. `POST /api/cierres` con token:

```json
{"desde":"2026-10-01","hasta":"2026-10-31","actor":"gerencia"}
```

Congela resultado y audita. Reejecutar no duplica. No generar cierres antes de las operaciones
OP-1/OP-2/OP-3 del ensayo: un período cerrado rechaza escrituras retroactivas.

## Chat

`POST /api/chat` con token:

```json
{"pregunta":"¿Cómo está la cartera al 31 de octubre de 2026?","fecha":"2026-10-31"}
```

Para encadenar preguntas, conservar el `sesion` devuelto:

```json
{"pregunta":"¿Y los vencimientos de los próximos 30 días?","fecha":"2026-10-31","sesion":"UUID-devuelto"}
```

La fecha general de la sesión es inmutable. G-7 puede pedir un corte distinto dentro de su
pregunta; se pasa explícitamente a la herramienta correspondiente. El servidor no adivina
fechas omitidas por el modelo: las herramientas rechazan parámetros incompletos.

Respuesta: `sesion`, `fecha_corte`, `respuesta`, `evidencias` y `fuentes`. Los reportes financieros
se presentan desde los resultados MCP de forma determinista en quetzales. La explicación
de políticas usa el modelo y sus fuentes; se requiere revisar su fidelidad semántica.
