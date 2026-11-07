import { useEffect, useRef, type ReactNode } from "react";
import { X, AlertCircle, LoaderCircle } from "lucide-react";
import { formatearQuetzales as q } from "../services/cartera";
import type { Cuota } from "../services/api";
export function ErrorMensaje({ mensaje }: { mensaje: string }) {
  return mensaje ? (
    <div className="alerta error" role="alert">
      <AlertCircle size={18} />
      <span>{mensaje}</span>
    </div>
  ) : null;
}
export function Cargando({
  texto = "Consultando información…",
}: {
  texto?: string;
}) {
  return (
    <p className="cargando" role="status">
      <LoaderCircle size={18} className="girar" />
      {texto}
    </p>
  );
}
export function Modal({
  titulo,
  children,
  cerrar,
}: {
  titulo: string;
  children: ReactNode;
  cerrar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    const d = ref.current;
    d?.showModal();
    const foco = requestAnimationFrame(() =>
      d?.querySelector<HTMLButtonElement>("button")?.focus(),
    );
    return () => {
      cancelAnimationFrame(foco);
      d?.close();
      previo?.focus();
    };
  }, []);
  return (
    <dialog
      aria-label={titulo}
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        cerrar();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
      className="dialogo"
    >
      <header>
        <h2>{titulo}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Cerrar diálogo"
          onClick={cerrar}
        >
          <X size={22} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Desglose({ cuota }: { cuota: Cuota }) {
  return (
    <dl className="desglose">
      {[
        ["Gastos", cuota.gastos_centavos],
        ["Interés moratorio", cuota.interes_moratorio_centavos],
        ["Interés corriente", cuota.interes_corriente_centavos],
        ["Capital", cuota.capital_centavos],
        ["Total exigible", cuota.total_exigible_centavos],
      ].map(([nombre, monto]) => (
        <div key={nombre}>
          <dt>{nombre}</dt>
          <dd>{q(Number(monto))}</dd>
        </div>
      ))}
    </dl>
  );
}
export function TablaPlan({ children }: { children: ReactNode }) {
  return (
    <div
      className="tabla-contenedor"
      tabIndex={0}
      aria-label="Tabla desplazable"
    >
      {children}
    </div>
  );
}
