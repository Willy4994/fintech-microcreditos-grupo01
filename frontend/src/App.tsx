import { useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Landmark,
  Wallet,
  AlertTriangle,
} from 'lucide-react'
import './App.css'

type Modulo = 'tablero' | 'cartera' | 'cierres'

const navegacion: { id: Modulo; nombre: string }[] = [
  { id: 'tablero', nombre: 'Tablero' },
  { id: 'cartera', nombre: 'Cartera' },
  { id: 'cierres', nombre: 'Cierres' },
]

const tramos = [
  { nombre: 'Mora 2' },
  { nombre: 'Mora 3' },
  { nombre: 'Vencido' },
  { nombre: 'Reestructurado' },
]

function App() {
  const [modulo, setModulo] = useState<Modulo>('tablero')
  const [fechaCorte, setFechaCorte] = useState('2026-10-31')

  return (
    <div className="aplicacion">
      <header className="encabezado">
        <div className="identidad">
          <div className="identidad-icono">
            <Landmark size={24} />
          </div>

          <div>
            <h1>
              {modulo === 'tablero'
                ? 'Tablero gerencial'
                : modulo === 'cartera'
                  ? 'Créditos del tramo'
                  : 'Cierres'}
            </h1>
            <p>
              {modulo === 'tablero'
                ? 'Resumen de cartera'
                : modulo === 'cartera'
                  ? 'Consulta de cartera'
                  : 'Cierre diario / mensual'}
            </p>
          </div>
        </div>

        <nav className="navegacion" aria-label="Navegación principal">
          {navegacion.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-boton ${modulo === item.id ? 'activo' : ''}`}
              onClick={() => setModulo(item.id)}
            >
              {item.id === 'tablero' && <BarChart3 size={16} />}
              {item.id === 'cartera' && <Wallet size={16} />}
              {item.id === 'cierres' && <CheckCircle2 size={16} />}
              {item.nombre}
            </button>
          ))}

          {modulo !== 'cierres' && (
            <button
              type="button"
              className="boton-principal"
              onClick={() => setModulo('cierres')}
            >
              <ArrowRight size={16} />
              Ver cierres
            </button>
          )}
        </nav>
      </header>

      <main className="contenido">
        {modulo === 'tablero' && (
          <>
            <section className="indicadores">
              <article className="tarjeta-indicador">
                <div className="indicador-icono">
                  <Wallet size={20} />
                </div>
                <span>Cartera activa</span>
                <strong>—</strong>
                <small>Pendiente de conexión con la API</small>
              </article>

              <article className="tarjeta-indicador">
                <div className="indicador-icono">
                  <AlertTriangle size={20} />
                </div>
                <span>Cartera en riesgo</span>
                <strong>—</strong>
                <small>Pendiente de conexión con la API</small>
              </article>

              <article className="tarjeta-indicador">
                <div className="indicador-icono">
                  <Clock3 size={20} />
                </div>
                <span>Cartera en mora</span>
                <strong>—</strong>
                <small>Pendiente de conexión con la API</small>
              </article>
            </section>

            <section className="paneles">
              <article className="panel">
                <div className="panel-titulo">
                  <div className="indicador-icono">
                    <BarChart3 size={19} />
                  </div>
                  <h2>Cartera en riesgo por tramo</h2>
                </div>

                <div className="tramos">
                  {tramos.map((tramo) => (
                    <div className="tramo" key={tramo.nombre}>
                      <div className="tramo-superior">
                        <span>{tramo.nombre}</span>
                        <strong>—</strong>
                      </div>

                      <div className="barra-fondo">
                        <div className="barra-progreso" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="total-riesgo">
                  <span>Total cartera en riesgo</span>
                  <strong>—</strong>
                </div>

                <p className="nota-panel">
                  Los porcentajes se mostrarán al conectar los datos reales.
                </p>
              </article>

              <article className="panel">
                <div className="panel-tabla-encabezado">
                  <div className="panel-titulo">
                    <div className="indicador-icono">
                      <AlertTriangle size={19} />
                    </div>
                    <h2>Créditos que requieren atención</h2>
                  </div>

                  <button
                    type="button"
                    className="boton-principal"
                    onClick={() => setModulo('cartera')}
                  >
                    <ArrowRight size={15} />
                    Ver créditos del tramo
                  </button>
                </div>

                <div className="tabla-contenedor">
                  <table>
                    <thead>
                      <tr>
                        <th>CRÉDITO</th>
                        <th>TRAMO</th>
                        <th>SALDO</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td colSpan={3} className="tabla-vacia">
                          Los créditos aparecerán cuando conectemos la API.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          </>
        )}

        {modulo === 'cartera' && (
          <section className="panel panel-modulo">
            <h2>Créditos del tramo</h2>
            <p>
              Aquí mostraremos los créditos agrupados por Mora 2,
              Mora 3, Vencido y Reestructurado.
            </p>
            <span className="estado-desarrollo">Pendiente de integración</span>
          </section>
        )}

        {modulo === 'cierres' && (
          <section className="panel panel-modulo">
            <h2>Cierres</h2>
            <p>Seleccione la fecha de corte para consultar el período.</p>

            <div className="fecha-control">
              <CalendarDays size={18} />
              <label htmlFor="fecha-corte">Fecha de corte</label>
              <input
                id="fecha-corte"
                type="date"
                value={fechaCorte}
                onChange={(evento) => setFechaCorte(evento.target.value)}
              />
            </div>

            <span className="estado-desarrollo">
              Generación de cierres pendiente de integración
            </span>
          </section>
        )}
      </main>
    </div>
  )
}

export default App