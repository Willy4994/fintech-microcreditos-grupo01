# Informe de Impacto SOLID – Proyecto 2

## 1. Punto de partida

Para realizar la medición del impacto de los cambios del Proyecto 2 se tomó como punto de partida la entrega final del Proyecto 1.

- **Commit P1:** `b3293fc`
- **Tag P1:** `entrega-p1`
- **Versión P2 evaluada:** `entrega-p2` (tag de entrega final)
- **Rama de trabajo:** `feature/p2-politica-mora`

La comparación entre ambas versiones se realizó utilizando Git y limitando el análisis del núcleo a la carpeta `src/dominio/`.

Comando utilizado:

`git diff --stat entrega-p1..HEAD -- src/dominio/`

El objetivo de esta comparación es medir cuánto tuvo que cambiar el núcleo existente para incorporar los nuevos requisitos del Proyecto 2.

---

## 2. Métricas del cambio

La comparación entre el Proyecto 1 y el Proyecto 2 produjo los siguientes resultados:

| Métrica | Resultado |
|---|---:|
| Archivos del núcleo creados | 7 |
| Archivos existentes del núcleo modificados | 3 |
| ¿Se modificó el motor de cálculo de mora? | Sí |
| Pruebas del P1 que dejaron de pasar | 0 |
| Pruebas del P1 que hubo que reescribir | 0 |
| Líneas netas añadidas al núcleo | 405 |

Git reportó un total de **438 inserciones y 33 eliminaciones** dentro de `src/dominio/`, dando como resultado **405 líneas netas añadidas**.

### 2.1 Archivos existentes modificados

Los tres archivos que ya existían en el Proyecto 1 y tuvieron que modificarse fueron:

- `src/dominio/calculo-financiero/services/CalculadoraMora.ts`
- `src/dominio/cierres/services/CalculadoraCarteraRiesgo.ts`
- `src/dominio/originacion/states/CreditoEnMora.ts`

### 2.2 Archivos nuevos

Para implementar los nuevos requisitos se agregaron siete archivos al núcleo:

- `src/dominio/cierres/services/CalculadoraDevengoInteres.ts`
- `src/dominio/politica-mora/CatalogoPoliticas.ts`
- `src/dominio/politica-mora/GastoGestionCobro.ts`
- `src/dominio/politica-mora/PoliticaEscalonada.ts`
- `src/dominio/politica-mora/PoliticaMora.ts`
- `src/dominio/politica-mora/PoliticaPlana.ts`
- `src/dominio/politica-mora/PoliticaRetroactiva.ts`

La modificación de `CalculadoraMora.ts` es especialmente relevante para el análisis del principio Abierto/Cerrado (OCP), ya que el cambio de requisitos requirió modificar una pieza existente del motor.

Por lo tanto, el resultado real muestra que el diseño del Proyecto 1 tenía una oportunidad de mejora respecto a OCP.

### 2.3 Pruebas del Proyecto 1

No fue necesario reescribir pruebas existentes del Proyecto 1 para hacer pasar la nueva implementación.

El archivo `tests/cartera.test.ts` aparece como modificado porque se agregó un nuevo caso correspondiente al Proyecto 2, pero las pruebas existentes no fueron reemplazadas ni alteradas para ocultar regresiones.

La suite completa continúa ejecutándose correctamente.

---

## 3. Análisis de los principios SOLID

### 3.1 S — Responsabilidad Única (SRP)

La clasificación del estado de mora y el cálculo del costo de la mora se encuentran separados.

La clase:

`src/dominio/cartera-cobros/value-objects/TramoMora.ts`

es responsable de clasificar los días de atraso en estados como:

- `SIN_MORA`
- `MORA_1`
- `MORA_2`
- `MORA_3`
- `VENCIDO`

Por otro lado, el cálculo del interés moratorio se encuentra separado mediante el contrato:

`src/dominio/politica-mora/PoliticaMora.ts`

y sus diferentes implementaciones:

