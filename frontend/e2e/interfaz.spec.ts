import { test, expect, type Page } from "@playwright/test";
const id = "CV-2026-0043";
async function preparar(page: Page, autenticado = true) {
  let pagado = false,
    persistido = false;
  let propuesta: Record<string, unknown> | null = null;
  const cuota = () => ({
    numero: 1,
    fecha_vencimiento: "2026-09-06",
    monto_programado_centavos: 54465,
    saldo_programado_centavos: 953035,
    capital_programado_centavos: 46965,
    capital_pagado_centavos: pagado ? 46965 : 0,
    interes_pagado_centavos: pagado ? 7500 : 0,
    capital_centavos: pagado ? 0 : 46965,
    interes_programado_centavos: 7500,
    interes_corriente_centavos: pagado ? 0 : 7500,
    interes_moratorio_centavos: pagado ? 0 : 1722,
    gastos_centavos: 0,
    total_exigible_centavos: pagado ? 0 : 56187,
    dias_atraso: pagado ? 0 : 55,
    tramo: pagado ? "SIN_MORA" : "MORA_2",
    pagada: pagado,
    base_conteo: "Actual/360",
    mora_generada_centavos: 1722,
    desglose_mora: [
      {
        desde: "2026-09-07",
        hasta: "2026-10-31",
        capital_centavos: 46965,
        dias: 55,
        tasa_bps: 2400,
        tramo: "plana",
        centavos_sin_redondear: "1722.05",
        monto_centavos: 1722,
      },
    ],
  });
  const resumen = {
    fecha_corte: "2026-10-31",
    cartera_activa_centavos: 29760634,
    cartera_mora_centavos: 4638169,
    cartera_mora_porcentaje: 15.584913,
    cartera_riesgo_centavos: 3550823,
    cartera_riesgo_porcentaje: 11.931275,
    incobrable_mes_centavos: 233348,
    desglose: [
      { tramo: "MORA_2", capital_centavos: 700000, porcentaje: 2.3521 },
      { tramo: "MORA_3", capital_centavos: 195426, porcentaje: 0.656659 },
      { tramo: "VENCIDO", capital_centavos: 430482, porcentaje: 1.446481 },
      {
        tramo: "REESTRUCTURADO",
        capital_centavos: 2224915,
        porcentaje: 7.476034,
      },
    ],
  };
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      ruta = url.pathname,
      metodo = req.method();
    const body = metodo === "POST" ? req.postDataJSON() : {};
    const ok = (json: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(json),
      });
    if (ruta === "/api/sesion") {
      if (metodo === "POST") {
        autenticado = true;
        return ok({ actor: body.actor, perfil: body.perfil });
      }
      return ok(
        autenticado
          ? { actor: "Willi", perfil: "gerencia" }
          : { codigo: "SESION_REQUERIDA" },
        autenticado ? 200 : 401,
      );
    }
    if (ruta === "/api/clientes/etiquetas")
      return ok([
        { id_cliente: "CL-001", nombre_completo: "Cliente de prueba" },
      ]);
    if (ruta === "/api/aprobaciones") return ok([]);
    if (ruta === "/api/cartera") return ok(resumen);
    if (ruta === "/api/cartera/creditos")
      return ok([
        {
          id_credito: id,
          id_cliente: "CL-001",
          id_asesor: "AS-01",
          id_politica: "POL-2024-01",
          fecha_desembolso: "2026-08-06",
          capital_centavos: "1000000",
          plazo_meses: 12,
          tna_bps: 3600,
          reestructurado: false,
          estado: "EN_MORA",
          tramo: "MORA_2",
          dias_atraso: 55,
          capital_pendiente_centavos: 1000000,
        },
      ]);
    if (ruta === "/api/morosos")
      return ok([
        {
          id_credito: id,
          dias_atraso: 55,
          tramo: "MORA_2",
          saldo_centavos: 1000000,
        },
      ]);
    if (ruta === "/api/cierres") {
      if (metodo === "POST") persistido = true;
      return ok({
        desde: body.desde ?? url.searchParams.get("desde"),
        hasta: body.hasta ?? url.searchParams.get("hasta"),
        persistido,
        desembolsos_centavos: 4100000,
        interes_reconocido_periodo_centavos: 834981,
        recuperaciones: {
          gastos_centavos: 0,
          interes_moratorio_centavos: 1693,
          interes_corriente_centavos: 716289,
          capital_centavos: 2937468,
          total_centavos: 3655450,
        },
      });
    }
    if (ruta.includes("/mora/")) return ok(cuota());
    if (ruta.startsWith("/api/creditos/"))
      return ok({
        id_credito: id,
        id_cliente: "CL-001",
        id_asesor: "AS-01",
        id_politica: "POL-2024-01",
        fecha_corte: "2026-10-31",
        estado: pagado ? "VIGENTE" : "EN_MORA",
        tramo: pagado ? "SIN_MORA" : "MORA_2",
        dias_atraso: pagado ? 0 : 55,
        capital_pendiente_centavos: pagado ? 953035 : 1000000,
        cuotas_pagadas: pagado ? 1 : 0,
        cuotas_vencidas: pagado ? 0 : 1,
        proxima_cuota: null,
        cuotas: [cuota()],
        movimientos: pagado
          ? [
              {
                id_pago: "227",
                fecha: "2026-10-31",
                clave_idempotencia: propuesta?.clave_idempotencia,
                monto_centavos: 56187,
                gastos_centavos: 0,
                interes_moratorio_centavos: 1722,
                interes_corriente_centavos: 7500,
                capital_centavos: 46965,
                excedente_centavos: 0,
              },
            ]
          : [],
      });
    if (ruta === "/api/pagos/propuestas") {
      if (pagado) return ok({ estado: "YA_REGISTRADO", duplicado: true });
      if (body.monto_centavos !== 56187)
        return ok(
          {
            codigo: "MONTO_NO_EXACTO",
            mensaje: "El monto debe coincidir con la deuda exacta de la cuota",
            detalles: { monto_correcto_centavos: 56187 },
          },
          409,
        );
      propuesta = body;
      return ok(
        {
          id: "aprobacion-prueba",
          estado: "PENDIENTE",
          parametros: body,
          desglose: cuota(),
        },
        202,
      );
    }
    if (ruta.endsWith("/decision")) {
      pagado = body.aprobar;
      return ok({
        estado: body.aprobar ? "APROBADA" : "RECHAZADA",
        resultado: { registrado: pagado, duplicado: false },
      });
    }
    if (ruta === "/api/simulaciones")
      return ok(
        Array.from({ length: 12 }, (_, i) => ({
          numero: i + 1,
          fecha_vencimiento: `2027-${String(i + 1).padStart(2, "0")}-01`,
          capital_centavos: 70462,
          interes_centavos: 30000,
          monto_centavos: i === 11 ? 100463 : 100462,
          saldo_centavos: i === 11 ? 0 : 929538,
        })),
      );
    if (ruta === "/api/originaciones")
      return ok({ id_credito: body.id_credito, estado: "VIGENTE" }, 201);
    if (ruta === "/api/chat")
      return ok({
        sesion: "sesion-chat-prueba",
        fecha_corte: "2026-10-31",
        respuesta:
          "La política plana aplica al crédito de agosto: 24 % anual, Actual/360. [POL-2024-01:1]",
        evidencias: [
          {
            herramienta: "buscar_politicas",
            parametros: { fecha: "2026-10-31" },
            resultado: { content: [{ type: "text", text: "[]" }] },
          },
        ],
        fuentes: [
          {
            content: [
              {
                type: "text",
                text: JSON.stringify([
                  {
                    id: "POL-2024-01:1",
                    documento: "POL-2024-01",
                    titulo: "Política de mora plana",
                    contenido:
                      "Se aplica el 24 % nominal anual sobre capital en mora, base Actual/360.",
                    similitud: 0.9,
                  },
                ]),
              },
            ],
          },
        ],
      });
    return ok({ mensaje: "Ruta de prueba no contemplada: " + ruta }, 404);
  });
}
test("acceso y tablero con indicadores legibles", async ({ page }) => {
  await preparar(page, false);
  await page.goto("/");
  await page.getByLabel("Tu nombre").fill("Asesora Prueba");
  await page
    .getByLabel("Clave de acceso del equipo")
    .fill("credencial-de-prueba");
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tablero gerencial" }),
  ).toBeVisible();
  await expect(page.getByText("Q 297,606.34", { exact: false })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("consulta de mora, pago, aprobación explícita, comprobante y reintento", async ({
  page,
}) => {
  await preparar(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Créditos", exact: true }).click();
  await page.getByRole("button", { name: "Ver detalle" }).click();
  await page
    .getByRole("button", { name: "Detalle de la mora", exact: true })
    .click();
  await expect(
    page.getByText("Tramos recorridos", { exact: true }),
  ).toBeVisible();
  if ((page.viewportSize()?.width ?? 1440) < 600)
    await expect(page.getByText("55 días · Tasa anual: 24.00 %")).toBeVisible();
  else
    await expect(
      page.getByRole("cell", { name: "24.00 %", exact: true }),
    ).toBeVisible();
  await page.getByRole("button", { name: "Continuar al pago" }).click();
  await page.getByLabel("Monto recibido (Q)").fill("500");
  await page
    .getByRole("button", { name: "Revisar y solicitar aprobación" })
    .click();
  await expect(page.getByRole("alert")).toContainText("Monto correcto");
  await page.getByRole("button", { name: "Usar monto exacto" }).click();
  await page
    .getByRole("button", { name: "Revisar y solicitar aprobación" })
    .click();
  const dialogo = page.getByRole("dialog", {
    name: "Confirmación humana de pago",
  });
  await expect(dialogo).toBeVisible();
  await dialogo
    .getByRole("button", { name: "Confirmar y registrar pago" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Comprobante de pago" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Reintentar el último pago con la misma clave",
    })
    .click();
  await expect(page.getByRole("status")).toContainText("ya registrado");
});
test("originación: cliente, simulación de 12 cuotas y desembolso", async ({
  page,
}) => {
  await preparar(page);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nueva solicitud", exact: true })
    .click();
  await page.getByLabel("Identificador del cliente").fill("CL-9001");
  await page.getByLabel("Nombre completo").fill("Gerencia Demostración Gálvez");
  await page.getByLabel("Documento de identificación").fill("DPI-FICT-009001");
  await page.getByLabel("Municipio").fill("Guatemala");
  await page.getByRole("button", { name: "Continuar a condiciones" }).click();
  await page.getByLabel("Identificador del crédito").fill("CV-2026-9001");
  await page.getByRole("button", { name: "Simular y revisar plan" }).click();
  await expect(page.getByRole("row")).toHaveCount(13);
  await expect(page.getByRole("row").last()).toContainText("1,004.63");
  await page.getByRole("button", { name: "Continuar a confirmación" }).click();
  await page.getByRole("button", { name: "Confirmar y desembolsar" }).click();
  await expect(
    page.getByRole("heading", { name: "Crédito desembolsado" }),
  ).toBeVisible();
});
test("cierre requiere revisión y confirmación antes de guardar", async ({
  page,
}) => {
  await preparar(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Cierres", exact: true }).click();
  await page.getByLabel("Tipo de cierre").selectOption("mensual");
  await page.getByRole("button", { name: "Consultar período" }).click();
  await expect(page.getByText("2026-10-01 — 2026-10-31")).toBeVisible();
  await page.getByRole("button", { name: "Generar y guardar cierre" }).click();
  const dialogo = page.getByRole("dialog", {
    name: "Confirmar cierre",
    exact: true,
  });
  await expect(dialogo).toContainText("no podrás registrar pagos");
  await dialogo
    .getByRole("button", { name: "Confirmar cierre", exact: true })
    .click();
  await expect(
    page.getByText("Cierre guardado · cifras congeladas"),
  ).toBeVisible();
});
test("chat conserva contexto y permite abrir la fuente citada", async ({
  page,
}) => {
  await preparar(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Asistente", exact: true }).click();
  await page
    .getByLabel("Pregunta al asistente")
    .fill("Política de agosto de 2026");
  await page.getByRole("button", { name: "Enviar pregunta" }).click();
  await expect(
    page.getByRole("button", { name: "POL-2024-01:1", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "POL-2024-01:1", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Cerrar diálogo" }),
  ).toBeFocused();
  await expect(page.getByRole("dialog")).toContainText("sobre capital en mora");
  await page.keyboard.press("Escape");
  await page.getByLabel("Pregunta al asistente").fill("¿Y si es de octubre?");
  const peticion = page.waitForRequest(
    (r) =>
      r.url().endsWith("/api/chat") &&
      r.postDataJSON().pregunta === "¿Y si es de octubre?",
  );
  await page.getByRole("button", { name: "Enviar pregunta" }).click();
  expect((await peticion).postDataJSON().sesion).toBe("sesion-chat-prueba");
});
