'use client'

import { useState } from 'react'
import FileUpload from '@/components/FileUpload'

export default function Home() {
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (file: File) => {
    setIsConverting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al convertir el archivo')
      }

      // Descargar el archivo Excel
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${file.name.replace('.pdf', '')}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            PDF to Excel Converter
          </h1>
          <p className="text-xl text-gray-600">
            Convierte tus archivos PDF a Excel en segundos
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <FileUpload 
            onFileUpload={handleFileUpload} 
            isConverting={isConverting} 
          />

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-center">{error}</p>
            </div>
          )}

          {isConverting && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-blue-800">Convirtiendo tu archivo...</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-gray-600">
          <h2 className="text-2xl font-semibold mb-4">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="font-semibold mb-2">1. Sube tu PDF</h3>
              <p className="text-sm">Arrastra o selecciona tu archivo PDF</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="font-semibold mb-2">2. Conversión automática</h3>
              <p className="text-sm">Procesamos y extraemos los datos</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-semibold mb-2">3. Descarga Excel</h3>
              <p className="text-sm">Obtén tu archivo Excel listo</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
