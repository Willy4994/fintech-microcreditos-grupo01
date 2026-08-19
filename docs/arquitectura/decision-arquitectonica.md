# E2 – Decisión Arquitectónica

## 1. Estilo arquitectónico seleccionado

Para el Sistema de Gestión de Microcrédito de Crédito Vecino, S. A. se selecciona una **arquitectura hexagonal (puertos y adaptadores)** implementada inicialmente como un **monolito modular**.

La decisión responde a la necesidad de mantener el núcleo financiero independiente de tecnologías externas como base de datos, red, interfaz gráfica o mecanismos de integración.

El dominio contiene reglas que deben ser exactas, reproducibles y auditables. Por ello, los cálculos de amortización, interés corriente, interés moratorio, aplicación de pagos, clasificación de mora y cartera en riesgo deben vivir en un núcleo independiente y comprobable.

---

## 2. Relación con los atributos de calidad priorizados

### 2.1 Adecuación funcional

La arquitectura hexagonal permite mantener las reglas financieras dentro del núcleo de dominio, evitando que dependan de controladores HTTP, consultas SQL o componentes de interfaz.

Esto facilita comprobar mediante pruebas automatizadas que los cálculos producen exactamente los resultados definidos por las reglas de negocio.

Ejemplos:

- tabla de amortización del caso 6.4.1;
- interés moratorio de Q7.26;
- cartera en riesgo de 7.00%;
- cartera en riesgo de 6.06% tras la baja contable indicada;
- invariantes del dominio.

---

### 2.2 Fiabilidad

Los casos de uso se ejecutan sobre un núcleo controlado y con dependencias explícitas.

La arquitectura permite implementar mecanismos como:

- clave de idempotencia para pagos;
- cierres idempotentes;
- puerto `Reloj` para controlar la fecha de corte;
- repositorios en memoria para pruebas;
- registro de movimientos en lugar de sobrescritura de saldos.

Esto contribuye a obtener resultados reproducibles y auditables.

---

### 2.3 Mantenibilidad

Las reglas institucionales pueden cambiar con el tiempo.

Por ejemplo:

- tasa nominal anual;
- tasa moratoria;
- base de conteo;
- política de pago anticipado;
- métodos financieros futuros.

La arquitectura hexagonal permite aislar estas decisiones mediante interfaces y estrategias, reduciendo el impacto de los cambios sobre el resto del sistema.

Además, el monolito modular mantiene fronteras claras entre contextos funcionales sin introducir desde el inicio complejidad distribuida.

---

### 2.4 Seguridad

La seguridad será implementada principalmente en adaptadores y capas externas.

Esto permite incorporar posteriormente autenticación, autorización y controles de acceso sin contaminar el núcleo financiero.

Las reglas del dominio permanecen independientes de la tecnología de autenticación utilizada.

---

### 2.5 Compatibilidad e interoperabilidad

Una ventaja central de esta arquitectura es que diferentes adaptadores primarios pueden utilizar los mismos casos de uso.

En el Proyecto Final se prevé incorporar:

- API REST;
- interfaz web;
- servidor MCP;
- Chat / asistente conversacional.

Todos invocarán los mismos puertos de aplicación.

De esta manera se evita duplicar reglas financieras.

---

### 2.6 Eficiencia de desempeño

El núcleo puede ejecutarse sin levantar una base de datos ni un servidor HTTP.

Las funciones financieras pueden probarse directamente en memoria, permitiendo ejecutar numerosos casos de prueba con bajo costo.

La persistencia solo interviene cuando un caso de uso realmente la necesita.

---

## 3. Organización como monolito modular

El sistema se desplegará inicialmente como una única aplicación, pero internamente estará dividido en módulos con responsabilidades explícitas:

- Originación
- Cálculo financiero
- Cartera y cobros
- Cierres
- Contratos / API

Cada módulo mantiene alta cohesión y evita asumir responsabilidades pertenecientes a otros contextos.

Esta organización reduce el acoplamiento sin introducir la complejidad operacional de los microservicios.

---

## 4. Puertos y adaptadores

### Puertos primarios

Representan los casos de uso que el exterior puede solicitar al sistema.

Ejemplos:

- RegistrarCliente
- SolicitarCredito
- EvaluarSolicitud
- DesembolsarCredito
- RegistrarPago
- GenerarCierre
- ConsultarCarteraEnRiesgo

### Adaptadores primarios

Actualmente o en fases posteriores podrán existir:

- API REST
- Interfaz Web
- Servidor MCP
- Chat / asistente

Estos adaptadores conducen solicitudes hacia los casos de uso.

### Puertos secundarios

Representan servicios que el núcleo necesita pero que no debe implementar directamente.

Ejemplos:

- RepositorioCreditos
- RepositorioClientes
- RepositorioMovimientos
- Reloj
- GeneradorIds

### Adaptadores secundarios

Implementan los puertos secundarios.

Ejemplos:

- PostgreSQL
- repositorio en memoria para pruebas;
- reloj real;
- reloj fijo para pruebas.

---

## 5. Alternativas consideradas

### 5.1 Arquitectura tradicional por capas

Una arquitectura tradicional basada en presentación, negocio y datos sería más sencilla inicialmente.

Sin embargo, existe el riesgo de que la lógica financiera termine acoplada a servicios, controladores o repositorios concretos.

Para este proyecto se necesita un núcleo especialmente independiente y comprobable, por lo que la arquitectura hexagonal ofrece una separación más explícita.

### 5.2 Microservicios

También se consideró dividir el sistema en servicios independientes.

Esta alternativa se descarta para la etapa actual.

Operaciones como desembolsar un crédito, registrar movimientos financieros y actualizar saldos requieren consistencia fuerte.

Separar estas operaciones entre varios servicios convertiría una transacción local en un problema de consistencia distribuida.

Esto agregaría complejidad en:

- transacciones distribuidas;
- comunicación entre servicios;
- reintentos;
- consistencia eventual;
- observabilidad;
- despliegue.

Actualmente esa complejidad no se justifica.

---

## 6. Evolución hacia el Proyecto Final

La arquitectura seleccionada permite evolucionar el sistema sin reemplazar el núcleo creado en el Proyecto 1.

En el Proyecto Final se podrán incorporar nuevos adaptadores primarios:

- API REST;
- servidor MCP;
- Chat;
- interfaz gráfica.

Estos componentes invocarán los mismos casos de uso existentes.

Por ejemplo:

API REST ─┐
Servidor MCP ─┼─> RegistrarPago
Chat ───────┘

Todos reciben exactamente el mismo resultado porque utilizan una única implementación del caso de uso.

---

## 7. Decisión final

Se adopta una **arquitectura hexagonal implementada como monolito modular**.

La decisión se considera adecuada porque:

- protege el núcleo financiero de dependencias externas;
- facilita pruebas rápidas y reproducibles;
- favorece la exactitud de los cálculos;
- reduce el acoplamiento;
- facilita el cambio de políticas;
- permite reutilizar los casos de uso desde diferentes interfaces;
- evita introducir prematuramente problemas de consistencia distribuida.

La arquitectura permitirá evolucionar el sistema hacia el Proyecto Final sin reescribir las reglas financieras implementadas en el núcleo.