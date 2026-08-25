Patrones de diseño aplicados

1. Value Object – Dinero

Ubicación: módulo de Cálculo Financiero.

Problema que resuelve:
Los importes monetarios no pueden representarse mediante Number en punto flotante debido a errores de precisión.

Aplicación:
Se utiliza un objeto de valor Dinero inmutable que encapsula el monto y la moneda.

Responsabilidades principales:

* sumar importes;
* restar importes;
* multiplicar por tasas;
* redondear a dos decimales;
* impedir operaciones entre monedas diferentes.

Las operaciones no modifican la instancia original, sino que devuelven un nuevo objeto Dinero.

⸻

2. Strategy – Método de amortización

Tipo: GoF.

Ubicación: módulo de Cálculo Financiero.

Problema que resuelve:
La política institucional puede cambiar el método utilizado para generar un plan de amortización.

Aplicación:
Se define la interfaz:

EstrategiaAmortizacion

La implementación inicial será:

AmortizacionFrancesa

El consumidor depende de la abstracción y no del algoritmo concreto.

Esto permite incorporar otra estrategia futura sin modificar los casos de uso que generan planes.

⸻

3. State – Ciclo de vida del crédito

Tipo: GoF.

Ubicación: módulo de Cartera y Cobros / dominio de Crédito.

Problema que resuelve:
Las operaciones permitidas dependen del estado actual del crédito.

El sistema debe impedir por diseño transiciones inválidas.

Ejemplos:

* un crédito SOLICITADO no puede recibir pagos;
* un crédito CANCELADO no puede entrar en mora;
* un crédito EN_MORA puede regularizarse y regresar a VIGENTE.

Aplicación:
Cada estado implementa el comportamiento permitido para el crédito.

Estados principales:

* Solicitado
* Aprobado
* Desembolsado
* Vigente
* EnMora
* Reestructurado
* Cancelado
* Rechazado
* Anulado
* Incobrable

El objeto Credito delega las operaciones dependientes del estado al objeto de estado actual.

⸻

4. Chain of Responsibility – Prelación de pagos

Tipo: GoF.

Ubicación: módulo de Cartera y Cobros.

Problema que resuelve:
Un pago debe distribuirse entre diferentes conceptos siguiendo un orden obligatorio.

La prelación definida es:

1. Gastos y comisiones.
2. Interés moratorio.
3. Interés corriente.
4. Capital.

Cada concepto consume únicamente el importe correspondiente y entrega el remanente al siguiente elemento de la cadena.

Aplicación:
La cadena puede estar formada por componentes como:

* AplicadorGastos
* AplicadorMoratorio
* AplicadorInteresCorriente
* AplicadorCapital

Cada componente implementa un contrato común y mantiene referencia al siguiente eslabón.

Esto evita una gran estructura condicional concentrada en un único método.

⸻

5. Repository – Persistencia

Ubicación: puertos secundarios de la arquitectura hexagonal.

Problema que resuelve:
El dominio y los casos de uso no deben depender directamente de PostgreSQL.

Aplicación:
Se definen interfaces como:

* RepositorioClientes
* RepositorioCreditos
* RepositorioMovimientos

Los casos de uso dependen de estas abstracciones.

En producción podrán utilizarse adaptadores PostgreSQL y en pruebas repositorios en memoria.

Esto mantiene la infraestructura separada del núcleo del sistema.

⸻

Relación entre los patrones

Los patrones no trabajan de forma aislada.

Por ejemplo, durante el registro de un pago:

1. Credito utiliza State para determinar si puede aceptar el pago.
2. La mora se calcula utilizando objetos Dinero.
3. Chain of Responsibility distribuye el pago según la prelación.
4. Repository registra los movimientos sin acoplar el caso de uso a PostgreSQL.

De forma similar, durante el desembolso:

1. Strategy selecciona la política de amortización.
2. El plan trabaja con objetos Dinero.
3. Repository permite persistir el crédito mediante un puerto secundario.

Los patrones se utilizan únicamente donde existe una variación o responsabilidad concreta del dominio, evitando agregar complejidad sin necesidad.