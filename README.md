# Historias Clínicas y Expediente Laboral
**Cruz Roja Mexicana · Delegación Estatal Colima · Coordinación de Servicios Médicos**

Front-end en Next.js (App Router) + TypeScript + Tailwind CSS v4 + React Hook Form + @react-pdf/renderer.

## Arranque

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # cálculos, estructura de los 206 campos y catálogo de CP
npm run typecheck
```

**Acceso de desarrollo.** La cuenta de Administración (rol `Leo`) se crea sola la primera vez:
`leo@crm-colima.mx` / `Leo#Colima2026` (ver `LEO_SEED` en `features/usuarios/api.ts`). Como está escrita en el
código, es temporal: en el primer acceso se pide cambiarla.

**No hay registro público.** Solo Leo da de alta cuentas en `/admin/usuarios`, con una contraseña temporal
generada (12 caracteres, mayúsculas, minúsculas, números y símbolos) que puede copiar para enviarla. Quien entra
con contraseña temporal llega a `/perfil` para cambiarla.

> ⚠️ **Todo es MOCK en `localStorage`** (`src/lib/local-db.ts`): usuarios, expedientes y bitácora viven
> solo en el navegador de quien los captura, no se comparten entre equipos y cualquiera con acceso al
> equipo puede alterarlos desde las herramientas del navegador. Antes de usarlo con pacientes reales hay
> que implementar el backend (ver *Seguridad*).

## Rutas

| Ruta | Quién | Qué |
|---|---|---|
| `/login` | Público | Inicio de sesión (sin registro público) |
| `/perfil` | Todos | Datos personales y cambio de contraseña |
| `/expedientes` | Todos | Navegador: búsqueda por nombre/CURP/folio/empresa, rango de fechas, tipo de examen, paginación |
| `/expediente` | Todos | Nueva historia: folio consecutivo y fecha de hoy (solo lectura) |
| `/expediente/[folio]` | Todos | Consultar / editar (se registra como *Consulta*) |
| `/admin/usuarios` | Leo | Tabla de usuarios, alta con rol, activar / desactivar |
| `/admin/bitacora` | Leo | Creación de folio, edición (campos modificados) y consulta |
| `/admin/reportes` | Leo | Excel (.xlsx) de la jornada (por defecto hoy) o de la base completa |

## Estructura de carpetas

