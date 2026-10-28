import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  obtenerCreditoPorId: vi.fn(),
  obtenerPagosPorCreditoHastaFecha: vi.fn(),
  obtenerPoliticaPorId: vi.fn(),
  obtenerConfiguracionFinanciera: vi.fn(),
  generarPlan: vi.fn(),
}));

vi.mock("../../src/infraestructura/persistencia/repositorios/CreditoRepositorio.js", () => ({
  obtenerCreditoPorId: mocks.obtenerCreditoPorId,
}));

vi.mock("../../src/infraestructura/persistencia/repositorios/PagoRepositorio.js", () => ({
  obtenerPagosPorCreditoHastaFecha: mocks.obtenerPagosPorCreditoHastaFecha,
}));

vi.mock("../../src/infraestructura/persistencia/repositorios/PoliticaRepositorio.js", () => ({
  obtenerPoliticaPorId: mocks.obtenerPoliticaPorId,
  obtenerConfiguracionFinanciera: mocks.obtenerConfiguracionFinanciera,
}));

vi.mock("../../src/aplicacion/servicios/ServicioAmortizacion.js", () => ({
  ServicioAmortizacion: class {
    generarPlan = mocks.generarPlan;
  },
}));

import { ServicioEstadoCuenta } from "../../src/aplicacion/servicios/ServicioEstadoCuenta.js";

describe("ServicioEstadoCuenta", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.obtenerCreditoPorId.mockResolvedValue({
      id_credito: "CV-TEST-001",
      nombre_cliente: "Cliente de prueba",
      id_politica: "POL-2024-01",
      capital_centavos: "100000",
    });

    mocks.obtenerPoliticaPorId.mockResolvedValue({
      tipo: "plana",
      configuracion: {
        tna_bps: 2400,
      },
    });

    mocks.obtenerConfiguracionFinanciera.mockResolvedValue({
      base_conteo: "ACTUAL_360",
      parametros: {},
    });

    mocks.generarPlan.mockResolvedValue({
      fecha_desembolso: "2026-01-01",
      cuotas: [
        {
          numero: 1,
          fecha_vencimiento: "2026-02-01",
          capital_centavos: 50000,
          interes_centavos: 3000,
        },
        {
          numero: 2,
          fecha_vencimiento: "2026-03-01",
          capital_centavos: 50000,
          interes_centavos: 1500,
        },
      ],
    });

    mocks.obtenerPagosPorCreditoHastaFecha.mockResolvedValue([]);
  });

  it("retorna null cuando el crédito no existe", async () => {
    mocks.obtenerCreditoPorId.mockResolvedValue(null);

    const resultado = await new ServicioEstadoCuenta().consultar(
      "NO-EXISTE",
      "2026-03-15"
    );

    expect(resultado).toBeNull();
  });

  it("rechaza fechas inválidas", async () => {
    await expect(
      new ServicioEstadoCuenta().consultar(
        "CV-TEST-001",
        "2026-02-30"
      )
    ).rejects.toThrow("La fecha de corte no es válida.");
  });

  it("rechaza fechas anteriores al desembolso", async () => {
    await expect(
      new ServicioEstadoCuenta().consultar(
        "CV-TEST-001",
        "2025-12-31"
      )
    ).rejects.toThrow(
      "La fecha de corte no puede ser anterior al desembolso."
    );
  });

  it("conserva el capital original cuando no existen pagos", async () => {
    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-01-15"
    );

    expect(resultado).not.toBeNull();
    expect(resultado!.capital_original_centavos).toBe(100000);
    expect(resultado!.capital_pendiente_centavos).toBe(100000);
    expect(resultado!.cantidad_pagos_aplicados).toBe(0);
  });

  it("registra mora cuando existe un pago atrasado", async () => {
    mocks.obtenerPagosPorCreditoHastaFecha.mockResolvedValue([
      {
        id_pago: "P-001",
        fecha: "2026-02-07",
        monto_centavos: "53200",
      },
    ]);

    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-02-07"
    );

    expect(resultado).not.toBeNull();
    expect(resultado!.cantidad_pagos_aplicados).toBe(1);

    const pago = resultado!.movimientos_reconstruidos[0];

if (!pago) {
  throw new Error("No se encontró el movimiento del pago.");
}

    expect(pago.interes_moratorio_centavos).toBeGreaterThan(0);
    expect(pago.capital_centavos).toBeGreaterThan(0);
    expect(pago.excedente_centavos).toBeGreaterThanOrEqual(0);
  });

  it("respeta la prelación de pagos", async () => {
    mocks.obtenerPagosPorCreditoHastaFecha.mockResolvedValue([
      {
        id_pago: "P-002",
        fecha: "2026-02-07",
        monto_centavos: "1000",
      },
    ]);

    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-02-07"
    );

    expect(resultado).not.toBeNull();

    const pago = resultado!.movimientos_reconstruidos[0];

if (!pago) {
  throw new Error("No se encontró el movimiento del pago.");
}

    expect(pago.interes_moratorio_centavos).toBeGreaterThan(0);
    expect(pago.interes_corriente_centavos).toBeGreaterThanOrEqual(0);
    expect(pago.capital_centavos).toBe(0);
  });

  it("mantiene la igualdad entre el saldo y sus componentes", async () => {
    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-03-15"
    );

    expect(resultado).not.toBeNull();

    const suma =
      resultado!.capital_pendiente_centavos +
      resultado!.interes_corriente_centavos +
      resultado!.interes_moratorio_centavos +
      resultado!.gastos_cobranza_centavos;

    expect(resultado!.saldo_total_centavos).toBe(suma);
  });

  it("no modifica los datos cuando se consulta dos veces", async () => {
    const servicio = new ServicioEstadoCuenta();

    const primero = await servicio.consultar(
      "CV-TEST-001",
      "2026-03-15"
    );

    const segundo = await servicio.consultar(
      "CV-TEST-001",
      "2026-03-15"
    );

    expect(segundo).toEqual(primero);
  });

