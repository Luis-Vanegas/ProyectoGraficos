# 🚀 GUÍA DE DEPLOYMENT - PROYECTO GRÁFICOS

## 📋 **REQUISITOS PREVIOS**

- Node.js 18+ instalado
- npm o yarn
- Cuenta en plataforma de hosting (Vercel, Netlify, Firebase, etc.)

## 🏗️ **PASOS PARA DEPLOYMENT**

### **1. PREPARAR EL PROYECTO**

```bash
# Instalar dependencias
npm install

# Crear build de producción
npm run build
```

### **2. OPCIONES DE HOSTING**

#### **A) VERCEL (RECOMENDADO)**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### **B) NETLIFY**
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### **C) FIREBASE**
```bash
# Instalar Firebase CLI
npm i -g firebase-tools

# Login y deploy
firebase login
firebase init hosting
firebase deploy
```

### **3. CONFIGURAR BACKEND**

#### **Opción A: Vercel Functions**
- Crear carpeta `api/` en la raíz
- Mover `server/index.js` a `api/index.js`
- Configurar `vercel.json`

#### **Opción B: Servidor independiente**
```bash
cd server
npm install
npm run prod
```

#### **Opción C: Railway/Render**
- Conectar repositorio Git
- Configurar variables de entorno
- Deploy automático

## 🔧 **CONFIGURACIÓN DE PRODUCCIÓN**

### **Variables de Entorno**
```bash
# Backend
NODE_ENV=production
PORT=3001
API_URL=https://tu-api.com
API_KEY=tu_api_key

# Frontend
VITE_API_BASE_URL=https://tu-backend.com
```

### **CORS y Seguridad**
- Configurar dominios permitidos
- Implementar rate limiting
- Configurar headers de seguridad

## 📊 **MONITOREO Y MANTENIMIENTO**

### **Logs**
```bash
# PM2 logs
pm2 logs proyecto-graficos-api

# Vercel logs
vercel logs
```

### **Métricas**
- Uptime monitoring
- Performance monitoring
- Error tracking

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **Error 404 en rutas**
- Verificar configuración de SPA routing
- Revisar archivos de configuración de hosting

### **Error de CORS**
- Verificar configuración del backend
- Revisar dominios permitidos

### **Error de API**
- Verificar variables de entorno
- Revisar logs del backend
- Comprobar conectividad de red

## 📞 **SOPORTE**

- Revisar logs de la aplicación
- Verificar configuración de hosting
- Consultar documentación de la plataforma
