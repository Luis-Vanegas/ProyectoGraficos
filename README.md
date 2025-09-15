# 🏛️ Visor de Proyectos Estratégicos - Alcaldía de Medellín

Dashboard interactivo para el seguimiento y visualización de proyectos estratégicos de obras públicas en Medellín.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Endpoints](#api-endpoints)
- [Despliegue](#despliegue)
- [Contribución](#contribución)

## ✨ Características

- 🗺️ **Mapa Interactivo**: Visualización geográfica con clustering por comunas
- 📊 **Dashboard Dinámico**: KPIs en tiempo real y gráficos interactivos
- 🎯 **Filtros Avanzados**: Por proyecto, dependencia, comuna, estado y fechas
- 📱 **Responsive Design**: Optimizado para desktop, tablet y móvil
- ⚡ **Performance**: Sistema de caché y optimizaciones de renderizado
- 🎨 **UI/UX Moderno**: Diseño corporativo de la Alcaldía de Medellín

## 🛠️ Tecnologías

### Frontend
- **React 19** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **MapLibre GL** - Mapas interactivos
- **ECharts** - Gráficos y visualizaciones
- **React Router** - Navegación SPA

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **Axios** - Cliente HTTP
- **CORS** - Cross-origin requests

## 🚀 Instalación

### Prerrequisitos
- Node.js >= 18.0.0
- npm >= 8.0.0

### Clonar el repositorio
```bash
git clone [URL_DEL_REPOSITORIO]
cd ProyectoGraficos
```

### Instalar dependencias

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd server
npm install
```

## ⚙️ Configuración

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# API Configuration
VITE_API_URL=https://tu-api-azure.azurewebsites.net/api/powerbi/obras
VITE_API_KEY=tu_api_key_aqui

# Server Configuration
PORT=3001
CACHE_DURATION=300000
API_TIMEOUT=10000
```

### Configuración del Servidor

Editar `server/config.js`:

```javascript
module.exports = {
  apiUrl: process.env.VITE_API_URL || 'https://default-api-url.com',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'ProyectoGraficos/1.0',
    'X-API-KEY': process.env.VITE_API_KEY || 'default-key'
  },
  server: {
    port: process.env.PORT || 3001,
    cacheDuration: process.env.CACHE_DURATION || 300000,
    timeout: process.env.API_TIMEOUT || 10000,
  }
};
```

## 🏃‍♂️ Uso

### Desarrollo

#### Iniciar el backend
```bash
cd server
npm run dev
```

#### Iniciar el frontend (nueva terminal)
```bash
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Producción

#### Build del frontend
```bash
npm run build
```

#### Iniciar servidor de producción
```bash
cd server
npm start
```

## 📁 Estructura del Proyecto

```
ProyectoGraficos/
├── 📂 src/                          # Código fuente frontend
│   ├── 📂 components/               # Componentes reutilizables
│   │   ├── 🗺️ MapLibreVisor.tsx     # Mapa interactivo
│   │   ├── 📊 Kpi.tsx               # Indicadores clave
│   │   ├── 🧭 Navigation.tsx        # Navegación
│   │   └── 📋 WorksTable.tsx        # Tablas de obras
│   ├── 📂 page/                     # Páginas principales
│   │   ├── 🏠 PaginaPrincipal.tsx   # Página de inicio
│   │   ├── 📈 Dashboard.tsx         # Dashboard general
│   │   └── 🎯 [Proyecto]Dashboard.tsx # Dashboards específicos
│   ├── 📂 utils/                    # Utilidades y helpers
│   │   └── 🧮 metrics.ts            # Cálculos y métricas
│   ├── ⚙️ dataConfig.ts             # Configuración de campos
│   └── 🚀 App.tsx                   # Componente principal
├── 📂 server/                       # Backend Node.js
│   ├── 🖥️ index.js                  # Servidor principal
│   ├── ⚙️ config.js                 # Configuración
│   └── 📦 package.json              # Dependencias backend
├── 📂 api/                          # Funciones serverless
│   └── 🔗 index.js                  # Handler para Vercel/Netlify
├── 📂 public/                       # Assets públicos
│   └── 🗺️ medellin_comunas_corregimientos.geojson
└── 📋 README.md                     # Esta documentación
```

## 🔌 API Endpoints

### Backend Local (http://localhost:3001)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/status` | GET | Estado de la API y cache |
| `/api/sheets` | GET | Lista de campos disponibles |
| `/api/data` | GET | Datos completos de obras |
| `/api/obras` | GET | Obras con filtros y transformaciones |
| `/api/limites` | GET | Límites geográficos (GeoJSON) |
| `/api/refresh` | POST | Forzar actualización de cache |

### Parámetros de Filtrado (`/api/obras`)

```bash
# Ejemplos de uso
GET /api/obras?estado=En%20Ejecución
GET /api/obras?dependencia=EDU&proyectoEstrategico=Escuelas%20Inteligentes
GET /api/obras?comunaCodigo=01&terminada=false
```

## 🎯 Páginas y Funcionalidades

### 🏠 Página Principal
- Menú de navegación con tarjetas interactivas
- Acceso a dashboard general y consulta específica
- 9 proyectos estratégicos individuales

### 📈 Dashboard General
- **Filtros**: Proyecto, dependencia, comuna, tipo, estado, fechas
- **KPIs**: Total obras, inversión, presupuesto ejecutado, alertas
- **Mapa**: Clustering por comuna con overlay de detalles
- **Tablas**: Vigencias, obras entregadas, alertas

### 🎯 Dashboards Específicos
Dashboards pre-filtrados por proyecto estratégico:
- ⚽ Escenarios Deportivos
- 🌱 Jardines Buen Comienzo
- 🏫 Escuelas Inteligentes
- 🎮 Recreos
- 🌸 Primavera Norte
- 👮 C5i
- 🌍 Tacita de Plata
- 🚇 Metro de La 80
- 🏥 Unidad Hospitalaria Santa Cruz

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Build
npm run build

# Subir carpeta dist/ a Netlify
```

### Variables de Entorno en Producción
Configurar en el panel de tu proveedor:
- `VITE_API_URL`
- `VITE_API_KEY`
- `PORT`
- `CACHE_DURATION`
- `API_TIMEOUT`

## 🤝 Contribución

### Flujo de Desarrollo
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Estándares de Código
- TypeScript estricto
- ESLint para linting
- Prettier para formateo
- Componentes funcionales con hooks
- CSS-in-JS para estilos

### Testing
```bash
# Ejecutar tests (cuando se implementen)
npm test

# Coverage
npm run test:coverage
```

## 📊 Métricas y KPIs

### Indicadores Calculados
- **Total de Obras**: Conteo de proyectos
- **Inversión Total**: Suma de costos actualizados
- **Presupuesto Ejecutado**: Porcentaje de ejecución financiera
- **Obras Entregadas**: Basado en estado y fechas reales
- **Alertas**: Proyectos con riesgos identificados
- **Indicador de Avance**: Fórmula compleja basada en DAX

### Fórmulas de Cálculo
El sistema implementa cálculos complejos basados en:
- 10 etapas de proyecto con pesos específicos
- Redistribución automática de pesos no aplicables
- Validación de datos y manejo de valores nulos

## 🔧 Solución de Problemas

### Problemas Comunes

#### Error de CORS
```bash
# Verificar que el servidor backend esté corriendo
cd server && npm start
```

#### Cache desactualizado
```bash
# Forzar actualización
curl -X POST http://localhost:3001/api/refresh
```

#### Problemas de build
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📄 Licencia

Este proyecto es propiedad de la Alcaldía de Medellín. Todos los derechos reservados.

## 📞 Contacto

Para soporte técnico o consultas sobre el proyecto, contactar al equipo de desarrollo de la Alcaldía de Medellín.

---

**Desarrollado con ❤️ para la Alcaldía de Medellín**