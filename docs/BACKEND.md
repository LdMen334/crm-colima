# Contexto del backend (CR_Backend) para el desarrollo del front

> **Sincronizado con:** `CR_Backend` @ `4a90297` (rama `develop`, 21-oct-2026) y `crm-colima` @ `f2d78ce`
> (rama `develop`, 20-oct-2026). Si alguno de los dos repos avanza, revisar `routes/api.php`,
> `app/Http/Controllers/Api/V1/` y `app/Http/Requests/StoreExpedienteRequest.php` y actualizar este archivo.

El backend es una API REST en **Laravel 13 + PHP 8.4 + PostgreSQL 16**, autenticada con **tokens Bearer de
Sanctum**. Vive en el repositorio hermano `CR_Backend` (en esta máquina: `../CR_Backend`). El front ya no usa
ningún mock: todas las llamadas pasan por `src/lib/api-client.ts`.

## 1. Levantar el backend en local

```bash
cd ../CR_Backend
cp .env.example .env
docker compose run --rm app php artisan key:generate
docker compose up -d --build
docker compose exec app php artisan migrate --seed   # imprime UNA sola vez la contraseña temporal de admin@crm-colima.mx
```

- API: `http://localhost:8080/api/v1` (puerto `APP_PORT`). Healthcheck: `GET http://localhost:8080/up`.
- CORS: `CORS_ALLOWED_ORIGINS=http://localhost:3000` en el `.env` del backend. Si el front corre en otro
  puerto u origen, agregarlo ahí (separado por comas) o el navegador bloqueará las peticiones.
- En el front, la URL se configura con `NEXT_PUBLIC_API_URL` en `.env.local` (por defecto
  `http://localhost:8080/api/v1`).
- Pruebas del backend: `docker compose --profile test run --rm app_test php artisan test` (nunca con el
  servicio `app`: borraría la base de desarrollo; ver README del backend).

## 2. Convenciones de la API

| Tema | Regla |
|---|---|
| Base | `/api/v1` |
| Autenticación | `Authorization: Bearer <token>` (se obtiene en `POST /auth/login`). El front lo guarda en `sessionStorage` (`crm-hc-token`) |
| Sesión única | Cada login revoca **todos** los tokens anteriores de esa cuenta. Si un usuario entra en otro equipo, el primero recibe 401 |
| Expiración | 480 min (8 h) — `SANCTUM_TOKEN_EXPIRATION_MINUTES` |
| Zona horaria de negocio | `America/Mexico_City` (fechas de estudio, jornada del Excel, estadísticas "hoy") |
| Fechas | Entrada y salida `AAAA-MM-DD`; marcas de tiempo en ISO 8601 |
| Nombres de campos | `snake_case`. El front convierte con `toDbPayload()` / `fromDbPayload()` (`features/historia-clinica/lib/db-mapping.ts`) |
| Mayúsculas | El backend guarda en MAYÚSCULAS `nombre_completo` y `universidad` de usuarios, y `zona_trabajo` |
| Rol (backend ↔ front) | `admin` ↔ `'Leo'` · `servicios_medicos` ↔ `'ServiciosMedicos'` (mapa en `features/usuarios/api.ts`) |
| PDF y Excel | **El backend no genera archivos.** Entrega JSON y el front construye el PDF (`@react-pdf/renderer`) y el Excel (`exceljs`) |
| Código postal | No existe en el backend; el front lo resuelve con `public/data/cp/` y **no se envía** |

