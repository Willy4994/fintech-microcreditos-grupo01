# Interfaz de Crédito Vecino

React, TypeScript, Vite y Tailwind, con la identidad azul/celeste del prototipo P2.

Desde la raíz del repositorio:

```bash
npm --prefix frontend ci
npm run build:all
npm start
```

Abrir http://127.0.0.1:3000. Deben estar preparados PostgreSQL, pgvector y los datos.
El asistente necesita Ollama y la ingesta; el resto de pantallas puede usarse sin el modelo.
Consultar el README principal para la preparación de servicios.

Para desarrollo: API con `npm start` y frontend con `npm run frontend:dev`, en dos terminales.
Vite envía `/api` a la API local, conservando host/origen para la sesión humana.

## Recorridos

- Originación: datos del cliente → solicitud → simulación → confirmación → desembolso.
- Cobro: créditos → detalle → mora por tramos → propuesta → aprobación humana → comprobante.
- Gerencia: tablero → créditos del tramo → detalle; cierres diarios/mensuales; chat con fuentes.

El perfil asesor prioriza tareas de campo; gerencia dispone del tablero, cierres y asistente.
La clave humana se introduce en acceso, se descarta al abrir la sesión y no va en variables
VITE ni almacenamiento del navegador. La cookie es HttpOnly. Reiniciar la API cierra sesiones.

Todas las cifras financieras proceden del backend. El frontend solo convierte centavos a
quetzales y puntos básicos a porcentajes para mostrarlos. Las fechas de negocio se eligen
explícitamente; cambiar el corte inicia una nueva conversación.

## Pruebas

Desde la raíz: `npm run test:ui`, después de `npx playwright install chromium`.
La configuración cubre escritorio y móvil y utiliza respuestas aisladas para los flujos
que escriben datos. `npm test` mantiene las pruebas del dominio, persistencia y sesión.

No hay cola automática de pagos sin conexión ni gestión empresarial de usuarios.
El último pago conserva su clave para un reintento; confirmar requiere conexión al servidor.