- `PoliticaPlana.ts`
- `PoliticaEscalonada.ts`
- `PoliticaRetroactiva.ts`

De esta forma, la clasificación del tramo no tiene que decidir directamente cuánto interés debe cobrarse.

La clasificación de la mora y las políticas encargadas del cálculo permanecen como responsabilidades separadas.

**Resultado:** el diseño presenta una separación clara de responsabilidades para esta parte del dominio.

---

### 3.2 O — Abierto/Cerrado (OCP)

Este principio presentó uno de los principales puntos de fricción durante la evolución del Proyecto 1 al Proyecto 2.

En el Proyecto 1, `CalculadoraMora.ts` contenía directamente la fórmula utilizada para calcular el interés moratorio.

Para soportar varias políticas de mora fue necesario modificar este archivo existente.

El cambio introdujo la abstracción:

`PoliticaMora`

y `CalculadoraMora` pasó a recibir una política mediante su constructor.

La calculadora posteriormente delega el cálculo a:

`this.politica.calcularInteresMoratorio(...)`

Esto significa que el diseño original del Proyecto 1 no estaba completamente cerrado a modificaciones, ya que fue necesario abrir y modificar el motor para introducir las nuevas estrategias.

Sin embargo, el rediseño realizado en el Proyecto 2 permite que nuevas implementaciones de `PoliticaMora` puedan incorporarse posteriormente sin modificar nuevamente la lógica interna de `CalculadoraMora`.

**Resultado:** P1 presentaba una debilidad respecto a OCP. En P2 se aplicó un rediseño basado en Strategy para mejorar la extensibilidad del núcleo.

---

### 3.3 L — Sustitución de Liskov (LSP)

Las políticas de mora implementan el mismo contrato `PoliticaMora`, lo que permite utilizar diferentes implementaciones sin cambiar la forma en que el consumidor realiza el cálculo.

Actualmente existen tres implementaciones:

- `PoliticaPlana`
- `PoliticaEscalonada`
- `PoliticaRetroactiva`

La evidencia principal se encuentra en:

`tests/contrato-politica-mora.test.ts`

La misma batería de pruebas de contrato se ejecuta contra las tres implementaciones.

Estas pruebas verifican condiciones comunes del contrato, entre ellas que el resultado sea válido, que con cero días de atraso no se genere mora y que se conserve la moneda correspondiente.

Además, las políticas plana y escalonada pueden coexistir y producir resultados diferentes para un mismo escenario sin cambiar el contrato utilizado por el consumidor.

**Resultado:** las tres políticas pueden sustituirse utilizando la misma abstracción sin romper las condiciones verificadas por las pruebas de contrato.

---

### 3.4 I — Segregación de Interfaces (ISP)

El núcleo utiliza interfaces específicas para responsabilidades concretas en lugar de depender de una única interfaz general con operaciones que los consumidores no necesitan.

`PoliticaMora` define únicamente el comportamiento necesario para realizar el cálculo de interés moratorio.

Esto permite que `PoliticaPlana`, `PoliticaEscalonada` y `PoliticaRetroactiva` dependan de un contrato pequeño y relacionado directamente con su responsabilidad.

De la misma forma, otras responsabilidades del dominio permanecen separadas en sus respectivos componentes en lugar de concentrarse dentro de una interfaz general del sistema.

**Resultado:** las políticas dependen de una abstracción específica para el cálculo que realizan y no de contratos con responsabilidades ajenas.

---

### 3.5 D — Inversión de Dependencias (DIP)

`CalculadoraMora` no depende directamente de una implementación específica como `PoliticaPlana` o `PoliticaEscalonada`.

La calculadora depende de la abstracción:

`PoliticaMora`

La política concreta puede proporcionarse al componente, permitiendo cambiar el comportamiento sin acoplar el consumidor a una implementación determinada.

Esto reduce el acoplamiento entre el motor y las reglas concretas de mora.