### Formato único de error

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Escribe el nombre completo del paciente.", "fields": { "nombre_completo": "Escribe el nombre completo del paciente." } } }
```

`apiFetch()` lo convierte en `ApiError` (`message`, `code`, `fields`, `status`). Los mensajes ya vienen en español
listos para mostrarse.

| HTTP | `code` | Cuándo |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Validación; `fields` trae el mensaje por campo (snake_case) |
| 401 | `UNAUTHENTICATED` | Sin token, token vencido o revocado por otro login |
| 401 | `INVALID_CREDENTIALS` | Correo o contraseña incorrectos en el login |
| 403 | `FORBIDDEN` | Rol sin permiso, cuenta inactiva, perfil equivocado en el login |
| 403 | `PASSWORD_CHANGE_REQUIRED` | La cuenta tiene contraseña temporal y llamó un endpoint distinto de `/auth/*` o `/me*` |
| 404 | `NOT_FOUND` | Recurso o clave de expediente inexistente |
| 409 | `CONFLICT` | Correo duplicado, último admin activo, o choque de guardado simultáneo ("Otro equipo guardó al mismo tiempo…") |
| 429 | `TOO_MANY_REQUESTS` | Login: más de 5 intentos/min por IP **y** por cuenta |
| 500 | `INTERNAL_ERROR` | Nunca expone detalles internos |

### Middlewares (orden de aplicación)

1. `auth:sanctum` + `active` → todo excepto `POST /auth/login`. Una cuenta inactiva queda fuera aunque tenga token.
2. `no-temp-password` → todo excepto `/auth/logout`, `/auth/me`, `PUT /me`, `POST /me/password`. Por eso,
   tras el login con contraseña temporal, el backend responde `redirect: "/perfil"`.
3. `role:admin` → usuarios (salvo el selector), bitácora, datos para PDF, entrega, Excel y cierre de año.

> Ocultar botones en el front (`can()` en `features/auth/permissions.ts`) es solo UX: la autorización real la
> hace el backend. Mantener ambas matrices alineadas.

## 3. Identificador de expediente: `{anio}-{folio_anual}`

El historial se **respalda y borra cada año**, así que el folio ya no es global:

- `anio` = año de `fecha_estudios` (columna generada en Postgres).
- `folio_anual` = consecutivo dentro del año (1, 2, 3… y vuelve a empezar en 1 el año siguiente).
- Restricción única `(anio, folio_anual)`.
- **Clave de ruta:** `"{anio}-{folio_anual}"`, p. ej. `2026-6`. Se usa en `/expedientes/{clave}`,
  `/expedientes/{clave}/pdf`, `/expedientes/{clave}/entrega` y en la ruta del front `/expediente/[folio]`
  (el segmento se llama `folio` pero contiene la clave). Helper: `clave(anio, folio)` en
  `features/historia-clinica/api.ts`.
- En las respuestas, `folio` es un alias de `folio_anual` por compatibilidad.
- Una búsqueda `q` **puramente numérica** se interpreta como folio exacto (navegador y bitácora).

**Asignación del folio:** el servidor lo asigna al guardar (advisory lock + reintento automático hasta 3 veces si
choca con otro equipo). `GET /expedientes/siguiente-folio` es solo una vista previa: si otro equipo guarda antes,
el expediente queda con otro número y el front lo avisa (`HistoriaClinicaWorkspace.tsx`, "folio reasignado").

**Fecha de realización (`fecha_estudios`):** la fija el servidor con la fecha de hoy (zona México) al crear y
**no cambia** al editar; lo que mande el front se ignora.

## 4. Endpoints

Rol: **todos** = cualquier usuario autenticado y activo sin contraseña temporal · **admin** = solo `admin`.

### Autenticación y perfil

| Método y ruta | Rol | Cuerpo / query | Respuesta |
|---|---|---|---|
| `POST /auth/login` | público | `{ email, password, perfil: "admin" \| "servicios_medicos" }` | `{ user, token, redirect: "/perfil" \| "/expedientes" }` |
| `POST /auth/logout` | cualquiera | — | 204 (revoca solo el token actual) |
| `GET /auth/me` | cualquiera | — | `{ user }` |
| `PUT /me` | cualquiera | `{ nombre_completo, email, cedula_profesional?, universidad? }` | `{ user }` (el rol nunca cambia aquí) |
| `POST /me/password` | cualquiera | `{ actual, nueva }` | `{ user }` y apaga `is_temporary_password` |

Login — orden de validación y mensajes: credenciales → cuenta inactiva ("Tu cuenta está inactiva…") → perfil
elegido vs. rol real ("Esta cuenta no tiene acceso de Administración…" / "Esta es una cuenta de Administración…").

Objeto `user` (`UserResource`):

```ts
{ id: string /* uuid */, email, nombre_completo, rol: 'admin' | 'servicios_medicos', estado: 'activo' | 'inactivo',
  cedula_profesional: string | null, universidad: string | null, is_temporary_password: boolean,
  ultimo_acceso: string | null, creado_por: string | null, creado_por_nombre?: string | null, created_at: string }
