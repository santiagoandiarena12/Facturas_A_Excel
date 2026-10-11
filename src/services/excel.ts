import * as XLSX from 'xlsx'
import type { InvoiceRecord } from '../types/invoice'

/**
 * Exporta una lista de facturas a un archivo .xlsx con una sola hoja:
 * Columnas:
 * 1. Sistema
 * 2. Comp Nro
 * 3. Cliente Nro
 * 4. Nombre del cliente
 * 5. Importe
 * 6. Estado (Pagada / Entregada / "")
 * 7. Fecha
 * 8. Mes
 */
export function exportInvoicesToExcel(
  invoices: InvoiceRecord[],
  selectedMonth?: string,
  filenamePrefix = 'Facturas_El_Eco'
): void {
  if (invoices.length === 0) {
    alert('No hay facturas para exportar.')
    return
  }

  // Encabezados con orden estricto de las 5 columnas base más Estado, Fecha y Mes
  const headers = ['Sistema', 'Comp Nro', 'Cliente Nro', 'Nombre del cliente', 'Importe', 'Estado', 'Fecha', 'Mes']

  // Mapear cada fila
  const rows = invoices.map((inv) => {
    const isSistema2 = inv.sistema === 'Sistema 2'
    const estadoTexto =
      inv.estado_pago === 'pagada' ? 'Pagada' : inv.estado_pago === 'entregada' ? 'Entregada' : ''
    return [
      inv.sistema,
      isSistema2 ? '' : (inv.comp_nro || ''),
      isSistema2 ? '' : (inv.cliente_nro || ''),
      inv.nombre_cliente || '',
      Number(inv.importe) || 0,
      estadoTexto,
      inv.fecha_emision || '',
      inv.mes || '',
    ]
  })

  // Crear la hoja de cálculo
  const wsData = [headers, ...rows]
  const worksheet = XLSX.utils.aoa_to_sheet(wsData)

  // Configurar anchos de columna para una visualización profesional en Excel y Google Sheets
  worksheet['!cols'] = [
    { wch: 14 }, // Sistema
    { wch: 16 }, // Comp Nro
    { wch: 16 }, // Cliente Nro
    { wch: 38 }, // Nombre del cliente
    { wch: 18 }, // Importe
    { wch: 15 }, // Estado
    { wch: 15 }, // Fecha
    { wch: 20 }, // Mes
  ]

  // Asignar formato numérico a la columna Importe (columna E, índice 4)
  for (let r = 1; r <= rows.length; r++) {
    const cellRef = XLSX.utils.encode_cell({ r, c: 4 })
    if (worksheet[cellRef]) {
      worksheet[cellRef].t = 'n'
      worksheet[cellRef].z = '"$"#,##0.00' // Formato moneda estándar en Excel
    }
  }

  // Crear el libro de trabajo con una sola hoja
  const workbook = XLSX.utils.book_new()
  const sheetName = selectedMonth && selectedMonth !== 'todos' ? selectedMonth.slice(0, 31) : 'Facturas'
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Generar nombre de archivo claro según el mes
  const fechaStr = new Date().toISOString().slice(0, 10)
  const mesSuffix = selectedMonth && selectedMonth !== 'todos' ? `_${selectedMonth.replace(/\s+/g, '_')}` : ''
  const fullFilename = `${filenamePrefix}${mesSuffix}_${fechaStr}.xlsx`

  // Descargar archivo
  XLSX.writeFile(workbook, fullFilename)
}
