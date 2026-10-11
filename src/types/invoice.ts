export type InvoiceSystem = 'Sistema 1' | 'Sistema 2' | 'Desconocido'

export type RevisionStatus = 'pendiente' | 'revisado'

export type InvoicePaymentStatus = 'pagada' | 'entregada' | 'ninguno'

export interface InvoiceData {
  sistema: 'Sistema 1' | 'Sistema 2'
  comp_nro: string // Para Sistema 2 queda vacío ""
  cliente_nro: string // Para Sistema 2 queda vacío ""
  nombre_cliente: string
  importe: number // Valor numérico flotante en pesos argentinos
  estado_revision: RevisionStatus
  estado_pago?: InvoicePaymentStatus // 'pagada' (verde), 'entregada' (naranja), 'ninguno' (sin color)
  fecha_emision?: string // Texto de la fecha tal como figura en la factura
  mes?: string // Mes normalizado, ej. "Septiembre 2026" o "2026-09"
  observaciones: string[]
}

export interface InvoiceRecord extends InvoiceData {
  id: string
  archivo_nombre: string
  archivo_tipo: string
  archivo_preview?: string // Data URL para visualizar la factura original
  creado_en: string
}

export interface ProcessingFile {
  id: string
  file: File
  previewUrl: string
  progress: 'pendiente' | 'procesando' | 'completado' | 'error' | 'necesita_seleccion'
  errorMessage?: string
  result?: InvoiceRecord
}