Además, el núcleo se mantiene independiente de tecnologías externas como servidor HTTP, interfaz gráfica o base de datos.

La lógica financiera puede probarse directamente mediante Vitest sin iniciar infraestructura externa.

**Resultado:** el consumidor principal del cálculo depende de la abstracción `PoliticaMora` y no de una estrategia concreta, mejorando el desacoplamiento del núcleo.

---

## 4. Puntos de fricción y rediseño

La evolución del Proyecto 1 permitió identificar piezas existentes que tuvieron que abrirse para incorporar los nuevos requisitos.

### 4.1 CalculadoraMora.ts

Este fue el punto de fricción más importante.

En P1, la fórmula del interés moratorio se encontraba directamente asociada al motor de cálculo.

Al introducir diferentes políticas fue necesario modificar `CalculadoraMora.ts`.

Esto evidencia que el diseño original no estaba completamente preparado para la extensión solicitada.

**Rediseño aplicado:**

Se introdujo la abstracción `PoliticaMora` y el patrón Strategy.

La calculadora delega ahora el comportamiento a una política inyectada, permitiendo agregar estrategias adicionales con menor impacto sobre el motor.

### 4.2 CalculadoraCarteraRiesgo.ts

Este archivo existente tuvo que modificarse para incorporar el nuevo desglose solicitado para la cartera en riesgo.

El cálculo permite diferenciar los porcentajes correspondientes a:

- Mora 2
- Mora 3
- Vencido
- Reestructurado

El caso de referencia produce:

- Mora 2: 3.00 %
- Mora 3: 2.25 %
- Vencido: 1.00 %
- Reestructurado: 0.75 %
- Cartera en riesgo total: 7.00 %
- Cartera en mora: 21.75 %

La modificación fue necesaria porque el nuevo requisito exige información más detallada que la disponible originalmente.

### 4.3 CreditoEnMora.ts

También fue necesario modificar el estado `CreditoEnMora` para soportar la nueva transición requerida por el Proyecto 2:

`en_mora → cancelado`

El cambio permite cancelar correctamente un crédito que se encuentra en mora cuando se cumplen las condiciones correspondientes.

Las pruebas también comprueban que continúan existiendo transiciones inválidas, como intentar pagar un crédito que todavía se encuentra en estado `solicitado`.

### 4.4 Evaluación general de las fricciones

El objetivo razonable indicado para los archivos existentes modificados era mantener el impacto reducido.

El resultado real fue de **3 archivos existentes modificados**.

Por lo tanto, el cambio no fue absorbido completamente mediante extensiones nuevas.

La principal evidencia de acoplamiento se encontró en `CalculadoraMora.ts`.

Sin embargo, la modificación permitió introducir una abstracción que reduce este problema para futuras políticas.

---

## 5. Resultado de las pruebas

La suite completa se ejecutó mediante:

`npm test`

Resultado obtenido:

- **Test Files:** 23 passed (23)
- **Tests:** 77 passed (77)

También se ejecutó:

`npx tsc --noEmit`

sin errores de TypeScript.

### 5.1 Casos obligatorios de mora

Los casos obligatorios del Proyecto 2 se encuentran cubiertos por las pruebas.

| Caso | Escenario | Resultado |
|---|---|---:|
| M-1 | 15 días, política escalonada | Q5.44 |
| M-2 | 45 días, política escalonada | Q18.14 |
| M-3 | 100 días, política escalonada | Q50.80 |
| M-4 | 120 días, política escalonada | Q65.32 |
| M-5 | Total adeudado cuota 2 a 45 días con gasto de gestión | Q1,047.76 |

### 5.2 Coexistencia de políticas

Se implementaron pruebas para comprobar que distintas políticas pueden coexistir dentro del núcleo.

Para el mismo escenario de 45 días de atraso:

- Política plana: **Q21.77**
- Política escalonada: **Q18.14**

La coexistencia permite seleccionar diferentes reglas sin duplicar el motor completo de cálculo.

### 5.3 Regresión del Proyecto 1

