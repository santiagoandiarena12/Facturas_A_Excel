import { useState } from 'react'
import {
  X,
  CheckCircle,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Save,
  Check,
  Building2,
  Receipt,
  User,
  DollarSign,
  AlertCircle,
  Eye,
  Edit3,
  Calendar
} from 'lucide-react'
import type { InvoiceRecord } from '../types/invoice'

interface InvoiceReviewModalProps {
  invoice: InvoiceRecord | null
  isOpen: boolean
  onClose: () => void
  onSave: (updated: InvoiceRecord) => void
}

export const InvoiceReviewModal = ({
  invoice,
  isOpen,
  onClose,
  onSave,
}: InvoiceReviewModalProps) => {
  if (!isOpen || !invoice) return null

  const [formData, setFormData] = useState<InvoiceRecord>({ ...invoice })
  const [zoom, setZoom] = useState<number>(1)
  const [mobileTab, setMobileTab] = useState<'datos' | 'documento'>('datos')

  const isSistema2 = formData.sistema === 'Sistema 2'

  const handleSystemChange = (sys: 'Sistema 1' | 'Sistema 2') => {
    setFormData((prev) => ({
      ...prev,
      sistema: sys,
      comp_nro: sys === 'Sistema 2' ? '' : prev.comp_nro,
      cliente_nro: sys === 'Sistema 2' ? '' : prev.cliente_nro,
    }))
  }

  const handleSave = (markAsReviewed: boolean = true) => {
    const updated: InvoiceRecord = {
      ...formData,
      importe: Number(formData.importe) || 0,
      estado_revision: markAsReviewed ? 'revisado' : formData.estado_revision,
    }
    onSave(updated)
    onClose()
  }

  // Detectar si faltan campos obligatorios
  const missingCompNro = !isSistema2 && !formData.comp_nro.trim()
  const missingClienteNro = !isSistema2 && !formData.cliente_nro.trim()
  const missingNombre = !formData.nombre_cliente.trim()
  const missingImporte = Number(formData.importe) <= 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-6xl w-full h-[100dvh] sm:h-[92vh] flex flex-col overflow-hidden border-0 sm:border border-slate-200">
        {/* Barra Superior */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <Receipt className="w-5 h-5 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate m-0">
                Revisión: <span className="font-mono text-slate-300 font-normal">{formData.archivo_nombre}</span>
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1 ${
                formData.estado_revision === 'revisado'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {formData.estado_revision === 'revisado' ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  <span>Revisado</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  <span>Pendiente</span>
                </>
              )}
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pestañas de cambio en CELULAR (Ver documento vs Editar datos) */}
        <div className="lg:hidden flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('datos')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors border-b-2 ${
              mobileTab === 'datos'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Datos de Factura</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('documento')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors border-b-2 ${
              mobileTab === 'documento'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver Documento Original</span>
          </button>
        </div>

        {/* Cuerpo dividido: Previsualización a la izquierda, Datos a la derecha */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-100">
          {/* LADO IZQUIERDO: Factura original con visor y zoom */}
          <div
            className={`lg:col-span-7 flex flex-col bg-slate-800 border-r border-slate-300 relative overflow-hidden ${
              mobileTab === 'documento' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Controles de visor */}
            <div className="bg-slate-900/90 text-white px-3 sm:px-4 py-2 flex items-center justify-between z-10 border-b border-slate-700">
              <span className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">Documento Original</span>
                <span className="sm:hidden">Original</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  title="Alejar (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-400 w-10 sm:w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  title="Acercar (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  title="Restablecer zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contenedor de imagen / PDF */}
            <div className="flex-1 overflow-auto p-3 sm:p-4 flex items-center justify-center">
              {formData.archivo_preview ? (
                <div
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                  className="transition-transform duration-150 ease-out shadow-2xl rounded-lg bg-white max-w-full"
                >
                  <img
                    src={formData.archivo_preview}
                    alt="Factura original"
                    className="max-w-full object-contain rounded-lg max-h-[70vh] sm:max-h-[80vh]"
                  />
                </div>
              ) : (
                <div className="text-slate-400 text-center p-8">
                  <FileText className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay vista previa disponible para este archivo.</p>
                </div>
              )}
            </div>

            {/* Botón flotante móvil para volver a editar */}
            <div className="lg:hidden p-3 bg-slate-900 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setMobileTab('datos')}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Volver a Editar Datos</span>
              </button>
            </div>
          </div>

          {/* LADO DERECHO: Formulario de revisión y corrección */}
          <div
            className={`lg:col-span-5 flex flex-col bg-white overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 ${
              mobileTab === 'datos' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Selector de Sistema */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Sistema de Factura
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSystemChange('Sistema 1')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    formData.sistema === 'Sistema 1'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Sistema 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSystemChange('Sistema 2')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    formData.sistema === 'Sistema 2'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Sistema 2</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isSistema2
                  ? 'Sistema 2: Solo requiere Nombre del cliente e Importe (precio facturado).'
                  : 'Sistema 1: Requiere Comp Nro, Cliente N°, Razón Social e Importe (1° vencimiento).'}
              </p>
            </div>

            {/* Alertas de campos faltantes */}
            {(missingCompNro || missingClienteNro || missingNombre || missingImporte) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Atención: Hay campos pendientes</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Verificá los valores con el documento original antes de guardar.
                  </p>
                </div>
              </div>
            )}

            {/* Campos de datos */}
            <div className="space-y-3.5">
              {/* Comp Nro (solo Sistema 1) */}
              {!isSistema2 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Número de Comprobante (Comp Nro)</span>
                    {missingCompNro && (
                      <span className="text-[10px] text-red-600 font-normal">Falta completar</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.comp_nro}
                    onChange={(e) => setFormData({ ...formData, comp_nro: e.target.value })}
                    placeholder="Ejemplo: 0001-0004523"
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-mono ${
                      missingCompNro
                        ? 'border-amber-400 bg-amber-50/40 text-slate-900 focus:ring-amber-500'
                        : 'border-slate-300 bg-white text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>
              )}

              {/* Cliente N° (solo Sistema 1) */}
              {!isSistema2 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Número de Cliente (Cliente N°)</span>
                    {missingClienteNro && (
                      <span className="text-[10px] text-red-600 font-normal">Falta completar</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.cliente_nro}
                    onChange={(e) => setFormData({ ...formData, cliente_nro: e.target.value })}
                    placeholder="Ejemplo: 12458"
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-mono ${
                      missingClienteNro
                        ? 'border-amber-400 bg-amber-50/40 text-slate-900 focus:ring-amber-500'
                        : 'border-slate-300 bg-white text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>
              )}

              {/* Nombre del cliente */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{isSistema2 ? 'Nombre del cliente (Encabezado)' : 'Razón Social / Apellido y Nombre'}</span>
                  {missingNombre && (
                    <span className="text-[10px] text-red-600 font-normal">Falta completar</span>
                  )}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.nombre_cliente}
                    onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                    placeholder="Ejemplo: Juan Pérez o Empresa S.A."
                    className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border ${
                      missingNombre
                        ? 'border-amber-400 bg-amber-50/40 text-slate-900 focus:ring-amber-500'
                        : 'border-slate-300 bg-white text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Importe */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    Importe ($ ARS){' '}
                    <span className="text-slate-500 font-normal text-[11px]">
                      {isSistema2 ? '(Precio facturado único)' : '(1° vencimiento únicamente)'}
                    </span>
                  </span>
                  {missingImporte && (
                    <span className="text-[10px] text-red-600 font-normal">Importe inválido</span>
                  )}
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.importe || ''}
                    onChange={(e) => setFormData({ ...formData, importe: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className={`w-full pl-9 pr-3.5 py-2.5 text-sm font-semibold rounded-xl border ${
                      missingImporte
                        ? 'border-amber-400 bg-amber-50/40 text-slate-900 focus:ring-amber-500'
                        : 'border-slate-300 bg-white text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  En pantalla: ${Number(formData.importe || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Fecha y Mes de la factura */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <span>{isSistema2 ? 'Fecha en factura' : 'Fecha de emisión'}</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.fecha_emision || ''}
                      onChange={(e) => setFormData({ ...formData, fecha_emision: e.target.value })}
                      placeholder="Ej: 15/09/2026"
                      className="w-full pl-8 pr-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <span>Mes correspondiente</span>
                  </label>
                  <input
                    type="text"
                    value={formData.mes || ''}
                    onChange={(e) => setFormData({ ...formData, mes: e.target.value })}
                    placeholder="Ej: Septiembre 2026"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>

              {/* Estado de Cobro y Entrega (Verde, Naranja o Sin Color) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Estado de la Factura (Color)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* VERDE: PAGADA */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, estado_pago: 'pagada' })}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      formData.estado_pago === 'pagada'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300'
                        : 'bg-emerald-50/60 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white"></span>
                    <span>Pagada</span>
                    <span className="text-[10px] font-normal opacity-90">(Verde)</span>
                  </button>

                  {/* NARANJA: ENTREGADA */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, estado_pago: 'entregada' })}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      formData.estado_pago === 'entregada'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                        : 'bg-amber-50/60 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-amber-600 border border-white"></span>
                    <span>Entregada</span>
                    <span className="text-[10px] font-normal opacity-90">(Naranja)</span>
                  </button>

                  {/* SIN COLOR: NADA */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, estado_pago: 'ninguno' })}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      !formData.estado_pago || formData.estado_pago === 'ninguno'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-sm ring-2 ring-slate-300'
                        : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400"></span>
                    <span>Nada</span>
                    <span className="text-[10px] font-normal opacity-90">(Sin color)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Observaciones de la IA */}
            {formData.observaciones && formData.observaciones.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Observaciones detectadas:</span>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                  {formData.observaciones.map((obs, idx) => (
                    <li key={idx}>{obs}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botones de Acción al pie */}
            <div className="mt-auto pt-4 border-t border-slate-200 space-y-2 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>Guardar y Marcar como Revisado</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar (Pendiente)</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-semibold rounded-xl text-xs transition-colors text-center cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
