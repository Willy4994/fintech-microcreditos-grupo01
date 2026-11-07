import { useState } from "react";
import { LockKeyhole, Search } from "lucide-react";
import { api, post, mensajeError, type Cierre } from "../services/api";
import { formatearQuetzales as q } from "../services/cartera";
import { Modal, ErrorMensaje } from "../components/UI";
export function Cierres({ fecha, actor }: { fecha: string; actor: string }) {
  const [tipo, setTipo] = useState("diario"),
    [dia, setDia] = useState(fecha),
    [mes, setMes] = useState(fecha.slice(0, 7)),
    [resultado, setResultado] = useState<
      (Cierre & { persistido?: boolean }) | null
    >(null),
    [periodo, setPeriodo] = useState<{ desde: string; hasta: string } | null>(
      null,
    ),
    [ocupado, setOcupado] = useState(false),
    [error, setError] = useState(""),
    [confirmar, setConfirmar] = useState(false),
    [aviso, setAviso] = useState("");
  function rango() {
    if (tipo === "diario") return { desde: dia, hasta: dia };
    const [a, m] = mes.split("-").map(Number);
    return {
      desde: `${mes}-01`,
      hasta: new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10),
    };
  }
  async function consultar() {
    setOcupado(true);
    setError("");
    setAviso("");
    setResultado(null);
    try {
      const p = rango();
      const r = await api<Cierre & { persistido?: boolean }>(
        `/cierres?desde=${p.desde}&hasta=${p.hasta}`,
      );
      setResultado(r);
      setPeriodo(p);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  }
  async function generar() {
    if (!periodo) return;
    setOcupado(true);
    setError("");
    try {
      const r = await post<Cierre>("/cierres", { ...periodo, actor });
      setResultado({ ...r, persistido: true });
      setConfirmar(false);
      setAviso(
        "Cierre guardado. Repetir este período conserva el mismo resultado.",
      );
    } catch (e) {
      setError(mensajeError(e));
      setConfirmar(false);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <>
      <div className="titulo-pagina">
        <div>
          <span className="sobretexto">Control financiero</span>
          <h2>Cierre diario / mensual</h2>
          <p>
            Desembolsos y recuperaciones del período, separados por concepto.
          </p>
        </div>
      </div>
      <section className="panel panel-modulo">
        <form
          className="filtros"
          onSubmit={(e) => {
            e.preventDefault();
            void consultar();
          }}
        >
          <label>
            Tipo de cierre
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                setResultado(null);
                setPeriodo(null);
                setAviso("");
              }}
            >
              <option value="diario">Diario</option>
              <option value="mensual">Mensual</option>
            </select>
          </label>
          {tipo === "diario" ? (
            <label>
              Fecha
              <input
                type="date"
                required
                value={dia}
                onChange={(e) => {
                  setDia(e.target.value);
                  setResultado(null);
                  setPeriodo(null);
                  setAviso("");
                }}
              />
            </label>
          ) : (
            <label>
              Mes
              <input
                type="month"
                required
                value={mes}
                onChange={(e) => {
                  setMes(e.target.value);
                  setResultado(null);
                  setPeriodo(null);
                  setAviso("");
                }}
              />
            </label>
          )}
          <button className="boton-principal" disabled={ocupado}>
            <Search size={16} />
            {ocupado ? "Consultando…" : "Consultar período"}
          </button>
        </form>
        <ErrorMensaje mensaje={error} />
        {aviso && (
          <p className="alerta exito" role="status">
            {aviso}
          </p>
        )}
        {resultado ? (
          <>
            <div className="cabecera-panel">
              <h3>
                {resultado.desde} — {resultado.hasta}
              </h3>
              <span className="etiqueta">
                {resultado.persistido
                  ? "Cierre guardado · cifras congeladas"
                  : "Consulta del período"}
              </span>
            </div>
            {resultado.cartera && (
              <section className="indicadores resumen-cierre">
                {[
                  ["Cartera activa", resultado.cartera.cartera_activa_centavos],
                  [
                    "Cartera en riesgo",
                    resultado.cartera.cartera_riesgo_centavos,
                  ],
                  ["Cartera en mora", resultado.cartera.cartera_mora_centavos],
                ].map(([n, v]) => (
                  <article className="tarjeta-indicador" key={n}>
                    <span>{n}</span>
                    <strong>{q(Number(v))}</strong>
                  </article>
                ))}
              </section>
            )}
            <dl className="desglose">
              <div>
                <dt>Desembolsos</dt>
                <dd>{q(resultado.desembolsos_centavos)}</dd>
              </div>
              {[
                ["Gastos", resultado.recuperaciones.gastos_centavos],
                [
                  "Interés moratorio",
                  resultado.recuperaciones.interes_moratorio_centavos,
                ],
                [
                  "Interés corriente",
                  resultado.recuperaciones.interes_corriente_centavos,
                ],
                [
                  "Capital recuperado",
                  resultado.recuperaciones.capital_centavos,
                ],
                ["Total recuperado", resultado.recuperaciones.total_centavos],
              ].map(([n, v]) => (
                <div key={n}>
                  <dt>{n}</dt>
                  <dd>{q(Number(v))}</dd>
                </div>
              ))}
            </dl>
            <p>
              Interés reconocido en el período:{" "}
              {q(resultado.interes_reconocido_periodo_centavos)}
            </p>
            <button
              className="boton-principal"
              disabled={ocupado}
              onClick={() => setConfirmar(true)}
            >
              <LockKeyhole size={16} />
              {resultado.persistido
                ? "Verificar cierre guardado"
                : "Generar y guardar cierre"}
            </button>
          </>
        ) : (
          <div className="estado-vacio">
            <LockKeyhole size={32} />
            <h3>Selecciona un período</h3>
            <p>
              Consultar permite revisar las cifras antes de guardar el cierre.
            </p>
          </div>
        )}
      </section>
      {confirmar && periodo && (
        <Modal
          titulo="Confirmar cierre"
          cerrar={() => {
            if (!ocupado) setConfirmar(false);
          }}
        >
          <div className="dialogo-cuerpo">
            <p>
              Se cerrará el período{" "}
              <strong>
                {periodo.desde} a {periodo.hasta}
              </strong>
              .
            </p>
            <p>
              Las cifras quedarán congeladas. Después no podrás registrar pagos
              ni desembolsos con fecha anterior o igual al corte. Termina
              primero las operaciones del período.
            </p>
            <div className="acciones">
              <button
                disabled={ocupado}
                className="boton-secundario"
                onClick={() => setConfirmar(false)}
              >
                Volver a revisar
              </button>
              <button
                disabled={ocupado}
                className="boton-principal"
                onClick={() => void generar()}
              >
                {ocupado ? "Guardando…" : "Confirmar cierre"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
