# E1 · Investigación de usuario

## Sistema de Gestión de Microcrédito — Crédito Vecino, S. A.

## 1. Base de investigación

Las siguientes personas se construyeron tomando como base los perfiles, necesidades y contextos de uso establecidos para Crédito Vecino, S. A. en el enunciado del Proyecto 2.

Se identifican tres perfiles principales: asesor de crédito, cliente y gerencia/comité. Cada uno interactúa con el sistema en condiciones diferentes, por lo que sus necesidades de interfaz también cambian.

El asesor necesita realizar operaciones desde un teléfono móvil y puede trabajar en lugares con conectividad intermitente. El cliente necesita comprender de forma sencilla la información relacionada con su crédito, pagos y mora. Por otro lado, gerencia necesita consultar indicadores y detalles de cartera principalmente desde una computadora.

Estas personas sirven como base para orientar las decisiones de UX/UI, arquitectura de información y diseño del prototipo.

---

# 2. Persona 1 · Asesor de crédito

**Nombre ficticio:** Melannie Lorenzana  
**Rol:** Asesor de crédito  
**Contexto de uso:** Oficina y trabajo de campo  
**Dispositivo principal:** Teléfono móvil de gama media

## Contexto

Melannie atiende clientes, registra solicitudes de crédito, consulta información de créditos y recibe pagos.

Parte de sus actividades pueden realizarse fuera de la oficina, utilizando principalmente un teléfono móvil. Durante estas actividades puede encontrarse con conexión a Internet inestable, utilizar el dispositivo mientras atiende al cliente y trabajar en condiciones de iluminación exterior.

## Objetivos

- Registrar solicitudes de crédito de forma rápida y correcta.
- Explicar al cliente el monto, plazo, cuota y condiciones del crédito.
- Consultar el saldo y estado de un crédito.
- Consultar información relacionada con mora.
- Registrar pagos evitando errores en los montos.
- Continuar el proceso ante interrupciones temporales de conectividad.

## Frustraciones

- Tener que volver a ingresar información.
- Perder información debido a problemas de conexión.
- No saber si una operación fue registrada correctamente.
- Encontrar información financiera poco clara.
- No comprender fácilmente cómo se distribuyó un pago.

## Alfabetización digital

Media. Utiliza aplicaciones móviles y herramientas digitales durante sus actividades, pero necesita que las operaciones frecuentes sean rápidas y fáciles de comprender.

## Restricciones del entorno

- Conectividad móvil intermitente.
- Uso frecuente de un teléfono móvil.
- Posible uso del sistema en exteriores.
- Condiciones variables de iluminación.
- Necesidad de atender al cliente mientras utiliza el sistema.
- Posibles interrupciones durante una operación.

## Necesidades de diseño

- Diseño mobile-first.
- Controles táctiles fáciles de utilizar.
- Información legible y con buena jerarquía visual.
- Procesos realizados en pocos pasos.
- Confirmación antes de operaciones financieras importantes.
- Manejo de operaciones ante pérdida temporal de conexión.
- Información clara sobre crédito, mora y pagos.

---

# 3. Persona 2 · Cliente

**Nombre ficticio:** Willi Hernandez  
**Rol:** Cliente de Crédito Vecino  
**Contexto de uso:** Solicitud, consulta y seguimiento de su microcrédito  
**Dispositivo principal:** Teléfono móvil, con apoyo del asesor

## Contexto

Willi solicita un microcrédito y necesita comprender claramente las condiciones antes de aceptarlo.

Durante el seguimiento del crédito necesita conocer cuánto debe, cuál es su próxima cuota, cuándo debe pagar y qué ocurre si se atrasa.

Gran parte de la interacción puede realizarse con apoyo del asesor, por lo que la información debe ser suficientemente clara para que pueda ser explicada y comprendida sin utilizar lenguaje financiero innecesariamente complejo.

## Objetivos

- Conocer el monto y plazo del crédito.
- Saber cuánto deberá pagar en cada cuota.
- Conocer su saldo pendiente.
- Identificar la fecha y monto de su próxima cuota.
- Comprender si el crédito se encuentra en mora.
- Entender por qué cambió el monto de mora.
- Comprender cómo se aplicó un pago.

## Frustraciones

- Encontrar términos financieros difíciles de comprender.
- Ver cantidades sin una explicación clara.
- No comprender por qué aumentó la mora.
- Descubrir que su crédito cambió de tramo de mora después de ocurrido.
- No saber qué parte de un pago corresponde a capital, intereses u otros conceptos.

## Alfabetización digital

Baja a media. Puede utilizar funciones comunes de un teléfono móvil, pero necesita procesos sencillos y lenguaje fácil de interpretar.

## Restricciones del entorno

- Puede tener conocimientos limitados sobre términos financieros.
- Puede necesitar apoyo del asesor para realizar o comprender algunas operaciones.
- Puede utilizar un teléfono móvil como principal dispositivo.
- La conectividad puede ser irregular.

