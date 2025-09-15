#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script de configuración automática para el Proyecto Gráficos
 * Instala dependencias, configura variables de entorno y prepara el proyecto
 */

console.log('🏛️  Configurando Proyecto Gráficos - Alcaldía de Medellín\n');

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function step(message) {
  log(`\n📋 ${message}`, 'blue');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

// Función para ejecutar comandos
function runCommand(command, description) {
  try {
    log(`   Ejecutando: ${command}`, 'yellow');
    execSync(command, { stdio: 'inherit' });
    success(`   ${description} completado`);
  } catch (err) {
    error(`   Error en: ${description}`);
    throw err;
  }
}

// Función para crear archivo si no existe
function createFileIfNotExists(filePath, content, description) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    success(`   ${description} creado`);
  } else {
    warning(`   ${description} ya existe, omitiendo`);
  }
}

// Función para verificar Node.js
function checkNodeVersion() {
  step('Verificando versión de Node.js');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  log(`   Versión actual: ${nodeVersion}`, 'yellow');
  
  if (majorVersion < 18) {
    error('   Se requiere Node.js 18 o superior');
    process.exit(1);
  }
  
  success('   Versión de Node.js compatible');
}

// Función para instalar dependencias del frontend
function installFrontendDependencies() {
  step('Instalando dependencias del frontend');
  
  runCommand('npm install', 'Instalación de dependencias frontend');
  
  // Instalar dependencias adicionales para las mejoras
  const additionalDeps = [
    'dotenv@^16.4.5'
  ];
  
  if (additionalDeps.length > 0) {
    runCommand(`npm install ${additionalDeps.join(' ')}`, 'Instalación de dependencias adicionales');
  }
}

// Función para instalar dependencias del backend
function installBackendDependencies() {
  step('Instalando dependencias del backend');
  
  if (fs.existsSync('server/package.json')) {
    process.chdir('server');
    runCommand('npm install', 'Instalación de dependencias backend');
    process.chdir('..');
  } else {
    warning('   No se encontró server/package.json, omitiendo');
  }
}

// Función para configurar variables de entorno
function setupEnvironmentVariables() {
  step('Configurando variables de entorno');
  
  const envContent = `# ============================================================================
# VARIABLES DE ENTORNO - PROYECTO GRÁFICOS ALCALDÍA DE MEDELLÍN
# ============================================================================
# Configuración automática generada por install-setup.js

# ============================================================================
# CONFIGURACIÓN DE LA API EXTERNA
# ============================================================================
# URL de la API de PowerBI/Azure
VITE_API_URL=https://visorestrategicobackend-gkejc4hthnace6b4.eastus2-01.azurewebsites.net/api/powerbi/obras

# Clave de autenticación para la API
VITE_API_KEY=pow3rb1_visor_3str4t3g1co_2025

# ============================================================================
# CONFIGURACIÓN DEL SERVIDOR LOCAL
# ============================================================================
# Puerto del servidor backend local
PORT=3001

# Duración del cache en milisegundos (5 minutos = 300000)
CACHE_DURATION=300000

# Timeout para llamadas a la API en milisegundos (10 segundos = 10000)
API_TIMEOUT=10000

# ============================================================================
# CONFIGURACIÓN DE DESARROLLO
# ============================================================================
# Modo de desarrollo
NODE_ENV=development

# Habilitar logs detallados
ENABLE_DEBUG_LOGS=true

# ============================================================================
# CONFIGURACIÓN OPCIONAL
# ============================================================================
# URL base para producción
VITE_BASE_URL=http://localhost:5173

# Versión de la aplicación
VITE_APP_VERSION=1.0.0
`;

  createFileIfNotExists('.env', envContent, 'Archivo .env');
  createFileIfNotExists('.env.local', envContent, 'Archivo .env.local');
}

