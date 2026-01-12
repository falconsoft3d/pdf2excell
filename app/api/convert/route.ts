import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'El archivo debe ser un PDF' },
        { status: 400 }
      )
    }

    // Convertir el archivo a buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extraer texto del PDF con opciones mejoradas
    const pdfData = await pdfParse(buffer, {
      max: 0, // Sin límite de páginas
    })
    
    const text = pdfData.text
    console.log('Texto extraído del PDF:', text)

    // Procesar el texto y convertirlo a datos tabulares
    const { rows, merges } = parseTextToRows(text)

    // Crear un libro de Excel
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(rows)

    // Aplicar merge de celdas
    if (merges.length > 0) {
      worksheet['!merges'] = merges
    }

    // Aplicar estilos y formato
    applyFormatting(worksheet, rows)

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')

    // Generar el archivo Excel como buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    // Retornar el archivo Excel
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${file.name.replace('.pdf', '')}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error al convertir PDF:', error)
    return NextResponse.json(
      { error: 'Error al procesar el archivo PDF' },
      { status: 500 }
    )
  }
}

interface ParseResult {
  rows: string[][]
  merges: XLSX.Range[]
}

function parseTextToRows(text: string): ParseResult {
  const lines = text.split('\n')
  const rows: string[][] = []
  const merges: XLSX.Range[] = []
  let currentRow = 0
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    
    // Saltar líneas completamente vacías
    if (line.trim() === '') continue
    
    // Detectar encabezados (texto que no tiene separadores de columna)
    const isHeader = !line.includes('\t') && line.trim().length > 0 && 
                    !/^\s+/.test(line) && // No empieza con espacios
                    !/\d+[.,]\d+/.test(line) // No contiene números decimales
    
    if (isHeader && line.trim().length < 100) {
      // Añadir como encabezado ocupando toda la fila
      rows.push([line.trim()])
      currentRow++
      continue
    }
    
    // Intentar detectar separación por tabuladores
    if (line.includes('\t')) {
      const cells = line.split('\t').map(c => c.trim())
      rows.push(cells)
      currentRow++
      continue
    }
    
    // Detectar separación por múltiples espacios (2 o más)
    if (/\s{2,}/.test(line)) {
      const cells = line.split(/\s{2,}/).map(c => c.trim()).filter(c => c)
      if (cells.length > 1) {
        rows.push(cells)
        currentRow++
        continue
      }
    }
    
    // Intentar detectar patrones de tabla común:
    // CODIGO    CRITERIO    UNIDAD    CANTIDAD    PRECIO    IMPORTE
    const tablePattern = /^(\S+)\s+(.+?)\s+(\S+)\s+(\d+[.,]?\d*)\s+(\d+[.,]?\d*\s*€?)\s+(\d+[.,]?\d*\s*€?)$/
    const match = line.match(tablePattern)
    
    if (match) {
      rows.push([match[1], match[2], match[3], match[4], match[5], match[6]])
      currentRow++
      continue
    }
    
    // Si no coincide con ningún patrón, agregarlo como una sola celda
    if (line.trim().length > 0) {
      rows.push([line.trim()])
      currentRow++
    }
  }
  
  return { rows: normalizeColumns(rows), merges }
}

function normalizeColumns(rows: string[][]): string[][] {
  if (rows.length === 0) return rows
  
  // Encontrar el número máximo de columnas
  const maxCols = Math.max(...rows.map(row => row.length))
  
  // Normalizar todas las filas para que tengan el mismo número de columnas
  return rows.map(row => {
    const normalized = [...row]
    while (normalized.length < maxCols) {
      normalized.push('')
    }
    return normalized
  })
}

function applyFormatting(worksheet: XLSX.WorkSheet, rows: string[][]) {
  if (!worksheet['!cols']) worksheet['!cols'] = []
  
  // Ajustar ancho de columnas automáticamente
  const maxCols = rows.length > 0 ? rows[0].length : 0
  
  for (let i = 0; i < maxCols; i++) {
    const maxLength = Math.max(
      ...rows.map(row => (row[i] || '').toString().length),
      10 // Ancho mínimo
    )
    worksheet['!cols'][i] = { wch: Math.min(maxLength + 2, 50) }
  }
  
  // Aplicar formato a las celdas
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      const cell = worksheet[cellAddress]
      
      if (cell && cell.v) {
        const value = cell.v.toString().trim()
        
        // Detectar y formatear montos con €
        if (/^\d+[.,]\d+\s*€$/.test(value)) {
          const numValue = parseFloat(value.replace(/[€\s]/g, '').replace(',', '.'))
          cell.v = numValue
          cell.t = 'n'
          cell.z = '#,##0.00 "€"'
        }
        // Detectar y formatear números decimales sin símbolo
        else if (/^\d+[.,]\d+$/.test(value) && !value.includes('-')) {
          const numValue = parseFloat(value.replace(',', '.'))
          cell.v = numValue
          cell.t = 'n'
          cell.z = '#,##0.00'
        }
        // Detectar y formatear números enteros
        else if (/^\d+$/.test(value)) {
          const numValue = parseInt(value)
          if (numValue < 1900 || numValue > 2100) { // No es probablemente un año
            cell.v = numValue
            cell.t = 'n'
          }
        }
        // Detectar fechas DD/MM/YYYY
        else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          const [day, month, year] = value.split('/').map(Number)
          const date = new Date(year, month - 1, day)
          cell.v = date
          cell.t = 'd'
          cell.z = 'dd/mm/yyyy'
        }
      }
    }
  }
}
