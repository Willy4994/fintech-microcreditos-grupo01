# Informe de Impacto SOLID – Proyecto 2

## 1. Punto de partida

Para realizar la medición del impacto de los cambios del Proyecto 2 se tomó como punto de partida la entrega final del Proyecto 1.

- **Commit P1:** `b3293fc`
- **Tag P1:** `entrega-p1`
- **Commit P2 evaluado:** `4654405`
- **Rama de trabajo:** `feature/p2-politica-mora`

La comparación entre ambas versiones se realizó utilizando Git y limitando el análisis del núcleo a la carpeta `src/dominio/`.

Comando utilizado:

`git diff --stat entrega-p1..HEAD -- src/dominio/`

## 2. Métricas del cambio

La comparación entre el Proyecto 1 y el Proyecto 2 produjo los siguientes resultados:

| Métrica | Resultado |
|---|---:|
| Archivos del núcleo creados | 8 |
| Archivos existentes del núcleo modificados | 3 |
| ¿Se modificó el motor de cálculo de mora? | Sí |
| Pruebas del P1 que dejaron de pasar | 0 |
| Pruebas del P1 que hubo que reescribir | 0 |
| Líneas netas añadidas al núcleo | 405 |

Git reportó un total de **438 inserciones y 33 eliminaciones** dentro de `src/dominio/`, dando como resultado **405 líneas netas añadidas**.

### Archivos existentes modificados

Los tres archivos que ya existían en el Proyecto 1 y tuvieron que modificarse fueron:

- `src/dominio/calculo-financiero/services/CalculadoraMora.ts`
- `src/dominio/cierres/services/CalculadoraCarteraRiesgo.ts`
- `src/dominio/originacion/states/CreditoEnMora.ts`

### Archivos nuevos

Para implementar los nuevos requisitos se agregaron siete archivos al núcleo:

- `src/dominio/cierres/services/CalculadoraDevengoInteres.ts`
- `src/dominio/politica-mora/CatalogoPoliticas.ts`
- `src/dominio/politica-mora/GastoGestionCobro.ts`
- `src/dominio/politica-mora/PoliticaEscalonada.ts`
- `src/dominio/politica-mora/PoliticaMora.ts`
- `src/dominio/politica-mora/PoliticaPlana.ts`
- `src/dominio/politica-mora/PoliticaRetroactiva.ts`

La modificación de `CalculadoraMora.ts` es relevante para el análisis del principio Abierto/Cerrado (OCP), ya que el cambio de requisitos requirió modificar una pieza existente del motor de cálculo de mora. Este resultado se analiza posteriormente con base en la evidencia del repositorio.

## 3. Análisis de los principios SOLID

### 3.1 S — Responsabilidad Única (SRP)

La clasificación del estado de mora y el cálculo del costo de la mora se encuentran separados.

La clase:

`src/dominio/cartera-cobros/value-objects/TramoMora.ts`

es responsable de clasificar los días de atraso en `SIN_MORA`, `MORA_1`, `MORA_2`, `MORA_3` o `VENCIDO`.

Por otro lado, el cálculo del interés moratorio se encuentra separado mediante el contrato:

`src/dominio/politica-mora/PoliticaMora.ts`

y sus diferentes implementaciones:

- `PoliticaPlana.ts`
- `PoliticaEscalonada.ts`
- `PoliticaRetroactiva.ts`

De esta forma, la clasificación del tramo no tiene que decidir directamente cuánto interés debe cobrarse. Las responsabilidades se mantienen separadas entre la clasificación de la mora y las políticas encargadas del cálculo.

### 3.2 O — Abierto/Cerrado (OCP)

Este principio presentó uno de los principales puntos de fricción durante la evolución del Proyecto 1 al Proyecto 2.

En el Proyecto 1, `CalculadoraMora.ts` contenía directamente la fórmula utilizada para calcular el interés moratorio. Para soportar varias políticas de mora fue necesario modificar este archivo existente.

El cambio introdujo la abstracción `PoliticaMora` y `CalculadoraMora` pasó a recibir una política mediante su constructor:

`private readonly politica: PoliticaMora`

Posteriormente delega el cálculo mediante:

`this.politica.calcularInteresMoratorio(...)`

Esto significa que el diseño original de P1 no estaba completamente cerrado a modificaciones, ya que fue necesario modificar el motor para introducir las nuevas estrategias.

Sin embargo, el rediseño realizado en P2 permite que nuevas implementaciones de `PoliticaMora` puedan incorporarse posteriormente sin modificar nuevamente la lógica interna de `CalculadoraMora`.

Por lo tanto, el cambio permitió identificar una debilidad de OCP en P1 y aplicar un rediseño basado en Strategy para mejorar la extensibilidad del núcleo.