// Función para crear scripts adicionales
function createUtilityScripts() {
  step('Creando scripts de utilidad');
  
  // Script de desarrollo
  const devScript = `#!/bin/bash

# Script para iniciar el entorno de desarrollo
echo "🚀 Iniciando Proyecto Gráficos en modo desarrollo..."

# Función para manejar Ctrl+C
cleanup() {
    echo "\\n🛑 Deteniendo servidores..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT

# Iniciar backend
echo "📡 Iniciando servidor backend..."
cd server && npm run dev &
BACKEND_PID=$!
cd ..

# Esperar un momento para que el backend se inicie
sleep 3

# Iniciar frontend
echo "🌐 Iniciando servidor frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Servidores iniciados:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   Presiona Ctrl+C para detener ambos servidores"

# Esperar a que terminen los procesos
wait
`;

  createFileIfNotExists('dev.sh', devScript, 'Script de desarrollo (dev.sh)');
  
  // Hacer ejecutable el script (solo en sistemas Unix)
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync('dev.sh', '755');
      success('   Script dev.sh marcado como ejecutable');
    } catch (err) {
      warning('   No se pudo hacer ejecutable dev.sh');
    }
  }

  // Script de Windows
  const devBat = `@echo off
echo 🚀 Iniciando Proyecto Gráficos en modo desarrollo...

echo 📡 Iniciando servidor backend...
start "Backend" cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak > nul

echo 🌐 Iniciando servidor frontend...
start "Frontend" cmd /k "npm run dev"

echo ✅ Servidores iniciados:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3001
echo.
echo Presiona cualquier tecla para continuar...
pause > nul
`;

  createFileIfNotExists('dev.bat', devBat, 'Script de desarrollo para Windows (dev.bat)');
}

// Función para verificar la configuración
function verifySetup() {
  step('Verificando configuración');
  
  const requiredFiles = [
    'package.json',
    'src/App.tsx',
    'src/components/ErrorBoundary.tsx',
    'src/components/LoadingSkeleton.tsx',
    'src/hooks/useErrorHandler.ts',
    '.env'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      success(`   ✓ ${file}`);
    } else {
      error(`   ✗ ${file} no encontrado`);
      allFilesExist = false;
    }
  });
  
  if (allFilesExist) {
    success('   Todos los archivos requeridos están presentes');
  } else {
    warning('   Algunos archivos están faltando');
  }
}

// Función para mostrar instrucciones finales
function showFinalInstructions() {
  step('¡Configuración completada! 🎉');
  
  log('\n📋 Próximos pasos:\n', 'bold');
  
  log('1. Revisar y ajustar las variables de entorno:', 'blue');
  log('   nano .env  # o tu editor favorito\n');
  
  log('2. Iniciar el entorno de desarrollo:', 'blue');
  if (process.platform === 'win32') {
    log('   dev.bat    # Windows');
  } else {
    log('   ./dev.sh   # Linux/macOS');
  }
  log('   # O manualmente:');
  log('   cd server && npm run dev    # Terminal 1');
  log('   npm run dev                 # Terminal 2\n');
  
  log('3. Acceder a la aplicación:', 'blue');
  log('   Frontend: http://localhost:5173');
  log('   Backend:  http://localhost:3001\n');
  
  log('4. Comandos útiles:', 'blue');
  log('   npm run build     # Construir para producción');
  log('   npm run preview   # Vista previa de producción');
  log('   npm run lint      # Verificar código\n');
  
  log('📚 Documentación completa en README.md\n', 'green');
  
  log('🤝 ¿Necesitas ayuda?', 'yellow');
  log('   Revisa la documentación o contacta al equipo de desarrollo\n');
  
  success('¡Proyecto Gráficos configurado exitosamente! 🏛️');
}

// Función principal
async function main() {
  try {
    checkNodeVersion();
    installFrontendDependencies();
    installBackendDependencies();
    setupEnvironmentVariables();
    createUtilityScripts();
    verifySetup();
    showFinalInstructions();
  } catch (err) {
    error('\n❌ Error durante la configuración:');
    console.error(err.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };
