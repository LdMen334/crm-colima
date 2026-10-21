# Historias Clínicas y Expediente Laboral — Front-end

**Cruz Roja Mexicana · Delegación Estatal Colima · Coordinación de Servicios Médicos**

Aplicación web para capturar, consultar y emitir las historias clínicas laborales (exámenes de ingreso, renovación
anual y seguimiento) del personal de empresas contratistas. Cada expediente tiene 206 campos oficiales organizados en
7 pestañas, genera los reportes PDF oficiales (formatos **PECO** y **TX**), el Excel de la jornada y el Reporte SABI.

Este repositorio contiene solo el front-end. Los datos, la autenticación y los permisos los maneja la API
**CR_Backend** (Laravel + PostgreSQL), que vive en un repositorio aparte.

## Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | ≥ 20.9 (probado con 26) | Entorno de ejecución |
| Next.js (App Router) | 16.4 | Framework |
| React / React DOM | 19.3 | Interfaz |
| TypeScript | 7.0 | Tipado |
| Tailwind CSS | 4.3 | Estilos |
| React Hook Form + @hookform/resolvers | 7.89 / 5.9 | Formularios |
| Zod | 4.6 | Validación |
| @react-pdf/renderer | 4.9 | Reportes PDF (PECO, TX, SABI) |
| ExcelJS | 4.4 | Exportación a Excel |
| lucide-react | 1.54 | Iconos |
| Motion | 13.4 | Animaciones |
| Vitest | 5.0 | Pruebas unitarias |

## Requisitos

- Node.js y npm.
- La API **CR_Backend** en ejecución (por defecto en `http://localhost:8080/api/v1`), con este origen incluido en
  su `CORS_ALLOWED_ORIGINS`.

## Instalación y ejecución

```bash
npm install
cp .env.example .env.local   # o crea .env.local con la variable de abajo
npm run dev                  # http://localhost:3000
```

### Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base de la API de CR_Backend | `http://localhost:8080/api/v1` |

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm start` | Sirve la compilación de producción |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run typecheck` | Verificación de tipos (`tsc --noEmit`) |

## Módulos y roles

| Módulo | Ruta | Servicios Médicos | Administración |
|---|---|:---:|:---:|
| Inicio de sesión | `/login` | ✓ | ✓ |
| Navegador de expedientes | `/expedientes` | ✓ (solo los propios) | ✓ |
| Nueva historia clínica | `/expediente` | ✓ | ✓ |
| Consultar / editar expediente | `/expediente/{anio}-{folio}` | ✓ | ✓ |
| Reporte SABI | `/reportes-sabi` | ✓ (sin PDF) | ✓ |
| Mi perfil | `/perfil` | ✓ | ✓ |
| Usuarios | `/admin/usuarios` | — | ✓ |
| Bitácora de auditoría | `/admin/bitacora` | — | ✓ |
| Reporte Excel | `/admin/reportes` | — | ✓ |
| Reportes PDF oficiales (PECO / TX) | dentro del expediente | — | ✓ |

No hay registro público: las cuentas las da de alta Administración.

## Estructura del proyecto

```
├── public/
│   ├── brand/              Logotipos institucionales
│   └── data/cp/            Catálogo de códigos postales (un archivo por prefijo)
├── scripts/                Generación del catálogo de códigos postales
├── docs/                   Documentación técnica
└── src/
    ├── app/                Rutas (App Router)
    │   ├── login/
    │   └── (protegido)/    Rutas con sesión: expedientes, expediente, reportes-sabi, perfil, admin
    ├── components/         Componentes compartidos (layout, ui, brand)
    ├── lib/                Cliente HTTP de la API y utilidades
    └── features/           Módulos por dominio
        ├── auth/               Sesión, roles y permisos
        ├── historia-clinica/   Definición de campos, formulario, cálculos y validación
        ├── expedientes/        Navegador de expedientes
        ├── pacientes/          Búsqueda y pacientes recurrentes
        ├── usuarios/           Login, perfil y gestión de cuentas
        ├── auditoria/          Bitácora
        ├── anios/              Cierre y respaldo anual
        ├── domicilio/          Asistente de código postal
        ├── reportes-pdf/       Plantillas PDF PECO y TX
        ├── reportes-excel/     Excel de la jornada
        └── reportes-sabi/      Reporte SABI
```

## Documentación

- [`docs/BACKEND.md`](docs/BACKEND.md) — contrato con la API de CR_Backend: endpoints, roles, errores, campos
  obligatorios y catálogos.
- [`docs/FUNCIONAMIENTO.md`](docs/FUNCIONAMIENTO.md) — reglas de negocio, cálculos automáticos, plantillas PDF,
  seguridad y pendientes.

## Licencias de datos

El catálogo de códigos postales (`public/data/cp/`) se genera a partir de un repositorio publicado bajo
**GPL-3.0**. Antes de distribuir la aplicación hay que confirmar con el área jurídica que es compatible (detalle en
`docs/FUNCIONAMIENTO.md`).