```
src/
├── app/
│   ├── layout.tsx                    AuthProvider global, idioma es-MX
│   ├── globals.css                   Tokens institucionales (@theme)
│   ├── page.tsx                      → /login
│   ├── login/page.tsx                Pantalla de login
│   └── (protegido)/
│       ├── layout.tsx                Guardia de sesión + encabezado oficial
│       └── expediente/page.tsx       Espacio de trabajo del expediente
│
├── components/
│   ├── brand/Logo.tsx                Logotipo oficial /brand/logo-cruz-roja.png
│   └── layout/
│       ├── Sidebar.tsx               Sidebar principal con logo, navegación y usuario
│       └── InstitutionalHeader.tsx   Barra superior (logo y sesión en móvil)
│
└── features/
    ├── auth/
    │   ├── types.ts                  Role = 'ServiciosMedicos' | 'Leo'
    │   ├── permissions.ts            Matriz rol → permisos (can())
    │   ├── api.ts                    MOCK de autenticación
    │   ├── AuthProvider.tsx          Contexto de sesión
    │   ├── RoleGate.tsx              <RoleGate permission="pdf:preview">
    │   └── LoginCard.tsx             Tarjeta flotante + conmutador de rol
    │
    ├── historia-clinica/
    │   ├── config/
    │   │   ├── fields.ts             ★ 206 campos oficiales + 3 complementarios (R1, R2, R4)
    │   │   ├── sections.ts           7 pestañas → 29 acordeones
    │   │   ├── catalogs.ts           Motivo, Categoría, Religión, Escolaridad, Estados…
    │   │   └── medicos.ts            Médico dictaminador y oftalmólogo firmantes
    │   ├── lib/
    │   │   ├── calculations.ts       Edad, grupo, IMC, OMS, TA, AHA/ACC (funciones puras)
    │   │   ├── calculations.test.ts
    │   │   ├── format.ts             Fechas, "---" para vacíos en PDF
    │   │   └── db-mapping.ts         camelCase → snake_case (tipo_examen_motivo…)
    │   ├── hooks/useAutoCalculos.ts  ★ Watchers de React Hook Form
    │   ├── components/
    │   │   ├── HistoriaClinicaWorkspace.tsx   useForm + FormProvider + layout
    │   │   ├── HistoriaClinicaForm.tsx        Pestañas + acordeones + avance
    │   │   ├── FieldRenderer.tsx              Input según tipo de campo
    │   │   ├── AudiometriaGrid.tsx            Tabla OD/OI + audiograma en vivo
    │   │   └── ClinicalSummaryPanel.tsx       Panel lateral con métricas
    │   └── api.ts                    MOCK de guardado
    │
    ├── pacientes/
    │   ├── api.ts                    Búsqueda por CURP / NSS / nombre (MOCK)
    │   └── PatientSearch.tsx         Autocomplete con teclado
    │
    ├── usuarios/                     Registro, alta por Leo, login (MOCK)
    ├── auditoria/                    Bitácora de auditoría
    ├── expedientes/                  Navegador de expedientes
    ├── reportes-excel/               Exportación .xlsx con exceljs (import dinámico)
    │
    ├── domicilio/
    │   └── CpAssistant.tsx           Asistente de CP (no se guarda ni imprime)
    │
    └── reportes-pdf/                 ★ Solo rol Leo
        ├── PdfActionBar.tsx          Barra condicionada por rol
        ├── PdfPreviewModal.tsx       Vista previa en tiempo real (import dinámico)
        ├── PlantillaSelector.tsx     PECO | TX
        ├── generate.tsx              Descarga y carga de logotipo
        └── templates/
            ├── config.ts             Paleta y márgenes medidos de los reportes oficiales
            ├── primitives.tsx        Celdas, grupos, barras, tablas, audiograma, firma
            ├── secciones.tsx         Secciones y hojas compartidas por PECO y TX
            ├── textos-laboratorio.ts Leyendas oficiales de drogas y grupo Rh
            ├── PecoTemplate.tsx      PECO: Historia Clínica + Pruebas Compl. + Ex. Visuales
            ├── TxTemplate.tsx        TX:   Historia Clínica + Pruebas Compl. + Ex. Visuales
            └── ReporteOficial.tsx    Selector de plantilla
```

## Decisiones clave

**Una sola definición de campos.** `fields.ts` alimenta formulario, panel, contador de avance y PDF.
Cambiar una etiqueta o el orden se refleja en todos lados. Los tests garantizan 206 campos,
numeración continua, claves únicas y que cada campo aparezca en exactamente una sección.

**Folio y fecha.** El folio es consecutivo (mayor folio + 1) y se confirma al guardar; la fecha de
realización es el día de creación. Ambos son de solo lectura. En producción el folio debe asignarlo
el servidor dentro de una transacción.

**Pacientes recurrentes.** Al capturar un CURP (18) o NSS (11) que ya existe, se precargan nombre,
nacimiento, género, domicilio, teléfono, empresa y puesto desde su visita más reciente (con opción de deshacer).

**Campos autocalculados** (`useAutoCalculos`), de solo lectura:

| Entrada | Resultado |
|---|---|
| Fecha de nacimiento (16) | Edad (17) y Grupo de edad (18). Se calcula a la **fecha de los estudios** (2) si existe; si no, a hoy. |
| Peso (82) + Talla (83) | IMC (84) a 1 decimal y Estado nutricional OMS (85). Talla en cm (170) se convierte a m; al salir del campo se reescribe como 1.70. |
| TA sistólica (78) + diastólica (79) | TA conjunta (80) y Clasificación AHA/ACC 2017 (81). |