```

### Usuarios

| Método y ruta | Rol | Cuerpo / query | Respuesta |
|---|---|---|---|
| `GET /users?vista=selector` | todos | — | `{ items: [{ id, nombre_completo, cedula_profesional, universidad, etiqueta }] }` (vista `medicos_selector`: médicos activos con cédula y universidad) |
| `GET /users` | admin | `q`, `rol`, `estado` | `{ items: user[] }` |
| `POST /users` | admin | `{ nombre_completo, email, rol, cedula_profesional?, universidad?, password? }` | 201 `{ user, temporary_password }` |
| `GET /users/{id}` | admin | — | `{ user }` |
| `PUT /users/{id}` | admin | `{ nombre_completo, email, rol, cedula_profesional?, universidad?, estado }` | `{ user }` |
| `POST /users/{id}/reset-password` | admin | — | `{ temporary_password }` y revoca las sesiones de esa cuenta |

Reglas: con `rol = servicios_medicos`, cédula (≥ 5 letras/números) y universidad (≥ 2) son obligatorias. Si no se
manda `password`, el servidor genera una temporal. Salvaguardas: nadie se desactiva ni se quita el rol admin a sí
mismo, y siempre queda ≥ 1 admin activo (409). Correo duplicado → 409 con `fields.email`.

### Pacientes

| Método y ruta | Rol | Query | Respuesta |
|---|---|---|---|
| `GET /pacientes/buscar` | todos | `q` (≥ 2 caracteres) | `{ items: [{ id, nombre_completo, curp, nss }] }` máx. 8; CURP/NSS por prefijo, nombre sin acentos |
| `GET /pacientes/lookup` | todos | `curp` y/o `nss`, `excluir_clave?` | `{ paciente_id, ultimo_folio, ultimo_anio, datos }` o 404 |

`lookup` precarga un paciente recurrente desde su visita más reciente: datos fijos (nombre, nacimiento, género,
CURP, NSS, domicilio, teléfono, empresa, puesto), **Antecedentes, Historia laboral, Exploración física y
Diagnóstico**. A propósito **no** incluye Laboratorio, Audiometría ni Gabinete (se capturan desde cero).
`excluir_clave` evita precargar desde el mismo expediente que se está editando.

### Expedientes

| Método y ruta | Rol | Cuerpo / query | Respuesta |
|---|---|---|---|
| `GET /expedientes/siguiente-folio` | todos | `anio?` | `{ folio, anio }` (informativo) |
| `GET /expedientes` | todos | `q`, `desde`, `hasta`, `tipo`, `empresa`, `medico_id`, `solo_examenes_visuales`, `page` (1-indexada), `page_size` (def. 12) | `{ items, total, page, page_size }` |
| `GET /expedientes/estadisticas` | todos | `anio?` | `{ anio, total, ultimos_7_dias, hoy, editados_hoy, por_tipo }` |
| `GET /expedientes/empresas` | todos | — | `{ items: string[] }` (filtro del Reporte SABI) |
| `GET /expedientes/zonas` | todos | — | `{ items: string[] }` (zonas de fábrica + las ya capturadas) |
| `POST /expedientes` | todos | payload plano (ver §5) | 201 expediente; bitácora "Creación de Folio" |
| `GET /expedientes/{clave}` | todos | — | expediente; bitácora "Consulta" |
| `PUT /expedientes/{clave}` | todos | payload plano | expediente; bitácora "Edición de Expediente" con los campos que cambiaron |
| `GET /expedientes/{clave}/pdf` | admin | `plantilla=PECO\|TX` | expediente + `plantilla`; bitácora "Consulta" (hoy el front no lo usa: genera el PDF con el expediente ya abierto) |
| `POST /expedientes/{clave}/entrega` | admin | — | `{ fecha_entrega_resultados }` (hoy, zona México). Se llama justo antes de generar el PDF |

**Visibilidad por rol en `GET /expedientes`:** para `servicios_medicos` el servidor **fuerza**
`medico_id = usuario actual` (solo ve los expedientes donde es el médico dictaminador); el admin puede filtrar por
cualquiera o ver todos. Por eso, al crear un expediente, el front precarga al propio médico en
"Médico dictaminador" (`valoresNuevoExpediente`). Orden: `updated_at` descendente.

Fila del navegador:

```ts
{ folio, anio, fecha_estudios, nombre_completo, curp, nss, empresa, zona_trabajo, tipo_examen_motivo,
  examenes_visuales_realizados: boolean, medico, gradiente: number | null, no_apto: boolean,
  updated_at, actualizado_por }
