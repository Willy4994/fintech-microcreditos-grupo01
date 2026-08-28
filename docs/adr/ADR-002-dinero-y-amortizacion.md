# ADR-002: Dinero en centavos y amortización francesa decimal

## Estado

Aceptada.

## Fecha

27/08/2026.

## Contexto

Los importes no pueden sufrir errores de punto flotante. El caso obligatorio requiere redondeo medio hacia arriba en cada cuota, ajuste de la última cuota, suma exacta de amortizaciones y saldo final cero. Las tasas contienen fracciones y requieren precisión decimal.

## Decisión

`Dinero` almacena un `number` que representa centavos enteros y lleva explícitamente la moneda. Las operaciones entre monedas diferentes se rechazan. Las tasas y los cálculos intermedios utilizan `decimal.js`. Cada resultado monetario vuelve a `Dinero` mediante redondeo a dos decimales con `ROUND_HALF_UP`.

El método inicial de amortización es Strategy mediante `MetodoAmortizacion`; `AmortizacionFrancesa` calcula la cuota fija y ajusta la última amortización al saldo pendiente exacto.

Se descartó almacenar montos como `number` expresado en quetzales porque introduce punto flotante. También se descartó usar exclusivamente `Decimal` dentro de `Dinero`, porque los centavos enteros ofrecen una representación simple, exacta y compatible con los movimientos contables del alcance actual.

## Consecuencias

Positivas:

- Sumas y restas monetarias exactas en centavos.
- Redondeo explícito y reproducible.
- Imposibilidad de mezclar monedas silenciosamente.
- La tabla obligatoria termina en Q0.00 y amortiza exactamente Q10,000.00.

Negativas:

- Todo cálculo con tasas debe convertir temporalmente el importe a `Decimal`.
- `obtenerMonto()` solo puede usarse para presentación, nunca para cálculo financiero.
- Debe vigilarse el límite de enteros seguros de JavaScript para importes extremadamente grandes.