**Código postal (INEGI / SEPOMEX).** Catálogo nacional (32,159 CP) en `public/data/cp/{NN}.json`, un archivo
por los 2 primeros dígitos del CP: el navegador solo descarga el fragmento del CP escrito (Colima ≈ 26 KB).
Lo consulta `src/lib/inegi-cp.ts`. Con 5 dígitos rellena Estado y Municipio; si el CP tiene varias colonias,
el campo Colonia se vuelve lista. Para regenerarlo:

```bash
git clone --depth 1 https://github.com/angelsantosa/inegi-lista-estados.git /tmp/inegi
node scripts/build-cp-inegi.mjs /tmp/inegi
```

> ⚠️ **Licencia:** ese repositorio publica los datos bajo **GPL-3.0**. Antes de distribuir la aplicación,
> confirmen con el área jurídica si es compatible con su licenciamiento; la alternativa es generar el
> catálogo desde la descarga oficial de SEPOMEX (datos públicos) con el mismo formato de salida.

El CP vive solo en el estado local de `CpAssistant`; no se registra en el formulario,
así que es imposible que llegue al expediente o al PDF. Estado, municipio y colonia siguen siendo editables.

**Ningún campo del expediente es obligatorio.** Solo se valida el formato de lo capturado
(`historia-clinica/lib/validacion.ts`, Zod): hoy, 003 Nombre completo.

**Reglas compartidas** (`usuarios/validacion.ts`, Zod; las usan los formularios y `api.ts`):
- Nombre completo: `/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.]+$/` (letras, espacios y puntos; admite "J. Jesus", "Ma. Fernanda").
  No admite guiones ni apóstrofos (p. ej. "Pérez-López", "O'Brien").
- Servicios Médicos: cédula obligatoria (≥ 5 letras o números) y universidad (≥ 2 caracteres).
  Administrador: ambas opcionales; si se escribe cédula, debe tener ese formato.

## Seguridad (importante)

Ocultar botones no basta. Para "Servicios Médicos" el código del generador PDF ni siquiera se descarga
(import dinámico), pero cualquier endpoint que genere, guarde o sirva PDFs **debe validar el rol en el servidor**.
El rol debe venir del backend al autenticarse; el conmutador del login solo indica el perfil solicitado.
Los datos clínicos son datos personales sensibles (LFPDPPP): usar HTTPS, sesiones con cookie `httpOnly`
y bitácora de accesos.

## Plantillas PDF

Ambas replican los reportes oficiales impresos (`Reporte_Folio_106` = PECO, `Reporte_Folio_108` = TX):
márgenes, paleta, celdas de etiqueta en color con texto blanco, rótulos de grupo (Tórax, Abdomen, Ojos…)
y gráfica de audiometría. Generan **3 hojas**:
Historia Clínica, Pruebas Complementarias (drogas en orina y grupo Rh con sus leyendas) y Exámenes Visuales
(firma del oftalmólogo). Los campos vacíos se imprimen como `---` y las fechas como DD/MM/AAAA, igual que en los originales.

| | PECO | TX |
|---|---|---|
| Encabezado | Logo Peña Colorada · Historia Clínica · logo Servicios Médicos | Logo Cruz Roja · HISTORIA CLÍNICA (repetido en cada página) |
| Paleta | Barras #C6361B · etiquetas #5D7388 · título #285775 | Barras #FF3300 · etiquetas #01688A · casilla de gradiente por nivel |
| Márgenes (pt) | izq. 57 · der. 54 · sup. 54 | izq. 46 · der. 53 · sup. 20 |
| Casilla destacada | Magnitud de Riesgo = B + gradiente (B1-B4) | Gradiente (1-4) |
| Fechas | Exámenes y entrega de resultados | Exámenes y siguiente valoración (+6 meses sugerido) |
| Gradiente | Clasificación fija "B" y gradiente en datos generales | En datos generales y casilla |
| Drogas en orina | Hoja complementaria | Tabla MET-COC-OPI-AMP-BZO-THC + hoja complementaria |
| Firma | Línea con nombre, universidad y cédula | Bloque: nombre, cédula, universidad, dirección, firma |

