# AGENTS.md — Guía para Agentes y Desarrolladores

Documento de referencia técnica y operativa para agentes de Inteligencia Artificial y desarrolladores humanos que trabajen sobre el repositorio **Gestor de Facturas de El Eco**.

---

## 1. Visión General del Proyecto

- **Nombre del Proyecto**: Gestor de Facturas de El Eco
- **Propósito**: Aplicación híbrida (Web + Escritorio Electron) orientada a usuarios no técnicos para la ingesta, extracción automática con IA (Google Gemini), validación visual en pantalla dividida, persistencia local (SQLite WASM) y exportación a Excel (.xlsx) de facturas de dos formatos comerciales ("Sistema 1" y "Sistema 2").
- **Stack Tecnológico**:
  - **Lenguaje**: TypeScript (`~6.0.2`, `es2023`, strict typing).
  - **Framework UI**: React 19 (`react: ^19.2.8`, `react-dom: ^19.2.8`).
  - **Bundler & Dev Server**: Vite 8 (`@vitejs/plugin-react`).
  - **Estilos**: Tailwind CSS v4 (`@tailwindcss/vite`, `@import "tailwindcss"` en `src/index.css`).
  - **Capa de Escritorio**: Electron 44 (`electron/main.cjs`, `cross-env`, `concurrently`).
  - **Motor de IA**: Google Gemini API (`@google/genai` / REST Gemini 2.5 Flash `gemini-2.5-flash:generateContent`).
  - **Motor de Base de Datos**: SQLite WASM en cliente vía `sql.js` (`^1.14.2`), persistido en `localStorage` y exportable a archivo binario `.sqlite`.
  - **Procesamiento de Documentos**: `pdfjs-dist` (`^6.4.299`) con worker local para renderizar primera página a canvas/JPEG.
  - **Exportación de Datos**: SheetJS `xlsx` (`^0.18.5`) con formato de moneda argentino (`"$"#,##0.00`).
  - **Linter**: `oxlint` (`^1.81.0`).

---

## 2. Setup y Entorno de Desarrollo

### Requisitos Previos
- **Node.js**: v18.0.0 o superior (recomendado LTS v20 o v22).
- **npm**: v9 o superior.
- **Sistema Operativo**: Windows, macOS o Linux (desarrollado y probado principalmente para Windows).

### Instalación de Dependencias
```bash
npm install
```

### Comandos de Ejecución

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo Vite en `http://localhost:5173` (con `host: true` para red local). |
| `npm run dev:electron` | Inicia Vite y la ventana de Electron en paralelo con recarga de desarrollo. |
| `npm run electron` | Abre Electron contra la aplicación compilada o el puerto local. |
| `npm run build` | Compila TypeScript (`tsc -b`) y empaqueta el frontend con Vite en `/dist`. |
| `npm run lint` | Ejecuta el linter ultrarrápido `oxlint`. |
| `npm run package` | Compila y empaqueta el instalador (`Setup.exe`) y la versión portable (`.exe`) en `/release`. |
| `npm run scan:skills` | Ejecuta **SkillSpector** para auditar la seguridad de las skills en `.agents/skills`. |
| `npm run preview` | Previsualiza la compilación de producción de Vite localmente. |

### Configuración de la API Key de Gemini
- La clave no se define por variables de entorno estáticas en el bundle para no exponerla.
- Se configura dinámicamente desde la UI (`SettingsModal.tsx`) y se almacena en el `localStorage` del cliente bajo la clave `'gemini_api_key'`.
- La función `testApiKey()` en `src/services/gemini.ts` valida la clave contra el endpoint oficial antes de guardarla.

---

## 3. Testing y Control de Calidad

### Estado Actual del Testing
Actualmente el proyecto **no** cuenta con un runner de pruebas automatizadas instalado (no incluye Vitest ni Jest en `package.json`). El aseguramiento de calidad se realiza mediante:

1. **Chequeo de Tipos Estricto**:
   ```bash
   npm run build
   # Ejecuta "tsc -b && vite build", detectando inconsistencias de tipos e interfaces.
   ```
2. **Linting de Código**:
   ```bash
   npm run lint
   # Ejecuta oxlint para asegurar sintaxis limpia y ausencia de antipatrones.
   ```

### Protocolo de Smoke Tests Manuales (Obligatorio tras cada cambio)
Antes de dar por completada una modificación, verificar manualmente:
1. **Carga de Archivos**:
   - Cargar un PDF multipágina o de 1 página.
   - Cargar una imagen JPG y una PNG.
   - Comprobar que `fileProcessor.ts` renderice el preview sin errores en consola.
2. **Extracción con Gemini**:
   - Factura Sistema 1: Verificar que extraiga `Comp Nro`, `Cliente N°`, `Razón Social / Apellido y Nombre` y **1° Vencimiento**.
   - Factura Sistema 2: Verificar que `comp_nro` y `cliente_nro` queden vacíos (`""`), y que tome el importe único.
