import { useState, useEffect } from 'react'
import { X, Key, ShieldCheck, ExternalLink, Check, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { getApiKey, saveApiKey, testApiKey } from '../services/gemini'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export const SettingsModal = ({ isOpen, onClose, onSaved }: SettingsModalProps) => {
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setKeyInput(getApiKey())
      setStatusMessage(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleTestAndSave = async () => {
    if (!keyInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor, escribe o pega una clave válida.' })
      return
    }

    setLoading(true)
    setStatusMessage(null)

    const res = await testApiKey(keyInput)
    setLoading(false)

    if (res.success) {
      saveApiKey(keyInput)
      setStatusMessage({ type: 'success', text: '¡Excelente! La clave funciona correctamente y ha sido guardada en este equipo.' })
      onSaved()
    } else {
      setStatusMessage({ type: 'error', text: res.message })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92dvh] flex flex-col overflow-hidden border border-slate-200">
        {/* Cabecera */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-white m-0">Configurar Clave IA (Gemini)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Tarjeta de privacidad */}
          <div className="flex items-start space-x-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-sm">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Privacidad y Seguridad Garantizada</p>
              <p className="text-xs text-blue-700 mt-0.5">
                La clave y los datos de las facturas se guardan únicamente en tu computadora. No se envían a servidores de terceros ni a bases de datos en la nube.
              </p>
            </div>
          </div>

          {/* Instrucciones sencillas para personas no técnicas */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 m-0">¿Cómo conseguir tu clave gratuita en 3 pasos?</h3>
            <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pl-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <li>
                Entrá en la página oficial gratuita de Google:{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-semibold inline-flex items-center hover:underline ml-1"
                >
                  Google AI Studio <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
              <li>Iniciá sesión con tu cuenta de Google (Gmail) y hacé clic en el botón azul <strong>"Create API Key"</strong> (Crear clave de API).</li>
              <li>Copia la clave generada y pegala en el cuadro de abajo.</li>
            </ol>
          </div>

          {/* Entrada de Clave */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Clave de API de Gemini
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Ejemplo: AIzaSyD..."
                className="w-full px-4 py-3 pr-11 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-slate-800 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showKey ? 'Ocultar' : 'Mostrar'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mensajes de Estado */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center space-x-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Pie con Botones */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleTestAndSave}
            disabled={loading || !keyInput.trim()}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando conexión...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Probar y Guardar Clave</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
