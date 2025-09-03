// ============================================================================
// CONFIGURACIÓN DE LA API - MODIFICA AQUÍ TUS CREDENCIALES
// ============================================================================

module.exports = {
  // URL de la API externa
  apiUrl: 'https://visorestrategicobackend-gkejc4hthnace6b4.eastus2-01.azurewebsites.net/api/powerbi/obras',
  
  // Headers de autenticación - DESCOMENTA Y MODIFICA SEGÚN TU API
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'ProyectoGraficos/1.0',
    'X-API-KEY': 'pow3rb1_visor_3str4t3g1co_2025'
    
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
  
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3001,
    cacheDuration: 5 * 60 * 1000, // 5 minutos en milisegundos
    timeout: 10000, // 10 segundos para llamadas a la API
  }
};
