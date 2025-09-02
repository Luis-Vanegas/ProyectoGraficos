const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const config = require('./config');

const app = express();
app.use(cors());

// Configuración desde archivo config.js
const API_URL = config.apiUrl;
const API_CONFIG = {
  headers: config.headers
};

// ============================================================================
// CACHE PARA LOS DATOS (se actualiza según configuración)
// ============================================================================
let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = config.server.cacheDuration;

// Función para obtener datos de la API con cache
async function fetchDataFromAPI() {
  try {
    console.log('🔐 Conectando a la API con headers de autenticación...');
    
    const response = await axios.get(API_URL, {
      timeout: config.server.timeout,
      headers: API_CONFIG.headers
    });
    
    console.log(`✅ Datos obtenidos de la API: ${response.data.length} registros`);
    console.log('🔍 Tipo de respuesta:', typeof response.data);
    console.log('🔍 ¿Es array?', Array.isArray(response.data));
    console.log('🔍 Estructura de respuesta:', Object.keys(response.data || {}));
    
    // Verificar si la respuesta tiene una estructura anidada
    let actualData = response.data;
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log('📦 Datos encontrados en response.data.data');
      actualData = response.data.data;
    } else if (response.data && response.data.rows && Array.isArray(response.data.rows)) {
      console.log('📦 Datos encontrados en response.data.rows');
      actualData = response.data.rows;
    } else if (Array.isArray(response.data)) {
      console.log('📦 Datos encontrados directamente en response.data');
      actualData = response.data;
    } else {
      console.log('⚠️ Estructura de datos inesperada:', response.data);
    }
    
    console.log(`📊 Datos finales: ${actualData.length} registros`);
    return actualData;
  } catch (error) {
    console.error('❌ Error al obtener datos de la API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      // Mensajes específicos según el error
      if (error.response.status === 401) {
        console.error('🔐 Error de autenticación: Verifica tu API key');
      } else if (error.response.status === 403) {
        console.error('🚫 Acceso denegado: Verifica permisos de tu API key');
      } else if (error.response.status === 429) {
        console.error('⏰ Demasiadas peticiones: Espera antes de reintentar');
      }
    }
    throw error;
  }
}

// Función para obtener datos (con cache)
async function getData() {
  const now = Date.now();
  
  // Si no hay cache o expiró, obtener nuevos datos
  if (!cachedData || (now - lastFetch) > CACHE_DURATION) {
    try {
      cachedData = await fetchDataFromAPI();
      lastFetch = now;
      console.log('🔄 Cache actualizado');
    } catch (error) {
      // Si falla la API pero tenemos cache anterior, usar cache
      if (cachedData) {
        console.log('⚠️ Usando cache anterior debido a error en API');
        return cachedData;
      }
      throw error;
    }
  }
  
  return cachedData;
}

// Lista de hojas (ahora campos únicos de la API)
app.get('/api/sheets', async (req, res) => {
  try {
    const data = await getData();
    
    // Obtener campos únicos de los datos
    if (data.length > 0) {
      const fields = Object.keys(data[0]);
      res.json({ sheets: fields });
    } else {
      res.json({ sheets: [] });
    }
  } catch (error) {
    console.error('Error en /api/sheets:', error);
    res.status(500).json({ error: 'Error al obtener campos de la API' });
  }
});

// Datos de la API
app.get('/api/data', async (req, res) => {
  try {
    const data = await getData();
    res.json({ rows: data });
  } catch (error) {
    console.error('Error en /api/data:', error);
    res.status(500).json({ error: 'Error al obtener datos de la API' });
  }
});

// Endpoint para forzar actualización del cache
app.post('/api/refresh', async (req, res) => {
  try {
    cachedData = null;
    lastFetch = 0;
    await getData(); // Esto actualizará el cache
    res.json({ message: 'Cache actualizado exitosamente' });
  } catch (error) {
    console.error('Error al refrescar cache:', error);
    res.status(500).json({ error: 'Error al actualizar cache' });
  }
});

// Endpoint de estado de la API
app.get('/api/status', async (req, res) => {
  try {
    const data = await getData();
    res.json({ 
      status: 'OK',
      records: data.length,
      lastFetch: new Date(lastFetch).toISOString(),
      cacheAge: Math.round((Date.now() - lastFetch) / 1000) + 's',
      apiUrl: API_URL,
      authConfigured: Object.keys(API_CONFIG.headers).length > 2 // Más de 2 headers básicos
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message,
      lastFetch: lastFetch ? new Date(lastFetch).toISOString() : null,
      apiUrl: API_URL,
      authConfigured: Object.keys(API_CONFIG.headers).length > 2
    });
  }
});

