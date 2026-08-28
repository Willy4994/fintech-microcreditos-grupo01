Aplicación de principios SOLID y GRASP

1. Objetivo

El diseño del Sistema de Gestión de Microcrédito busca mantener las reglas financieras separadas de la infraestructura y distribuir las responsabilidades entre componentes cohesivos.

Los principios SOLID y GRASP se aplican sobre decisiones concretas del diseño y no únicamente como conceptos teóricos.

⸻

2. Principios SOLID

2.1 SRP — Principio de Responsabilidad Única

Cada componente debe tener una razón principal para cambiar.

Ejemplos dentro del diseño:

* Dinero representa y opera cantidades monetarias.
* AmortizacionFrancesa genera planes mediante el sistema francés.
* CalculadoraMora calcula interés moratorio y determina la clasificación derivada de mora.
* PrelacionPago distribuye un pago entre los conceptos adeudados.
* RegistrarPago coordina el caso de uso de registro de pagos.
* Cierre representa la información congelada de un cierre.

Esto evita concentrar cálculo financiero, persistencia y coordinación de casos de uso dentro de una misma clase.

⸻

2.2 OCP — Principio Abierto/Cerrado

Los componentes deben estar abiertos a extensión pero cerrados a modificaciones innecesarias.

El módulo de cálculo utiliza la interfaz:

MetodoAmortizacion

La implementación inicial es:

AmortizacionFrancesa

Si en el futuro la institución incorpora otro método de amortización, se puede crear una nueva estrategia sin modificar el consumidor del cálculo.

El mismo criterio puede aplicarse a políticas financieras versionadas, permitiendo sustituirlas sin modificar las entidades centrales.

⸻

2.3 LSP — Principio de Sustitución de Liskov

Las implementaciones de una abstracción deben poder sustituirse sin alterar el comportamiento esperado por sus consumidores.

Por ejemplo, cualquier implementación válida de MetodoAmortizacion debe producir un PlanAmortizacion que respete los invariantes establecidos por el dominio.

Entre ellos:

* ningún saldo de capital puede ser negativo;
* la suma de amortizaciones debe coincidir con el capital;
* el saldo después de la última cuota debe ser exactamente Q0.00.

El consumidor depende del contrato de MetodoAmortizacion, no de una implementación específica.

⸻

2.4 ISP — Principio de Segregación de Interfaces

Los consumidores no deben depender de operaciones que no utilizan.

Por esta razón se prefieren puertos específicos, por ejemplo:

* RegistrarPago
* DesembolsarCredito
* GenerarCierre
* ConsultarCarteraEnRiesgo

en lugar de una interfaz general que concentre todas las operaciones del sistema.

Lo mismo aplica a los puertos secundarios, que se separan según la responsabilidad requerida.

⸻

2.5 DIP — Principio de Inversión de Dependencias

Los casos de uso no deben depender directamente de implementaciones de infraestructura.

Por ejemplo, RegistrarPago puede necesitar consultar y almacenar créditos, pero no debe depender directamente de PostgreSQL.

Depende de una abstracción como:

RepositorioCreditos

Posteriormente, un adaptador de PostgreSQL puede implementar dicha interfaz.

En pruebas se puede utilizar otra implementación en memoria.

De forma similar, los cálculos dependientes de una fecha de corte utilizan el puerto Reloj en lugar de consultar directamente la fecha del sistema.

Esto permite utilizar un RelojFijo durante las pruebas y obtener resultados reproducibles.

⸻

3. Principios GRASP

3.1 Information Expert

Una responsabilidad debe asignarse al objeto que posee la información necesaria para realizarla.

Ejemplos:

* PlanAmortizacion conoce sus cuotas y puede determinar su última cuota y saldo final.
* Credito conoce su saldo, estado e historial necesario para validar determinadas operaciones.
* Cuota contiene los importes correspondientes a capital e interés de un período.

Esto evita trasladar innecesariamente la lógica hacia controladores externos.

⸻

3.2 Controller

Los eventos provenientes del exterior son recibidos por casos de uso que coordinan la operación.

Ejemplos:

* RegistrarPago
* DesembolsarCredito
* GenerarCierre

Estos componentes reciben la solicitud desde un adaptador primario y coordinan las entidades y servicios necesarios.

El controlador no realiza directamente los cálculos financieros.

⸻

3.3 Low Coupling

El sistema busca minimizar dependencias directas entre módulos y tecnologías.

El dominio no depende de:

* Express o Fastify;
* PostgreSQL;
* interfaz web;
* MCP;
* Chat.

Los casos de uso utilizan puertos para interactuar con recursos externos.

Esto permite sustituir adaptadores sin modificar las reglas del negocio.

⸻

3.4 High Cohesion

Cada módulo agrupa responsabilidades estrechamente relacionadas.

Por ejemplo:

Cálculo Financiero agrupa:

* Dinero;
* PlanAmortizacion;
* Cuota;
* AmortizacionFrancesa;
* CalculadoraMora.

Mientras que Cartera y Cobros agrupa:

* Pago;
* Movimiento;
* PrelacionPago;
* RegistrarPago.

Esta separación evita módulos con responsabilidades excesivamente diferentes.

⸻

3.5 Polymorphism

Cuando una operación puede variar según una política, se utiliza una abstracción en lugar de condicionales distribuidos.

MetodoAmortizacion permite utilizar diferentes algoritmos de amortización mediante implementaciones intercambiables.

El caso de uso que necesita generar el plan no necesita conocer los detalles internos del algoritmo seleccionado.

⸻

3.6 Protected Variations

Los elementos susceptibles a cambios se protegen mediante interfaces.

Ejemplos:

* cambios en persistencia → RepositorioCreditos;
* cambios en la fuente de fecha → Reloj;
* cambios en métodos de amortización → MetodoAmortizacion;
* cambios futuros en mecanismos de entrada → puertos de aplicación.

De esta forma, una variación tecnológica o institucional tiene un impacto limitado sobre el resto del sistema.

⸻

4. Relación con la arquitectura

La aplicación de SOLID y GRASP complementa la arquitectura hexagonal seleccionada.

SOLID guía principalmente la organización y dependencia entre clases e interfaces, mientras que GRASP ayuda a determinar dónde deben ubicarse las responsabilidades del dominio.

En conjunto permiten mantener un núcleo financiero:

* cohesivo;
* desacoplado;
* comprobable;
* extensible;
* independiente de infraestructura.

Estas características son especialmente importantes porque las reglas financieras deben mantenerse consistentes aunque cambien la base de datos, la interfaz de usuario o los mecanismos de integración del sistema.
