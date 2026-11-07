import { useState } from "react";
import { ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";
import {
  api,
  post,
  centavos,
  mensajeError,
  ApiError,
  nombresTramos,
  type EstadoCredito,
  type PagoEntrada,
  type Propuesta,
  type Movimiento,
  type Sesion,
} from "../services/api";
import { useConsulta } from "../services/useConsulta";
import { formatearQuetzales as q } from "../services/cartera";
import { Cargando, ErrorMensaje, Desglose, TablaPlan } from "../components/UI";
import { AprobarPago } from "../components/AprobarPago";
function ultimoPago(id: string): PagoEntrada | null {
  try {
    const p = JSON.parse(
      localStorage.getItem("cv_ultimo_pago") ?? "null",
    ) as PagoEntrada | null;
    return p?.id_credito === id ? p : null;
  } catch {
    return null;
  }
}
export function DetalleCredito({
  id,
  fecha,
  sesion,
  volver,
  cambio,
}: {
  id: string;
  fecha: string;
  sesion: Sesion;
  volver: () => void;
  cambio: () => void;
}) {
  const [version, setVersion] = useState(0),
    [tab, setTab] = useState("detalle"),
    [numero, setNumero] = useState<number | null>(null),
    [monto, setMonto] = useState(""),
    [clave, setClave] = useState<string>(() => crypto.randomUUID()),
    [propuesta, setPropuesta] = useState<Propuesta | null>(null),
    [ocupado, setOcupado] = useState(false),
    [error, setError] = useState(""),
    [aviso, setAviso] = useState(""),
    [recibo, setRecibo] = useState<Movimiento | null>(null),
    [anterior, setAnterior] = useState(() => ultimoPago(id));
  const {
    datos: credito,
    cargando,
    error: errorCarga,
  } = useConsulta<EstadoCredito>(
    `/creditos/${encodeURIComponent(id)}?fecha=${fecha}`,
    version,
  );
  const { datos: cliente } = useConsulta<{
    id_cliente: string;
    nombre_completo: string;
  }>(`/creditos/${encodeURIComponent(id)}/cliente`);
  const cuota = credito?.cuotas.find(
    (c) =>
      c.numero ===
      (numero ?? credito.cuotas.find((c) => !c.pagada)?.numero ?? 1),
  );
  async function proponer(reintento?: PagoEntrada) {
    if (!cuota && !reintento) return;
    setOcupado(true);
    setError("");
    setAviso("");
    try {
      const entrada = reintento ?? {
        id_credito: id,
        cuota: cuota!.numero,
        fecha,
        monto_centavos: monto
          ? centavos(monto)
          : cuota!.total_exigible_centavos,
        clave_idempotencia: clave,
      };
      const p = await post<Propuesta>("/pagos/propuestas", entrada);
      if (p.estado === "YA_REGISTRADO") {
        setAviso("Pago ya registrado. La misma clave no genera otro cobro.");
        setPropuesta(null);
      } else {
        setPropuesta(p);
        localStorage.setItem("cv_ultimo_pago", JSON.stringify(entrada));
        setAnterior(entrada);
      }
    } catch (e) {
      setError(
        `${mensajeError(e)}${e instanceof ApiError && e.detalles?.monto_correcto_centavos !== undefined ? ` Monto correcto: ${q(e.detalles.monto_correcto_centavos)}.` : ""}`,
      );
    } finally {
      setOcupado(false);
    }
  }
  function seleccionarTab(t: string) {
    setTab(t);
    setError("");
    setAviso("");
  }
  return (
    <>
      <button className="volver" onClick={volver}>
        <ArrowLeft size={17} />
        Volver a créditos
      </button>
      <div className="titulo-pagina">
        <div>
          <span className="sobretexto">Consulta y cobro</span>
          <h2>{id}</h2>
          <p>Información al {fecha}</p>
        </div>
        <button
          className="boton-secundario"
          onClick={() => setVersion((v) => v + 1)}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>
      <ErrorMensaje mensaje={errorCarga} />
      {cargando && <Cargando />}
      {credito && (
        <>
          <div
            className="pestanas"
            role="group"
            aria-label="Secciones del crédito"
          >
            {[
              ["detalle", "Detalle del crédito"],
              ["plan", "Plan de amortización"],
              ["mora", "Detalle de la mora"],
              ["pago", "Registro de pago"],
            ].map(([t, n]) => (
              <button
                key={t}
                aria-pressed={tab === t}
                onClick={() => seleccionarTab(t)}
              >
                {n}
              </button>
            ))}
          </div>
          {tab === "detalle" && (
            <section className="panel panel-modulo">
              <div className="cabecera-panel">
                <h3>Estado del crédito</h3>
                <span
                  className={`etiqueta ${credito.estado === "INCOBRABLE" ? "peligro" : ""}`}
                >
                  {credito.estado.replaceAll("_", " ")}
                </span>
              </div>
              <div className="datos-grid">
                {[
                  ["Cliente", cliente?.nombre_completo ?? credito.id_cliente],
                  ["Asesor", credito.id_asesor],
                  ["Política", credito.id_politica],
                  ["Capital pendiente", q(credito.capital_pendiente_centavos)],
                  ["Días de atraso", credito.dias_atraso],
                  ["Tramo", nombresTramos[credito.tramo] ?? credito.tramo],
                  ["Cuotas pagadas", credito.cuotas_pagadas],
                  ["Cuotas vencidas", credito.cuotas_vencidas],
                ].map(([n, v]) => (
                  <div key={n}>
                    <span>{n}</span>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>
              <div className="destacado">
                <h3>Próxima cuota</h3>
                {credito.proxima_cuota ? (
                  <p>
                    Cuota {credito.proxima_cuota.numero} ·{" "}
                    {credito.proxima_cuota.fecha_vencimiento} ·{" "}
                    {q(credito.proxima_cuota.total_exigible_centavos)}
                  </p>
                ) : (
                  <p>No hay próximas cuotas pendientes.</p>
                )}
              </div>
              <div className="acciones">
                <button
                  className="boton-secundario"
                  onClick={() => seleccionarTab("mora")}
                >
                  Revisar mora
                </button>
                <button
                  className="boton-principal"
                  onClick={() => seleccionarTab("pago")}
                >
                  Registrar pago
                </button>
              </div>
            </section>
          )}
          {tab === "plan" && (
            <section className="panel panel-modulo">
              <h3>Plan de amortización</h3>
              <p>
                Capital e interés programados por el núcleo. La última cuota se
                ajusta por redondeo para cerrar el saldo del plan en cero.
              </p>
              <TablaPlan>
                <table>
                  <caption>
                    Cuotas programadas y saldo pendiente al {fecha}
                  </caption>
                  <thead>
                    <tr>
                      {[
                        "Cuota",
                        "Vencimiento",
                        "Cuota total",
                        "Capital programado",
                        "Interés programado",
                        "Saldo del plan",
                        "Capital pendiente",
                        "Estado",
                      ].map((n) => (
                        <th key={n}>{n}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {credito.cuotas.map((c) => (
                      <tr key={c.numero}>
                        <td>{c.numero}</td>
                        <td>{c.fecha_vencimiento}</td>
                        <td>{q(c.monto_programado_centavos)}</td>
                        <td>{q(c.capital_programado_centavos)}</td>
                        <td>{q(c.interes_programado_centavos)}</td>
                        <td>{q(c.saldo_programado_centavos)}</td>
                        <td>{q(c.capital_centavos)}</td>
                        <td>
                          {c.pagada
                            ? "Pagada"
                            : c.dias_atraso > 0
                              ? "Vencida"
                              : "Pendiente"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TablaPlan>
            </section>
          )}
          {(tab === "mora" || tab === "pago") && (
            <section className="panel panel-modulo">
              <div className="cabecera-panel">
                <h3>
                  {tab === "mora"
                    ? "Cómo se formó la mora"
                    : "Registrar pago de cuota"}
                </h3>
                <label>
                  Cuota
                  <select
                    value={cuota?.numero ?? 1}
                    onChange={(e) => {
                      setNumero(Number(e.target.value));
                      setMonto("");
                      setClave(crypto.randomUUID());
                      setPropuesta(null);
                      setError("");
                    }}
                  >
                    {credito.cuotas.map((c) => (
                      <option key={c.numero} value={c.numero}>
                        {c.numero} · {c.fecha_vencimiento}
                        {c.pagada ? " · Pagada" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {cuota && (
                <>
                  <p>
                    <strong>{nombresTramos[cuota.tramo] ?? cuota.tramo}</strong>{" "}
                    · {cuota.dias_atraso} días de atraso · Base{" "}
                    {cuota.base_conteo}
                  </p>
                  <Desglose cuota={cuota} />
                  {tab === "mora" ? (
                    <>
                      <h3>Tramos recorridos</h3>
                      {cuota.desglose_mora.length ? (
                        <>
                          <div className="tabla-tramos">
                            <TablaPlan>
                              <table>
                                <thead>
                                  <tr>
                                    {[
                                      "Desde / hasta",
                                      "Días",
                                      "Tasa anual",
                                      "Capital base",
                                      "Mora informativa",
                                    ].map((n) => (
                                      <th key={n}>{n}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {cuota.desglose_mora.map((t, i) => (
                                    <tr key={i}>
                                      <td>
                                        {t.desde} / {t.hasta}
                                      </td>
                                      <td>{t.dias}</td>
                                      <td>{(t.tasa_bps / 100).toFixed(2)} %</td>
                                      <td>{q(t.capital_centavos)}</td>
                                      <td>{q(t.monto_centavos)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </TablaPlan>
                          </div>
                          <div className="tramos-moviles">
                            {cuota.desglose_mora.map((t, i) => (
                              <article className="tramo-tarjeta" key={i}>
                                <div>
                                  <strong>
                                    {t.tramo === "plana"
                                      ? "Mora plana"
                                      : t.tramo.replaceAll("_", " ")}
                                  </strong>
                                  <strong>{q(t.monto_centavos)}</strong>
                                </div>
                                <p>
                                  {t.desde} a {t.hasta}
                                </p>
                                <p>
                                  {t.dias} días · Tasa anual:{" "}
                                  {(t.tasa_bps / 100).toFixed(2)} %
                                </p>
                                <small>
                                  Capital base: {q(t.capital_centavos)}
                                </small>
                              </article>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p>No se generó mora para esta cuota.</p>
                      )}
                      <div className="destacado">
                        Mora generada:{" "}
                        <strong>{q(cuota.mora_generada_centavos)}</strong>
                      </div>
                      <p>
                        El total se redondea una sola vez. Los componentes
                        redondeados son informativos y su suma puede diferir un
                        centavo del total.
                      </p>
                      <button
                        className="boton-principal"
                        onClick={() => seleccionarTab("pago")}
                      >
                        Continuar al pago
                      </button>
                    </>
                  ) : (
                    <>
                      <p>
                        El pago debe cubrir exactamente la cuota exigible más
                        antigua. Revisa el desglose y confirma antes de
                        registrar.
                      </p>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void proponer();
                        }}
                      >
                        <div className="form-grid">
                          <label>
                            Monto recibido (Q)
                            <input
                              aria-label="Monto recibido (Q)"
                              inputMode="decimal"
                              placeholder={(
                                cuota.total_exigible_centavos / 100
                              ).toFixed(2)}
                              value={monto}
                              onChange={(e) => setMonto(e.target.value)}
                            />
                          </label>
                          <label>
                            Clave del pago
                            <input
                              value={clave}
                              onChange={(e) => setClave(e.target.value)}
                              required
                              maxLength={100}
                            />
                          </label>
                        </div>
                        <div className="acciones">
                          <button
                            type="button"
                            className="boton-secundario"
                            onClick={() =>
                              setMonto(
                                (cuota.total_exigible_centavos / 100).toFixed(
                                  2,
                                ),
                              )
                            }
                          >
                            Usar monto exacto
                          </button>
                          <button
                            className="boton-principal"
                            disabled={ocupado || cuota.pagada}
                          >
                            {ocupado
                              ? "Validando…"
                              : "Revisar y solicitar aprobación"}
                          </button>
                        </div>
                      </form>
                      {anterior && (
                        <button
                          className="enlace"
                          disabled={ocupado}
                          onClick={() => void proponer(anterior)}
                        >
                          Reintentar el último pago con la misma clave
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
              <ErrorMensaje mensaje={error} />
              {aviso && (
                <p className="alerta exito" role="status">
                  <CheckCircle2 size={18} />
                  {aviso}
                </p>
              )}
              {recibo && (
                <div className="recibo">
                  <h3>Comprobante de pago</h3>
                  <p>
                    Pago {recibo.id_pago} · {recibo.fecha}
                  </p>
                  <dl className="desglose">
                    {[
                      ["Recibido", recibo.monto_centavos],
                      ["Gastos", recibo.gastos_centavos],
                      ["Mora", recibo.interes_moratorio_centavos],
                      ["Interés corriente", recibo.interes_corriente_centavos],
                      ["Capital", recibo.capital_centavos],
                    ].map(([n, v]) => (
                      <div key={n}>
                        <dt>{n}</dt>
                        <dd>{q(Number(v))}</dd>
                      </div>
                    ))}
                  </dl>
                  <p>Clave: {recibo.clave_idempotencia}</p>
                </div>
              )}
            </section>
          )}
        </>
      )}
      {propuesta?.id && propuesta.parametros && propuesta.desglose && (
        <AprobarPago
          id={propuesta.id}
          parametros={propuesta.parametros}
          cuota={propuesta.desglose}
          actor={sesion.actor}
          cerrar={() => setPropuesta(null)}
          terminar={(d) => {
            const p = propuesta.parametros!;
            setPropuesta(null);
            setAviso(
              d.estado === "APROBADA"
                ? "Pago aprobado. Consulta el comprobante y el estado actualizado."
                : "Propuesta rechazada; no se registró un pago.",
            );
            if (d.estado === "APROBADA") {
              void api<EstadoCredito>(
                `/creditos/${encodeURIComponent(id)}?fecha=${fecha}`,
              )
                .then((c) =>
                  setRecibo(
                    c.movimientos.find(
                      (m) => m.clave_idempotencia === p.clave_idempotencia,
                    ) ?? null,
                  ),
                )
                .catch((e) => setError(mensajeError(e)));
              setClave(crypto.randomUUID());
              setMonto("");
              setVersion((v) => v + 1);
              cambio();
            }
          }}
        />
      )}
    </>
  );
}
