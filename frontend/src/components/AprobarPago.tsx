import { useState } from "react";
import {
  post,
  mensajeError,
  type PagoEntrada,
  type Cuota,
  type Decision,
} from "../services/api";
import { formatearQuetzales as q } from "../services/cartera";
import { Modal, Desglose, ErrorMensaje } from "./UI";
export function AprobarPago({
  id,
  parametros,
  cuota,
  actor,
  cerrar,
  terminar,
}: {
  id: string;
  parametros: PagoEntrada;
  cuota: Cuota;
  actor: string;
  cerrar: () => void;
  terminar: (decision: Decision) => void;
}) {
  const [ocupado, setOcupado] = useState(false),
    [error, setError] = useState("");
  async function decidir(aprobar: boolean) {
    if (ocupado) return;
    setOcupado(true);
    setError("");
    try {
      const d = await post<Decision>(
        `/aprobaciones/${encodeURIComponent(id)}/decision`,
        { aprobar, actor },
      );
      terminar(d);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Modal
      titulo="Confirmación humana de pago"
      cerrar={() => {
        if (!ocupado) cerrar();
      }}
    >
      <div className="dialogo-cuerpo">
        <p>
          Revisa la distribución antes de registrar{" "}
          <strong>{q(parametros.monto_centavos)}</strong>.
        </p>
        <p>
          <strong>{parametros.id_credito}</strong> · Cuota {parametros.cuota} ·{" "}
          {parametros.fecha}
        </p>
        <Desglose cuota={cuota} />
        <p className="nota-panel">
          Orden de aplicación: gastos → mora → interés corriente → capital. Esta
          confirmación registra el pago en la base de datos. La deuda se valida
          otra vez al aprobar.
        </p>
        <ErrorMensaje mensaje={error} />
        <div className="acciones">
          <button
            disabled={ocupado}
            className="boton-secundario"
            onClick={() => void decidir(false)}
          >
            Rechazar propuesta
          </button>
          <button
            disabled={ocupado}
            className="boton-principal"
            onClick={() => void decidir(true)}
          >
            {ocupado ? "Procesando…" : "Confirmar y registrar pago"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
