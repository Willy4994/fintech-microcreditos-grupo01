Análisis de cohesión y acoplamiento

1. Objetivo

La arquitectura del Sistema de Gestión de Microcrédito busca mantener alta cohesión dentro de cada módulo y bajo acoplamiento entre módulos.

La alta cohesión permite que los elementos agrupados dentro de un módulo colaboren alrededor de una responsabilidad claramente definida. El bajo acoplamiento reduce las dependencias innecesarias y permite modificar una parte del sistema con un impacto limitado sobre las demás.

⸻

2. Originación

Responsabilidad principal: administrar el proceso desde el registro del cliente hasta el desembolso del crédito.

Cohesión: Alta

Las clases y casos de uso del módulo están relacionados con el nacimiento del crédito:

* Cliente
* SolicitudCredito
* EvaluarSolicitud
* DesembolsarCredito

No se incluyen responsabilidades relacionadas con pagos, mora o cierres.

Acoplamiento: Bajo

Originación utiliza servicios del módulo de Cálculo Financiero para generar el plan de amortización, pero no necesita conocer la implementación concreta del algoritmo.

La persistencia se realiza mediante interfaces de repositorio y no mediante acceso directo a PostgreSQL.

⸻

3. Cálculo Financiero

Responsabilidad principal: ejecutar las reglas matemáticas y financieras del dominio.

Cohesión: Muy alta

Sus componentes están relacionados exclusivamente con cálculos financieros:

* Dinero
* Cuota
* PlanAmortizacion
* MetodoAmortizacion
* AmortizacionFrancesa
* CalculadoraMora

El módulo concentra reglas como redondeo, amortización e interés moratorio.

Acoplamiento: Muy bajo

No depende de:

* PostgreSQL;
* API REST;
* Express o Fastify;
* interfaz gráfica;
* MCP;
* Chat.

Esta independencia permite ejecutar las pruebas financieras sin levantar infraestructura.

⸻

4. Cartera y Cobros

Responsabilidad principal: administrar pagos, movimientos, mora y regularización de los créditos.

Cohesión: Alta

Sus componentes participan en el procesamiento de obligaciones y pagos:

* Pago
* Movimiento
* PrelacionPago
* RegistrarPago
* aplicadores de la cadena de prelación.

La prelación se mantiene dentro de este módulo porque corresponde directamente al procesamiento del pago.

Acoplamiento: Bajo

Utiliza Cálculo Financiero para operaciones relacionadas con dinero y mora.

La persistencia se realiza mediante puertos como:

* RepositorioCreditos
* RepositorioMovimientos

La fecha de corte se obtiene mediante el puerto Reloj, evitando dependencia directa de la fecha del sistema.

⸻

5. Cierres

Responsabilidad principal: consolidar y congelar las cifras financieras de un período.

Cohesión: Alta

Agrupa operaciones relacionadas con:

* cierre diario;
* cierre mensual;
* cartera activa;
* cartera en riesgo;
* incobrables;
* provisiones;
* vencimientos.

Componentes principales:

* Cierre
* CarteraRiesgo
* GenerarCierre
* ConsultarCarteraEnRiesgo

Acoplamiento: Bajo

El módulo consulta información mediante interfaces y utiliza movimientos existentes para reconstruir cifras.

No modifica directamente las reglas internas de Originación ni de Cálculo Financiero.

La dependencia del tiempo se abstrae mediante Reloj.

⸻

6. Contratos / API

Responsabilidad principal: permitir que consumidores externos invoquen los casos de uso.

Cohesión: Alta

Los elementos del módulo están relacionados exclusivamente con la entrada y salida del sistema:

* validación de solicitudes;
* transformación de datos;
* invocación de casos de uso;
* construcción de respuestas.

Acoplamiento: Bajo

El módulo depende de los puertos de aplicación y no accede directamente a entidades de persistencia.

Esto permite incorporar distintos adaptadores primarios, por ejemplo:

* API REST;
* servidor MCP;
* Chat;
* interfaz web.

Todos pueden reutilizar los mismos casos de uso.

⸻

7. Infraestructura

Responsabilidad principal: implementar los mecanismos técnicos requeridos por los puertos secundarios.

Ejemplos:

* PostgreSQL;
* repositorios concretos;
* RelojSistema;
* generadores de identificadores.

Cohesión: Alta

Los componentes están relacionados con detalles técnicos externos al dominio.

Acoplamiento controlado

Infraestructura conoce e implementa las interfaces definidas por el núcleo, pero el núcleo no depende de las implementaciones de infraestructura.

La dirección de dependencia se mantiene hacia las abstracciones.

⸻

8. Resumen

Módulo	Cohesión	Acoplamiento	Razón principal
Originación	Alta	Bajo	Concentra el proceso de creación y desembolso del crédito.
Cálculo Financiero	Muy alta	Muy bajo	Contiene cálculos puros y no depende de infraestructura.
Cartera y Cobros	Alta	Bajo	Concentra pagos, movimientos, mora y regularización.
Cierres	Alta	Bajo	Consolida información financiera mediante interfaces.
Contratos / API	Alta	Bajo	Adapta consumidores externos hacia casos de uso.
Infraestructura	Alta	Controlado	Implementa detalles técnicos detrás de puertos secundarios.

⸻

9. Conclusión

El diseño busca que cada módulo tenga una responsabilidad claramente delimitada y que la comunicación entre módulos ocurra mediante contratos explícitos.

La principal decisión para reducir el acoplamiento es aplicar el principio de inversión de dependencias de la arquitectura hexagonal: el dominio y los casos de uso no dependen de PostgreSQL, HTTP, MCP u otras tecnologías concretas.

Esta separación también permite que el núcleo financiero desarrollado y probado en el Proyecto 1 continúe siendo utilizado cuando se incorporen nuevos adaptadores en etapas posteriores.