// Endpoint para probar la conexión a la API
app.get('/api/test-connection', async (req, res) => {
  try {
    console.log('🧪 Probando conexión a la API...');
    const response = await axios.get(API_URL, {
      timeout: Math.min(config.server.timeout, 5000), // Máximo 5 segundos para test
      headers: API_CONFIG.headers
    });
    
    res.json({
      status: 'SUCCESS',
      message: 'Conexión exitosa a la API',
      statusCode: response.status,
      dataLength: response.data?.length || 0,
      headers: response.headers
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al conectar con la API',
      error: error.message,
      statusCode: error.response?.status,
      data: error.response?.data
    });
  }
});

// Endpoint de debug para diagnosticar problemas
app.get('/api/debug', async (req, res) => {
  try {
    const data = await getData();
    
    // Debug: Ver qué estructura tienen los datos
    console.log('🔍 Debug - Estructura de datos recibida:');
    console.log('Tipo de data:', typeof data);
    console.log('¿Es array?', Array.isArray(data));
    console.log('Longitud:', data ? data.length : 'undefined');
    console.log('Primer elemento:', data && data[0] ? typeof data[0] : 'undefined');
    
    if (!data) {
      return res.json({
        status: 'ERROR',
        message: 'No se recibieron datos de la API',
        dataType: typeof data,
        data: data
      });
    }
    
    if (!Array.isArray(data)) {
      return res.json({
        status: 'ERROR',
        message: 'Los datos no son un array',
        dataType: typeof data,
        data: data
      });
    }
    
    if (data.length === 0) {
      return res.json({
        status: 'WARNING',
        message: 'El array de datos está vacío',
        dataLength: 0,
        sampleData: null
      });
    }
    
    // Verificar que el primer elemento sea un objeto
    const firstRecord = data[0];
    if (!firstRecord || typeof firstRecord !== 'object') {
      return res.json({
        status: 'ERROR',
        message: 'El primer elemento no es un objeto válido',
        firstElementType: typeof firstRecord,
        firstElement: firstRecord,
        dataLength: data.length
      });
    }
    
    // Analizar la estructura de los datos
    const fields = Object.keys(firstRecord);
    const fieldTypes = {};
    
    fields.forEach(field => {
      const value = firstRecord[field];
      fieldTypes[field] = {
        type: typeof value,
        value: value,
        isNull: value === null,
        isUndefined: value === undefined,
        length: value ? String(value).length : 0
      };
    });
    
    // Verificar campos críticos para los filtros
    const criticalFields = [
      'PROYECTO ESTRATÉGICO',
      'COMUNA O CORREGIMIENTO', 
      'DEPENDENCIA',
      'TIPO DE INTERVECIÓN',
      'ESTADO DE LA OBRA',
      'COSTO TOTAL ACTUALIZADO',
      'PRESUPUESTO EJECUTADO'
    ];
    
    const missingFields = criticalFields.filter(field => !fields.includes(field));
    const availableFields = criticalFields.filter(field => fields.includes(field));
    
    res.json({
      status: 'SUCCESS',
      message: 'Análisis de datos completado',
      dataLength: data.length,
      totalFields: fields.length,
      sampleRecord: firstRecord,
      fieldTypes: fieldTypes,
      criticalFields: {
        available: availableFields,
        missing: missingFields
      },
      firstFewRecords: data.slice(0, 3)
    });
    
  } catch (error) {
    console.error('❌ Error en endpoint debug:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al analizar datos',
      error: error.message,
      stack: error.stack
    });
  }
});

// (Opcional) cache-control mínimo
app.set('etag', false);

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${PORT}`);
  console.log(`📊 Conectando a: ${API_URL}`);
  console.log(`⏰ Cache configurado para ${CACHE_DURATION/1000/60} minutos`);
  console.log(`🔐 Headers configurados: ${Object.keys(API_CONFIG.headers).join(', ')}`);
  
  // Verificar si hay autenticación configurada
  const hasAuth = Object.keys(API_CONFIG.headers).some(key => 
    key.toLowerCase().includes('auth') || 
    key.toLowerCase().includes('key') || 
    key.toLowerCase().includes('token')
  );
  
  if (!hasAuth) {
    console.log(`⚠️  ADVERTENCIA: No se detectaron headers de autenticación`);
    console.log(`   Modifica API_CONFIG.headers en el código para agregar tu API key`);
  } else {
    console.log(`✅ Autenticación configurada`);
  }
});
