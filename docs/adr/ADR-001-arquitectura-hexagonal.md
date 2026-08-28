# ADR-001: Arquitectura hexagonal como monolito modular

## Estado

Aceptada.

## Fecha

27/08/2026.

## Contexto

El sistema calcula importes financieros que deben ser exactos, reproducibles y auditables. En fases posteriores incorporará API REST, interfaz, chat y servidor MCP, pero el Proyecto 1 solo permite un núcleo TypeScript sin infraestructura. También se necesita evitar que una operación financiera local se convierta prematuramente en un problema de consistencia distribuida.

## Decisión

Se adopta arquitectura hexagonal implementada como monolito modular. El dominio se divide en Originación, Cálculo financiero, Cartera y cobros y Cierres. Los casos de uso constituyen puertos primarios; `Reloj`, `GeneradorIds` y los repositorios son puertos secundarios. API, UI, MCP, PostgreSQL y otros adaptadores se incorporarán únicamente en las fases que los permitan.

Se descartó una arquitectura tradicional por capas porque facilita que las reglas financieras terminen en controladores o persistencia. Se descartaron microservicios porque no existe una necesidad de escalamiento independiente que justifique consistencia distribuida, despliegues múltiples y observabilidad adicional.

## Consecuencias

Positivas:

- El núcleo puede compilarse y probarse sin red ni base de datos.
- API, chat y MCP reutilizarán los mismos casos de uso.
- Las fronteras modulares facilitan reemplazar políticas y adaptadores.
- Los movimientos financieros pueden mantenerse consistentes dentro de una transacción local.

Negativas:

- Deben mantenerse disciplinadamente las fronteras entre módulos.
- Los adaptadores requieren traducción explícita hacia los tipos del dominio.
- El monolito completo se despliega como una unidad mientras no se justifique separar módulos.
