# Funcionamiento y decisiones del front

Reglas de negocio, decisiones de diseño y pendientes de `crm-colima`. El contrato con la API está en
[`BACKEND.md`](BACKEND.md).

## Decisiones clave

**Una sola definición de campos.** `fields.ts` alimenta formulario, panel, contador de avance y PDF.
Cambiar una etiqueta o el orden se refleja en todos lados. Los tests garantizan 206 campos,
numeración continua, claves únicas y que cada campo aparezca en exactamente una sección.

**Folio y fecha.** El folio es consecutivo **dentro de cada año** (`folio_anual`) y lo asigna el servidor al
guardar, de forma atómica; el que se muestra antes de guardar es solo una vista previa y, si otro equipo guardó
primero, se avisa del folio reasignado. La fecha de realización la fija el servidor (hoy, zona México). Ambos son
de solo lectura. Un expediente se identifica con la clave `{anio}-{folio}` (ver `docs/BACKEND.md` §3).

**Cierre de año.** Cada año el historial anterior se respalda en Excel y **se borra** de la base
(`/admin/anios/{anio}/cerrar`, irreversible). El admin ve un aviso mientras haya años pendientes.

**Pacientes recurrentes.** Al capturar un CURP (18) o NSS (11) que ya existe, se precargan nombre,
nacimiento, género, domicilio, teléfono, empresa, puesto, antecedentes, historia laboral, exploración física y
diagnóstico desde su visita más reciente (con opción de deshacer). Laboratorio, audiometría y gabinete siempre se
capturan desde cero.

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

**Campos obligatorios del expediente.** Los de "Datos Generales" (identificación y datos laborales, datos
personales, domicilio) más el Médico dictaminador (206); CURP **o** NSS (al menos uno). Zona de trabajo, Área,
Categoría del examen y Exposición (POE) son opcionales. Grupo Rh, Gradiente y los 6 antidoping no bloquean el
guardado: solo muestran un aviso (`CAMPOS_ADVERTENCIA`). Las reglas viven en `historia-clinica/lib/validacion.ts`
(Zod) y **se repiten en el backend** (`StoreExpedienteRequest.php`): si se cambia una, cambiar ambas. Lista exacta
en `docs/BACKEND.md` §5.

**Reglas compartidas** (`usuarios/validacion.ts`, Zod; las usan los formularios y `api.ts`):
- Nombre completo: `/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.]+$/` (letras, espacios y puntos; admite "J. Jesus", "Ma. Fernanda").
  No admite guiones ni apóstrofos (p. ej. "Pérez-López", "O'Brien").
- Servicios Médicos: cédula obligatoria (≥ 5 letras o números) y universidad (≥ 2 caracteres).
  Administrador: ambas opcionales; si se escribe cédula, debe tener ese formato.

## Seguridad (importante)

Ocultar botones no basta. Para "Servicios Médicos" el código del generador PDF ni siquiera se descarga
(import dinámico), y el backend valida el rol en cada endpoint (`role:admin` para usuarios, bitácora, PDF,
Excel y cierre de año). El rol viene del backend al autenticarse; el selector del login solo indica el perfil
solicitado. Si se agrega un permiso en `permissions.ts`, debe existir la regla equivalente en el backend.

Los datos clínicos son datos personales sensibles (LFPDPPP): usar HTTPS en producción. La sesión usa un token
Bearer de Sanctum en `sessionStorage` (sesión única por cuenta, 8 h); la bitácora de accesos la escribe solo el
servidor. No guardar datos de pacientes en `localStorage` ni en logs del navegador.

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
- Retirar `src/lib/local-db.ts` (mover `todayIso()` a un módulo de utilidades) ahora que todo usa la API.
