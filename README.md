# Sistema de Gestión de Microcrédito — Crédito Vecino

Proyecto de Arquitectura y Diseño de Componentes para el curso Análisis de Sistemas II. Modela el núcleo de dominio de una institución guatemalteca de microfinanzas que otorga créditos entre Q1,000.00 y Q25,000.00, con plazos de 3 a 24 meses.

Repositorio: [fintech-microcreditos-grupo01](https://github.com/Willy4994/fintech-microcreditos-grupo01)

## Alcance del Proyecto 1

Esta fase contiene:

- Modelo de dominio y diagramas UML editables.
- Arquitectura hexagonal como monolito modular.
- Vistas 4+1 y diagramas C4 niveles 1, 2 y 3.
- Diseño mediante SOLID, GRASP y patrones de diseño.
- Núcleo financiero ejecutable en TypeScript estricto.
- Contrato OpenAPI y esquemas Zod.
- Decisiones de arquitectura ADR.
- Pruebas unitarias de los casos financieros obligatorios.

No incluye servidor HTTP, base de datos, interfaz gráfica, autenticación, RAG, chat ni servidor MCP. Esos componentes aparecen en la arquitectura solamente como extensiones futuras.

## Reglas implementadas

- Dinero inmutable almacenado como centavos enteros y asociado a una moneda.
- Tasas y cálculos intermedios mediante `decimal.js`.
- Redondeo a dos decimales, medio hacia arriba, en cada cuota.
- Amortización francesa con ajuste exacto de la última cuota.
- Interés moratorio calculado exclusivamente sobre capital en mora.
- Clasificación derivada de mora: Mora 1, Mora 2, Mora 3 y Vencido.
- Prelación de pagos: gastos, interés moratorio, interés corriente y capital.
- Idempotencia en el procesamiento de pagos.
- Cartera en riesgo, reestructurados y exclusión de incobrables.
- Ciclo de vida reversible mediante State e historial auditable.

## Requisitos

- Node.js 20 LTS o superior.
- npm.

## Instalación

```bash
git clone https://github.com/Willy4994/fintech-microcreditos-grupo01.git
cd fintech-microcreditos-grupo01
npm install
```

## Ejecución y verificación

Ejecutar todas las pruebas una vez:

```bash
npm test
```

Ejecutar las pruebas en modo observación:

```bash
npm run test:watch
```

Comprobar el tipado estricto sin generar archivos:

```bash
npx tsc --noEmit
```

El proyecto no requiere una base de datos ni un servidor para ejecutar sus pruebas.

## Casos de referencia verificados

- Plan de Q10,000.00, TNA de 36% y 12 cuotas, reproducido fila por fila.
- Última cuota ajustada a Q1,004.63.
- Amortización total exacta de Q10,000.00 y saldo final Q0.00.
- Interés moratorio de Q7.26 sobre Q725.76 durante 15 días, con TNA moratoria de 24% y base Actual/360.
- Cartera en riesgo de 7.00%.
- Cartera en riesgo de 6.06% después de declarar incobrable C-005.
- Regularización reversible de Mora 2 a Mora 1 y posteriormente a Vigente.
- Rechazo de pagos en estados que no los permiten.

## Estructura

```text
src/
├── contratos/                    Esquemas Zod y derivación JSON Schema
└── dominio/
    ├── originacion/              Cliente, solicitud, crédito y State
    ├── calculo-financiero/       Amortización, tasas y mora
    ├── cartera-cobros/           Pagos, movimientos y prelación
    ├── cierres/                  Cartera y cálculo de riesgo
    └── shared/                   Dinero, excepciones y puertos comunes
tests/                            Pruebas unitarias del núcleo
docs/
├── adr/                          Decisiones de arquitectura
├── api/                          Contrato OpenAPI
├── arquitectura/                Atributos, decisión y vistas 4+1
├── diagramas/                    UML, C4 y trazabilidad
└── diseno/                       Módulos, patrones, SOLID y GRASP
```

## Decisiones técnicas principales

- TypeScript con `strict: true` y sin `any` en el dominio.
- Arquitectura hexagonal y monolito modular.
- `Dinero` conserva importes como `number` entero en centavos; no usa punto flotante para cálculos monetarios.
- `Decimal` se utiliza para tasas, porcentajes y operaciones financieras intermedias.
- Strategy para amortización, State para el crédito y Chain of Responsibility para la prelación de pagos.

## Documentación

- [Decisión arquitectónica](docs/arquitectura/decision-arquitectonica.md)
- [Atributos de calidad](docs/arquitectura/atributos-calidad.md)
- [Matriz de trazabilidad](docs/diagramas/trazabilidad.md)
- [Patrones de diseño](docs/diseno/patrones.md)
- [Contrato OpenAPI](docs/api/openapi.yaml)
- [ADR-001: arquitectura hexagonal](docs/adr/ADR-001-arquitectura-hexagonal.md)
- [ADR-002: dinero y amortización](docs/adr/ADR-002-dinero-y-amortizacion.md)

## Uso de inteligencia artificial

Se utilizaron herramientas de inteligencia artificial, principalmente ChatGPT, y Codex como apoyo durante el desarrollo del proyecto para analizar los requisitos proporcionados, resolver dudas técnicas, identificar posibles errores de compilación, apoyar en la elaboración y revisión de pruebas, verificar la coherencia entre el diseño, el código y la documentación, y asistir en la redacción técnica. Las decisiones de diseño, implementación y documentación fueron revisadas y comprendidas por cada uno de nosotros que conformamos el equipo.
