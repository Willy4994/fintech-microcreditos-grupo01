import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { useConsulta } from "../services/useConsulta";
import type { Credito } from "../services/creditos";
import { nombresTramos } from "../services/api";
import {
  formatearQuetzales as q,
  type ResumenCartera,
} from "../services/cartera";
import { Cargando, ErrorMensaje, TablaPlan } from "../components/UI";
type Fila = Credito & {
  estado: string;
  tramo: string;
  dias_atraso: number;
  capital_pendiente_centavos: number;
};
export function Creditos({
  fecha,
  version,
  tramo,
  setTramo,
  abrir,
}: {
  fecha: string;
  version: number;
  tramo: string;
  setTramo: (t: string) => void;
  abrir: (id: string) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { datos, cargando, error } = useConsulta<Fila[]>(
    `/cartera/creditos?fecha=${fecha}${tramo ? "&tramo=" + tramo : ""}`,
    version,
  );
  const { datos: resumen } = useConsulta<ResumenCartera>(
    `/cartera?fecha=${fecha}`,
    version,
  );
  const resumenTramo = resumen?.desglose.find((t) => t.tramo === tramo);
  const { datos: clientes } = useConsulta<
    { id_cliente: string; nombre_completo: string }[]
  >("/clientes/etiquetas", version);
  const nombre = (id: string) =>
    clientes?.find((c) => c.id_cliente === id)?.nombre_completo ?? id;
  const filas = (datos ?? []).filter((c) =>
    `${c.id_credito} ${c.id_cliente} ${nombre(c.id_cliente)}`
      .toLowerCase()
      .includes(busqueda.trim().toLowerCase()),
  );
  return (
    <>
      <div className="titulo-pagina">
        <div>
          <span className="sobretexto">Consulta de cartera</span>
          <h2>Créditos{tramo ? ` · ${nombresTramos[tramo] ?? tramo}` : ""}</h2>
          <p>Consulta el estado real del crédito antes de registrar un pago.</p>
        </div>
        <span className="etiqueta">Al {fecha}</span>
      </div>
      {resumenTramo && (
        <section className="indicadores resumen-tramo">
          <article className="tarjeta-indicador">
            <span>Tramo seleccionado</span>
            <strong>{nombresTramos[tramo]}</strong>
          </article>
          <article className="tarjeta-indicador">
            <span>Participación en cartera activa</span>
            <strong>{resumenTramo.porcentaje.toFixed(2)} %</strong>
          </article>
          <article className="tarjeta-indicador">
            <span>Saldo del tramo</span>
            <strong>{q(resumenTramo.capital_centavos)}</strong>
          </article>
        </section>
      )}
      <section className="panel panel-modulo">
        <div className="filtros">
          <label className="buscador">
            <span>Buscar crédito o cliente</span>
            <div>
              <Search size={18} />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Crédito, nombre o identificador del cliente"
              />
            </div>
          </label>
          <label>
            Tramo
            <select value={tramo} onChange={(e) => setTramo(e.target.value)}>
              <option value="">Todos los créditos</option>
              {Object.entries(nombresTramos).map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ErrorMensaje mensaje={error} />
        {cargando ? (
          <Cargando />
        ) : (
          <>
            <p className="contador">{filas.length} créditos encontrados</p>
            <TablaPlan>
              <table>
                <thead>
                  <tr>
                    {[
                      "Crédito / cliente",
                      "Estado",
                      "Tramo",
                      "Días de atraso",
                      "Capital pendiente",
                      "Acción",
                    ].map((n) => (
                      <th key={n}>{n}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filas.map((c) => (
                    <tr key={c.id_credito}>
                      <td>
                        <strong>{c.id_credito}</strong>
                        <small className="bloque">
                          {nombre(c.id_cliente)} · {c.id_cliente}
                        </small>
                      </td>
                      <td>{c.estado.replaceAll("_", " ")}</td>
                      <td>
                        <span
                          className={`etiqueta ${c.estado === "INCOBRABLE" ? "peligro" : ""}`}
                        >
                          {nombresTramos[c.tramo] ?? c.tramo}
                        </span>
                      </td>
                      <td>{c.dias_atraso}</td>
                      <td>{q(c.capital_pendiente_centavos)}</td>
                      <td>
                        <button
                          className="enlace"
                          onClick={() => abrir(c.id_credito)}
                        >
                          Ver detalle <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="tabla-vacia">
                        No hay créditos para esta búsqueda y fecha de corte.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TablaPlan>
          </>
        )}
      </section>
    </>
  );
}
