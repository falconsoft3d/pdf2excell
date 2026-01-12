# PDF to Excel Converter

Una aplicación web moderna construida con Next.js que permite convertir archivos PDF a Excel de forma rápida y sencilla.

## 🚀 Características

- ✅ Interfaz de usuario intuitiva con drag & drop
- ✅ Conversión automática de PDF a Excel
- ✅ Descarga instantánea del archivo convertido
- ✅ Diseño responsive y moderno
- ✅ Procesamiento del lado del servidor

## 📋 Requisitos

- Node.js 18 o superior
- npm o yarn

## 🛠️ Instalación

1. Clona el repositorio:
```bash
git clone <tu-repositorio>
cd pdf2excell
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Abre tu navegador en [http://localhost:3000](http://localhost:3000)

## 📦 Tecnologías Utilizadas

- **Next.js 14** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **pdf-parse** - Extracción de datos de PDF
- **xlsx** - Generación de archivos Excel

## 🎯 Uso

1. Abre la aplicación en tu navegador
2. Arrastra y suelta un archivo PDF o haz clic para seleccionarlo
3. Espera a que se complete la conversión
4. El archivo Excel se descargará automáticamente

## 🏗️ Estructura del Proyecto

```
pdf2excell/
├── app/
│   ├── api/
│   │   └── convert/
│   │       └── route.ts       # API endpoint para conversión
│   ├── globals.css            # Estilos globales
│   ├── layout.tsx             # Layout principal
│   └── page.tsx               # Página principal
├── components/
│   └── FileUpload.tsx         # Componente de subida de archivos
├── package.json
└── README.md
```

## 📝 Notas

- Los archivos PDF complejos con gráficos o formatos especiales pueden no convertirse perfectamente
- La conversión funciona mejor con PDFs que contienen texto estructurado o tablas
- El tamaño máximo de archivo es de 10MB

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## 📄 Licencia

MIT
