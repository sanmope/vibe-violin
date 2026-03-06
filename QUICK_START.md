# Quick Start Guide

## Project Setup Complete! 🎉

Tu aplicación **Vibe - Violin Sheet Music Reader** está lista. Aquí está todo lo que se ha implementado:

## ✅ Lo que está listo

### Fase 1 - Prototipo Frontend Funcional

1. **Estructura del Proyecto**
   - Configuración completa de Vite + React + TypeScript
   - Arquitectura modular y extensible
   - Sistema de tipos TypeScript completo

2. **Componentes Principales**
   - **Fingerboard**: Visualización interactiva del diapasón del violín
   - **BowVisualizer**: Indicador de técnica y posición del arco
   - **PlaybackControls**: Controles de reproducción con ajuste de tempo
   - **PracticePage**: Interfaz principal que integra todos los componentes

3. **Páginas**
   - HomePage: Página de bienvenida
   - LibraryPage: Biblioteca de partituras
   - PracticePage: Interfaz de práctica completa
   - UploadPage: Subida de partituras (simulada)

4. **Servicios de Datos**
   - MockSheetMusicService: Servicio con datos simulados
   - MockSessionService: Gestión de sesiones de práctica
   - ServiceFactory: Patrón Factory para cambiar entre mock y API real

5. **Datos de Ejemplo**
   - "Twinkle Twinkle Little Star" con digitación completa
   - "Ode to Joy" de Beethoven
   - Ejercicios de escalas

6. **Documentación**
   - README.md completo con instrucciones
   - ARCHITECTURE.md con diseño detallado

## 🚀 Instalación

### Opción 1: Instalación Automática

```bash
cd frontend
npm install
npm run dev
```

### Opción 2: Instalación Manual (si hay problemas con npm)

Si encuentras el error "Class extends value undefined is not a constructor or null", prueba:

```bash
# 1. Actualiza npm a la última versión
npm install -g npm@latest

# 2. Limpia la caché de npm
npm cache clean --force

# 3. Elimina node_modules si existe
rm -rf frontend/node_modules

# 4. Instala las dependencias
cd frontend
npm install

# 5. Inicia el servidor de desarrollo
npm run dev
```

### Opción 3: Usar pnpm o yarn

Si npm continúa dando problemas, prueba con un gestor de paquetes alternativo:

```bash
# Con pnpm
cd frontend
npm install -g pnpm
pnpm install
pnpm run dev

# Con yarn
cd frontend
npm install -g yarn
yarn install
yarn dev
```

## 📱 Uso de la Aplicación

Una vez que el servidor esté corriendo (normalmente en `http://localhost:5173`):

1. **Página de Inicio**: Verás la bienvenida con descripción de funciones
2. **Ir a Library**: Click en "Browse Library"
3. **Seleccionar una Pieza**: Elige "Twinkle Twinkle Little Star" o "Ode to Joy"
4. **Practicar**:
   - Verás el **diapasón** mostrando dónde colocar los dedos
   - El **visualizador de arco** indica dirección y técnica
   - Usa los **controles de reproducción** para avanzar nota por nota
   - Ajusta el **tempo** con el slider (40-240 BPM)

## 🎻 Características Principales

### Fingerboard (Diapasón)
- Muestra las 4 cuerdas (G, D, A, E)
- Posiciones de dedos 0-4 (0 = cuerda al aire)
- Highlighting de la nota actual
- Indicador de posición (1ra, 2da, 3ra, etc.)

### Bow Visualizer (Visualizador de Arco)
- Dirección del arco (arriba/abajo)
- Porción del arco (talón, medio, punta)
- Técnica (détaché, legato, staccato, etc.)
- Indicador de presión

### Playback Controls
- Play/Pause
- Avanzar/Retroceder nota por nota
- Barra de progreso
- Control de tempo ajustable

## 📂 Estructura del Proyecto

```
vibe/
├── frontend/                    # Aplicación React
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   │   ├── violin/         # Fingerboard, BowVisualizer
│   │   │   ├── playback/       # PlaybackControls
│   │   │   └── pages/          # HomePage, PracticePage, etc.
│   │   ├── services/           # Capa de servicios
│   │   │   ├── mock/           # Datos simulados (Fase 1)
│   │   │   └── ServiceFactory.ts
│   │   ├── hooks/              # usePlayback, etc.
│   │   ├── types/              # Definiciones TypeScript
│   │   └── styles/             # Estilos globales
│   ├── package.json
│   └── vite.config.ts
├── backend/                     # Django (Fase 2 - futuro)
├── docs/                        # Documentación adicional
├── README.md                    # Documentación principal
├── ARCHITECTURE.md              # Arquitectura detallada
└── QUICK_START.md              # Este archivo
```

## 🔧 Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Construye para producción
npm run preview      # Preview del build de producción

# Calidad de Código
npm run lint         # Ejecuta ESLint

# Tests
npm run test         # Ejecuta tests (cuando se agreguen)
```

## 🎯 Próximos Pasos

### Para Desarrollar Más (Fase 1)
- Agregar más piezas musicales a `mockData.ts`
- Mejorar la visualización de partituras (integrar VexFlow)
- Agregar reproducci
ón de audio MIDI (integrar Tone.js)
- Implementar guardado de sesiones en localStorage

### Para Fase 2 (Backend)
1. Configurar Django y PostgreSQL
2. Crear modelos de base de datos
3. Implementar endpoints REST
4. Integrar music21 para procesamiento de PDFs
5. Cambiar ServiceFactory a modo API

## 🐛 Troubleshooting

### El servidor no inicia
```bash
# Verifica que estás en el directorio correcto
cd frontend

# Verifica que las dependencias estén instaladas
ls node_modules  # Debe mostrar paquetes

# Verifica el puerto
# Si el puerto 5173 está ocupado, Vite usará otro automáticamente
```

### Errores de TypeScript
```bash
# Limpia y reconstruye
rm -rf dist
npm run build
```

### Problemas de renderizado
- Abre las herramientas de desarrollo (F12)
- Revisa la consola para errores
- Verifica que todos los componentes se importen correctamente

## 📚 Recursos Adicionales

- **README.md**: Documentación completa del proyecto
- **ARCHITECTURE.md**: Diseño arquitectónico detallado
- **Código fuente**: Todos los archivos están documentados con comentarios

## 💡 Tips de Desarrollo

1. **Hot Reload**: Vite recarga automáticamente al guardar cambios
2. **TypeScript**: Aprovecha el autocompletado del IDE
3. **Components**: Cada componente tiene su propio CSS
4. **Mock Data**: Modifica `mockData.ts` para agregar nuevas piezas
5. **Service Factory**: Cambiar entre mock y API es tan simple como cambiar el modo

## 🎉 ¡Disfruta Practicando!

Tu aplicación está lista para usar. El prototipo frontend está completamente funcional con datos simulados que demuestran todas las capacidades de la aplicación.

Para cualquier pregunta, consulta:
- README.md para documentación general
- ARCHITECTURE.md para detalles técnicos
- Los comentarios en el código fuente

**¡Feliz práctica de violín! 🎻**
