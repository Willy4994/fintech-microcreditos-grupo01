E3 – Diseño de Componentes y Principios

1. Descomposición en módulos

El Sistema de Gestión de Microcrédito se organiza como un monolito modular sobre arquitectura hexagonal. Cada módulo tiene una responsabilidad claramente definida y evita asumir funciones pertenecientes a otros contextos.

Originación

Responsabilidad: gestionar el ciclo inicial del crédito.

Incluye:

* registro y consulta de clientes;
* creación de solicitudes;
* evaluación de solicitudes;
* aprobación o rechazo;
* desembolso.

Interfaces principales:

* RegistrarCliente
* SolicitarCredito
* EvaluarSolicitud
* DesembolsarCredito

No le corresponde:

* calcular mora;
* registrar pagos;
* generar cierres;
* calcular cartera en riesgo.

⸻

Cálculo Financiero

Responsabilidad: realizar los cálculos financieros puros del dominio.

Incluye:

* representación de dinero;
* generación del plan de amortización francés;
* cálculo de interés corriente;
* cálculo de interés moratorio;
* redondeo;
* clasificación por días de atraso.

Componentes principales:

* Dinero
* PlanAmortizacion
* Cuota
* CalculadoraMora

No le corresponde:

* persistir información;
* consultar bases de datos;
* exponer endpoints;
* manejar autenticación.

Este módulo debe mantenerse libre de dependencias de infraestructura.

⸻

Cartera y Cobros

Responsabilidad: administrar pagos, saldos y situación de cartera.

Incluye:

* registro de pagos;
* aplicación de prelación;
* creación de movimientos financieros;
* actualización del saldo;
* regularización de créditos;
* clasificación de mora.

Interfaces principales:

* RegistrarPago
* ConsultarCredito
* AplicarPago

Componentes principales:

* Pago
* Movimiento
* PrelacionPago
* Cartera

No le corresponde:

* definir tasas;
* modificar políticas financieras;
* ejecutar cierres.

⸻

Cierres

Responsabilidad: consolidar y congelar información financiera según una fecha de corte.

Incluye:

* cierre diario;
* cierre mensual;
* cartera activa;
* cartera en riesgo;
* créditos incobrables;
* provisiones;
* vencimientos próximos.

Interfaces principales:

* GenerarCierre
* ConsultarCarteraEnRiesgo

Componentes principales:

* Cierre
* CarteraRiesgo

No le corresponde:

* modificar directamente créditos;
* registrar pagos;
* cambiar políticas financieras.

⸻

Contratos / API

Responsabilidad: exponer los casos de uso del sistema hacia consumidores externos.

Consumidores previstos:

* API REST;
* interfaz web;
* servidor MCP;
* Chat / asistente.

Este módulo únicamente adapta solicitudes externas hacia los casos de uso.

No le corresponde:

* contener reglas financieras;
* calcular intereses;
* modificar directamente entidades de dominio.

⸻

Dependencias entre módulos

La dirección general de dependencias es:

Adaptadores externos
        ↓
Casos de uso
        ↓
Dominio
        ↓
Puertos secundarios
        ↑
Adaptadores de infraestructura

El módulo de Cálculo Financiero permanece independiente de infraestructura y puede utilizarse directamente desde pruebas unitarias.

Los módulos no deben depender de implementaciones concretas como PostgreSQL o Express. Las dependencias externas se representan mediante puertos e interfaces.