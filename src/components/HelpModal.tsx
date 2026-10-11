import { HelpCircle, FileText, X } from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white m-0">Guía de Uso: Gestor de Facturas de El Eco</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* El flujo en 3 pasos */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 m-0">El flujo habitual de trabajo (en 3 pasos)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mb-1">
                  1
                </span>
                <p className="text-xs font-bold text-blue-900">Cargar Facturas</p>
                <p className="text-[11px] text-blue-800">
                  Arrastrá tus archivos PDF o fotos (JPG/PNG). La Inteligencia Artificial las lee automáticamente.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center mb-1">
                  2
                </span>
                <p className="text-xs font-bold text-amber-900">Revisar los Datos</p>
                <p className="text-[11px] text-amber-800">
                  Hacé clic en "Revisar" para comparar la imagen de la factura con los datos extraídos y corregir si falta algo.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mb-1">
                  3
                </span>
                <p className="text-xs font-bold text-emerald-900">Descargar Excel</p>
                <p className="text-[11px] text-emerald-800">
                  Tocá el botón verde "Descargar Excel" para obtener tu planilla lista para abrir en Excel o Google Sheets.
                </p>
              </div>
            </div>
          </div>

          {/* Función de Colores: Verde, Naranja o Sin Color */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 m-0">Marcar Facturas con Colores (Fácil y Rápido)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>Verde = Pagada</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Tocá el botón <strong>"Pagada"</strong> en la tabla o en la revisión para marcar que el cliente ya abonó la factura.
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-amber-800 font-bold text-xs">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span>Naranja = Entregada</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  Tocá el botón <strong>"Entregada"</strong> para indicar que el comprobante o trabajo ya fue entregado.
                </p>
              </div>

              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-700 font-bold text-xs">
                  <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                  <span>Sin Color = Nada</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Hacé clic en el botón con signo menos (<span className="font-bold">-</span>) para quitar el color y dejarla neutra.
                </p>
              </div>
            </div>
          </div>

          {/* Filtro y Exportación por Mes */}
          <div className="space-y-2 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
            <h3 className="text-xs font-bold text-blue-900 m-0">📅 Filtro y Exportación por Mes</h3>
            <p className="text-[11px] text-blue-800 m-0">
              La IA extrae automáticamente la fecha y el mes de cada factura (ej. Septiembre 2026, Octubre 2026). Con el selector <strong>"Mes:"</strong> podés filtrar para ver solo ese período, y al tocar <strong>"Descargar Excel"</strong> se exportan únicamente las facturas de ese mes.
            </p>
          </div>

          {/* Diferencias entre Sistema 1 y Sistema 2 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 m-0">¿Cómo funcionan los 2 sistemas de facturas?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-800 m-0">Facturas de Sistema 1</h4>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1 pl-1">
                  <li>• Tiene <strong>"Comp Nro"</strong> y <strong>"Cliente N°"</strong>.</li>
                  <li>• Nombre: <strong>"Razón Social / Apellido y Nombre"</strong>.</li>
                  <li>• <strong>Importe:</strong> toma únicamente el <strong>1° vencimiento</strong> (los vencimientos posteriores se ignoran).</li>
                </ul>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800 m-0">Facturas de Sistema 2</h4>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1 pl-1">
                  <li>• No tiene Comp Nro ni Cliente N° (quedan vacíos).</li>
                  <li>• Nombre del cliente en el encabezado.</li>
                  <li>• <strong>Importe:</strong> toma el <strong>precio facturado único</strong>.</li>
                  <li>• Si la hoja tiene duplicado, se toma como <strong>una sola factura</strong>.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Privacidad */}
          <div className="p-3.5 bg-slate-100 rounded-xl text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Tus datos están protegidos:</p>
            <p>
              Toda la información se almacena localmente en la base de datos de tu computadora (SQLite). Nadie fuera de tu equipo tiene acceso a tus facturas ni a tus números.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Entendido, gracias
          </button>
        </div>
      </div>
    </div>
  )
}
