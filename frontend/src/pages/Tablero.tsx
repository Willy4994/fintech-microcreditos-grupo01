import {
  Wallet,
  AlertTriangle,
  Clock3,
  ArrowRight,
  TrendingUp,
  Banknote,
} from "lucide-react";
import { useConsulta } from "../services/useConsulta";
import { nombresTramos, type Cierre } from "../services/api";
import {
  formatearQuetzales as q,
  formatearPorcentaje as pct,
  type ResumenCartera,
} from "../services/cartera";
import type { CreditoMoroso } from "../services/creditos";
import { Cargando, ErrorMensaje, TablaPlan } from "../components/UI";
export function Tablero({
  fecha,
  version,
  filtrar,
  abrirCredito,
}: {
  fecha: string;
  version: number;
  filtrar: (tramo: string) => void;
  abrirCredito: (id: string) => void;
}) {
  const {
    datos: c,
    error,
    cargando,
  } = useConsulta<ResumenCartera>(`/cartera?fecha=${fecha}`, version);
  const { datos: morosos, error: errorMorosos } = useConsulta<CreditoMoroso[]>(
    `/morosos?fecha=${fecha}`,
    version,
  );
  const { datos: cierre, error: errorCierre } = useConsulta<Cierre>(
    `/cierres?desde=${fecha.slice(0, 7)}-01&hasta=${fecha}`,
    version,
  );
  return (
    <>
      <div className="titulo-pagina">
        <div>
          <span className="sobretexto">Una visión de tu cartera</span>
          <h2>Tablero gerencial</h2>
          <p>
            Indicadores al {fecha}. Consulta cada tramo para ver sus créditos.
          </p>
        </div>
        <span className="etiqueta">GTQ · Quetzales</span>
      </div>
      <ErrorMensaje mensaje={error || errorMorosos || errorCierre} />
      {cargando && <Cargando />}
      <section className="indicadores">
        {[
          {
            n: "Cartera activa",
            v: c?.cartera_activa_centavos,
            icono: Wallet,
            nota: "Capital activo · base de los porcentajes",
          },
          {
            n: "Cartera en riesgo",
            v: c?.cartera_riesgo_centavos,
            icono: AlertTriangle,
            nota: c
              ? `${pct(c.cartera_riesgo_porcentaje)} · más de 30 días o reestructurados`
              : "—",
          },
          {
            n: "Cartera en mora",
            v: c?.cartera_mora_centavos,
            icono: Clock3,
            nota: c
              ? `${pct(c.cartera_mora_porcentaje)} · desde un día de atraso`
              : "—",
          },
          {
            n: "Incobrables del mes",
            v: c?.incobrable_mes_centavos,
            icono: Banknote,
            nota: "Baja contable del mes hasta el corte",
          },
          {
            n: "Desembolsos del mes",
            v: cierre?.desembolsos_centavos,
            icono: TrendingUp,
            nota: "Créditos desembolsados hasta el corte",
          },
          {
            n: "Recuperaciones del mes",
            v: cierre?.recuperaciones.total_centavos,
            icono: Wallet,
            nota: "Pagos recibidos hasta el corte",
          },
        ].map((t) => (
          <article className="tarjeta-indicador" key={t.n}>
            <div className="indicador-icono">
              <t.icono size={20} />
            </div>
            <span>{t.n}</span>
            <strong>{t.v === undefined ? "—" : q(t.v)}</strong>
            <small>{t.nota}</small>
          </article>
        ))}
      </section>
      <section className="paneles">
        <article className="panel">
          <div className="panel-titulo">
            <div className="indicador-icono">
              <AlertTriangle size={19} />
            </div>
            <h3>Cartera en riesgo por tramo</h3>
          </div>
          <div className="tramos">
            {c?.desglose.map((t) => (
              <button
                className="tramo"
                key={t.tramo}
                onClick={() => filtrar(t.tramo)}
              >
                <div className="tramo-superior">
                  <span>{nombresTramos[t.tramo] ?? t.tramo}</span>
                  <strong>{pct(t.porcentaje)}</strong>
                </div>
                <div className="barra-fondo">
                  <div
                    className="barra-progreso"
                    style={{
                      width: `${Math.min(100, Math.max(0, t.porcentaje))}%`,
                    }}
                  />
                </div>
                <div className="tramo-inferior">
                  <small>{q(t.capital_centavos)}</small>
                  <ArrowRight size={15} />
                </div>
              </button>
            ))}
          </div>
          <p className="nota-panel">
            Porcentajes sobre la cartera activa. Mora y riesgo son indicadores
            diferentes; los incobrables se reportan por separado.
          </p>
        </article>
        <article className="panel">
          <div className="panel-tabla-encabezado">
            <h3>Créditos que requieren atención</h3>
            <button className="enlace" onClick={() => filtrar("")}>
              Ver todos <ArrowRight size={15} />
            </button>
          </div>
          <TablaPlan>
            <table>
              <thead>
                <tr>
                  <th>Crédito</th>
                  <th>Tramo</th>
                  <th>Días</th>
                  <th>Saldo de capital</th>
                </tr>
              </thead>
              <tbody>
                {[...(morosos ?? [])]
                  .sort((a, b) => b.dias_atraso - a.dias_atraso)
                  .slice(0, 10)
                  .map((m) => (
                    <tr key={m.id_credito}>
                      <td>
                        <button
                          className="enlace"
                          onClick={() => abrirCredito(m.id_credito)}
                        >
                          {m.id_credito}
                        </button>
                      </td>
                      <td>
                        <span className="etiqueta">
                          {nombresTramos[m.tramo] ?? m.tramo}
                        </span>
                      </td>
                      <td>{m.dias_atraso}</td>
                      <td>{q(m.saldo_centavos)}</td>
                    </tr>
                  ))}
                {morosos?.length === 0 && (
                  <tr>
                    <td colSpan={4}>No hay créditos en mora al corte.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </TablaPlan>
        </article>
      </section>
    </>
  );
}
