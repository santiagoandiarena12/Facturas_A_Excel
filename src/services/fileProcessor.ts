import * as pdfjsLib from 'pdfjs-dist'

// Configurar el worker local para procesar PDFs sin depender de internet
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
}

export interface FileData {
  name: string
  type: string
  base64Data: string // sin el prefijo "data:image/...;base64,"
  mimeType: string
  previewUrl: string // con prefijo completo data:... para <img src="">
}

/**
 * Convierte un archivo de imagen (JPG, PNG) o PDF a imagen base64 para Gemini y previsualización.
 */
export async function processFileForGemini(file: File): Promise<FileData> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

  if (isPdf) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      const page = await pdf.getPage(1) // Primera página de la factura

      const viewport = page.getViewport({ scale: 2.0 }) // Buena resolución para OCR y lectura visual
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width

      if (!context) {
        throw new Error('No se pudo inicializar el contexto de renderizado de imagen.')
      }

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      const base64Data = dataUrl.split(',')[1]

      return {
        name: file.name,
        type: file.type || 'application/pdf',
        base64Data,
        mimeType: 'image/jpeg',
        previewUrl: dataUrl,
      }
    } catch (error) {
      console.warn('Fallo renderizado nativo PDF, intentando fallback de lectura directa:', error)
      const base64 = await fileToBase64(file)
      return {
        name: file.name,
        type: file.type || 'application/pdf',
        base64Data: base64.split(',')[1],
        mimeType: 'application/pdf',
        previewUrl: base64,
      }
    }
  } else {
    // Es una imagen JPG / JPEG / PNG
    const dataUrl = await fileToBase64(file)
    const mimeType = file.type || (file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg')
    const base64Data = dataUrl.split(',')[1]

    return {
      name: file.name,
      type: mimeType,
      base64Data,
      mimeType,
      previewUrl: dataUrl,
    }
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}
