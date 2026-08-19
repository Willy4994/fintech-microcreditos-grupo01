# Matriz de trazabilidad

| Requisito | Caso de uso | Clase / módulo |
|---|---|---|
| R1: Registrar y consultar clientes | Registrar cliente | Cliente · Originación |
| R2: Registrar solicitudes de crédito | Solicitar crédito | SolicitudCredito · Originación |
| R3: Evaluar y decidir solicitudes | Evaluar / aprobar solicitud | SolicitudCredito · Originación |
| R4: Desembolsar créditos con plan de amortización | Desembolsar crédito | Credito · PlanAmortizacion · Cuota · Dinero |
| R5: Registrar pagos aplicando prelación | Registrar pago de cuota | Pago · Movimiento · PrelacionPago · Credito |
| R6: Calcular mora e interés moratorio | Calcular mora | CalculadoraMora · Cuota · Credito |
| R7: Gestionar el ciclo de vida del crédito | Actualizar estado del crédito | Credito · EstadoCredito |
| R8: Generar cierres diarios y mensuales | Generar cierre | Cierre · Movimiento |
| R9: Calcular y consultar cartera en riesgo | Consultar cartera en riesgo | Cartera · Credito · Cierre |
| R10: Mantener trazabilidad financiera | Consultar movimientos / historial | Movimiento · Credito · Cierre |