import { useState } from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { post, centavos, mensajeError, type CuotaPlan } from "../services/api";
import { formatearQuetzales as q } from "../services/cartera";
import { ErrorMensaje, TablaPlan } from "../components/UI";
export function Originacion({
  fecha,
  abrirCredito,
  cambio,
}: {
  fecha: string;
  abrirCredito: (id: string) => void;
  cambio: () => void;
}) {
  const [paso, setPaso] = useState(0),
    [datos, setDatos] = useState({
      id_cliente: "",
      nombre_completo: "",
      dpi: "",
      telefono: "",
      municipio: "",
      id_credito: "",
      id_asesor: "AS-01",
      monto: "10000.00",
      plazo: "12",
      tasa: "36",
    }),
    [plan, setPlan] = useState<CuotaPlan[]>([]),
    [error, setError] = useState(""),
    [ocupado, setOcupado] = useState(false);
  const campo = (k: keyof typeof datos, v: string) => {
    setDatos((d) => ({ ...d, [k]: v }));
    setPlan([]);
  };
  const condiciones = () => ({
    capital_centavos: centavos(datos.monto),
    plazo_meses: Number(datos.plazo),
    tna_bps: centavos(datos.tasa),
    fecha,
  });
  async function continuar() {
    setError("");
    if (paso === 0) {
      setPaso(1);
      return;
    }
    if (paso === 2) {
      setPaso(3);
      return;
    }
    setOcupado(true);
    try {
      if (paso === 1) {
        setPlan(await post<CuotaPlan[]>("/simulaciones", condiciones()));
        setPaso(2);
      } else {
        await post("/originaciones", {
          cliente: {
            id_cliente: datos.id_cliente,
            nombre_completo: datos.nombre_completo,
            dpi: datos.dpi,
            telefono: datos.telefono,
            municipio: datos.municipio,
          },
          id_credito: datos.id_credito,
          id_asesor: datos.id_asesor,
          ...condiciones(),
        });
        setPaso(4);
        cambio();
      }
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  }
  return (
    <>
      <div className="titulo-pagina">
        <div>
          <span className="sobretexto">Originación</span>
          <h2>
            {
              [
                "Alta de cliente",
                "Nueva solicitud de crédito",
                "Simulación del crédito",
                "Confirmar crédito",
                "Crédito desembolsado",
              ][paso]
            }
          </h2>
          <p>
            Da de alta al cliente, simula su plan y confirma las condiciones.
          </p>
        </div>
        <span className="etiqueta">Operación: {fecha}</span>
      </div>
      <ol className="pasos">
        {["Cliente", "Solicitud", "Simulación", "Confirmación"].map((n, i) => (
          <li key={n} className={paso >= i ? "completo" : ""}>
            <span>{i + 1}</span>
            {n}
          </li>
        ))}
      </ol>
      <section className="panel panel-modulo formulario">
        <ErrorMensaje mensaje={error} />
        {paso === 4 ? (
          <div className="estado-vacio">
            <CheckCircle2 size={48} />
            <h3>El crédito fue desembolsado correctamente</h3>
            <p>
              {datos.id_credito} · {datos.nombre_completo}
            </p>
            <div className="destacado">
              <p>
                Monto desembolsado:{" "}
                <strong>{q(condiciones().capital_centavos)}</strong>
              </p>
              <p>
                Plazo: {datos.plazo} meses · Cuota mensual:{" "}
                {plan[0] ? q(plan[0].monto_centavos) : "—"}
              </p>
              <span className="etiqueta">Vigente</span>
            </div>
            <button
              className="boton-principal"
              onClick={() => abrirCredito(datos.id_credito)}
            >
              Ver crédito y plan
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void continuar();
            }}
          >
            {paso === 0 && (
              <>
                <h3>Datos del cliente</h3>
                <p>El alta del cliente es el primer paso de la solicitud.</p>
                <div className="form-grid">
                  {(
                    [
                      ["id_cliente", "Identificador del cliente"],
                      ["nombre_completo", "Nombre completo"],
                      ["dpi", "Documento de identificación"],
                      ["telefono", "Teléfono (opcional)"],
                      ["municipio", "Municipio"],
                    ] as const
                  ).map(([k, n]) => (
                    <label key={k}>
                      {n}
                      <input
                        required={k !== "telefono"}
                        minLength={k === "nombre_completo" ? 3 : 1}
                        maxLength={k === "nombre_completo" ? 200 : 100}
                        value={datos[k]}
                        onChange={(e) => campo(k, e.target.value)}
                        autoComplete={
                          k === "nombre_completo"
                            ? "name"
                            : k === "telefono"
                              ? "tel"
                              : "off"
                        }
                      />
                    </label>
                  ))}
                </div>
              </>
            )}
            {paso === 1 && (
              <>
                <h3>Condiciones del crédito</h3>
                <div className="form-grid">
                  <label>
                    Identificador del crédito
                    <input
                      required
                      value={datos.id_credito}
                      onChange={(e) => campo("id_credito", e.target.value)}
                    />
                  </label>
                  <label>
                    Asesor
                    <select
                      value={datos.id_asesor}
                      onChange={(e) => campo("id_asesor", e.target.value)}
                    >
                      {[
                        "AS-01",
                        "AS-02",
                        "AS-03",
                        "AS-04",
                        "AS-05",
                        "AS-06",
                      ].map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Monto solicitado (Q)
                    <input
                      type="number"
                      required
                      min="1000"
                      max="25000"
                      step="0.01"
                      value={datos.monto}
                      onChange={(e) => campo("monto", e.target.value)}
                    />
                  </label>
                  <label>
                    Plazo en meses
                    <input
                      type="number"
                      required
                      min="3"
                      max="24"
                      value={datos.plazo}
                      onChange={(e) => campo("plazo", e.target.value)}
                    />
                  </label>
                  <label>
                    Tasa nominal anual (%)
                    <input
                      type="number"
                      required
                      min="0.01"
                      max="100"
                      step="0.01"
                      value={datos.tasa}
                      onChange={(e) => campo("tasa", e.target.value)}
                    />
                  </label>
                </div>
                <p>
                  La tasa mensual y todas las cuotas se obtienen del núcleo
                  financiero al simular.
                </p>
              </>
            )}
            {(paso === 2 || paso === 3) && (
              <>
                <h3>
                  {paso === 2
                    ? "Simulación del crédito"
                    : "Revisa los datos antes de desembolsar"}
                </h3>
                <div className="datos-grid">
                  {[
                    [
                      "Cliente",
                      `${datos.id_cliente} · ${datos.nombre_completo}`,
                    ],
                    ["Crédito", datos.id_credito],
                    ["Monto", q(condiciones().capital_centavos)],
                    ["Plazo", `${datos.plazo} meses`],
                    ["TNA", `${datos.tasa} %`],
                    [
                      "Cuota mensual",
                      plan[0] ? q(plan[0].monto_centavos) : "—",
                    ],
                    ["Fecha", fecha],
                  ].map(([n, v]) => (
                    <div key={n}>
                      <span>{n}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
                {paso === 2 && (
                  <>
                    <h3>Plan de amortización simulado</h3>
                    <TablaPlan>
                      <table>
                        <thead>
                          <tr>
                            {[
                              "Cuota",
                              "Vencimiento",
                              "Cuota total",
                              "Interés",
                              "Capital",
                              "Saldo final",
                            ].map((n) => (
                              <th key={n}>{n}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {plan.map((c) => (
                            <tr key={c.numero}>
                              <td>{c.numero}</td>
                              <td>{c.fecha_vencimiento}</td>
                              <td>{q(c.monto_centavos)}</td>
                              <td>{q(c.interes_centavos)}</td>
                              <td>{q(c.capital_centavos)}</td>
                              <td>{q(c.saldo_centavos)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TablaPlan>
                  </>
                )}
                <p>
                  La última cuota ajusta el redondeo del plan. Revisa los datos;
                  puedes regresar y corregir antes de confirmar.
                </p>
                {paso === 3 && (
                  <p className="alerta aviso">
                    Confirmación requerida: al confirmar se registrarán el
                    cliente y el desembolso. Revisa la información antes de
                    continuar.
                  </p>
                )}
              </>
            )}
            <div className="acciones">
              {paso > 0 && (
                <button
                  disabled={ocupado}
                  type="button"
                  className="boton-secundario"
                  onClick={() => {
                    setPaso((p) => p - 1);
                    setError("");
                  }}
                >
                  <ArrowLeft size={16} />
                  Regresar y corregir
                </button>
              )}
              <button className="boton-principal" disabled={ocupado}>
                {ocupado
                  ? "Procesando…"
                  : paso === 0
                    ? "Continuar a condiciones"
                    : paso === 1
                      ? "Simular y revisar plan"
                      : paso === 2
                        ? "Continuar a confirmación"
                        : "Confirmar y desembolsar"}
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
