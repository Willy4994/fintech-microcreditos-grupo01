import { useEffect, useState, lazy, Suspense } from "react";
import {
  Landmark,
  BarChart3,
  Wallet,
  CheckCircle2,
  MessageSquare,
  Plus,
  LogOut,
  CalendarDays,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { api, mensajeError, type Sesion } from "./services/api";
import { ErrorMensaje, Cargando } from "./components/UI";
import { Tablero } from "./pages/Tablero";
import { Creditos } from "./pages/Creditos";
import { DetalleCredito } from "./pages/DetalleCredito";
import { Originacion } from "./pages/Originacion";
import { Cierres } from "./pages/Cierres";
const Chat = lazy(() =>
  import("./pages/Chat").then((m) => ({ default: m.Chat })),
);
import "./App.css";
type Modulo = "tablero" | "cartera" | "solicitud" | "cierres" | "chat";
function Acceso({ entrar }: { entrar: (s: Sesion) => void }) {
  const [actor, setActor] = useState(""),
    [perfil, setPerfil] = useState<"asesor" | "gerencia">("gerencia"),
    [clave, setClave] = useState(""),
    [error, setError] = useState(""),
    [ocupado, setOcupado] = useState(false);
  return (
    <main className="acceso">
      <section className="presentacion-acceso">
        <div className="marca">
          <Landmark size={30} />
          <strong>
            Crédito Vecino<span>Cerca de ti. Cerca de tus metas.</span>
          </strong>
        </div>
        <div>
          <span className="sobretexto">Gestión de microcrédito</span>
          <h1>
            Tu cartera,
            <br />
            con claridad.
          </h1>
          <p>
            Una misma información para acompañar al cliente, recibir sus pagos y
            tomar decisiones.
          </p>
        </div>
        <small>Crédito Vecino, S. A. · Guatemala</small>
      </section>
      <section className="formulario-acceso">
        <div className="tarjeta-acceso">
          <span className="sobretexto">Bienvenido al equipo</span>
          <h2>Ingresar al sistema</h2>
          <p>Elige tu perfil para acceder a tus herramientas de trabajo.</p>
          <ErrorMensaje mensaje={error} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setOcupado(true);
              setError("");
              void api<Sesion>("/sesion", {
                method: "POST",
                headers: { Authorization: `Bearer ${clave}` },
                body: JSON.stringify({ actor, perfil }),
              })
                .then((s) => {
                  setClave("");
                  entrar(s);
                })
                .catch((e) => {
                  setError(mensajeError(e));
                  setClave("");
                })
                .finally(() => setOcupado(false));
            }}
          >
            <label>
              Tu nombre
              <input
                required
                minLength={2}
                maxLength={80}
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                autoComplete="username"
              />
            </label>
            <label>
              Perfil
              <select
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as Sesion["perfil"])}
              >
                <option value="gerencia">Gerencia / Comité</option>
                <option value="asesor">Asesor de crédito</option>
              </select>
            </label>
            <label>
              Clave de acceso del equipo
              <input
                type="password"
                required
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <button className="boton-principal" disabled={ocupado}>
              {ocupado ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
export default function App() {
  const [chatIniciado, setChatIniciado] = useState(false);
  const [sesion, setSesion] = useState<Sesion | null>(null),
    [iniciando, setIniciando] = useState(true),
    [modulo, setModulo] = useState<Modulo>("tablero"),
    [fecha, setFecha] = useState("2026-10-31"),
    [fechaBorrador, setFechaBorrador] = useState("2026-10-31"),
    [tramo, setTramo] = useState(""),
    [seleccionado, setSeleccionado] = useState<string | null>(null),
    [version, setVersion] = useState(0),
    [online, setOnline] = useState(navigator.onLine),
    [error, setError] = useState("");
  useEffect(() => {
    let vivo = true;
    api<Sesion>("/sesion")
      .then((s) => {
        if (vivo) {
          setSesion(s);
          setModulo(s.perfil === "gerencia" ? "tablero" : "cartera");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (vivo) setIniciando(false);
      });
    return () => {
      vivo = false;
    };
  }, []);
  useEffect(() => {
    const actualizar = () => setOnline(navigator.onLine);
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);
  const cambio = () => setVersion((v) => v + 1);
  const abrir = (id: string) => {
    setSeleccionado(id);
    setModulo("cartera");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  if (iniciando)
    return (
      <main className="cargando-inicial">
        <Cargando texto="Preparando tu espacio de trabajo…" />
      </main>
    );
  if (!sesion)
    return (
      <Acceso
        entrar={(s) => {
          setSesion(s);
          setModulo(s.perfil === "gerencia" ? "tablero" : "cartera");
        }}
      />
    );
  const gerencia = sesion.perfil === "gerencia";
  const nav = [
    { id: "tablero", nombre: "Tablero", icono: BarChart3, visible: gerencia },
    { id: "cartera", nombre: "Créditos", icono: Wallet, visible: true },
    { id: "solicitud", nombre: "Nueva solicitud", icono: Plus, visible: true },
    {
      id: "cierres",
      nombre: "Cierres",
      icono: CheckCircle2,
      visible: gerencia,
    },
    {
      id: "chat",
      nombre: "Asistente",
      icono: MessageSquare,
      visible: gerencia,
    },
  ] as const;
  return (
    <div className={`aplicacion perfil-${sesion.perfil} modulo-${modulo}`}>
      <a className="saltar" href="#contenido-principal">
        Ir al contenido
      </a>
      <header className="encabezado">
        <div className="marca">
          <div className="identidad-icono">
            <Landmark size={24} />
          </div>
          <strong>
            Crédito Vecino<span>Gestión de microcrédito</span>
          </strong>
        </div>
        <nav className="navegacion" aria-label="Navegación principal">
          {nav
            .filter((n) => n.visible)
            .map((n) => (
              <button
                key={n.id}
                className={`nav-boton ${modulo === n.id ? "activo" : ""}`}
                aria-current={modulo === n.id ? "page" : undefined}
                onClick={() => {
                  setModulo(n.id);
                  if (n.id === "chat") setChatIniciado(true);
                  setSeleccionado(null);
                }}
              >
                <n.icono size={17} />
                {n.nombre}
              </button>
            ))}
        </nav>
        <div className="usuario">
          <span>
            <strong>{sesion.actor}</strong>
            <small>
              {gerencia ? "Gerencia / Comité" : "Asesor de crédito"}
            </small>
          </span>
          <button
            className="icon-button"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            onClick={() => {
              void api("/sesion", { method: "DELETE" })
                .then(() => {
                  setSesion(null);
                  setSeleccionado(null);
                })
                .catch((e) => setError(mensajeError(e)));
            }}
          >
            <LogOut size={19} />
          </button>
        </div>
      </header>
      <main className="contenido" id="contenido-principal">
        <div className="barra-contexto">
          <span>
            <span className={`punto ${online ? "" : "desconectado"}`} />
            {online ? "Espacio de trabajo" : "Sin conexión"}
          </span>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (fechaBorrador !== fecha) {
                setFecha(fechaBorrador);
                setSeleccionado(null);
              }
            }}
          >
            <CalendarDays size={17} />
            <label htmlFor="fecha-global">Fecha de corte</label>
            <input
              id="fecha-global"
              type="date"
              required
              value={fechaBorrador}
              onChange={(e) => setFechaBorrador(e.target.value)}
            />
            <button className="boton-secundario" type="submit">
              Aplicar
            </button>
          </form>
          <button
            className="icon-button"
            aria-label="Actualizar datos"
            title="Actualizar datos"
            onClick={cambio}
          >
            <RefreshCw size={17} />
          </button>
        </div>
        {!online && (
          <p className="alerta aviso" role="status">
            <WifiOff size={18} />
            Sin conexión. Conserva la clave del pago y reintenta al reconectar;
            no se confirmará un pago hasta recibir respuesta del sistema.
          </p>
        )}
        <ErrorMensaje mensaje={error} />
        {modulo === "tablero" && gerencia && (
          <Tablero
            fecha={fecha}
            version={version}
            filtrar={(t) => {
              setTramo(t);
              setSeleccionado(null);
              setModulo("cartera");
            }}
            abrirCredito={abrir}
          />
        )}{" "}
        {modulo === "cartera" &&
          (seleccionado ? (
            <DetalleCredito
              key={`${seleccionado}-${fecha}`}
              id={seleccionado}
              fecha={fecha}
              sesion={sesion}
              volver={() => setSeleccionado(null)}
              cambio={cambio}
            />
          ) : (
            <Creditos
              fecha={fecha}
              version={version}
              tramo={tramo}
              setTramo={setTramo}
              abrir={abrir}
            />
          ))}
        {modulo === "solicitud" && (
          <Originacion
            key={fecha}
            fecha={fecha}
            abrirCredito={abrir}
            cambio={cambio}
          />
        )}{" "}
        {modulo === "cierres" && gerencia && (
          <Cierres key={fecha} fecha={fecha} actor={sesion.actor} />
        )}{" "}
        {gerencia && chatIniciado && (
          <div hidden={modulo !== "chat"}>
            <Suspense fallback={<Cargando texto="Preparando el asistente…" />}>
              <Chat key={fecha} fecha={fecha} sesion={sesion} cambio={cambio} />
            </Suspense>
          </div>
        )}
      </main>
      <footer className="pie">
        Crédito Vecino, S. A. <span>Información financiera al {fecha}</span>
      </footer>
    </div>
  );
}