### 3.3 L — Sustitución de Liskov (LSP)

Las políticas de mora implementan el mismo contrato `PoliticaMora`, lo que permite utilizar diferentes implementaciones sin cambiar la forma en que el consumidor realiza el cálculo.

Actualmente existen tres implementaciones:

- `PoliticaPlana`
- `PoliticaEscalonada`
- `PoliticaRetroactiva`

La evidencia principal se encuentra en:

`tests/contrato-politica-mora.test.ts`

La misma batería de pruebas de contrato se ejecuta contra las tres implementaciones. Las pruebas verifican, entre otros aspectos, que el resultado no sea negativo, que con cero días de atraso el resultado sea cero y que se conserve la moneda del capital recibido.

Esto demuestra que las tres políticas pueden sustituirse utilizando el mismo contrato sin romper las condiciones verificadas por el motor.

### 3.4 I — Segregación de Interfaces (ISP)

El núcleo utiliza interfaces específicas para responsabilidades concretas en lugar de una única interfaz general.

Entre las abstracciones encontradas se encuentran:

- `PoliticaMora`, para el cálculo del interés moratorio.
- `MetodoAmortizacion`, para estrategias de amortización.
- `Reloj`, para proporcionar tiempo al dominio.
- `GeneradorIds`, para la generación de identificadores.
- `EstadoCredito`, para representar el comportamiento correspondiente al estado de un crédito.

Estas interfaces mantienen contratos enfocados en necesidades específicas del dominio. Por ejemplo, una política de mora no necesita implementar operaciones relacionadas con amortización, generación de identificadores o estados del crédito.

Esto reduce dependencias innecesarias entre los componentes y permite que cada implementación dependa únicamente del contrato que necesita.

### 3.5 D — Inversión de Dependencias (DIP)

El núcleo presenta separación respecto a tecnologías externas y detalles de infraestructura.

La revisión de los imports dentro de `src/dominio/` no encontró dependencias directas hacia Express, PostgreSQL, MySQL, Prisma, Sequelize o TypeORM.

Además, para comportamientos que pueden variar se utilizan abstracciones como:

- `PoliticaMora`
- `MetodoAmortizacion`
- `Reloj`
- `GeneradorIds`

Un ejemplo importante se encuentra en `CalculadoraMora`, que depende del contrato `PoliticaMora` para realizar el cálculo y permite recibir una implementación mediante el constructor.

De esta manera, las reglas principales del dominio pueden mantenerse independientes de frameworks, bases de datos y otros detalles externos de infraestructura.

## 4. Puntos de fricción y rediseño

La evolución de los requisitos del Proyecto 2 permitió identificar puntos del diseño original que necesitaron modificaciones. La comparación entre `entrega-p1` y P2 muestra tres archivos existentes del núcleo modificados.

### 4.1 CalculadoraMora.ts

Este fue el principal punto de fricción relacionado con el principio Abierto/Cerrado.

En P1, `CalculadoraMora` realizaba directamente la fórmula del interés moratorio. Al introducir diferentes políticas de mora en P2, fue necesario modificar esta clase.

Como rediseño se creó la interfaz `PoliticaMora` y la calculadora pasó a delegar el cálculo a una implementación de dicha interfaz.

Esto permitió incorporar:

- `PoliticaPlana`
- `PoliticaEscalonada`
- `PoliticaRetroactiva`

El cambio muestra que el diseño de P1 no estaba completamente preparado para agregar nuevas políticas sin modificar el motor. Sin embargo, después del rediseño, `CalculadoraMora` puede trabajar con diferentes políticas mediante el mismo contrato.

### 4.2 CalculadoraCarteraRiesgo.ts

Este archivo tuvo que evolucionar debido a los nuevos requerimientos relacionados con la medición de cartera.

En P2 se amplió el cálculo para contemplar indicadores como cartera activa, cartera en riesgo, cartera en mora, Mora 2, Mora 3, vencido, reestructurado y montos declarados incobrables.

La modificación fue necesaria porque la versión de P1 no contemplaba todos los indicadores requeridos por la evolución funcional.

Las pruebas de cartera verifican los resultados esperados, incluyendo el caso de referencia de cartera en riesgo de 7.00 % y el escenario posterior con 6.06 %.

### 4.3 CreditoEnMora.ts

El modelo de estados también requirió una modificación puntual.

P2 agregó la transición que permite pasar de un crédito `EN_MORA` a `CANCELADO` cuando se cumplen las condiciones correspondientes.

Para soportar esta transición fue necesario modificar `CreditoEnMora.ts` e incorporar el comportamiento de cancelación.

La prueba `cancelacion-credito-en-mora.test.ts` verifica este nuevo comportamiento.

### 4.4 Resultado del rediseño