it("calcula la mora exacta por seis días de atraso", async () => {
    mocks.obtenerPagosPorCreditoHastaFecha.mockResolvedValue([
      {
        id_pago: "P-MORA-001",
        fecha: "2026-02-07",
        monto_centavos: "53000",
      },
    ]);

    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-02-07"
    );

    expect(resultado).not.toBeNull();

    const pago = resultado!.movimientos_reconstruidos[0];

    if (!pago) {
      throw new Error("No se encontró el movimiento del pago.");
    }

    // Q500 de capital vencido, 24% anual, seis días y base 360.
    // Mora = 50000 × 0.24 × 6 / 360 = 200 centavos.
    expect(pago.interes_moratorio_centavos).toBe(200);
    expect(pago.interes_corriente_centavos).toBe(3000);
    expect(pago.capital_centavos).toBe(49800);
    expect(pago.excedente_centavos).toBe(0);

    expect(resultado!.capital_pendiente_centavos).toBe(50200);
    expect(resultado!.interes_moratorio_centavos).toBe(0);
  });

  it("calcula mora sobre el capital restante después de un pago parcial", async () => {
    mocks.obtenerPagosPorCreditoHastaFecha.mockResolvedValue([
      {
        id_pago: "P-PARCIAL-001",
        fecha: "2026-02-01",
        monto_centavos: "28000",
      },
      {
        id_pago: "P-PARCIAL-002",
        fecha: "2026-02-07",
        monto_centavos: "25000",
      },
    ]);

    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-02-07"
    );

    expect(resultado).not.toBeNull();

    const [primerPago, segundoPago] =
      resultado!.movimientos_reconstruidos;

    if (!primerPago || !segundoPago) {
      throw new Error("No se encontraron los pagos esperados.");
    }

    // Primer pago: Q30 de interés y Q250 de capital.
    expect(primerPago.interes_corriente_centavos).toBe(3000);
    expect(primerPago.capital_centavos).toBe(25000);
    expect(primerPago.interes_moratorio_centavos).toBe(0);

    // Segundo pago: mora sobre Q250 pendientes durante seis días.
    expect(segundoPago.interes_moratorio_centavos).toBe(100);
    expect(segundoPago.capital_centavos).toBe(24900);

    expect(resultado!.capital_pendiente_centavos).toBe(50100);
    expect(resultado!.cantidad_pagos_aplicados).toBe(2);
  });

  it("conserva la mora acumulada cuando un pago no alcanza para cubrirla", async () => {
    mocks.obtenerPagosPorCreditoHastaFecha.mockResolvedValue([
      {
        id_pago: "P-MORA-PARCIAL-001",
        fecha: "2026-02-07",
        monto_centavos: "100",
      },
    ]);

    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-02-07"
    );

    expect(resultado).not.toBeNull();

    const pago = resultado!.movimientos_reconstruidos[0];

    if (!pago) {
      throw new Error("No se encontró el movimiento del pago.");
    }

    expect(pago.interes_moratorio_centavos).toBe(100);
    expect(pago.interes_corriente_centavos).toBe(0);
    expect(pago.capital_centavos).toBe(0);

    expect(resultado!.interes_moratorio_centavos).toBe(100);
    expect(resultado!.capital_pendiente_centavos).toBe(100000);
  });

  it("conserva los centavos al distribuir un pago entre obligaciones", async () => {
    mocks.obtenerPagosPorCreditoHastaFecha.mockResolvedValue([
      {
        id_pago: "P-REDONDEO-001",
        fecha: "2026-02-07",
        monto_centavos: "53323",
      },
    ]);

    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-02-07"
    );

    expect(resultado).not.toBeNull();

    const pago = resultado!.movimientos_reconstruidos[0];

    if (!pago) {
      throw new Error("No se encontró el movimiento del pago.");
    }

    const totalDistribuido =
      pago.gastos_centavos +
      pago.interes_moratorio_centavos +
      pago.interes_corriente_centavos +
      pago.capital_centavos +
      pago.excedente_centavos;

    expect(totalDistribuido).toBe(pago.monto_centavos);
    expect(pago.interes_moratorio_centavos).toBe(200);
    expect(pago.interes_corriente_centavos).toBe(3000);
    expect(pago.capital_centavos).toBe(50000);
    expect(pago.excedente_centavos).toBe(123);
  });

