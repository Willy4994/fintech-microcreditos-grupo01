import { z } from "zod";

import { esquemasContrato } from "./schemas.js";

/**
 * Fuente programática de los componentes JSON Schema/OpenAPI.
 * En fases posteriores, el adaptador HTTP consumirá estos mismos esquemas.
 */
export const esquemasOpenApi = Object.fromEntries(
  Object.entries(esquemasContrato).map(([nombre, esquema]) => [
    nombre,
    z.toJSONSchema(esquema),
  ])
);