## Necesidades de diseño

- Lenguaje sencillo y directo.
- Montos y fechas claramente visibles.
- Explicación comprensible de las cuotas.
- Información clara del estado del crédito.
- Explicación de los días de atraso y tramo de mora.
- Desglose del cálculo de mora.
- Explicación de cómo se distribuye un pago.

---

# 4. Persona 3 · Gerencia / Comité

**Nombre ficticio:** Cristian Garcia  
**Rol:** Gerente / miembro del comité  
**Contexto de uso:** Oficina  
**Dispositivo principal:** Computadora de escritorio o portátil

## Contexto

Cristian supervisa información relacionada con la cartera de créditos y necesita identificar rápidamente situaciones que requieren atención.

Utiliza principalmente una computadora, donde puede consultar indicadores generales y posteriormente profundizar en los créditos relacionados con cada indicador.

También participa en procesos administrativos como la evaluación de solicitudes y consulta de cierres.

## Objetivos

- Consultar el estado general de la cartera.
- Identificar la cartera en mora.
- Identificar la cartera en riesgo.
- Diferenciar ambos indicadores.
- Analizar la cartera en riesgo por tramo.
- Consultar los créditos relacionados con un tramo.
- Evaluar solicitudes.
- Consultar o generar cierres diarios y mensuales.

## Frustraciones

- Indicadores financieros sin contexto.
- No poder diferenciar cartera en mora de cartera en riesgo.
- Tener que revisar crédito por crédito para encontrar problemas.
- Información excesiva sin una jerarquía clara.
- No poder pasar de un indicador general al detalle de los créditos.

## Alfabetización digital

Media a alta. Está acostumbrado a utilizar sistemas administrativos y consultar información financiera desde una computadora.

## Restricciones del entorno

- Necesidad de analizar varios indicadores.
- Tiempo limitado para revisar información.
- Necesidad de consultar información resumida y posteriormente acceder al detalle.
- Uso principal desde una pantalla de escritorio.

## Necesidades de diseño

- Tablero optimizado para escritorio.
- Indicadores principales visibles inmediatamente.
- Diferenciación clara entre cartera en mora y cartera en riesgo.
- Desglose de cartera en riesgo por tramo.
- Navegación desde indicadores hacia créditos específicos.
- Información organizada mediante una jerarquía visual clara.

---

# 5. Journey Map · Solicitud hasta el primer pago

El siguiente recorrido representa la experiencia del cliente y del asesor desde la solicitud del crédito hasta el registro del primer pago.

| Etapa | Acción | Interacción con el sistema | Emoción | Punto de dolor | Oportunidad de diseño |
|---|---|---|---|---|---|
| 1. Solicitud | El cliente proporciona sus datos y solicita el crédito. | El asesor registra una nueva solicitud. | Interés / duda | Una interrupción puede afectar la captura de información. | Reducir pasos y facilitar la continuidad del proceso. |
| 2. Monto y plazo | El cliente indica cuánto necesita y el plazo deseado. | El asesor registra monto y plazo. | Expectativa | Un dato incorrecto cambia las condiciones del crédito. | Mostrar claramente los datos antes de continuar. |
| 3. Simulación | El cliente revisa las condiciones. | El sistema presenta la cuota y el plan de amortización. | Análisis | El cliente puede no comprender las cifras. | Presentar cuota, tasa, plazo y plan de manera clara. |
| 4. Confirmación | Se revisan las condiciones antes del desembolso. | El sistema presenta un resumen para confirmar. | Precaución | Confirmar información incorrecta produce consecuencias monetarias. | Permitir revisar, confirmar o regresar a corregir. |
| 5. Desembolso | El crédito es confirmado y desembolsado. | El sistema muestra que el crédito fue desembolsado. | Satisfacción | El cliente puede tener dudas sobre las condiciones posteriores. | Mantener acceso al plan y detalle del crédito. |
| 6. Seguimiento | El cliente consulta saldo, cuota y estado. | Se consulta el detalle del crédito. | Tranquilidad | La información financiera puede ser difícil de interpretar. | Utilizar cifras visibles y lenguaje sencillo. |
| 7. Atraso y cambio de tramo | El crédito acumula días de atraso. | El sistema muestra días de atraso, tramo actual y desglose de mora. | Preocupación | El cliente puede descubrir el cambio después de haber pasado al nuevo tramo. | Explicar claramente el tramo actual y cómo se obtuvo el total de mora. |
| 8. Registro del pago | El cliente entrega dinero al asesor. | El asesor registra el pago desde el teléfono. | Alivio / precaución | Un monto incorrecto o un reintento puede afectar el saldo. | Mostrar el monto y proteger la operación contra duplicados. |
| 9. Comprobante | Se consulta cómo se aplicó el pago. | El sistema presenta el desglose del pago. | Confianza | Un único total no explica cómo fue utilizado el dinero. | Mostrar gastos, interés moratorio, interés corriente y capital. |

