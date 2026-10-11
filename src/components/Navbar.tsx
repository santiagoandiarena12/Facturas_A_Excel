import { FileText, Settings, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react'

interface NavbarProps {
  hasKey: boolean
  onOpenSettings: () => void
  onOpenHelp: () => void
}

export const Navbar = ({ hasKey, onOpenSettings, onOpenHelp }: NavbarProps) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2">
        {/* Identidad */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight leading-tight truncate m-0">
              Gestor de Facturas de El Eco
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate m-0">
              Extracción inteligente • Sistema 1 y 2
            </p>
          </div>
        </div>

        {/* Acciones & Estado */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Indicador de clave Gemini en pantallas pequeñas (botón circular compacto) y grandes */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center space-x-1 sm:space-x-2 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors border cursor-pointer ${
              hasKey
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title={hasKey ? 'Gemini está configurado' : 'Falta configurar la clave de Gemini'}
          >
            {hasKey ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">IA Gemini Lista</span>
                <span className="sm:hidden text-[11px] font-bold">IA OK</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 animate-pulse shrink-0" />
                <span className="hidden sm:inline">Configurar IA</span>
                <span className="sm:hidden text-[11px] font-bold">Configurar</span>
              </>
            )}
          </button>

          {/* Botón de Ayuda */}
          <button
            onClick={onOpenHelp}
            className="p-2 sm:px-3 sm:py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Ver guía de uso paso a paso"
            aria-label="Ayuda"
          >
            <HelpCircle className="w-5 h-5 text-slate-500" />
            <span className="hidden md:inline ml-1.5">Ayuda</span>
          </button>

          {/* Botón de Configuración */}
          <button
            onClick={onOpenSettings}
            className="p-2 sm:px-4 sm:py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
            aria-label="Configuración"
            title="Configuración de la aplicación"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configuración</span>
          </button>
        </div>
      </div>
    </header>
  )
}
