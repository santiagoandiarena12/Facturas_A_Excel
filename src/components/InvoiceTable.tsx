import { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Eye,
  DownloadCloud,
  Check,
  Truck,
  Minus,
  Calendar
} from 'lucide-react'
import type { InvoiceRecord, InvoicePaymentStatus } from '../types/invoice'
import { exportInvoicesToExcel } from '../services/excel'
import { downloadDatabaseBackup } from '../services/database'

interface InvoiceTableProps {
  invoices: InvoiceRecord[]
  onEditInvoice: (invoice: InvoiceRecord) => void
  onDeleteInvoice: (id: string) => void
  onAddNew: () => void
  onClearAll: () => void
  onChangePaymentStatus: (id: string, status: InvoicePaymentStatus) => void
}

export const InvoiceTable = ({
  invoices,
  onEditInvoice,
  onDeleteInvoice,
  onAddNew,
  onClearAll,
  onChangePaymentStatus,
}: InvoiceTableProps) => {
  const [filter, setFilter] = useState<
    'todos' | 'pagadas' | 'entregadas' | 'sin_marcar' | 'pendientes' | 'revisados' | 'sistema1' | 'sistema2'
  >('todos')
  const [selectedMonth, setSelectedMonth] = useState<string>('todos')
  const [search, setSearch] = useState('')

  // Obtener lista dinámica de meses disponibles en las facturas
  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    invoices.forEach((inv) => {
      if (inv.mes && inv.mes.trim() && inv.mes !== 'Sin mes especificado') {
        set.add(inv.mes.trim())
      }
    })
    return Array.from(set).sort((a, b) => b.localeCompare(a)) // orden descendente
  }, [invoices])

  // Filtrado de registros considerando filtro de estado y mes
  const filteredInvoices = invoices.filter((inv) => {
    // Filtro por mes
    if (selectedMonth !== 'todos' && inv.mes !== selectedMonth) return false

    // Filtro por estado / sistema
    if (filter === 'pagadas' && inv.estado_pago !== 'pagada') return false
    if (filter === 'entregadas' && inv.estado_pago !== 'entregada') return false
    if (filter === 'sin_marcar' && inv.estado_pago && inv.estado_pago !== 'ninguno') return false
    if (filter === 'pendientes' && inv.estado_revision !== 'pendiente') return false
    if (filter === 'revisados' && inv.estado_revision !== 'revisado') return false
    if (filter === 'sistema1' && inv.sistema !== 'Sistema 1') return false
    if (filter === 'sistema2' && inv.sistema !== 'Sistema 2') return false

    // Búsqueda libre
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchName = (inv.nombre_cliente || '').toLowerCase().includes(q)
      const matchComp = (inv.comp_nro || '').toLowerCase().includes(q)
      const matchCliente = (inv.cliente_nro || '').toLowerCase().includes(q)
      const matchFecha = (inv.fecha_emision || '').toLowerCase().includes(q)
      const matchMes = (inv.mes || '').toLowerCase().includes(q)
      return matchName || matchComp || matchCliente || matchFecha || matchMes
    }
    return true
  })

  // Cálculos de resumen para el mes o filtro actual
  const totalImporte = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.importe) || 0), 0)
  const pagadasCount = filteredInvoices.filter((i) => i.estado_pago === 'pagada').length
  const pagadasTotal = filteredInvoices
    .filter((i) => i.estado_pago === 'pagada')
    .reduce((sum, inv) => sum + (Number(inv.importe) || 0), 0)

  const entregadasCount = filteredInvoices.filter((i) => i.estado_pago === 'entregada').length
  const entregadasTotal = filteredInvoices
    .filter((i) => i.estado_pago === 'entregada')
    .reduce((sum, inv) => sum + (Number(inv.importe) || 0), 0)

  const pendientesCount = filteredInvoices.filter((i) => i.estado_revision === 'pendiente').length

  const handleExport = () => {
    exportInvoicesToExcel(filteredInvoices, selectedMonth)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Barra superior de control y métricas responsive */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Métricas con Grid responsivo en móviles */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-4">
          <div className="p-2 sm:p-0 bg-slate-50 sm:bg-transparent rounded-xl border border-slate-100 sm:border-0">
            <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase tracking-wider font-bold block">
              {selectedMonth !== 'todos' ? `Facturas (${selectedMonth})` : 'Total Facturas'}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-800">{filteredInvoices.length}</div>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
              ${totalImporte.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="h-10 w-px bg-slate-200 hidden sm:block" />

          {/* Tarjeta Verde: Pagadas */}
          <div className="bg-emerald-50/70 border border-emerald-200 px-3 py-2 sm:px-3.5 sm:py-1.5 rounded-xl">
            <div className="flex items-center space-x-1.5 text-emerald-800 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">Pagadas ({pagadasCount})</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-emerald-700">
              ${pagadasTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Tarjeta Naranja: Entregadas */}
          <div className="bg-amber-50/70 border border-amber-200 px-3 py-2 sm:px-3.5 sm:py-1.5 rounded-xl">
            <div className="flex items-center space-x-1.5 text-amber-800 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <span className="truncate">Entregadas ({entregadasCount})</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-amber-700">
              ${entregadasTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {pendientesCount > 0 && (
            <div className="col-span-2 sm:col-span-1 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="text-xs font-bold text-red-800">
                {pendientesCount} {pendientesCount === 1 ? 'requiere revisión' : 'requieren revisión'}
              </span>
            </div>
          )}
        </div>

        {/* Filtro de Mes y Botones de acción */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          {/* SELECTOR DE MES DESTACADO */}
          <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3.5 py-2.5 rounded-xl">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-blue-900 shrink-0">Mes:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-blue-900 focus:outline-none cursor-pointer w-full"
            >
              <option value="todos">Todos los meses ({invoices.length})</option>
              {availableMonths.map((m) => {
                const count = invoices.filter((i) => i.mes === m).length
                return (
                  <option key={m} value={m}>
                    {m} ({count})
                  </option>
                )
              })}
            </select>
          </div>

          <button
            onClick={onAddNew}
            className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-600" />
            <span>Procesar otra</span>
          </button>

          {/* BOTÓN DESTACADO: Descargar Excel por Mes */}
          <button
            onClick={handleExport}
            disabled={filteredInvoices.length === 0}
            className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            title={
              selectedMonth !== 'todos'
                ? `Descargar Excel con las facturas de ${selectedMonth}`
                : 'Descargar Excel con todas las facturas'
            }
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-100" />
            <span>
              {selectedMonth !== 'todos' ? `Excel (${selectedMonth})` : 'Descargar Excel (.xlsx)'}
            </span>
          </button>
        </div>
      </div>

      {/* Filtros por Color/Estado y Búsqueda con scroll horizontal táctil */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <button
            onClick={() => setFilter('todos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              filter === 'todos'
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Todas ({invoices.length})
          </button>

          {/* Filtro Verde: Pagadas */}
          <button
            onClick={() => setFilter('pagadas')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center space-x-1.5 cursor-pointer ${
              filter === 'pagadas'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
            <span>Pagadas ({pagadasCount})</span>
          </button>

          {/* Filtro Naranja: Entregadas */}
          <button
            onClick={() => setFilter('entregadas')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center space-x-1.5 cursor-pointer ${
              filter === 'entregadas'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white"></span>
            <span>Entregadas ({entregadasCount})</span>
          </button>

          {/* Filtro Sin color: Nada */}
          <button
            onClick={() => setFilter('sin_marcar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              filter === 'sin_marcar'
                ? 'bg-slate-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Sin marcar
          </button>

          <span className="text-slate-300 shrink-0">|</span>

          <button
            onClick={() => setFilter('pendientes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              filter === 'pendientes'
                ? 'bg-red-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Pendientes ({pendientesCount})
          </button>

          <button
            onClick={() => setFilter('sistema1')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              filter === 'sistema1'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Sistema 1
          </button>
          <button
            onClick={() => setFilter('sistema2')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              filter === 'sistema2'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Sistema 2
          </button>
        </div>

        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Buscar cliente, nro o mes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 shadow-xs"
          />
        </div>
      </div>

      {/* VISTA MÓVIL (Celular y smartphones: Tarjetas táctiles) */}
      <div className="block md:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200 text-sm">
            {selectedMonth !== 'todos'
              ? `No hay facturas registradas en ${selectedMonth}.`
              : 'No se encontraron facturas con el filtro seleccionado.'}
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const isPendiente = inv.estado_revision === 'pendiente'
            const isSis2 = inv.sistema === 'Sistema 2'
            const estadoPago = inv.estado_pago || 'ninguno'

            let borderClass = 'border-l-4 border-l-slate-300'
            if (estadoPago === 'pagada') borderClass = 'border-l-4 border-l-emerald-500 bg-emerald-50/10'
            if (estadoPago === 'entregada') borderClass = 'border-l-4 border-l-amber-500 bg-amber-50/10'

            return (
              <div
                key={inv.id}
                className={`bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 ${borderClass}`}
              >
                {/* Cabecera de la tarjeta: Sistema, Mes y Revisión */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {inv.sistema}
                    </span>
                    {inv.mes && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-1">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{inv.mes}</span>
                      </span>
                    )}
                    {isPendiente ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Revisar</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Revisado</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar la factura de "${inv.nombre_cliente || 'Sin nombre'}"?`)) {
                        onDeleteInvoice(inv.id)
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                    title="Eliminar factura"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Cliente, Fecha e Importe */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-2 m-0 leading-tight">
                    {inv.nombre_cliente || <span className="text-red-500 italic">Sin nombre</span>}
                  </h4>
                  <div className="flex flex-wrap gap-x-3 text-[11px] text-slate-500 font-mono">
                    {inv.fecha_emision && <span>Fecha: {inv.fecha_emision}</span>}
                    {!isSis2 && (
                      <>
                        <span>Comp: {inv.comp_nro || 'Falta'}</span>
                        <span>Cliente: {inv.cliente_nro || 'Falta'}</span>
                      </>
                    )}
                  </div>
                  <div className="pt-1 text-lg font-extrabold text-slate-900 font-mono">
                    ${Number(inv.importe || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Botones de acción táctiles en móvil */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    {/* Botón táctil Pagada */}
                    <button
                      type="button"
                      onClick={() =>
                        onChangePaymentStatus(
                          inv.id,
                          estadoPago === 'pagada' ? 'ninguno' : 'pagada'
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                        estadoPago === 'pagada'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Pagada</span>
                    </button>

                    {/* Botón táctil Entregada */}
                    <button
                      type="button"
                      onClick={() =>
                        onChangePaymentStatus(
                          inv.id,
                          estadoPago === 'entregada' ? 'ninguno' : 'entregada'
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                        estadoPago === 'entregada'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Entregada</span>
                    </button>

                    {estadoPago !== 'ninguno' && (
                      <button
                        type="button"
                        onClick={() => onChangePaymentStatus(inv.id, 'ninguno')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                        title="Quitar color"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Botón Revisar */}
                  <button
                    onClick={() => onEditInvoice(inv)}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Revisar</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* VISTA ESCRITORIO (Tablets y Desktop: Todo a la vista al 100% del ancho SIN scroll) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-3 w-36">Estado</th>
              <th className="py-3 px-3 w-32">Período</th>
              <th className="py-3 px-3 w-36">Sistema / Comp</th>
              <th className="py-3 px-3">Cliente</th>
              <th className="py-3 px-3 text-right w-32">Importe</th>
              <th className="py-3 px-3 text-center w-28">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  {selectedMonth !== 'todos'
                    ? `No hay facturas registradas en ${selectedMonth}.`
                    : 'No se encontraron facturas con el criterio seleccionado.'}
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const isPendiente = inv.estado_revision === 'pendiente'
                const isSis2 = inv.sistema === 'Sistema 2'
                const estadoPago = inv.estado_pago || 'ninguno'

                let rowBorderColor = 'border-l-4 border-l-transparent'
                if (estadoPago === 'pagada') {
                  rowBorderColor = 'border-l-4 border-l-emerald-500 bg-emerald-50/15'
                } else if (estadoPago === 'entregada') {
                  rowBorderColor = 'border-l-4 border-l-amber-500 bg-amber-50/15'
                }

                return (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50/80 transition-colors ${rowBorderColor} ${
                      isPendiente ? 'bg-red-50/20' : ''
                    }`}
                  >
                    {/* 1. Estado con selector de color compacto */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() =>
                            onChangePaymentStatus(
                              inv.id,
                              estadoPago === 'pagada' ? 'ninguno' : 'pagada'
                            )
                          }
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                            estadoPago === 'pagada'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title="Marcar como Pagada (Verde)"
                        >
                          <Check className="w-3 h-3" />
                          <span>Pagada</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onChangePaymentStatus(
                              inv.id,
                              estadoPago === 'entregada' ? 'ninguno' : 'entregada'
                            )
                          }
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                            estadoPago === 'entregada'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-400 hover:text-amber-700 hover:bg-amber-50'
                          }`}
                          title="Marcar como Entregada (Naranja)"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Entregada</span>
                        </button>

                        {estadoPago !== 'ninguno' && (
                          <button
                            type="button"
                            onClick={() => onChangePaymentStatus(inv.id, 'ninguno')}
                            className="p-1 text-slate-300 hover:text-slate-600 rounded-md transition-colors"
                            title="Quitar marca de color"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 2. Período: Mes y Fecha combinados en vertical */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs truncate">
                          {inv.mes || 'Sin mes'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {inv.fecha_emision || '-'}
                        </span>
                      </div>
                    </td>

                    {/* 3. Sistema y Comprobante combinados */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${
                              isSis2
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {inv.sistema}
                          </span>
                          {isPendiente && (
                            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1 py-0.5 rounded">
                              Revisar
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600">
                          {isSis2 ? (
                            <span className="text-slate-400 italic text-[10px]">Precio único</span>
                          ) : (
                            <div className="truncate">
                              <span className="text-slate-700 font-medium">N° {inv.comp_nro || 'Falta'}</span>
                              {inv.cliente_nro && (
                                <span className="text-slate-400 text-[10px] ml-1">({inv.cliente_nro})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 4. Nombre del cliente (Flexible, no desborda) */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 leading-snug break-words pr-2">
                        {inv.nombre_cliente ? (
                          <span>{inv.nombre_cliente}</span>
                        ) : (
                          <span className="text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded text-xs">
                            Sin nombre
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. Importe */}
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900 font-mono text-sm whitespace-nowrap">
                      ${Number(inv.importe || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>

                    {/* 6. Acciones (Siempre visibles a la derecha) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onEditInvoice(inv)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Ver documento original y corregir datos"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Revisar</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar la factura de "${inv.nombre_cliente || 'Sin nombre'}"?`)) {
                              onDeleteInvoice(inv.id)
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar factura"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de tabla con opciones adicionales */}
      <div className="p-3 sm:px-6 sm:py-3 bg-white sm:bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-none sm:border-t flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>
          Mostrando {filteredInvoices.length} de {invoices.length} facturas registradas
          {selectedMonth !== 'todos' && ` (filtradas por ${selectedMonth})`}
        </span>
        <div className="flex items-center space-x-3">
          <button
            onClick={downloadDatabaseBackup}
            className="text-slate-600 hover:text-slate-900 font-medium hover:underline cursor-pointer flex items-center space-x-1"
            title="Descargar copia de la base de datos SQLite (.sqlite)"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Copia de seguridad local (SQLite)</span>
          </button>
          {invoices.length > 0 && (
            <>
              <span>•</span>
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas vaciar todas las facturas guardadas? Esta acción no se puede deshacer.')) {
                    onClearAll()
                  }
                }}
                className="text-red-600 hover:text-red-800 font-medium hover:underline cursor-pointer"
              >
                Vaciar historial
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
