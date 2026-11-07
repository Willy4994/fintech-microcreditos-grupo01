import { useEffect, useRef, useState } from "react";
import { Send, BookOpen, MessageSquarePlus, ShieldCheck } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  api,
  post,
  leerMcp,
  mensajeError,
  type RespuestaChat,
  type Fuente,
  type Propuesta,
  type Aprobacion,
  type Cuota,
  type Sesion,
} from "../services/api";
import { Modal, Cargando, ErrorMensaje } from "../components/UI";
import { AprobarPago } from "../components/AprobarPago";
interface Mensaje {
  id: string;
  pregunta: string;
  respuesta?: RespuestaChat;
}
export function Chat({
  fecha,
  sesion,
  cambio,
}: {
  fecha: string;
  sesion: Sesion;
  cambio: () => void;
}) {
  const [historial, setHistorial] = useState<Mensaje[]>([]),
    [pregunta, setPregunta] = useState(""),
    [sesionChat, setSesionChat] = useState<string | undefined>(),
    [ocupado, setOcupado] = useState(false),
    [error, setError] = useState(""),
    [fuente, setFuente] = useState<Fuente | null>(null),
    [aviso, setAviso] = useState(""),
    [aprobacion, setAprobacion] = useState<
      (Aprobacion & { cuota: Cuota }) | null
    >(null),
    [pendientes, setPendientes] = useState<Aprobacion[]>([]),
    [version, setVersion] = useState(0);
  const final = useRef<HTMLDivElement>(null);
  useEffect(() => {
    final.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [historial, ocupado]);
  useEffect(() => {
    let activo = true;
    api<Aprobacion[]>("/aprobaciones")
      .then((r) => {
        if (activo)
          setPendientes(
            r.filter(
              (p) =>
                p.estado === "PENDIENTE" &&
                Date.parse(p.expira_en) > Date.now(),
            ),
          );
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [version]);
  async function enviar(texto = pregunta, reintento = false) {
    if (!texto.trim() || ocupado) return;
    setOcupado(true);
    setError("");
    setPregunta("");
    const id = crypto.randomUUID();
    if (!reintento) setHistorial((h) => [...h, { id, pregunta: texto }]);
    try {
      const r = await post<RespuestaChat>("/chat", {
        pregunta: texto,
        fecha,
        ...(sesionChat ? { sesion: sesionChat } : {}),
      });
      setSesionChat(r.sesion);
      setHistorial((h) =>
        h.map((m, i) =>
          (reintento ? i === h.length - 1 : m.id === id)
            ? { ...m, respuesta: r }
            : m,
        ),
      );
      setVersion((v) => v + 1);
    } catch (e) {
      setError(mensajeError(e));
      setPregunta(texto);
    } finally {
      setOcupado(false);
    }
  }
  async function revisar(p: Aprobacion) {
    setError("");
    try {
      const cuota = await api<Cuota>(
        `/creditos/${encodeURIComponent(p.parametros.id_credito)}/mora/${p.parametros.cuota}?fecha=${p.parametros.fecha}`,
      );
      setAprobacion({ ...p, cuota });
    } catch (e) {
      setError(mensajeError(e));
    }
  }
  const sugerencias = [
    "¿Cómo está la cartera al 31 de octubre de 2026?",
    "Lista los créditos en Mora 3 al 31 de octubre de 2026.",
    "¿Qué cuotas vencen en los próximos 7 días desde el 31 de octubre de 2026?",
    "¿Cómo se calcula la mora de un crédito otorgado en agosto de 2026? Cita la fuente.",
  ];
  return (
    <>
      <div className="titulo-pagina">
        <div>
          <span className="sobretexto">Gerencia / Comité</span>
          <h2>Asistente gerencial</h2>
          <p>Consulta tu cartera y verifica las políticas con sus fuentes.</p>
        </div>
        <button
          className="boton-secundario"
          disabled={ocupado}
          onClick={() => {
            setHistorial([]);
            setSesionChat(undefined);
            setError("");
            setPregunta("");
          }}
        >
          <MessageSquarePlus size={17} />
          Nueva conversación
        </button>
      </div>
      <div className="chat-layout">
        <section className="panel chat">
          <div className="chat-contexto">
            <span className="punto" />
            Fecha de corte: <strong>{fecha}</strong>
            <span>Una nueva fecha inicia otra conversación.</span>
          </div>
          <div
            className="conversacion"
            role="log"
            aria-label="Conversación con el asistente"
          >
            {historial.length === 0 && (
              <div className="bienvenida">
                <div className="marca-chat">
                  <BookOpen size={26} />
                </div>
                <h3>¿Qué necesitas conocer de tu cartera?</h3>
                <p>
                  Pregunta por saldos, cierres, mora o vencimientos. Las
                  políticas se acompañan de referencias para consultarlas.
                </p>
                <div className="sugerencias">
                  {sugerencias.map((s) => (
                    <button key={s} onClick={() => setPregunta(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {historial.map((m) => {
              const r = m.respuesta;
              const fuentes = [
                ...new Map(
                  (r?.fuentes ?? [])
                    .flatMap((f) => leerMcp<Fuente[]>(f) ?? [])
                    .map((f) => [f.id, f]),
                ).values(),
              ];
              return (
                <article className="intercambio" key={m.id}>
                  <div className="pregunta">
                    <span>Tú</span>
                    <p>{m.pregunta}</p>
                  </div>
                  {r && (
                    <div className="respuesta">
                      <span className="autor">
                        <ShieldCheck size={16} />
                        Crédito Vecino
                      </span>
                      <div className="markdown">
                        <Markdown
                          skipHtml
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            a: ({ href, children }) => {
                              const identificador = (href ?? "").replace(
                                /^#/,
                                "",
                              );
                              const f = fuentes.find(
                                (f) =>
                                  f.id === identificador ||
                                  String(children).includes(f.id),
                              );
                              return f ? (
                                <button
                                  className="cita"
                                  onClick={() => setFuente(f)}
                                >
                                  {children}
                                </button>
                              ) : (
                                <span>{children}</span>
                              );
                            },
                          }}
                        >
                          {r.respuesta.replace(
                            /\[([A-Z][A-Z0-9-]+:\d+)\](?!\()/g,
                            (original, id: string) =>
                              fuentes.some((f) => f.id === id)
                                ? `[${id}](#${id})`
                                : original,
                          )}
                        </Markdown>
                      </div>
                      {fuentes.length > 0 && (
                        <div className="fuentes">
                          <h4>
                            <BookOpen size={16} />
                            Fuentes consultadas
                          </h4>
                          {fuentes.map((f) => (
                            <button key={f.id} onClick={() => setFuente(f)}>
                              <strong>{f.id}</strong>
                              <span>{f.titulo}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {r.evidencias.length > 0 && (
                        <details className="evidencias">
                          <summary>
                            Ver datos que respaldan la respuesta (
                            {r.evidencias.length})
                          </summary>
                          {r.evidencias.map((e, i) => (
                            <div key={i}>
                              <strong>
                                {e.herramienta.replaceAll("_", " ")}
                              </strong>
                              <pre>
                                {JSON.stringify(leerMcp(e.resultado), null, 2)}
                              </pre>
                            </div>
                          ))}
                        </details>
                      )}
                      {r.evidencias
                        .filter((e) => e.herramienta === "proponer_pago")
                        .map((e, i) => {
                          const p = leerMcp<Propuesta>(e.resultado);
                          return p?.estado === "PENDIENTE" &&
                            p.id &&
                            p.parametros ? (
                            <div key={i} className="alerta aviso">
                              <span>
                                El pago propuesto necesita tu confirmación.
                              </span>
                              <button
                                className="boton-principal"
                                onClick={() =>
                                  void revisar({
                                    id: p.id!,
                                    estado: "PENDIENTE",
                                    parametros: p.parametros!,
                                    expira_en: "",
                                  })
                                }
                              >
                                Revisar propuesta
                              </button>
                            </div>
                          ) : null;
                        })}
                    </div>
                  )}
                </article>
              );
            })}
            {ocupado && (
              <Cargando texto="Consultando al asistente. La respuesta puede tardar mientras revisa la información…" />
            )}
            <div ref={final} />
          </div>
          <div className="chat-compositor">
            <ErrorMensaje mensaje={error} />
            {error && historial.at(-1) && (
              <button
                className="enlace"
                disabled={ocupado}
                onClick={() => void enviar(historial.at(-1)!.pregunta, true)}
              >
                Volver a intentar la consulta
              </button>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void enviar();
              }}
            >
              <label className="sr-only" htmlFor="pregunta-chat">
                Pregunta al asistente
              </label>
              <textarea
                id="pregunta-chat"
                required
                maxLength={4000}
                rows={2}
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                placeholder="Escribe tu pregunta sobre créditos, cartera o políticas…"
                disabled={ocupado}
              />
              <button
                className="boton-principal"
                disabled={ocupado || !pregunta.trim()}
                aria-label="Enviar pregunta"
              >
                <Send size={18} />
                Enviar
              </button>
            </form>
            <small>
              Las operaciones de pago siempre requieren aprobación humana.
            </small>
          </div>
        </section>
        <aside className="panel panel-modulo aprobaciones">
          <h3>Aprobaciones pendientes</h3>
          <p>Revisa cada propuesta antes de mover el saldo del crédito.</p>
          {pendientes.length === 0 ? (
            <p>No hay solicitudes vigentes pendientes.</p>
          ) : (
            pendientes.map((p) => (
              <article className="pendiente" key={p.id}>
                <strong>{p.parametros.id_credito}</strong>
                <span>
                  Cuota {p.parametros.cuota} · {p.parametros.fecha}
                </span>
                <button
                  className="boton-secundario"
                  onClick={() => void revisar(p)}
                >
                  Revisar pago
                </button>
              </article>
            ))
          )}
          <button className="enlace" onClick={() => setVersion((v) => v + 1)}>
            Actualizar pendientes
          </button>
          {aviso && (
            <p className="alerta exito" role="status">
              {aviso}
            </p>
          )}
        </aside>
      </div>
      {fuente && (
        <Modal titulo={fuente.titulo} cerrar={() => setFuente(null)}>
          <div className="dialogo-cuerpo">
            <span className="etiqueta">{fuente.id}</span>
            <div className="markdown fuente-texto">
              <Markdown skipHtml remarkPlugins={[remarkGfm]}>
                {fuente.contenido.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")}
              </Markdown>
            </div>
          </div>
        </Modal>
      )}
      {aprobacion && (
        <AprobarPago
          id={aprobacion.id}
          parametros={aprobacion.parametros}
          cuota={aprobacion.cuota}
          actor={sesion.actor}
          cerrar={() => setAprobacion(null)}
          terminar={(d) => {
            setAprobacion(null);
            setAviso(
              d.estado === "APROBADA"
                ? "Pago aprobado y registrado. Los saldos se actualizaron."
                : "Propuesta rechazada.",
            );
            setVersion((v) => v + 1);
            if (d.estado === "APROBADA") cambio();
          }}
        />
      )}
    </>
  );
}
