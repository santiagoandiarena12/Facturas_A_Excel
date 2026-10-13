---
name: sqlite-wasm-migrations
description: >-
  Procedimiento técnico para modificar el esquema de base de datos SQLite WASM (sql.js)
  y la persistencia en localStorage sin corromper datos históricos de los usuarios.
---

# SQLite WASM Migrations & Persistence

Esta skill describe las directivas de seguridad para alterar tablas, añadir columnas o modificar la capa de persistencia en `src/services/database.ts`.

---

## 1. Arquitectura de Almacenamiento

- **Motor**: `sql.js` ejecutado vía WebAssembly en el navegador (`/sql-wasm.wasm`).
- **Persistencia**: Se exporta el binario con `db.export()`, se convierte a Base64 por chunks (`8192` bytes) y se guarda en `localStorage` con la clave `'el_eco_facturas_sqlite_db'`.
- **Copia física**: `downloadDatabaseBackup()` genera un archivo binario `.sqlite` descargable por el usuario.

---

## 2. Regla de Oro: Migraciones Idempotentes

Dado que la base de datos corre en el cliente y puede tener datos preexistentes guardados en el navegador del usuario:

> [!CAUTION]
> **NUNCA ejecutes `DROP TABLE facturas` ni modifiques la definición de `CREATE TABLE` esperando que se recree automáticamente.** La tabla solo se crea si no existe (`IF NOT EXISTS`).

### Patrón Obligatorio para Nuevas Columnas

Cada nueva columna debe agregarse en la función `getDatabase()` utilizando bloques individuales `try / catch`:

```typescript
// Ejemplo: agregar columna 'cuit_emisor'
try {
  dbInstance.run(`ALTER TABLE facturas ADD COLUMN cuit_emisor TEXT DEFAULT ''`)
} catch {
  // Ignorar error si la columna ya existe en una base de datos previamente migrada
}
```

---

## 3. Checklist al Agregar un Nuevo Campo

1. **Definir en TypeScript**:
   - Agregar el campo a `InvoiceData` y/o `InvoiceRecord` en `src/types/invoice.ts`.
2. **Definir en SQLite**:
   - Añadir la instrucción `ALTER TABLE facturas ADD COLUMN ...` en `src/services/database.ts` dentro de `getDatabase()`.
3. **Mapear en Lectura (`getAllInvoices`)**:
   - Actualizar el query `SELECT` respetando la posición de los índices de columnas `row[index]`.
4. **Mapear en Escritura (`saveInvoice`)**:
   - Añadir el nuevo campo al query `INSERT OR REPLACE INTO facturas (...) VALUES (...)` y al array de parámetros.
5. **Persistencia**:
   - Asegurarse de que `persistDatabase(db)` se invoque tras cualquier mutación (`INSERT`, `UPDATE`, `DELETE`).

---

## 4. Verificación de Integridad

- Comprobar que bases de datos antiguas cargadas desde `localStorage` sigan funcionando sin lanzar excepciones.
- Realizar una prueba de exportación física mediante `downloadDatabaseBackup()` y verificar que el archivo `.sqlite` resultante pueda ser abierto correctamente con herramientas como DB Browser for SQLite.
