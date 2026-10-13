---
name: invoice-system-extractor
description: >-
  Guía y procedimiento operativo para diagnosticar, modificar, calibrar o incorporar
  reglas de extracción de facturas con Google Gemini (Sistema 1, Sistema 2 o nuevos formatos)
  en Gestor de Facturas de El Eco.
---

# Invoice System Extractor

Esta skill define el procedimiento estándar para auditar, modificar o añadir lógica de extracción de documentos comerciales mediante la API de Google Gemini en este proyecto.

---

## 1. Archivos Clave Involucrados

- **Servicio de Extracción**: `src/services/gemini.ts`
- **Preprocesador de Archivos**: `src/services/fileProcessor.ts`
- **Contratos y Tipos**: `src/types/invoice.ts`
- **Modal de Revisión y Corrección**: `src/components/InvoiceReviewModal.tsx`

---

## 2. Reglas de Negocio Esenciales por Sistema

### Sistema 1
- **Campos esperados**:
  - `comp_nro`: Cadena con el número de comprobante.
  - `cliente_nro`: Cadena con el número de cliente.
  - `nombre_cliente`: Razón social o nombre completo del cliente.
  - `importe`: **REGLA ESTRICTA**: Tomar exclusivamente el valor del **1° Vencimiento**. Si el documento indica recargos para 2° o 3° vencimiento, deben ignorarse por completo.
  - `fecha_emision`: Fecha legible en formato DD/MM/AAAA o similar.
  - `mes`: Mes y año normalizado en español (ej: "Octubre 2026").

### Sistema 2
- **Campos esperados**:
  - `comp_nro`: Cadena vacía estricta `""`.
  - `cliente_nro`: Cadena vacía estricta `""`.
  - `nombre_cliente`: Extraído del encabezado principal.
  - `importe`: Precio facturado único.
  - Copias duplicadas: Si en la misma hoja o imagen conviven el original y el duplicado, computar como una sola factura.

---

## 3. Procedimiento para Modificar o Afinar Prompts

Cuando se necesite mejorar la tasa de acierto de la IA:

1. **Ajustar `SYSTEM_INSTRUCTION`**:
   - Editar el bloque `SYSTEM_INSTRUCTION` en `src/services/gemini.ts`.
   - Mantener directivas explícitas en mayúsculas para condiciones obligatorias ("Toma SIEMPRE el valor del primer vencimiento", "NO INVENTES DATOS").
   - Especificar que los importes se transformen a números flotantes estándar (`12450.50`), descartando símbolos de moneda `$` y adaptando comas decimales.

2. **Verificar `JSON_RESPONSE_SCHEMA`**:
   - Toda propiedad nueva o modificada debe declararse en `JSON_RESPONSE_SCHEMA`.
   - Si una propiedad es obligatoria en la respuesta estructurada, debe incluirse en la lista `required`.

3. **Cálculo Defensivo de Fallback**:
   - La función `extractInvoiceData()` contiene lógica de post-procesamiento.
   - Si `mes` no viene explícito, debe ejecutarse la deducción a partir de `fecha_emision` utilizando expresiones regulares y nombres de meses en español.

---

## 4. Procedimiento para Incorporar un "Sistema 3" (o Nuevos Formatos)

1. **Actualizar el Modelo de Datos**:
   - En `src/types/invoice.ts`, ampliar el tipo `InvoiceSystem`:
     ```typescript
     export type InvoiceSystem = 'Sistema 1' | 'Sistema 2' | 'Sistema 3' | 'Desconocido'
     ```
2. **Actualizar el Schema de Gemini**:
   - En `src/services/gemini.ts`, agregar `'Sistema 3'` al `enum` de `JSON_RESPONSE_SCHEMA.properties.sistema`.
3. **Redactar las Reglas del Sistema en `SYSTEM_INSTRUCTION`**:
   - Detallar la ubicación del comprobante, cliente e importe específico.
4. **Actualizar la UI**:
   - En `src/components/InvoiceReviewModal.tsx`, agregar el selector para el nuevo sistema.
   - En `src/components/InvoiceTable.tsx`, agregar el filtro correspondiente si aplica.