3. **Persistencia SQLite**:
   - Modificar un campo en `InvoiceReviewModal`.
   - Cambiar estado de pago (Sin marcar -> Pagada -> Entregada).
   - Recargar la página (`F5`) y verificar que los cambios sigan presentes.
   - Probar botón "Descargar Respaldo (.sqlite)" para asegurar exportación limpia.
4. **Exportación a Excel**:
   - Descargar el archivo `.xlsx` y validar que contenga las 8 columnas correctas y que la columna "Importe" conserve formato numérico monetario.

### Recomendación para Implementación Futura de Tests
Si se agregan pruebas unitarias en el futuro:
- Instalar `vitest` y `@testing-library/react`.
- Priorizar tests unitarios en:
  - `src/services/gemini.ts`: parsing de respuestas JSON y fallback de cálculo de meses.
  - `src/services/database.ts`: serialización/deserialización de observaciones y queries SQLite.
  - `src/services/excel.ts`: asignación de columnas y celdas numéricas.

---

## 4. Convenciones de Código y Arquitectura

### Estructura de Directorios
```text
facturas/
├── .agents/
│   └── skills/                # Skills modulares de Antigravity para el proyecto
│       ├── invoice-system-extractor/
│       ├── sqlite-wasm-migrations/
│       ├── excel-export-formatter/
│       └── electron-desktop-packager/
├── electron/
│   └── main.cjs               # Proceso principal de Electron (CJS)
├── public/
│   ├── pdf.worker.min.mjs     # Worker local de PDF.js (vital para offline)
│   └── sql-wasm.wasm          # Binario WASM del motor SQLite
├── src/
│   ├── components/            # Componentes funcionales React (modales, tablas, upload, navbar)
│   ├── services/              # Lógica pura: base de datos, gemini, excel, procesamiento de archivos
│   ├── types/                 # Interfaces y tipos TypeScript compartidos
│   ├── App.tsx                # Orquestador del flujo y estado principal
│   ├── index.css              # Configuración base de Tailwind CSS v4
│   └── main.tsx               # Entrypoint de React montado en #root
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

### Skills de Antigravity Disponibles
El proyecto cuenta con skills modulares en `.agents/skills/` que el agente activa bajo demanda:
- **`invoice-system-extractor`** (`.agents/skills/invoice-system-extractor/SKILL.md`): Protocolo para calibrar prompts, esquemas JSON y añadir nuevos sistemas de facturación.
- **`sqlite-wasm-migrations`** (`.agents/skills/sqlite-wasm-migrations/SKILL.md`): Directivas para alterar tablas y persistir datos en SQLite WASM sin corromper la base existente.
- **`excel-export-formatter`** (`.agents/skills/excel-export-formatter/SKILL.md`): Reglas de orden de columnas y formateo de celdas numéricas de moneda para SheetJS.
- **`electron-desktop-packager`** (`.agents/skills/electron-desktop-packager/SKILL.md`): Guía para empaquetar ejecutables e instaladores Windows (.exe) preservando workers y SQLite WASM.

### Convenciones de TypeScript y React
- **Componentes**: Funcionales con named exports o default exports acordes al patrón existente (`export const ComponentName = ...` o `export function ...`).
- **Props**: Definir interfaces dedicadas para cada componente (ej: `InvoiceTableProps`, `SettingsModalProps`).
- **Imports**: El proyecto tiene configurado `allowImportingTsExtensions: true` y `verbatimModuleSyntax: true` en `tsconfig.app.json`. Mantener importaciones consistentes y relativas (`./services/database.ts` o `./types/invoice`).
- **Tipado Defensivo**: Manejar siempre valores nulos/indefinidos con fallbacks (ej: `(inv.nombre_cliente || '').toLowerCase()`, `Number(inv.importe) || 0`).
- **Idioma y Terminología**:
  - Código, nombres de funciones y variables: mezcla bilingüe técnica (`InvoiceRecord`, `saveInvoice`, `sistema`, `comp_nro`, `cliente_nro`, `estado_pago`).
  - Interfaz de usuario (UI), notificaciones, alertas y documentación: **estrictamente en Español neutro/rioplatense amigable** ("Cargar Facturas", "Pagada", "Entregada", "Revisar", "Descargar Excel").

### Convenciones de UI y Estilos
- Usar **Tailwind CSS v4** mediante clases utilitarias directas.
- Paleta semántica del proyecto:
  - **Primario / Acción**: `blue-600`, `blue-700`
  - **Estado Pagada**: `emerald-600` / `emerald-500`, fondos `emerald-50`
  - **Estado Entregada / Atención**: `amber-500` / `amber-600`, fondos `amber-50`
  - **Pendiente / Alerta**: `amber-500`, fondos `amber-50`
  - **Superficies**: `bg-white`, fondos neutros `bg-slate-50`, texto `text-slate-800`
- Iconos: Importar exclusivamente desde `lucide-react`.

---

## 5. Reglas de Negocio Críticas

Cualquier cambio que afecte la extracción o exportación debe respetar estrictamente estas reglas contables:

### 1. Sistema 1
- **Identificadores**: Posee "Comp Nro" (número de comprobante), "Cliente N°" (número de cliente) y "Razón Social / Apellido y Nombre".
- **Regla de Oro del Importe**: Suele tener múltiples vencimientos (1°, 2° y 3° Vencimiento con recargos). **Se debe tomar SIEMPRE el importe del 1° Vencimiento**. Bajo ninguna circunstancia tomar importes con recargo.
- **Campos esperados**:
  - `sistema`: `"Sistema 1"`
  - `comp_nro`: String con el número.
  - `cliente_nro`: String con el número de cliente.
  - `nombre_cliente`: Nombre extraído.
  - `importe`: Número flotante en pesos argentinos.

### 2. Sistema 2
- **Identificadores**: No posee "Comp Nro" ni "Cliente N°". El nombre del cliente se ubica en el encabezado.
- **Regla de Campos Vacíos**: `comp_nro` y `cliente_nro` **deben quedar estrictamente vacíos** (`""`). No inventar valores ni usar guiones.
- **Regla del Importe**: Tomar el precio facturado único.
- **Regla de Copias Duplicadas**: Si la factura incluye original y duplicado en la misma página/imagen, se debe registrar como **una única factura**.

### 3. Estados de Pago y Revisión
- `estado_pago`:
  - `'pagada'`: Verde. El cliente ya saldó el importe.
  - `'entregada'`: Naranja. La factura fue entregada al cliente pero aún no cobrada.
  - `'ninguno'`: Sin marcar (valor por defecto).
- `estado_revision`:
  - `'revisado'`: Todos los campos requeridos son legibles y válidos.
  - `'pendiente'`: Falta algún dato obligatorio o la IA tiene dudas reflejadas en `observaciones`.

### 4. Estructura de Exportación a Excel (`exportInvoicesToExcel`)
El orden de las columnas de la hoja generada debe mantenerse idéntico:
1. `Sistema`
2. `Comp Nro`
3. `Cliente Nro`
4. `Nombre del cliente`
5. `Importe` (con formato de celda de moneda: `"$#,##0.00"`)
6. `Estado` ("Pagada", "Entregada" o vacío)
7. `Fecha`
8. `Mes`

---

## 6. QUÉ NO TOCAR (Zonas Rojas / Componentes Críticos)

> [!CAUTION]
> Los siguientes archivos y componentes son el núcleo de funcionamiento de la aplicación. No deben modificarse sin una justificación de alto impacto y pruebas exhaustivas.

1. **Archivos Binarios / Workers en `/public`**:
   - `public/sql-wasm.wasm`: Binario de WebAssembly requerido por `sql.js`. Si se elimina o se renombra, la base de datos no arrancará.
   - `public/pdf.worker.min.mjs`: Worker de PDF.js para renderizado en hilo secundario sin conexión a internet.
2. **Mecanismo de Persistencia y Migraciones en `src/services/database.ts`**:
   - La base de datos se guarda codificada en Base64 dentro de `localStorage` (`DB_STORAGE_KEY = 'el_eco_facturas_sqlite_db'`).
   - Las instrucciones `ALTER TABLE facturas ADD COLUMN ...` envueltas en `try/catch` garantizan que bases de datos previas de los usuarios no se corrompan al actualizar la versión. **No eliminar estas migraciones ni cambiar el nombre de las columnas existentes**.
3. **Prompt del Sistema y Schema JSON en `src/services/gemini.ts`**:
   - `SYSTEM_INSTRUCTION` contiene las directivas exactas probadas para evitar alucinaciones en los 2 sistemas.
   - `JSON_RESPONSE_SCHEMA` es un esquema estructurado forzado en la API de Google. Cambiar los nombres de las propiedades romperá el tipado y la persistencia en SQLite.
4. **Seguridad y Parámetros de Ventana en `electron/main.cjs`**:
   - `contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`: Políticas de seguridad de Electron que evitan ejecución remota arbitraria de código.
   - `shell.openExternal(url)`: Obligatorio para abrir enlaces web (ej. Google AI Studio) en el navegador del usuario y no dentro del iframe de Electron.
5. **Configuración de Host en `vite.config.ts`**:
   - `server.host: true`: Configuración necesaria para permitir el acceso y testeo desde teléfonos móviles u otros dispositivos conectados a la misma red Wi-Fi local.

---

## 7. Checklist para Agentes antes de Concluir Cambios

- [ ] ¿Los cambios conservan compatibilidad con los datos existentes en SQLite?
- [ ] ¿Se ejecutó la verificación de tipos (`npm run build`) para descartar errores TypeScript?
- [ ] ¿Se pasó el linter (`npm run lint`) sin advertencias ni fallos?
- [ ] ¿Se preservaron las reglas de extracción de Sistema 1 (1° Vencimiento) y Sistema 2 (campos vacíos)?
- [ ] ¿Los textos agregados a la interfaz están en español y pensados para usuarios de baja experiencia técnica?
- [ ] ¿Se evitó agregar dependencias pesadas innecesarias en `package.json`?