La suite del Proyecto 1 continúa funcionando junto con los nuevos requisitos.

El caso original de mora del Proyecto 1 mantiene el resultado esperado de:

**Q7.26**

También se conserva el comportamiento del plan de amortización de 12 cuotas utilizado como referencia en P1.

No fue necesario reescribir las pruebas existentes del Proyecto 1 para hacerlas pasar.

### 5.4 Prueba de contrato

El archivo:

`tests/contrato-politica-mora.test.ts`

ejecuta una batería común contra:

- Política plana
- Política escalonada
- Política retroactiva

Esto proporciona evidencia de sustituibilidad entre las implementaciones del contrato `PoliticaMora`.

### 5.5 Invariantes

El archivo:

`tests/invariantes-p2.test.ts`

contiene las pruebas correspondientes a los ocho invariantes requeridos para la evolución del núcleo.

La ejecución actual reporta:

**8 tests passed**

### 5.6 Cancelación de crédito en mora

El archivo:

`tests/cancelacion-credito-en-mora.test.ts`

verifica la nueva transición requerida para un crédito en mora y las restricciones relacionadas con los estados del crédito.

La ejecución actual reporta:

**3 tests passed**

### 5.7 Suspensión del devengo

El archivo:

`tests/devengo-interes.test.ts`

verifica el comportamiento del devengo de intereses requerido para los créditos con más de 90 días de atraso.

La ejecución actual reporta:

**3 tests passed**

### 5.8 Cartera en riesgo

Las pruebas de cartera verifican el desglose requerido:

`3.00 % + 2.25 % + 1.00 % + 0.75 % = 7.00 %`

También se verifica la diferencia entre:

- **Cartera en riesgo: 7.00 %**
- **Cartera en mora: 21.75 %**

Esto permite evitar que ambos indicadores sean tratados como si representaran el mismo concepto.

---

## 6. Conclusión

La evolución realizada en el Proyecto 2 permitió comprobar los principios SOLID del núcleo utilizando cambios reales en lugar de limitarse a una explicación teórica.

La comparación entre P1 y P2 muestra que se agregaron **7 archivos nuevos** y fue necesario modificar **3 archivos existentes** dentro de `src/dominio/`.

El principal punto de fricción fue `CalculadoraMora.ts`.

La necesidad de modificar este archivo demuestra que el diseño del Proyecto 1 no cumplía completamente con el principio Abierto/Cerrado para el cambio de políticas de mora solicitado en P2.

Como respuesta se introdujo la abstracción `PoliticaMora` y un diseño basado en Strategy. Esto permite que las políticas plana, escalonada y retroactiva compartan un mismo contrato y que nuevas políticas puedan incorporarse con menor impacto en el motor.

También se identificaron cambios necesarios en `CalculadoraCarteraRiesgo.ts` y `CreditoEnMora.ts` debido a los nuevos requisitos de cartera y estados del crédito.

A pesar de estas modificaciones, la evolución no produjo regresiones detectadas por la suite actual. La ejecución final obtuvo:

- **23 archivos de prueba aprobados**
- **77 pruebas aprobadas**
- **0 pruebas fallidas**
- **0 pruebas del P1 reescritas para ocultar regresiones**
- **TypeScript sin errores con `npx tsc --noEmit`**

El resultado muestra que el diseño del Proyecto 1 tenía áreas mejorables, principalmente respecto a OCP, pero también permitió evolucionar el núcleo conservando el comportamiento anterior y agregando nuevas reglas mediante abstracciones y pruebas automatizadas.

Si se diseñara nuevamente esta parte del núcleo desde el inicio, el motor de mora dependería desde P1 de una abstracción de política, evitando que un cambio de estrategia obligara a modificar `CalculadoraMora`.

En conclusión, la evolución de P2 permitió no solamente incorporar los nuevos requisitos financieros, sino también medir de forma concreta las fortalezas y debilidades del diseño original y mejorar su capacidad de extensión.