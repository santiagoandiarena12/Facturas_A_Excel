---
name: excel-export-formatter
description: >-
  Instrucciones y procedimientos para personalizar, validar o extender la exportación
  de planillas de cálculo Excel (.xlsx) con SheetJS en Gestor de Facturas de El Eco.
---

# Excel Export Formatter

Esta skill define cómo mantener y extender la generación de planillas Excel (`.xlsx`) mediante SheetJS (`xlsx`) en `src/services/excel.ts`.

---

## 1. Archivo Central

- **Servicio**: `src/services/excel.ts`
- **Llamada desde la UI**: `src/components/InvoiceTable.tsx` mediante el botón "Descargar Excel".

---

## 2. Estructura Estricta de Columnas

El orden de columnas actual responde al flujo de trabajo del usuario contable y administrativo:

| Columna | Encabezado | Tipo / Formato | Regla Especial |
| :---: | :--- | :--- | :--- |
| **A** | Sistema | Texto | "Sistema 1" o "Sistema 2" |
| **B** | Comp Nro | Texto / Cadena | En Sistema 2 debe quedar vacío `""` |
| **C** | Cliente Nro | Texto / Cadena | En Sistema 2 debe quedar vacío `""` |
| **D** | Nombre del cliente | Texto | Razón Social o Nombre |
| **E** | Importe | Numérico (`n`) | Formato moneda: `"$#,##0.00"` |
| **F** | Estado | Texto | "Pagada", "Entregada" o vacío |
| **G** | Fecha | Texto | Fecha de emisión de la factura |
| **H** | Mes | Texto | Mes y año clasificado (ej: "Octubre 2026") |

---

## 3. Reglas de Implementación en SheetJS

### Formato de Celdas Numéricas (Moneda)
Para que Excel y Google Sheets reconozcan el importe como número calculable (y no como texto plano):

```typescript
// En exportInvoicesToExcel:
for (let r = 1; r <= rows.length; r++) {
  const cellRef = XLSX.utils.encode_cell({ r, c: 4 }) // c: 4 corresponde a Columna E (Importe)
  if (worksheet[cellRef]) {
    worksheet[cellRef].t = 'n'
    worksheet[cellRef].z = '"$"#,##0.00' // Formato moneda estándar de Excel
  }
}
```

### Anchos de Columna (`!cols`)
Al añadir columnas, siempre debe asignarse un ancho (`wch`) proporcional en `worksheet['!cols']` para evitar que las celdas muestren texto truncado o `###` al abrir el archivo.

### Nombres de Archivo y Hojas
- Si el usuario filtra por un mes específico (ej: "Octubre 2026"), la hoja del libro (`sheetName`) y el sufijo del archivo toman dicho mes.
- El nombre de la hoja no debe exceder los 31 caracteres (límite estándar de Microsoft Excel).

---

## 4. Checklist para Nuevas Columnas

- [ ] Si se agrega una nueva columna antes de la columna E, actualizar el índice `c: 4` del bucle que aplica el formato de moneda.
- [ ] Incluir el encabezado en el array `headers`.
- [ ] Mapear el nuevo dato en `rows.map()`.
- [ ] Añadir la especificación `{ wch: ... }` en `worksheet['!cols']`.
- [ ] Descargar el archivo de prueba y verificar que se abra sin advertencias en Microsoft Excel, LibreOffice Calc o Google Sheets.