```

Expediente completo (`ExpedienteResource`):

```ts
{ folio, anio, folio_anual, fecha_estudios,
  values: Record<string, unknown>,          // todas las columnas aplanadas en snake_case
  creado_por: { id, nombre }, actualizado_por: { id, nombre }, created_at, updated_at }
```

### Administración

| Método y ruta | Rol | Cuerpo / query | Respuesta |
|---|---|---|---|
| `GET /bitacora` | admin | `accion`, `fecha` (día), `q`, `page` (20 por página) | `{ items: [{ fecha, usuario_nombre, accion, anio, folio, paciente, detalle }], total }` |
| `GET /export/excel` | admin | `fecha?` (def. hoy) | `{ fecha, items: expediente[] }` — realizados **o editados** ese día |
| `GET /admin/anios/pendientes` | admin | — | `{ anios: number[] }` años anteriores al actual con datos |
| `POST /admin/anios/{anio}/cerrar` | admin | `{ confirmar: true }` | `{ anio, total_borrado, items: expediente[] }` (stream) |

`accion` de bitácora: `Creación de Folio`, `Edición de Expediente`, `Consulta`, `Importación Histórica`.

> ⚠️ **Cierre de año = borrado irreversible.** El servidor transmite el respaldo completo y, si la descarga llegó
> entera, **borra** todas las historias de ese año y los pacientes que se queden sin visitas. El front debe
> construir el Excel de respaldo con esa misma respuesta (`cerrarAnio()` + `features/anios/CierreAnioAviso.tsx`).
> No hay forma de recuperar los datos después.

## 5. Payload del expediente (`POST` / `PUT`)

Es un objeto **plano** en snake_case con las columnas de todos los módulos (lo genera `toDbPayload()`; vacíos →
`null`). Diferencias importantes con el formulario:

- `medico_dictaminador` debe ser el **UUID** del usuario (el formulario guarda el nombre; `guardarExpediente()`
  lo traduce con `medicoIdPorNombre()`).
- `fecha_siguiente_valoracion`: fecha o el texto literal `NO APTO` (el servidor lo guarda como `no_apto = true`).
- `gradiente`: se guarda como entero 1-4.
- Audiometría `aud{frecuencia}_{od|oi}`: numérico entre -10 y 120; el servidor acepta coma decimal y sufijo "dB".
- Calculados por el servidor (se ignoran si se envían): `edad`, `grupo_edad`, `ta_conjunta`, `imc`,
  `estado_nutricional`, `folio`, `anio`, `folio_anual`, `fecha_estudios`.

### Campos obligatorios (400 si faltan)

Por solicitud del cliente, solo tres: `nombre_completo`, `curp` **o** `nss` (al menos uno) y `medico_dictaminador`.
Todos los demás son opcionales; si se envían, se valida su formato (catálogos, fechas, números).

El front aplica las mismas reglas antes de enviar (`features/historia-clinica/lib/validacion.ts`). Los campos de `CAMPOS_ADVERTENCIA` (grupo Rh, gradiente y los 6 antidoping) **no bloquean**: solo
se muestra un aviso.

### Catálogos cerrados que valida el backend

| Campo | Valores |
|---|---|
| `genero` | `MASCULINO`, `FEMENINO` |
| `tipo_examen_motivo` | `INGRESO / EVALUACIÓN INICIAL`, `RENOVACIÓN ANUAL`, `CONTROL PERIÓDICO / SEGUIMIENTO` |
| `tipo_examen_categoria` | `PERSONAL GENERAL`, `OPERADORES`, `CAT B`, `CAT C`, `VISITA TEC` |
| `religion` | `Católica`, `Cristiana`, `Ninguna`, `Atea`, `Negado`, `Otra` |
| `estado_civil` | `SOLTERO`, `CASADO`, `UNION LIBRE`, `DIVORCIADO`, `SEPARADO`, `VIUDO` |
| `escolaridad` | `Sin Escolaridad`, `Primaria Incompleta`, `Primaria Terminada`, `Secundaria Incompleta`, `Secundaria Terminada`, `Preparatoria Incompleta`, `Preparatoria Terminada`, `Licenciatura Incompleta`, `Licenciatura Terminada`, `Maestría / Postgrado` |
| `lentes_seguridad` | `PX NO NECESITA LENTES GRADUADOS DE SEGURIDAD`, `PX REQUIERE LENTES GRADUADOS DE SEGURIDAD` |
| `bh_grupo_rh` | `O/A/B/AB` + `POSITIVO`/`NEGATIVO` (p. ej. `O POSITIVO`) |
| `ad_opi`, `ad_coc`, `ad_thc`, `ad_bzo`, `ad_met`, `ad_amp` | `NO REACTIVO`, `REACTIVO`, `NO REALIZADO` |

`zona_trabajo` es **texto libre** (máx. 255) con sugerencias. Las de fábrica (`StoreExpedienteRequest::ZONAS_TRABAJO`,
deben coincidir con `zonasTrabajo` del front): ALZADA, AQUILA, CLUB SOCIAL, COLIMA, MINA, NOVA, PALOMAS, PELET,
PRESAS, TECOMÁN, TERNIUM. El servidor las normaliza a mayúsculas y unifica variantes sin acento ("tecoman" → "TECOMÁN").

**Si se agrega o cambia un catálogo, hay que tocar los dos repos:** `config/catalogs.ts` en el front y
`StoreExpedienteRequest.php` en el backend; si no, el backend responderá 400.

## 6. Modelo de datos (resumen)

| Tabla | Contenido |
|---|---|
| `users` | Cuentas (UUID, rol, estado, cédula, universidad, contraseña Argon2id, `is_temporary_password`) |
| `pacientes` | Datos fijos de la persona; CURP y NSS únicos cuando no son nulos |
| `domicilios` | Domicilio vigente del paciente |
| `historias_clinicas` | Una visita: `anio`, `folio_anual`, `fecha_estudios`, datos laborales, médico, gradiente, `no_apto`, fechas R1/R2 |
| `hc_antecedentes`, `hc_historia_laboral`, `hc_exploracion`, `hc_laboratorio`, `hc_audiometria`, `hc_gabinete` | Módulos clínicos (1:1 con la historia; historia laboral 1:N por `orden`) |
| `auditoria` | Bitácora append-only (solo el servidor escribe) |
| vista `medicos_selector` | Médicos activos con cédula y universidad |

`hc_exploracion` calcula en Postgres `ta_conjunta`, `imc` y `estado_nutricional` (columnas generadas). El front
también los calcula en vivo (`useAutoCalculos`) para mostrarlos al capturar; si cambian las fórmulas, cambiarlas en
ambos lados (`CalculoClinicoService.php` y la migración de `hc_exploracion`).

Correspondencia completa de columnas con etiquetas oficiales: `app/Support/CamposExpediente.php` y
`app/Support/EtiquetasCampoExpediente.php` en el backend; `config/fields.ts` en el front.

## 7. Dónde está cada cosa (front ↔ back)

| Tema | Front (`crm-colima/src`) | Backend (`CR_Backend`) |
|---|---|---|
| Cliente HTTP / errores | `lib/api-client.ts` | `app/Exceptions/ApiExceptionHandler.php` |
| Login, sesión, perfil | `features/usuarios/api.ts`, `features/auth/*` | `AuthController`, `MeController` |
| Usuarios | `features/usuarios/*` | `UserController`, `StoreUserRequest`, `UpdateUserRequest` |
| Expedientes | `features/historia-clinica/api.ts` | `ExpedienteController`, `ExpedienteBuilder`, `FolioAnualService` |
| Validación del expediente | `historia-clinica/lib/validacion.ts` | `StoreExpedienteRequest` |
| Pacientes recurrentes | `features/pacientes/*` | `PacienteController`, `PacienteUpsertService` |
| Médicos (selector) | `historia-clinica/config/medicos.ts`, `usuarios/useMedicos.ts` | `GET /users?vista=selector`, vista `medicos_selector` |
| Bitácora | `features/auditoria/*` | `BitacoraController`, `AuditoriaService` |
| Excel de la jornada | `features/reportes-excel/*` | `ExportController` |
| Reporte SABI | `features/reportes-sabi/*` | `GET /expedientes` + `/expedientes/empresas` |
| PDF PECO / TX | `features/reportes-pdf/*` | `POST /expedientes/{clave}/entrega` |
| Cierre de año | `features/anios/*`, `cerrarAnio()` | `CierreAnioController` |
