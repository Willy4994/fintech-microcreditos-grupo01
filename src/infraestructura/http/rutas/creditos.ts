import { Router } from "express";

import {
  obtenerCreditos,
  obtenerCreditoPorId
} from "../../persistencia/repositorios/CreditoRepositorio.js";

import { ServicioAmortizacion } from "../../../aplicacion/servicios/ServicioAmortizacion.js";

import {
  obtenerPagosPorCredito,
  obtenerPagosPorCreditoHastaFecha
} from "../../persistencia/repositorios/PagoRepositorio.js";

import { ServicioEstadoCuenta } from "../../../aplicacion/servicios/ServicioEstadoCuenta.js";

export const rutasCreditos = Router();

const servicioAmortizacion = new ServicioAmortizacion();

// ======================================================
// GET /api/creditos
// ======================================================

rutasCreditos.get("/", async (_req, res) => {
  try {
    const creditos = await obtenerCreditos();

    res.json(creditos);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "No se pudieron consultar los crÃ©ditos"
    });
  }
});

// ======================================================
// GET /api/creditos/:id
// ======================================================

rutasCreditos.get("/:id", async (req, res) => {
  try {
    const idCredito = String(req.params.id);
    const credito = await obtenerCreditoPorId(idCredito);

    if (!credito) {
      res.status(404).json({
        error: "CrÃ©dito no encontrado"
      });
      return;
    }

    res.json(credito);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "No se pudo consultar el crÃ©dito"
    });
  }
});

// ======================================================
// GET /api/creditos/:id/amortizacion
// ======================================================

rutasCreditos.get("/:id/amortizacion", async (req, res) => {
  try {
    const idCredito = String(req.params.id);
    const credito = await obtenerCreditoPorId(idCredito);

    if (!credito) {
      res.status(404).json({
        error: "CrÃ©dito no encontrado"
      });
      return;
    }

    const resultado = await servicioAmortizacion.generarPlan(
      idCredito
    );

    res.json(resultado);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "No se pudo generar el plan de amortizaciÃ³n"
    });
  }
});

// ======================================================
// GET /api/creditos/:id/pagos
// ======================================================

rutasCreditos.get("/:id/pagos", async (req, res) => {
  try {
    const idCredito = String(req.params.id);

    const credito = await obtenerCreditoPorId(idCredito);

    if (!credito) {
      res.status(404).json({
        error: "CrÃ©dito no encontrado"
      });
      return;
    }

    const pagos = await obtenerPagosPorCredito(idCredito);

    const totalCentavos = pagos.reduce(
      (acumulado, pago) =>
        acumulado + BigInt(pago.monto_centavos),
      0n
    );

    res.json({
      id_credito: idCredito,
      cantidad_pagos: pagos.length,
      total_pagado_centavos: totalCentavos.toString(),
      pagos
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "No se pudieron consultar los pagos"
    });
  }
});

// ======================================================
// GET /api/creditos/:id/pagos-historicos?fecha=YYYY-MM-DD
// ======================================================

rutasCreditos.get("/:id/pagos-historicos", async (req, res) => {
  try {
    const idCredito = String(req.params.id);
    const fechaCorte = req.query.fecha;

    // Validar formato de fecha
    if (
      typeof fechaCorte !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fechaCorte)
    ) {
      res.status(400).json({
        error: "Debe proporcionar una fecha con formato YYYY-MM-DD"
      });
      return;
    }

    // Validar fecha real
    const fecha = new Date(`${fechaCorte}T00:00:00.000Z`);

    if (
      Number.isNaN(fecha.getTime()) ||
      fecha.toISOString().slice(0, 10) !== fechaCorte
    ) {
      res.status(400).json({
        error: "La fecha proporcionada no existe"
      });
      return;
    }

    // Verificar existencia del crÃ©dito
    const credito = await obtenerCreditoPorId(idCredito);

    if (!credito) {
      res.status(404).json({
        error: "CrÃ©dito no encontrado"
      });
      return;
    }

    // Consultar pagos histÃ³ricos
    const pagos = await obtenerPagosPorCreditoHastaFecha(
      idCredito,
      fechaCorte
    );

    // Calcular total histÃ³rico
    const totalCentavos = pagos.reduce(
      (acumulado, pago) =>
        acumulado + BigInt(pago.monto_centavos),
      0n
    );

    res.json({
      id_credito: idCredito,
      fecha_corte: fechaCorte,
      cantidad_pagos: pagos.length,
      total_pagado_centavos: totalCentavos.toString(),
      pagos
    });
  } catch (error) {
  console.error("Error al consultar pagos histÃ³ricos:", error);

  res.status(500).json({
    error: "No se pudieron consultar los pagos histÃ³ricos"
  });
}
});

// ======================================================
// GET /api/creditos/:id/estado-cuenta?fecha=YYYY-MM-DD
// ======================================================

rutasCreditos.get("/:id/estado-cuenta", async (req, res) => {
  try {
    const idCredito = String(req.params.id);
    const fechaCorte = req.query.fecha;

    if (
      typeof fechaCorte !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fechaCorte)
    ) {
      res.status(400).json({
        error: "Debe proporcionar una fecha válida con formato YYYY-MM-DD"
      });
      return;
    }

    const fecha = new Date(`${fechaCorte}T00:00:00.000Z`);

    if (
      Number.isNaN(fecha.getTime()) ||
      fecha.toISOString().slice(0, 10) !== fechaCorte
    ) {
      res.status(400).json({
        error: "La fecha proporcionada no existe"
      });
      return;
    }

    const servicio = new ServicioEstadoCuenta();

    const resultado = await servicio.consultar(
      idCredito,
      fechaCorte
    );

    if (!resultado) {
      res.status(404).json({
        error: "Crédito no encontrado"
      });
      return;
    }

    res.json(resultado);

  } catch (error) {
    console.error("Error al consultar estado de cuenta:", error);

    res.status(500).json({
      error: "No se pudo consultar el estado de cuenta"
    });
  }
});