---

# 6. Resultado del Journey Map

El recorrido permitió identificar que los principales puntos de dolor se encuentran en las operaciones que afectan directamente cantidades de dinero y en la comprensión de la información financiera.

También se identificó la importancia de considerar la conectividad del asesor durante el trabajo de campo y de presentar al cliente explicaciones claras sobre cuotas, saldo, mora y aplicación de pagos.

Uno de los puntos más importantes ocurre cuando el cliente descubre que su crédito cambió de tramo de mora. En el prototipo actual esta información se comunica después de ocurrido el cambio, mediante el detalle del crédito y la pantalla de detalle de mora.

Como mejora futura se propone incorporar una advertencia previa cuando el crédito esté próximo a cambiar de tramo.

---

# 7. Momentos críticos de la experiencia

Se identificaron cuatro momentos en los que un error de interfaz puede producir consecuencias monetarias o afectar significativamente la comprensión del usuario.

## Momento crítico 1 · Captura del monto y plazo

**Situación:**  
El asesor registra el monto solicitado y el plazo del crédito.

**Riesgo:**  
Un error de digitación o selección puede generar una simulación con condiciones diferentes a las solicitadas.

**Respuesta de diseño:**  
La interfaz muestra claramente el monto y el plazo. Posteriormente, las condiciones vuelven a mostrarse antes de confirmar el crédito.

---

## Momento crítico 2 · Confirmación y desembolso

**Situación:**  
Se revisan las condiciones antes de confirmar el crédito.

**Riesgo:**  
Confirmar información incorrecta puede producir una operación financiera con datos equivocados.

**Respuesta de diseño:**  
El prototipo incorpora una pantalla de confirmación donde se presentan las condiciones principales y existe la opción de regresar para corregir la información antes del desembolso.

---

## Momento crítico 3 · Registro del pago

**Situación:**  
El asesor registra el dinero recibido del cliente.

**Riesgo:**  
Puede ingresarse un monto incorrecto o producirse incertidumbre si se pierde la conexión durante la operación.

**Respuesta de diseño:**  
La interfaz muestra el monto y el desglose del pago. La estrategia de movilidad contempla el uso de una clave de idempotencia para evitar que un reintento genere un pago duplicado.

Después del registro se presenta un comprobante con la prelación aplicada:

1. Gastos.
2. Interés moratorio.
3. Interés corriente.
4. Capital.

---

## Momento crítico 4 · Cambio de tramo de mora

**Situación:**  
El crédito acumula suficientes días de atraso para encontrarse en un nuevo tramo de mora.

**Riesgo:**  
El cliente puede descubrir un monto diferente al esperado y no comprender la razón del cambio.

**Respuesta de diseño actual:**  
El detalle del crédito muestra el tramo actual. Desde esta pantalla se puede acceder al detalle de mora, donde se presentan los días de atraso, el tramo y el desglose correspondiente.

Para el caso M-3 utilizado en el prototipo se presentan 100 días de atraso y el cálculo separado por los tramos recorridos, permitiendo comprender cómo se obtiene el total de mora.

**Momento de comunicación actual:**  
Después de ocurrido el cambio de tramo, durante la consulta del detalle del crédito o del detalle de mora, principalmente con apoyo del asesor.

**Mejora futura:**  
Incorporar una advertencia antes de que el crédito cambie al siguiente tramo, de manera que el cliente pueda conocer anticipadamente el efecto de continuar en atraso.

---

# 8. Fundamentación

Las personas, restricciones y necesidades descritas fueron construidas a partir del contexto de uso establecido para Crédito Vecino, S. A. y de los requerimientos funcionales y de experiencia definidos para el Proyecto 2.

No se presentan entrevistas como fuente de información, ya que para este ejercicio se utilizó principalmente el análisis del contexto y de los requerimientos proporcionados para el proyecto.

Las decisiones de diseño derivadas de este análisis priorizan:

- Claridad de la información financiera.
- Prevención de errores monetarios.
- Uso desde dispositivos móviles para el asesor.
- Adaptación a conectividad intermitente.
- Explicación del cálculo de mora.
- Transparencia en la aplicación de pagos.
- Visualización resumida y detallada para gerencia.

---

# 9. Conclusión de E1

La investigación permitió diferenciar tres contextos principales de uso: las operaciones móviles y de campo de Melannie como asesora, la necesidad de comprensión y transparencia de Willi como cliente, y el análisis administrativo y financiero realizado por Cristian desde gerencia.

El Journey Map permitió identificar puntos de dolor relacionados con conectividad, captura de información, confirmación de operaciones financieras, cambio de tramo de mora y registro de pagos.

Estos hallazgos fueron utilizados como base para definir la arquitectura de información, los wireframes y posteriormente el prototipo navegable de alta fidelidad.