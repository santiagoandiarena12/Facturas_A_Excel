import { useState, useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { FileUpload } from './components/FileUpload'
import { InvoiceTable } from './components/InvoiceTable'
import { InvoiceReviewModal } from './components/InvoiceReviewModal'
import { SettingsModal } from './components/SettingsModal'
import { HelpModal } from './components/HelpModal'
import type { InvoiceRecord, InvoicePaymentStatus } from './types/invoice'
import {
  getAllInvoices,
  saveInvoice,
  deleteInvoice,
  clearAllInvoices,
  updateInvoicePaymentStatus
} from './services/database'
import { processFileForGemini } from './services/fileProcessor'
import { extractInvoiceData, hasApiKey } from './services/gemini'
import { Sparkles, Loader2, FileCheck, CheckCircle2 } from 'lucide-react'

export function App() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [isLoadingDb, setIsLoadingDb] = useState(true)
  const [hasKey, setHasKey] = useState(false)

  // Modales
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  // Estado de procesamiento de carga
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string>('')
  const [statusNotification, setStatusNotification] = useState<string | null>(null)

  // Cargar datos iniciales desde SQLite local
  useEffect(() => {
    setHasKey(hasApiKey())
    loadInitialDatabase()
  }, [])

  const loadInitialDatabase = async () => {
    try {
      setIsLoadingDb(true)
      const list = await getAllInvoices()
      setInvoices(list)
    } catch (error) {
      console.error('Error al cargar facturas de SQLite:', error)
    } finally {
      setIsLoadingDb(false)
    }
  }

  // Notificación temporal
  const showToast = (msg: string) => {
    setStatusNotification(msg)
    setTimeout(() => setStatusNotification(null), 3000)
  }

  // Procesar archivos reales seleccionados por el usuario
  const handleFilesSelected = async (files: File[]) => {
    if (!hasApiKey()) {
      setIsSettingsOpen(true)
      return
    }

    setIsProcessing(true)
    let processedCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setCurrentProcessingFile(`Leyendo ${file.name} (${i + 1} de ${files.length})...`)

      try {
        // 1. Procesar archivo a base64 y generar preview
        const fileData = await processFileForGemini(file)

        // 2. Extraer con Gemini
        setCurrentProcessingFile(`Extrayendo datos con Gemini para ${file.name}...`)
        const extracted = await extractInvoiceData(fileData)

        // 3. Crear registro completo
        const newRecord: InvoiceRecord = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          archivo_nombre: file.name,
          archivo_tipo: file.type,
          archivo_preview: fileData.previewUrl,
          sistema: extracted.sistema,
          comp_nro: extracted.comp_nro,
          cliente_nro: extracted.cliente_nro,
          nombre_cliente: extracted.nombre_cliente,
          importe: extracted.importe,
          estado_revision: extracted.estado_revision,
          estado_pago: 'ninguno',
          fecha_emision: extracted.fecha_emision || '',
          mes: extracted.mes || 'Sin mes especificado',
          observaciones: extracted.observaciones,
          creado_en: new Date().toISOString(),
        }

        // 4. Guardar en SQLite local y actualizar estado
        await saveInvoice(newRecord)
        setInvoices((prev) => [newRecord, ...prev])
        processedCount++
      } catch (err: any) {
        console.error(`Error al procesar ${file.name}:`, err)
        alert(`No se pudo procesar "${file.name}": ${err.message || err}`)
      }
    }

    setIsProcessing(false)
    setCurrentProcessingFile('')
    showToast(`¡Se procesaron y guardaron ${processedCount} facturas exitosamente!`)
  }

  // Guardar factura corregida o editada (Mantiene el scroll intacto)
  const handleSaveInvoice = async (updated: InvoiceRecord) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)))
    await saveInvoice(updated)
    showToast('Factura actualizada correctamente.')
  }

  // Cambiar estado rápido de color (Pagada / Entregada / Ninguno) sin mover el scroll
  const handleChangePaymentStatus = async (id: string, status: InvoicePaymentStatus) => {
    // Actualización inmediata en pantalla (sin recargar la tabla ni mover el scroll)
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, estado_pago: status } : inv))
    )
    // Persistencia silenciosa en SQLite local
    await updateInvoicePaymentStatus(id, status)
  }

  // Eliminar factura sin mover el scroll
  const handleDeleteInvoice = async (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id))
    await deleteInvoice(id)
    showToast('Factura eliminada.')
  }

  // Vaciar todas las facturas
  const handleClearAll = async () => {
    setInvoices([])
    await clearAllInvoices()
    showToast('Historial vaciado.')
  }

  // Cargar ejemplos de prueba para ambos sistemas con distintos meses (Septiembre, Octubre, Agosto)
  const handleLoadSamples = async () => {
    const sample1: InvoiceRecord = {
      id: `sample_1_${Date.now()}`,
      archivo_nombre: 'Factura_A_Eco_001.pdf',
      archivo_tipo: 'application/pdf',
      archivo_preview:
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      sistema: 'Sistema 1',
      comp_nro: '0001-0008492',
      cliente_nro: '4821',
      nombre_cliente: 'Distribuidora Tandil S.R.L.',
      importe: 84500.50, // 1er vencimiento
      estado_revision: 'revisado',
      estado_pago: 'pagada', // VERDE
      fecha_emision: '15/09/2026',
      mes: 'Septiembre 2026',
      observaciones: ['Identificado como Sistema 1 por presencia de Comp Nro y Cliente N°.'],
      creado_en: new Date().toISOString(),
    }

    const sample2: InvoiceRecord = {
      id: `sample_2_${Date.now()}`,
      archivo_nombre: 'Comprobante_Eco_002.jpg',
      archivo_tipo: 'image/jpeg',
      archivo_preview:
        'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      sistema: 'Sistema 2',
      comp_nro: '', // Vacío para Sistema 2
      cliente_nro: '', // Vacío para Sistema 2
      nombre_cliente: 'Martín Gómez',
      importe: 19200.00, // Precio facturado único
      estado_revision: 'revisado',
      estado_pago: 'entregada', // NARANJA
      fecha_emision: '04/10/2026',
      mes: 'Octubre 2026',
      observaciones: ['Sistema 2 identificado por encabezado y precio facturado único. Copia duplicada omitida.'],
      creado_en: new Date(Date.now() - 3600000).toISOString(),
    }

    const sample3: InvoiceRecord = {
      id: `sample_3_${Date.now()}`,
      archivo_nombre: 'Factura_B_Eco_003.png',
      archivo_tipo: 'image/png',
      archivo_preview:
        'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80',
      sistema: 'Sistema 1',
      comp_nro: '0004-0012903',
      cliente_nro: '9104',
      nombre_cliente: 'Estudio Jurídico Álvarez & Asoc.',
      importe: 125300.00,
      estado_revision: 'pendiente',
      estado_pago: 'ninguno', // SIN COLOR (NADA)
      fecha_emision: '28/09/2026',
      mes: 'Septiembre 2026',
      observaciones: ['Segundo vencimiento ignorado conforme a la regla del 1er vencimiento.'],
      creado_en: new Date(Date.now() - 7200000).toISOString(),
    }

    const sample4: InvoiceRecord = {
      id: `sample_4_${Date.now()}`,
      archivo_nombre: 'Comprobante_Eco_004.jpg',
      archivo_tipo: 'image/jpeg',
      archivo_preview:
        'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      sistema: 'Sistema 2',
      comp_nro: '',
      cliente_nro: '',
      nombre_cliente: 'Agropecuaria Las Sierras',
      importe: 54100.00,
      estado_revision: 'revisado',
      estado_pago: 'pagada', // VERDE
      fecha_emision: '20/08/2026',
      mes: 'Agosto 2026',
      observaciones: ['Sistema 2 procesado correctamente.'],
      creado_en: new Date(Date.now() - 14400000).toISOString(),
    }

    await saveInvoice(sample1)
    await saveInvoice(sample2)
    await saveInvoice(sample3)
    await saveInvoice(sample4)
    setInvoices([sample1, sample2, sample3, sample4])
    showToast('¡Se cargaron 4 facturas de prueba con meses: Agosto, Septiembre y Octubre!')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Barra de Navegación */}
      <Navbar
        hasKey={hasKey}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Notificación flotante Toast */}
      {statusNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{statusNotification}</span>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Banner de bienvenida y botón de ejemplos */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-white/15 backdrop-blur-xs text-blue-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Procesamiento Automático Inteligente</span>
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight m-0">
              Lectura y Control de Facturas en Segundos
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed m-0">
              Cargá tus comprobantes de <strong>Sistema 1</strong> o <strong>Sistema 2</strong>. El sistema lee los importes en pesos, omite vencimientos secundarios, y genera una planilla lista para Excel y Google Sheets.
            </p>
          </div>

          <div className="mt-4 sm:mt-0 sm:absolute sm:right-8 sm:bottom-8 z-10 flex flex-wrap gap-2">
            <button
              onClick={handleLoadSamples}
              className="w-full sm:w-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-xs border border-white/30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              title="Cargar facturas simuladas para probar el flujo sin consumir tokens"
            >
              <FileCheck className="w-4 h-4 text-emerald-300" />
              <span>Cargar Facturas de Prueba</span>
            </button>
          </div>
        </div>

        {/* Zona de Carga (Paso 1) */}
        <FileUpload
          onFilesSelected={handleFilesSelected}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isProcessing={isProcessing}
        />

        {/* Notificador de Procesamiento en Vivo */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center space-x-3 text-blue-900 animate-pulse">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
            <div className="text-xs font-semibold">
              {currentProcessingFile || 'Analizando documentos con Google Gemini...'}
            </div>
          </div>
        )}

        {/* Tabla de Facturas y Botón Descargar Excel (Paso 2 y Paso 3) */}
        {isLoadingDb ? (
          <div className="py-12 text-center text-slate-400 flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm">Cargando base de datos local SQLite...</span>
          </div>
        ) : (
          <InvoiceTable
            invoices={invoices}
            onEditInvoice={(inv) => {
              setSelectedInvoice(inv)
              setIsReviewOpen(true)
            }}
            onDeleteInvoice={handleDeleteInvoice}
            onAddNew={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onClearAll={handleClearAll}
            onChangePaymentStatus={handleChangePaymentStatus}
          />
        )}
      </main>

      {/* Pie de página sencillo */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Gestor de Facturas de El Eco • Diseñado para facilidad de uso y máxima privacidad local • Preparado para versión móvil
      </footer>

      {/* Modales */}
      <InvoiceReviewModal
        isOpen={isReviewOpen}
        invoice={selectedInvoice}
        onClose={() => {
          setIsReviewOpen(false)
          setSelectedInvoice(null)
        }}
        onSave={handleSaveInvoice}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => {
          setHasKey(hasApiKey())
        }}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  )
}

export default App
