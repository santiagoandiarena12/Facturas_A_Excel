import type { InvoiceData } from '../types/invoice'
import type { FileData } from './fileProcessor'

const API_KEY_STORAGE = 'gemini_api_key'

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) || ''
}

export function saveApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE, key.trim())
}

export function hasApiKey(): boolean {
  return Boolean(getApiKey())
}

/**
 * Prueba la clave de Gemini con una solicitud mínima para confirmar que es válida.
 */
export async function testApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  const trimmed = apiKey.trim()
  if (!trimmed) {
    return { success: false, message: 'La clave de API no puede estar vacía.' }
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${trimmed}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Responde únicamente con la palabra OK.' }],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errJson = await response.json().catch(() => null)
      const detail = errJson?.error?.message || `Error HTTP ${response.status}`
      return { success: false, message: `Clave rechazada por Google: ${detail}` }
    }

    return { success: true, message: '¡Conexión exitosa con Google Gemini!' }
  } catch (err: any) {
    return {
      success: false,
      message: `Error de red al conectar con Google: ${err.message || err}`,
    }
  }
}

const SYSTEM_INSTRUCTION = `
Eres un extractor experto de datos para "Gestor de Facturas de El Eco". Tu tarea es analizar la imagen o documento de la factura, identificar si corresponde al "Sistema 1" o al "Sistema 2", y extraer estrictamente los datos solicitados.

REGLAS DE IDENTIFICACIÓN:
1. SISTEMA 1:
   - Suele tener campos identificados como "Comp Nro" (número de comprobante), "Cliente N°" (número de cliente), y "Razón Social / Apellido y Nombre".
   - Puede presentar múltiples vencimientos (1° Vencimiento, 2° Vencimiento, etc.).
   - REGLA DE EXTRACCIÓN SISTEMA 1:
     * sistema: "Sistema 1"
     * comp_nro: Número que figura como "Comp Nro".
     * cliente_nro: Número que figura como "Cliente N°".
     * nombre_cliente: Texto que figura como "Razón Social / Apellido y Nombre".
     * importe: Valor del PRIMER VENCIMIENTO de la factura. Si la factura muestra importes distintos para el segundo o tercer vencimiento, NO los uses. Toma SIEMPRE el valor del primer vencimiento.
     * fecha_emision: Fecha que figura como "Fecha de emisión:" o "Fecha:".
     * mes: Mes y año correspondiente en español (ejemplo: "Septiembre 2026", "Octubre 2026").

2. SISTEMA 2:
   - Diseño alternativo donde no figura "Comp Nro" ni "Cliente N°".
   - Encabezado con el nombre del cliente y un único precio facturado.
   - Si la imagen contiene una copia original y otra duplicada de la misma factura, procésalas como UNA SOLA FACTURA.
   - REGLA DE EXTRACCIÓN SISTEMA 2:
     * sistema: "Sistema 2"
     * comp_nro: "" (dejar vacío)
     * cliente_nro: "" (dejar vacío)
     * nombre_cliente: Nombre del cliente que aparece en el encabezado.
     * importe: Único valor de la factura que corresponde al precio facturado. No uses importes de pagos o vencimientos posteriores.
     * fecha_emision: Fecha que figura en la factura.
     * mes: Mes y año correspondiente en español (ejemplo: "Septiembre 2026", "Octubre 2026").

REGLAS GENERALES Y FORMATO DE DATOS:
- Importes en pesos argentinos: Convierte los importes a un número flotante puro (ejemplo: "$ 12.450,50" -> 12450.50). Ten en cuenta que el punto suele ser separador de miles y la coma separador decimal. El campo importe debe ser un NUMBER, nunca string.
- NO INVENTES DATOS. Si un dato no es legible o no existe en el documento, déjalo vacío ("") y coloca en "observaciones" el motivo.
- Si falta algún campo obligatorio o es dudoso, pon "estado_revision": "pendiente". Si todos los campos requeridos se leyeron con total claridad, pon "estado_revision": "revisado".
- No extraigas datos adicionales.
- Devuelve la respuesta en formato JSON estricto.
`

/**
 * Esquema JSON forzado para la API de Gemini
 */
