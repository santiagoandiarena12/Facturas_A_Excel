import initSqlJs, { type Database } from 'sql.js'
import type { InvoiceRecord } from '../types/invoice'

const DB_STORAGE_KEY = 'el_eco_facturas_sqlite_db'

let dbInstance: Database | null = null

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance
  }

  const SQL = await initSqlJs({
    locateFile: () => `/sql-wasm.wasm`,
  })

  // Cargar base de datos guardada previamente en IndexedDB / localStorage
  const savedDbBase64 = localStorage.getItem(DB_STORAGE_KEY)
  if (savedDbBase64) {
    try {
      const binaryString = atob(savedDbBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      dbInstance = new SQL.Database(bytes)
    } catch (e) {
      console.warn('Error al restaurar base de datos SQLite guardada, creando una nueva:', e)
      dbInstance = new SQL.Database()
    }
  } else {
    dbInstance = new SQL.Database()
  }

  // Asegurar que la tabla exista
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS facturas (
      id TEXT PRIMARY KEY,
      archivo_nombre TEXT,
      archivo_tipo TEXT,
      archivo_preview TEXT,
      sistema TEXT,
      comp_nro TEXT,
      cliente_nro TEXT,
      nombre_cliente TEXT,
      importe REAL,
      estado_revision TEXT,
      estado_pago TEXT DEFAULT 'ninguno',
      fecha_emision TEXT DEFAULT '',
      mes TEXT DEFAULT '',
      observaciones TEXT,
      creado_en TEXT
    );
  `)

  // Migraciones automáticas para bases de datos existentes
  try {
    dbInstance.run(`ALTER TABLE facturas ADD COLUMN estado_pago TEXT DEFAULT 'ninguno'`)
  } catch {
    // Ya existe
  }
  try {
    dbInstance.run(`ALTER TABLE facturas ADD COLUMN fecha_emision TEXT DEFAULT ''`)
  } catch {
    // Ya existe
  }
  try {
    dbInstance.run(`ALTER TABLE facturas ADD COLUMN mes TEXT DEFAULT ''`)
  } catch {
    // Ya existe
  }

  persistDatabase(dbInstance)
  return dbInstance
}

function persistDatabase(db: Database) {
  try {
    const data = db.export()
    // Convertir Uint8Array a base64 seguro por bloques
    let binary = ''
    const len = data.byteLength
    const chunkSize = 8192
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = data.subarray(i, Math.min(i + chunkSize, len))
      binary += String.fromCharCode.apply(null, Array.from(chunk))
    }
    const base64 = btoa(binary)
    localStorage.setItem(DB_STORAGE_KEY, base64)
  } catch (error) {
    console.error('Error al persistir la base de datos local SQLite:', error)
  }
}

export async function getAllInvoices(): Promise<InvoiceRecord[]> {
  const db = await getDatabase()
  const results = db.exec(`
    SELECT id, archivo_nombre, archivo_tipo, archivo_preview, sistema, comp_nro, cliente_nro, nombre_cliente, importe, estado_revision, estado_pago, fecha_emision, mes, observaciones, creado_en
    FROM facturas
    ORDER BY creado_en DESC
  `)

  if (!results.length || !results[0].values) {
    return []
  }

  return results[0].values.map((row) => {
    let observaciones: string[] = []
    try {
      observaciones = row[13] ? JSON.parse(row[13] as string) : []
    } catch {
      observaciones = []
    }

    return {
      id: row[0] as string,
      archivo_nombre: row[1] as string,
      archivo_tipo: row[2] as string,
      archivo_preview: row[3] as string,
      sistema: (row[4] as 'Sistema 1' | 'Sistema 2') || 'Sistema 1',
      comp_nro: (row[5] as string) || '',
      cliente_nro: (row[6] as string) || '',
      nombre_cliente: (row[7] as string) || '',
      importe: typeof row[8] === 'number' ? row[8] : Number(row[8]) || 0,
      estado_revision: (row[9] as 'pendiente' | 'revisado') || 'pendiente',
      estado_pago: (row[10] as 'pagada' | 'entregada' | 'ninguno') || 'ninguno',
      fecha_emision: (row[11] as string) || '',
      mes: (row[12] as string) || '',
      observaciones,
      creado_en: row[14] as string,
    }
  })
}

export async function saveInvoice(invoice: InvoiceRecord): Promise<void> {
  const db = await getDatabase()
  const observacionesJson = JSON.stringify(invoice.observaciones || [])

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO facturas (
      id, archivo_nombre, archivo_tipo, archivo_preview, sistema, comp_nro, cliente_nro, nombre_cliente, importe, estado_revision, estado_pago, fecha_emision, mes, observaciones, creado_en
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run([
    invoice.id,
    invoice.archivo_nombre,
    invoice.archivo_tipo,
    invoice.archivo_preview || '',
    invoice.sistema,
    invoice.comp_nro || '',
    invoice.cliente_nro || '',
    invoice.nombre_cliente,
    invoice.importe,
    invoice.estado_revision,
    invoice.estado_pago || 'ninguno',
    invoice.fecha_emision || '',
    invoice.mes || '',
    observacionesJson,
    invoice.creado_en,
  ])

  stmt.free()
  persistDatabase(db)
}

export async function updateInvoicePaymentStatus(
  id: string,
  status: 'pagada' | 'entregada' | 'ninguno'
): Promise<void> {
  const db = await getDatabase()
  db.run(`UPDATE facturas SET estado_pago = ? WHERE id = ?`, [status, id])
  persistDatabase(db)
}

export async function deleteInvoice(id: string): Promise<void> {
  const db = await getDatabase()
  db.run(`DELETE FROM facturas WHERE id = ?`, [id])
  persistDatabase(db)
}

export async function clearAllInvoices(): Promise<void> {
  const db = await getDatabase()
  db.run(`DELETE FROM facturas`)
  persistDatabase(db)
}

/**
 * Permite descargar la base de datos física SQLite (.sqlite) para respaldo local.
 */
export async function downloadDatabaseBackup(): Promise<void> {
  const db = await getDatabase()
  const data = db.export()
  const blob = new Blob([data as unknown as BlobPart], { type: 'application/x-sqlite3' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `facturas_el_eco_${new Date().toISOString().slice(0, 10)}.sqlite`
  a.click()
  URL.revokeObjectURL(url)
}