**Campos complementarios (R1, R2, R4).** Los formatos impresos piden datos que no están entre los 206 encabezados:
fecha de entrega de resultados, fecha de siguiente valoración y tipo de empleado (este último lo asigna el sistema).
R3, R5, R6 y R7 se retiraron y sus códigos no se reutilizan: *Lugar de certificación* lo cubre *Zona de trabajo* (006),
la *Clasificación* PECO es siempre "B", el *Perímetro abdominal* era redundante con *Aspecto general* (082-086) y la
*Magnitud de riesgo* se deriva del Gradiente (205).

**Aspecto general** (pestaña Exploración física) contiene 082 Peso, 083 Talla, 084 IMC (calculado),
085 Estado nutricional, 086 Tipo y 087 Piel. En el Excel, 086 cae en la columna **CH**.
El PDF PECO conserva la celda **Per. Abdominal** (formato oficial) y la llena con el mismo valor de 086 Tipo,
para no capturarlo dos veces.

**R4 Tipo de empleado** no se captura: el sistema guarda siempre `CONTRATISTA` (al crear, al guardar y al
releer expedientes anteriores), y así sale en el PDF PECO y en el Excel.

**R2 Fecha de siguiente valoración** acepta una fecha o `NO APTO` (botón junto al calendario). Ambos se
guardan e imprimen tal cual; la fecha sale como DD/MM/AAAA.

**Colonia** acepta texto libre y sugiere las colonias del código postal capturado.

**Gradiente y colores** (`lib/gradiente.ts`, una sola regla para PDF y Excel):
1 verde `#00B050` · 2 amarillo `#FFFF00` · 3 naranja `#FF9800` · 4 rojo `#FF0000`.
PECO imprime la Magnitud de Riesgo como `B` + gradiente (B1-B4); TX imprime solo el número.
El Excel colorea la columna del Gradiente y añade junto a ella la Magnitud de riesgo PECO.

**Logotipos** (`public/brand/`): `logo-cruz-roja.png` (login), `logo-cruz-roja-horizontal-blanco.png` y
`logo-cruz-roja-cruz.png` (sidebar sobre fondo oscuro, expandido y colapsado; derivados del vertical oficial con
el texto en blanco; si cuentan con la versión inversa oficial, basta con reemplazar esos archivos), `logo-cruz-roja-horizontal.png`,
`logo-pena-colorada.png` y `logo-servicios-medicos.png` (encabezados PDF, tomados de los reportes oficiales).

**Médico que atiende (206).** Lista con los usuarios activos que tienen cédula y universidad
(dados de alta por Leo) más el firmante oficial, mostrada como `Nombre - Cédula: … (Universidad)`.
Se guarda el nombre; el PDF obtiene la cédula y la universidad del mismo directorio. Un alta nueva aparece
al instante, sin recargar.

**Firmas.** Los PDF dejan la línea de firma vacía. Las rúbricas escaneadas de los reportes de muestra no se
incluyeron: estamparlas automáticamente permitiría emitir reportes "firmados" sin intervención del médico.
Si se requiere firma digital, debe aplicarla el propio médico (p. ej. firma electrónica con su e.firma).

**Clasificación de T/A (campo 81)** es de captura libre, con sugerencias (NORMAL, LIGERAMENTE ELEVADA, ALTA, MUY ALTA).

## Pendientes por confirmar

- **Tipografía TX**: el original usa Trade Gothic Next (licencia comercial). Se usa Helvetica; si tienen la licencia, registrar los TTF con `Font.register`.
- **Valores fuera de rango** en laboratorio salen en rojo en los originales; requiere definir los rangos de referencia por estudio.
- **"Examen de Audiometría" OD/OI** del formato TX no tiene campo entre los 206; hoy solo se imprime el resultado.
- **Escolaridad**: el Excel TX usa "COMPLETA" y llega hasta doctorado; se mantuvo el catálogo indicado ("Terminada", hasta Maestría / Postgrado).
- **Fechas del Excel** mezclan formatos (4/20/1971 es mes/día; 6/1/1968 es día/mes según la CURP). Revisar antes de migrar datos históricos.
- Backend real para usuarios, expedientes, bitácora y folios (hoy MOCK en `localStorage`).