const JSON_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    sistema: {
      type: 'STRING',
      enum: ['Sistema 1', 'Sistema 2'],
      description: 'Sistema identificado: Sistema 1 o Sistema 2',
    },
    comp_nro: {
      type: 'STRING',
      description: 'Número de comprobante (Comp Nro) para Sistema 1, o vacío para Sistema 2',
    },
    cliente_nro: {
      type: 'STRING',
      description: 'Número de cliente (Cliente N°) para Sistema 1, o vacío para Sistema 2',
    },
    nombre_cliente: {
      type: 'STRING',
      description: 'Razón Social / Apellido y Nombre para Sistema 1, o Nombre del cliente para Sistema 2',
    },
    importe: {
      type: 'NUMBER',
      description: 'Importe numérico en pesos (primer vencimiento para Sistema 1, precio facturado para Sistema 2)',
    },
    fecha_emision: {
      type: 'STRING',
      description: 'Fecha que figura en la factura (ejemplo: 15/09/2026)',
    },
    mes: {
      type: 'STRING',
      description: 'Mes y año en español de la factura (ejemplo: Septiembre 2026, Octubre 2026)',
    },
    estado_revision: {
      type: 'STRING',
      enum: ['pendiente', 'revisado'],
      description: 'revisado si los datos son 100% legibles, pendiente si falta algo o hay dudas',
    },
    observaciones: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Lista de aclaraciones, advertencias o dudas detectadas',
    },
  },
  required: [
    'sistema',
    'comp_nro',
    'cliente_nro',
    'nombre_cliente',
    'importe',
    'fecha_emision',
    'mes',
    'estado_revision',
    'observaciones',
  ],
}

export async function extractInvoiceData(
  fileData: FileData,
  manualSystemOverride?: 'Sistema 1' | 'Sistema 2'
): Promise<InvoiceData> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('Falta configurar la clave de API de Gemini. Por favor ingresa a Configuración.')
  }

  let promptText = 'Analiza esta factura y extrae los datos correspondientes según las reglas.'
  if (manualSystemOverride) {
    promptText += ` ATENCIÓN: El usuario ha especificado manualmente que esta factura es del "${manualSystemOverride}". Extrae los campos correspondientes a ese sistema.`
  }

  const requestBody = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: fileData.mimeType,
              data: fileData.base64Data,
            },
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: JSON_RESPONSE_SCHEMA,
      temperature: 0.1, // Baja temperatura para máxima precisión determinista
    },
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  )

  if (!response.ok) {
    const errData = await response.json().catch(() => null)
    const errorMsg = errData?.error?.message || `Error ${response.status}: ${response.statusText}`
    throw new Error(`Google Gemini no pudo procesar la factura: ${errorMsg}`)
  }

  const data = await response.json()
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!rawText) {
    throw new Error('No se recibió texto de respuesta de Gemini.')
  }

  try {
    const parsed = JSON.parse(rawText) as InvoiceData

    // Validaciones y normalizaciones defensivas
    const sistema = manualSystemOverride || (parsed.sistema === 'Sistema 2' ? 'Sistema 2' : 'Sistema 1')
    const comp_nro = sistema === 'Sistema 2' ? '' : (parsed.comp_nro || '').toString().trim()
    const cliente_nro = sistema === 'Sistema 2' ? '' : (parsed.cliente_nro || '').toString().trim()
    const nombre_cliente = (parsed.nombre_cliente || '').toString().trim()
    let importe = typeof parsed.importe === 'number' ? parsed.importe : parseFloat(String(parsed.importe).replace(',', '.'))
    if (isNaN(importe)) importe = 0

    const fecha_emision = (parsed.fecha_emision || '').toString().trim()
    let mes = (parsed.mes || '').toString().trim()

    // Si mes vino vacío pero tenemos fecha_emision, deducir el mes en español
    if (!mes && fecha_emision) {
      const match = fecha_emision.match(/(?:(\d{1,2})[/.-])?(\d{1,2})[/.-](\d{2,4})/)
      if (match) {
        const monthNum = parseInt(match[2], 10)
        let yearNum = parseInt(match[3], 10)
        if (yearNum < 100) yearNum += 2000
        const nombresMeses = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        if (monthNum >= 1 && monthNum <= 12) {
          mes = `${nombresMeses[monthNum - 1]} ${yearNum}`
        }
      }
    }

    const observaciones: string[] = Array.isArray(parsed.observaciones) ? parsed.observaciones : []

    // Revisar si faltan datos críticos
    let estado_revision: 'pendiente' | 'revisado' = parsed.estado_revision === 'revisado' ? 'revisado' : 'pendiente'
    if (!nombre_cliente) {
      estado_revision = 'pendiente'
      observaciones.push('Falta el nombre del cliente o no es legible.')
    }
    if (importe <= 0) {
      estado_revision = 'pendiente'
      observaciones.push('El importe no se pudo leer o es cero.')
    }
    if (sistema === 'Sistema 1' && (!comp_nro || !cliente_nro)) {
      estado_revision = 'pendiente'
      if (!comp_nro) observaciones.push('Falta el número de comprobante (Comp Nro).')
      if (!cliente_nro) observaciones.push('Falta el número de cliente (Cliente N°).')
    }

    return {
      sistema,
      comp_nro,
      cliente_nro,
      nombre_cliente,
      importe,
      estado_revision,
      fecha_emision,
      mes: mes || 'Sin mes especificado',
      observaciones,
    }
  } catch (parseError: any) {
    throw new Error(`Error al interpretar el JSON devuelto por Gemini: ${parseError.message}`)
  }
}
