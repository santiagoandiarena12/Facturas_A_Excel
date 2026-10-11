# Gestor de Facturas de El Eco

Una aplicación de escritorio moderna, rápida y muy fácil de usar, diseñada especialmente para personas con pocos conocimientos tecnológicos. Permite leer automáticamente facturas de dos sistemas diferentes utilizando **Google Gemini**, revisar los datos visualmente junto a la imagen original y exportar todo a una hoja de cálculo compatible con **Excel** y **Google Sheets**.

---

## 🌟 Características Principales

1. **Flujo simple en 3 pasos**:
   - **Paso 1: Cargar Facturas**: Arrastrá o seleccioná archivos PDF, JPG o PNG.
   - **Paso 2: Revisar**: Compará la imagen original de la factura al lado de los datos extraídos para verificar o corregir si algo falta.
   - **Paso 3: Descargar Excel**: Con un solo clic obtenés tu archivo `.xlsx` listo para trabajar.

2. **Detección inteligente de Sistemas**:
   - **Sistema 1**: Extrae automáticamente:
     - `Sistema`: "Sistema 1"
     - `Comp Nro`: Número de comprobante
     - `Cliente N°`: Número de cliente
     - `Razón Social / Apellido y Nombre`
     - `Importe`: Toma estrictamente el **1° vencimiento** (ignora 2do y 3er vencimiento).
   - **Sistema 2**: Extrae automáticamente:
     - `Sistema`: "Sistema 2"
     - `Comp Nro`: *(Vacío)*
     - `Cliente N°`: *(Vacío)*
     - `Nombre del cliente`: Del encabezado
     - `Importe`: Precio facturado único (ignora copias duplicadas en la misma hoja).

3. **100% Privada y Local**:
   - Los datos se guardan en tu propia máquina mediante una base de datos local **SQLite** (`sql.js`).
   - Ninguna factura ni dato contable se almacena en la nube de terceros.
   - Posibilidad de descargar una copia de seguridad física de la base de datos `.sqlite` en cualquier momento.

4. **Preparada para versión móvil**:
   - Arquitectura desacoplada en React + TypeScript + Tailwind CSS, compatible con empaquetadores móviles como **Capacitor** o PWA para funcionar en Android e iOS sin rehacer la lógica.

---

## 📂 Arquitectura de Carpetas

```text
facturas/
├── electron/
│   └── main.cjs               # Proceso principal de Electron (aplicación de escritorio)
├── public/
│   ├── pdf.worker.min.mjs     # Worker local para lectura offline de PDFs
│   └── sql-wasm.wasm          # Motor WebAssembly de SQLite local
├── src/
│   ├── components/
│   │   ├── FileUpload.tsx     # Zona de carga y drag-and-drop
│   │   ├── HelpModal.tsx      # Guía ilustrada de uso en español
│   │   ├── InvoiceReviewModal.tsx # Pantalla dividida: visor original + corrección
│   │   ├── InvoiceTable.tsx   # Tabla clara con botón destacado "Descargar Excel"
│   │   ├── Navbar.tsx         # Barra superior e indicador de IA lista
│   │   └── SettingsModal.tsx  # Configuración paso a paso de clave Gemini
│   ├── services/
│   │   ├── database.ts        # Almacenamiento local SQLite con persistencia
│   │   ├── excel.ts           # Generador de planillas .xlsx con formato de moneda
│   │   ├── fileProcessor.ts   # Renderizado de PDF/imágenes a base64
│   │   └── gemini.ts          # Integración con Google Gemini (JSON estructurado)
│   ├── types/
│   │   └── invoice.ts         # Definiciones de datos y esquemas TypeScript
│   ├── App.tsx                # Pantalla y flujo principal
│   ├── index.css              # Estilos con Tailwind CSS
│   └── main.tsx               # Montaje de la aplicación React
├── package.json
└── vite.config.ts
```

---

## 🚀 Cómo Iniciar la Aplicación

### Requisitos
- Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).

### Modo 1: Aplicación Web en el Navegador
Abrí una terminal en la carpeta del proyecto y ejecutá:
```bash
npm run dev
```
Luego abrí en tu navegador: `http://localhost:5173`

### Modo 2: Aplicación de Escritorio Nativa (Electron)
```bash
npm run dev:electron
```
Se abrirá una ventana de escritorio independiente en Windows.

---

## 🔑 Configuración de la Clave de Gemini (Paso a paso para usuarios no técnicos)

1. En la aplicación, hacé clic en el botón superior **"Configuración"** (o en el aviso naranja si es la primera vez).
2. Hacé clic en el enlace a [Google AI Studio](https://aistudio.google.com/app/apikey).
3. Iniciá sesión con tu cuenta de Google y hacé clic en **"Create API Key"** (Crear clave de API).
4. Copiá la clave, pegala en la aplicación y hacé clic en **"Probar y Guardar Clave"**.
5. ¡Listo! La clave queda guardada únicamente en tu equipo y ya podés procesar todas tus facturas.