La medición muestra que fue necesario modificar tres archivos existentes del núcleo. Esto supera el objetivo orientativo de no más de dos archivos modificados indicado en el enunciado.

Sin embargo, los cambios permiten identificar de forma concreta los puntos donde el diseño original presentó fricción. El caso más significativo fue `CalculadoraMora.ts`, que fue rediseñado para delegar el comportamiento variable mediante `PoliticaMora`.

La evolución también se concentró principalmente en archivos nuevos, manteniendo las nuevas políticas separadas del resto de las responsabilidades del dominio.

## 5. Resultado de las pruebas

Después de implementar la evolución del núcleo y realizar los ajustes correspondientes, se ejecutó nuevamente la suite completa de pruebas.

Comandos utilizados:

`npx tsc --noEmit`

`npm test`

Resultado final:

- **Test Files:** 23 passed (23)
- **Tests:** 77 passed (77)
- **Errores de TypeScript:** 0
- **Pruebas fallidas:** 0

### 5.1 Casos numéricos obligatorios

La suite verifica los casos numéricos establecidos para las políticas de mora:

- M-1: Q5.44
- M-2: Q18.14
- M-3: Q50.80
- M-4: Q65.32
- M-5: Q1,047.76

También se verifica la coexistencia de políticas para una misma cuota con 45 días de atraso:

- Política plana: Q21.77
- Política escalonada: Q18.14

### 5.2 Compatibilidad con Proyecto 1

Las pruebas correspondientes al comportamiento existente del Proyecto 1 continúan pasando.

Entre ellas se verifica:

- Interés moratorio plano de Q7.26.
- Tabla completa de amortización francesa de 12 cuotas.
- Capital amortizado total de Q10,000.00.
- Saldo final igual a cero.
- Rechazo de pagos sobre un crédito en estado `SOLICITADO`.

No fue necesario reescribir pruebas del Proyecto 1 para adaptar sus resultados a los nuevos requisitos.

### 5.3 Contrato de políticas de mora

El archivo:

`tests/contrato-politica-mora.test.ts`

ejecuta una misma batería de pruebas contra:

- `PoliticaPlana`
- `PoliticaEscalonada`
- `PoliticaRetroactiva`

Esto permite comprobar que las tres implementaciones respetan el contrato esperado por el núcleo.

### 5.4 Invariantes y reglas adicionales

La suite también verifica los ocho invariantes definidos para P2 y las nuevas reglas del dominio, incluyendo:

- Cancelación de un crédito en mora.
- Suspensión del devengo de interés corriente después de 90 días.
- Generación del gasto de gestión de cobro.
- Cartera en riesgo de 7.00 %.
- Cartera en riesgo de 6.06 % después de excluir el crédito declarado incobrable.
- Desglose de riesgo de 3.00 % + 2.25 % + 1.00 % + 0.75 % = 7.00 %.

El resultado final de 77 pruebas aprobadas confirma que la evolución implementada mantiene los casos anteriores y cubre los nuevos comportamientos requeridos.

## 6. Conclusión

La evolución del Proyecto 1 al Proyecto 2 permitió comprobar de manera práctica el comportamiento del diseño frente a nuevos requisitos.

La medición mediante Git mostró que la evolución requirió modificar tres archivos existentes del núcleo. El principal punto de fricción se encontró en `CalculadoraMora.ts`, debido a que en P1 la fórmula de mora se encontraba implementada directamente en la calculadora. Para soportar diferentes políticas fue necesario realizar un rediseño e introducir el contrato `PoliticaMora`.

A partir de este cambio, las políticas plana, escalonada y retroactiva se encuentran separadas y pueden utilizarse mediante una misma abstracción. Las pruebas de contrato proporcionan evidencia de que estas implementaciones pueden sustituirse conservando el comportamiento esperado.

También fue necesario extender `CalculadoraCarteraRiesgo.ts` para incorporar los nuevos indicadores de cartera y `CreditoEnMora.ts` para permitir la nueva transición hacia el estado `CANCELADO`.

La medición obtenida no representa un cumplimiento perfecto de todos los objetivos orientativos del enunciado, ya que fue necesario modificar tres archivos existentes y el motor de cálculo de mora tuvo que ser abierto durante la evolución. Estos resultados se consideran evidencia de los puntos de acoplamiento existentes en el diseño de P1.

El rediseño realizado en P2 mejora la extensibilidad del núcleo al introducir abstracciones y separar comportamientos variables. Además, la suite completa finaliza con 23 archivos de prueba y 77 pruebas aprobadas, sin regresiones detectadas en los casos de referencia del Proyecto 1.

Por lo tanto, el informe evidencia tanto los aspectos del diseño que facilitaron la evolución como los puntos que requirieron refactorización, utilizando el historial de Git y las pruebas automatizadas como respaldo de la evaluación de SOLID.