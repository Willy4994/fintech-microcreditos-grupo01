import type { Pool, PoolClient } from "pg";
import { pool } from "./conexion.js";
import type {
  DatosCartera,
  RepositorioCartera,
  CreditoDato,
  PagoDato,
  PoliticaDato,
  ConfiguracionDato,
} from "../../aplicacion/puertos/DatosCartera.js";
import { exigir } from "../../aplicacion/errores.js";
export class RepositorioCarteraPg implements RepositorioCartera {
  constructor(private db: Pool | PoolClient = pool) {}
  async leer(): Promise<DatosCartera> {
    if (this.db === pool) {
      const cliente = await pool.connect();
      try {
        await cliente.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
        const datos = await new RepositorioCarteraPg(cliente).leer();
        await cliente.query("COMMIT");
        return datos;
      } catch (e) {
        await cliente.query("ROLLBACK");
        throw e;
      } finally {
        cliente.release();
      }
    }
    const creditos = await this.db.query<CreditoDato>(
      `SELECT id_credito,id_cliente,id_asesor,id_politica,to_char(fecha_desembolso,'YYYY-MM-DD') fecha_desembolso,capital_centavos::text,plazo_meses,tna_bps,reestructurado FROM creditos ORDER BY id_credito`,
    );
    const pagos = await this.db.query<PagoDato>(
      `SELECT id_pago::text,clave_idempotencia,id_credito,to_char(fecha,'YYYY-MM-DD') fecha,monto_centavos::text,canal,numero_cuota AS cuota,COALESCE(seq_evento,1000000+orden_operacion)::int AS orden FROM pagos ORDER BY fecha,orden`,
    );
    const politicas = await this.db.query<PoliticaDato>(
      "SELECT id_politica,configuracion FROM politicas_mora",
    );
    const conf = await this.db.query<ConfiguracionDato>(
      "SELECT moneda,base_conteo,parametros FROM configuracion_financiera ORDER BY id_configuracion DESC LIMIT 1",
    );
    return {
      creditos: creditos.rows,
      pagos: pagos.rows,
      politicas: politicas.rows,
      configuracion: exigir(conf.rows[0], "Ejecute la carga canónica"),
    };
  }
}
