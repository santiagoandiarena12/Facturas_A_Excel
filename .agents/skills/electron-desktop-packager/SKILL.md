---
name: electron-desktop-packager
description: >-
  Guía y procedimiento técnico para empaquetar, configurar y generar ejecutables de escritorio
  Windows (.exe) con Electron en Gestor de Facturas de El Eco, preservando workers y binarios WASM offline.
---

# Electron Desktop Packager

Esta skill define el procedimiento para compilar, resolver rutas relativas y empaquetar la aplicación de escritorio nativa para distribución a usuarios finales en Windows.

---

## 1. Arquitectura de Escritorio Actual

- **Entrypoint de Electron**: `electron/main.cjs`
- **Frontend compilado**: `dist/index.html` (generado por `npm run build`)
- **Assets críticos en tiempo de ejecución**:
  - `public/sql-wasm.wasm`: Requerido por `sql.js`.
  - `public/pdf.worker.min.mjs`: Requerido por `pdfjs-dist`.

---

## 2. Requisitos de Empaquetado para Evitar Rupturas

### A. Regla del Protocolo `file://` y Rutas Relativas
En desarrollo, Vite sirve los assets vía HTTP (`http://localhost:5173/`).
En producción dentro de Electron, la aplicación carga desde el disco local (`mainWindow.loadFile(...)`).

> [!IMPORTANT]
> Si se empaqueta la aplicación, `vite.config.ts` debe tener configurado `base: './'` (o relativo) para que los archivos JavaScript, CSS y WASM en `dist/` se resuelvan correctamente bajo el protocolo `file://`.

### B. Binarios WASM y ASAR Unpack
El motor `sql.js` y el worker de PDF.js leen archivos desde el disco. Si los archivos están empaquetados dentro de un archivo comprimido `.asar`, algunos motores WASM pueden fallar al acceder a ellos:
- Los binarios `sql-wasm.wasm` y `pdf.worker.min.mjs` deben copiarse a la carpeta `dist/` durante el build.
- En configuraciones de `electron-builder`, deben agregarse a `asarUnpack`:
  ```json
  "build": {
    "appId": "com.eleco.facturas",
    "asarUnpack": [
      "**/sql-wasm.wasm",
      "**/pdf.worker.min.mjs"
    ]
  }
  ```

---

## 3. Procedimiento para Generar el Instalador Windows (.exe)

Si se incorpora una herramienta de empaquetado (como `electron-builder`):

1. **Compilar el frontend de React**:
   ```bash
   npm run build
   ```
2. **Verificar que `dist/index.html`, `dist/sql-wasm.wasm` y `dist/pdf.worker.min.mjs` existan**.
3. **Ejecutar el empaquetador**:
   ```bash
   npx electron-builder --win
   ```
4. **Verificar la salida en `release/` o `dist-electron/`**:
   - Comprobar que el archivo instalador ejecutable (`Setup.exe` o versión Portable) arranque sin pantalla en blanco.
   - Probar abrir la aplicación sin conexión a internet y verificar que la lectura de PDFs y la base de datos SQLite inicien correctamente.

---

## 4. Parámetros Críticos de Seguridad en `main.cjs`

Al modificar la configuración de Electron, **nunca relajar estos parámetros**:
- `contextIsolation: true`
- `nodeIntegration: false`
- `webSecurity: true`
- Enlaces externos (Google AI Studio, etc.) deben abrirse con `shell.openExternal(url)` y denegar navegación interna en la ventana principal.
