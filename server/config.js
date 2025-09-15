// ============================================================================
// CONFIGURACIÓN DE LA API - USANDO VARIABLES DE ENTORNO
// ============================================================================

// Cargar variables de entorno desde .env si está disponible
require('dotenv').config({ path: '../.env' });

module.exports = {
  // URL de la API externa (desde variable de entorno o valor por defecto)
  apiUrl: process.env.VITE_API_URL || 'https://visorestrategicobackend-gkejc4hthnace6b4.eastus2-01.azurewebsites.net/api/powerbi/obras',
  
  // Headers de autenticación - CONFIGURADOS VÍA VARIABLES DE ENTORNO
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'ProyectoGraficos/1.0',
    'X-API-KEY': process.env.VITE_API_KEY || 'pow3rb1_visor_3str4t3g1co_2025'
    
    // ===== OPCIONES DE AUTENTICACIÓN =====
    
    // Opción 1: Bearer Token
    // 'Authorization': 'Bearer TU_API_KEY_AQUI',
    
    // Opción 2: API Key en header personalizado
    // 'X-API-Key': 'TU_API_KEY_AQUI',
    
    // Opción 3: API Key en header estándar
    // 'api-key': 'TU_API_KEY_AQUI',
    
    // Opción 4: Otros headers que pueda necesitar tu API
    // 'X-Client-ID': 'TU_CLIENT_ID',
    // 'X-Client-Secret': 'TU_CLIENT_SECRET',
    
    // ===== EJEMPLOS COMUNES =====
    
    // Para Azure API Management:
    // 'Ocp-Apim-Subscription-Key': 'TU_SUBSCRIPTION_KEY',
    
    // Para APIs con autenticación personalizada:
    // 'X-Auth-Token': 'TU_TOKEN',
    
    // Para APIs que requieren Content-Type específico:
    // 'Content-Type': 'application/json',
  },
  
  // Configuración del servidor (usando variables de entorno)
  server: {
    port: process.env.PORT || 3001,
    cacheDuration: process.env.CACHE_DURATION || 5 * 60 * 1000, // 5 minutos por defecto
    timeout: process.env.API_TIMEOUT || 10000, // 10 segundos por defecto
    enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === 'true' || false,
  }
};