it("excluye los pagos posteriores a la fecha de corte", async () => {
    mocks.obtenerPagosPorCreditoHastaFecha.mockResolvedValue([
      {
        id_pago: "P-HIST-001",
        fecha: "2026-02-01",
        monto_centavos: "28000",
      },
      {
        id_pago: "P-HIST-002",
        fecha: "2026-03-10",
        monto_centavos: "25000",
      },
    ]);

    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-02-15"
    );

    expect(resultado).not.toBeNull();
    expect(resultado!.cantidad_pagos_aplicados).toBe(1);
    expect(resultado!.movimientos_reconstruidos).toHaveLength(1);
    expect(resultado!.movimientos_reconstruidos[0]?.id_pago).toBe(
      "P-HIST-001"
    );
    expect(resultado!.capital_pendiente_centavos).toBe(75000);
  });

  it("procesa los pagos en orden cronológico", async () => {
    mocks.obtenerPagosPorCreditoHastaFecha.mockResolvedValue([
      {
        id_pago: "P-ORDEN-002",
        fecha: "2026-02-07",
        monto_centavos: "25000",
      },
      {
        id_pago: "P-ORDEN-001",
        fecha: "2026-02-01",
        monto_centavos: "28000",
      },
    ]);

    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-02-07"
    );

    expect(resultado).not.toBeNull();

    const movimientos = resultado!.movimientos_reconstruidos;

    expect(movimientos).toHaveLength(2);
    expect(movimientos[0]?.id_pago).toBe("P-ORDEN-001");
    expect(movimientos[1]?.id_pago).toBe("P-ORDEN-002");
    expect(resultado!.capital_pendiente_centavos).toBe(50100);
  });

  it("mantiene el mismo estado histórico aunque existan pagos posteriores", async () => {
    const servicio = new ServicioEstadoCuenta();

    mocks.obtenerPagosPorCreditoHastaFecha.mockResolvedValue([
      {
        id_pago: "P-CORTE-001",
        fecha: "2026-02-01",
        monto_centavos: "28000",
      },
    ]);

    const estadoInicial = await servicio.consultar(
      "CV-TEST-001",
      "2026-02-15"
    );

    mocks.obtenerPagosPorCreditoHastaFecha.mockResolvedValue([
      {
        id_pago: "P-CORTE-001",
        fecha: "2026-02-01",
        monto_centavos: "28000",
      },
      {
        id_pago: "P-CORTE-002",
        fecha: "2026-03-10",
        monto_centavos: "25000",
      },
    ]);

    const estadoPosterior = await servicio.consultar(
      "CV-TEST-001",
      "2026-02-15"
    );

    expect(estadoPosterior).toEqual(estadoInicial);
    expect(estadoPosterior!.cantidad_pagos_aplicados).toBe(1);
  });

  it("mantiene el capital pendiente dentro de los límites válidos", async () => {
    mocks.obtenerPagosPorCreditoHastaFecha.mockResolvedValue([
      {
        id_pago: "P-LIMITE-001",
        fecha: "2026-02-01",
        monto_centavos: "200000",
      },
    ]);

    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-02-15"
    );

    expect(resultado).not.toBeNull();

    expect(resultado!.capital_pendiente_centavos).toBeGreaterThanOrEqual(0);
    expect(resultado!.capital_pendiente_centavos).toBeLessThanOrEqual(
      resultado!.capital_original_centavos
    );

    expect(resultado!.capital_pendiente_centavos).toBe(50000);
    expect(resultado!.saldo_favor_centavos).toBe(147000);
  });

