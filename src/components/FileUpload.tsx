import { useRef, useState } from 'react'
import { UploadCloud, FileUp, Key, Loader2, CheckCircle2 } from 'lucide-react'
import { hasApiKey } from '../services/gemini'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  onOpenSettings: () => void
  isProcessing: boolean
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  onOpenSettings,
  isProcessing,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const keyConfigured = hasApiKey()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = filterValidFiles(Array.from(e.dataTransfer.files))
      if (validFiles.length > 0) {
        onFilesSelected(validFiles)
      } else {
        alert('Por favor selecciona únicamente archivos PDF, JPG o PNG.')
      }
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = filterValidFiles(Array.from(e.target.files))
      if (validFiles.length > 0) {
        onFilesSelected(validFiles)
      }
      // Reset input para permitir volver a cargar los mismos archivos si se desea
      e.target.value = ''
    }
  }

  const filterValidFiles = (files: File[]) => {
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png']
    return files.filter((file) => {
      const lower = file.name.toLowerCase()
      return validExtensions.some((ext) => lower.endsWith(ext))
    })
  }

  return (
    <div className="space-y-4">
      {/* Aviso si falta la clave de Gemini */}
      {!keyConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3 text-amber-900">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-bold">Falta configurar la clave de Inteligencia Artificial (Gemini)</p>
              <p className="text-xs text-amber-700">
                Para que el sistema pueda leer las facturas automáticamente, necesitás ingresar tu clave gratuita una sola vez.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Configurar Clave Ahora
          </button>
        </div>
      )}

      {/* Zona principal de Carga */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/50'
        } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf, .jpg, .jpeg, .png, image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3 sm:space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
            {isProcessing ? (
              <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-blue-600" />
            ) : isDragging ? (
              <FileUp className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce text-blue-600" />
            ) : (
              <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              {isProcessing
                ? 'Procesando facturas con Inteligencia Artificial...'
                : 'Subir facturas o tomar foto'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Arrastrá o seleccioná <strong>PDF</strong>, <strong>JPG</strong> o <strong>PNG</strong>. Podés elegir varias a la vez.
            </p>
          </div>

          {!isProcessing && (
            <div className="pt-2">
              <span className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-md transition-all shadow-blue-200 cursor-pointer">
                Elegir Archivos o Cámara
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Detección automática de Sistema 1 y Sistema 2</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Almacenamiento 100% privado en tu equipo</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
