# E2 – Decisión y Justificación de la Arquitectura

## 1. Priorización de atributos de calidad

El Sistema de Gestión de Microcrédito de Crédito Vecino, S. A. maneja operaciones financieras en las que la exactitud, trazabilidad y reproducibilidad de los resultados son fundamentales.

La priorización de atributos de calidad se realiza tomando como referencia ISO/IEC 25010 y considerando las características particulares del dominio de microcréditos.

| Prioridad | Atributo de calidad | Nivel | Justificación |
|---|---|---|---|
| 1 | Adecuación funcional | Crítico | Los cálculos de amortización, intereses, mora, pagos y cartera en riesgo deben producir resultados financieros correctos y reproducibles. |
| 2 | Fiabilidad | Crítico | El sistema debe mantener resultados consistentes ante reintentos, cierres y operaciones financieras. La idempotencia es especialmente importante para evitar pagos o movimientos duplicados. |
| 3 | Mantenibilidad | Alto | Tasas, políticas de crédito, métodos de cálculo y reglas institucionales pueden cambiar. El diseño debe permitir modificar estas políticas sin afectar innecesariamente otros módulos. |
| 4 | Seguridad | Alto | El sistema administra información financiera y operaciones sensibles, por lo que debe proteger la integridad y confidencialidad de los datos. |
| 5 | Compatibilidad / Interoperabilidad | Alto | Los mismos casos de uso deberán ser consumidos posteriormente desde API REST, servidor MCP y Chat sin duplicar la lógica financiera. |
| 6 | Eficiencia de desempeño | Medio | Los cálculos financieros y cierres deben ejecutarse eficientemente, pero nunca sacrificando exactitud, auditabilidad o mantenibilidad. |

---

## 2. Análisis de los atributos priorizados

### 2.1 Adecuación funcional

Este es el atributo de mayor prioridad debido a que el sistema trabaja directamente con dinero.

El sistema debe reproducir correctamente las reglas financieras definidas por la institución, incluyendo:

- generación del plan de amortización;
- cálculo de interés corriente;
- cálculo de interés moratorio exclusivamente sobre capital en mora;
- aplicación de pagos respetando la prelación;
- clasificación de mora;
- cálculo de cartera en riesgo;
- cierres diarios y mensuales.

Los cálculos monetarios utilizarán el objeto de valor `Dinero`, evitando el uso de números de punto flotante para representar importes financieros.

---

### 2.2 Fiabilidad

Una operación financiera no debe producir resultados diferentes cuando se ejecuta nuevamente bajo las mismas condiciones.

El diseño deberá garantizar, entre otros aspectos:

- idempotencia en el registro de pagos;
- idempotencia de cierres;
- saldo final exacto de los planes de amortización;
- imposibilidad de generar saldos negativos;
- consistencia de las transiciones del crédito;
- reconstrucción de saldos mediante movimientos financieros.

El sistema utilizará movimientos en lugar de sobrescribir saldos históricos, permitiendo reconstruir y auditar las cifras posteriormente.

---

### 2.3 Mantenibilidad

Las políticas financieras pueden modificarse por decisiones institucionales o cambios regulatorios.

Por esta razón, elementos como tasas, políticas de amortización y tratamiento de pagos anticipados no deberán estar codificados como constantes rígidas dentro del núcleo.

La arquitectura deberá favorecer:

- alta cohesión;
- bajo acoplamiento;
- separación de responsabilidades;
- sustitución de políticas;
- pruebas unitarias independientes de infraestructura.

Se utilizarán principios SOLID, GRASP y patrones de diseño apropiados para el dominio.

---

### 2.4 Seguridad

El sistema manejará información personal, crediticia y financiera.

Aunque la autenticación y autorización no forman parte del núcleo ejecutable del Proyecto 1, la arquitectura deberá permitir incorporarlas posteriormente sin modificar las reglas financieras del dominio.

La infraestructura futura deberá considerar controles de acceso, validación de entradas, protección de información sensible y trazabilidad de operaciones.

---

### 2.5 Compatibilidad e interoperabilidad

La evolución del proyecto contempla diferentes mecanismos de interacción con el sistema.

Entre ellos:

- API REST;
- interfaz web;
- servidor MCP;
- asistente conversacional.

Todos deberán utilizar los mismos casos de uso del sistema.

La lógica financiera no deberá duplicarse dentro de controladores REST, herramientas MCP o componentes de interfaz.

---

### 2.6 Eficiencia de desempeño

Los cálculos financieros deben poder ejecutarse rápidamente, especialmente durante pruebas y procesos de cierre.

El núcleo financiero se mantendrá independiente de red y base de datos siempre que la operación no requiera persistencia, permitiendo ejecutar cálculos y pruebas unitarias en memoria.

Sin embargo, la optimización de desempeño nunca deberá comprometer la exactitud financiera ni la auditabilidad.

---

## 3. Conclusión

Los atributos de calidad priorizados conducen hacia una arquitectura que permita aislar las reglas financieras de los detalles tecnológicos.

Por esta razón, se seleccionará una arquitectura hexagonal basada en puertos y adaptadores, implementada inicialmente como un monolito modular.

Esta combinación permite mantener una única fuente de verdad para las reglas financieras, facilita las pruebas automatizadas y permite incorporar posteriormente nuevos mecanismos de entrada, como API REST, servidor MCP y Chat, sin duplicar la lógica del dominio.