it("no genera gastos antes de 31 días de atraso", async () => {
    mocks.obtenerCreditoPorId.mockResolvedValue({
      id_credito: "CV-TEST-001",
      nombre_cliente: "Cliente de prueba",
      id_politica: "POL-2026-10",
      capital_centavos: "100000",
    });

    mocks.obtenerPoliticaPorId.mockResolvedValue({
      tipo: "escalonada",
      configuracion: {},
    });

    mocks.obtenerConfiguracionFinanciera.mockResolvedValue({
      base_conteo: "ACTUAL_360",
      parametros: {
        gasto_gestion_cobro: {
          dia_generacion: 31,
          monto_centavos: 2500,
          aplica_a_politicas: ["POL-2026-10"],
        },
      },
    });

    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-03-03"
    );

    expect(resultado).not.toBeNull();
    expect(resultado!.gastos_cobranza_centavos).toBe(0);
  });

  it("genera Q25 al alcanzar 31 días de atraso", async () => {
    mocks.obtenerCreditoPorId.mockResolvedValue({
      id_credito: "CV-TEST-001",
      nombre_cliente: "Cliente de prueba",
      id_politica: "POL-2026-10",
      capital_centavos: "100000",
    });

    mocks.obtenerPoliticaPorId.mockResolvedValue({
      tipo: "escalonada",
      configuracion: {},
    });

    mocks.obtenerConfiguracionFinanciera.mockResolvedValue({
      base_conteo: "ACTUAL_360",
      parametros: {
        gasto_gestion_cobro: {
          dia_generacion: 31,
          monto_centavos: 2500,
          aplica_a_politicas: ["POL-2026-10"],
        },
      },
    });

    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-03-04"
    );

    expect(resultado).not.toBeNull();
    expect(resultado!.gastos_cobranza_centavos).toBe(2500);
  });

  it("genera gastos independientes por dos cuotas vencidas", async () => {
    mocks.obtenerCreditoPorId.mockResolvedValue({
      id_credito: "CV-TEST-001",
      nombre_cliente: "Cliente de prueba",
      id_politica: "POL-2026-10",
      capital_centavos: "100000",
    });

    mocks.obtenerPoliticaPorId.mockResolvedValue({
      tipo: "escalonada",
      configuracion: {},
    });

    mocks.obtenerConfiguracionFinanciera.mockResolvedValue({
      base_conteo: "ACTUAL_360",
      parametros: {
        gasto_gestion_cobro: {
          dia_generacion: 31,
          monto_centavos: 2500,
          aplica_a_politicas: ["POL-2026-10"],
        },
      },
    });

    const resultado = await new ServicioEstadoCuenta().consultar(
      "CV-TEST-001",
      "2026-04-02"
    );

    expect(resultado).not.toBeNull();
    expect(resultado!.gastos_cobranza_centavos).toBe(5000);
  });

});