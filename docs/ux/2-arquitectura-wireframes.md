# E2 · Arquitectura de información y wireframes

## Sistema de Gestión de Microcrédito — Crédito Vecino, S. A.

# 1. Mapa de navegación

El mapa de navegación se organiza de acuerdo con los tres perfiles
principales del sistema: asesor de crédito, cliente y gerencia.

## Asesor de crédito

Inicio
├── Clientes
│   ├── Buscar cliente
│   └── Detalle del crédito
│       ├── Plan de amortización
│       ├── Detalle de mora
│       └── Registrar pago
│           └── Comprobante de pago
│
└── Nueva solicitud
    ├── Datos de la solicitud
    ├── Simulación del plan
    ├── Confirmación
    └── Desembolso

## Cliente

Detalle del crédito
├── Saldo actual
├── Próxima cuota
├── Estado del crédito
├── Plan de amortización
└── Detalle de mora

## Gerencia / Comité

Tablero gerencial
├── Desembolsos
├── Recuperaciones
├── Cartera en mora
├── Cartera en riesgo
│   ├── Desglose por tramo
│   └── Detalle de créditos del tramo
├── Incobrables
└── Cierres
    ├── Cierre diario
    └── Cierre mensual

# 2. Flujos principales

## Flujo 1 · Originación

Solicitud de crédito
→ Simulación del plan
→ Confirmación
→ Desembolso

## Flujo 2 · Cobro en campo

Buscar cliente
→ Detalle del crédito
→ Detalle de mora
→ Registrar pago
→ Comprobante de pago

## Flujo 3 · Consulta gerencial

Tablero gerencial
→ Cartera en riesgo por tramo
→ Detalle de créditos del tramo

# 3. Correspondencia entre casos de uso y pantallas

La interfaz del Proyecto 2 mantiene coherencia con las operaciones
principales definidas en el Proyecto 1.

| Puerto primario / Caso de uso P1 | Pantalla P2 |
|---|---|
| RegistrarCliente | Alta de cliente |
| SolicitarCredito | Solicitud de crédito |
| EvaluarSolicitud | Bandeja del comité |
| DesembolsarCredito | Confirmación de desembolso |
| RegistrarPago | Registro de pago en campo |
| ConsultarCarteraEnRiesgo | Tablero gerencial |
| GenerarCierre | Cierre diario / mensual |

## Relación con el prototipo

### Alta de cliente
Permite al asesor registrar los datos necesarios de un nuevo cliente
antes de iniciar una solicitud de crédito.

### Solicitud de crédito
Permite ingresar el monto y plazo solicitado y posteriormente
visualizar la simulación del plan de amortización.

### Bandeja del comité
Permite consultar las solicitudes que requieren evaluación y acceder
a la información necesaria para tomar una decisión.

### Confirmación de desembolso
Presenta un resumen de las condiciones del crédito antes de realizar
el desembolso y solicita una confirmación explícita.

### Registro de pago en campo
Permite al asesor ingresar el monto recibido y revisar cómo se
distribuye entre gastos, mora, interés corriente y capital.

### Tablero gerencial
Permite consultar los principales indicadores de cartera,
incluyendo cartera en mora, cartera en riesgo y su desglose.

### Cierre diario / mensual
Permite ejecutar y consultar los cierres financieros, mostrando
claramente el período y el estado del cierre.