const axios = require('axios');

// Configuración de la API
const API_URL = 'https://visorestrategicobackend-gkejc4hthnace6b4.eastus2-01.azurewebsites.net/api/powerbi/obras';
const API_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'ProyectoGraficos/1.0',
    'X-API-KEY': 'pow3rb1_visor_3str4t3g1co_2025'
  }
};

// Cache en memoria (se resetea cada vez que se ejecuta la función)
let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para obtener datos de la API con cache
async function fetchDataFromAPI() {
  try {
    console.log('🔐 Conectando a la API...');
    
    const response = await axios.get(API_URL, {
      timeout: 10000,
      headers: API_CONFIG.headers
    });
    
    console.log(`✅ Respuesta de la API recibida. Tipo:`, typeof response.data, 'Longitud:', response.data?.length || 'N/A');
    
    // Verificar estructura de respuesta
    let actualData = response.data;
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      actualData = response.data.data;
      console.log('📊 Usando response.data.data - Longitud:', actualData.length);
    } else if (response.data && response.data.rows && Array.isArray(response.data.rows)) {
      actualData = response.data.rows;
      console.log('📊 Usando response.data.rows - Longitud:', actualData.length);
    } else if (Array.isArray(response.data)) {
      actualData = response.data;
      console.log('📊 Usando response.data directamente - Longitud:', actualData.length);
    } else {
      console.log('⚠️ Estructura de respuesta inesperada:', Object.keys(response.data || {}));
    }
    
    return actualData;
  } catch (error) {
    console.error('❌ Error al obtener datos:', error.message);
    throw error;
  }
}

// Función para obtener datos (con cache)
async function getData() {
  const now = Date.now();
  
  if (!cachedData || (now - lastFetch) > CACHE_DURATION) {
    try {
      cachedData = await fetchDataFromAPI();
      lastFetch = now;
      console.log('🔄 Cache actualizado - Datos:', cachedData?.length || 0, 'registros');
    } catch (error) {
      console.log('❌ Error al obtener datos:', error.message);
      if (cachedData) {
        console.log('⚠️ Usando cache anterior - Datos:', cachedData?.length || 0, 'registros');
        return cachedData;
      }
      throw error;
    }
  } else {
    console.log('📦 Usando cache existente - Datos:', cachedData?.length || 0, 'registros');
  }
  
  return cachedData;
}

// Exportar función principal para Vercel
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    
    // Endpoint: /api/sheets
    if (pathname === '/api/sheets' && req.method === 'GET') {
      const data = await getData();
      
      if (data.length > 0) {
        const fields = Object.keys(data[0]);
        res.json({ sheets: fields });
      } else {
        res.json({ sheets: [] });
      }
      return;
    }
    
    // Endpoint: /api/data
    if (pathname === '/api/data' && req.method === 'GET') {
      const data = await getData();
      res.json({ rows: data });
      return;
    }
    
    // Endpoint: /api/status
    if (pathname === '/api/status' && req.method === 'GET') {
      const data = await getData();
      res.json({ 
        status: 'OK',
        records: data.length,
        lastFetch: new Date(lastFetch).toISOString(),
        cacheAge: Math.round((Date.now() - lastFetch) / 1000) + 's'
      });
      return;
    }
    
    // Endpoint: /api/refresh
    if (pathname === '/api/refresh' && req.method === 'POST') {
      cachedData = null;
      lastFetch = 0;
      await getData();
      res.json({ message: 'Cache actualizado exitosamente' });
      return;
    }
    
    // Endpoint: /api/limites
    if (pathname === '/api/limites' && req.method === 'GET') {
      try {
        // Servir el archivo GeoJSON de límites de comunas
        const fs = require('fs');
        const path = require('path');
        const limitesPath = path.join(process.cwd(), 'public', 'medellin_comunas_corregimientos.geojson');
        
        if (fs.existsSync(limitesPath)) {
          const limitesData = JSON.parse(fs.readFileSync(limitesPath, 'utf8'));
          res.json(limitesData);
        } else {
          res.status(404).json({ error: 'Archivo de límites no encontrado' });
        }
      } catch (error) {
        console.error('Error al cargar límites:', error);
        res.status(500).json({ error: 'Error al cargar límites' });
      }
      return;
    }
    
    // Endpoint: /api/obras
    if (pathname === '/api/obras' && req.method === 'GET') {
      const data = await getData();
      console.log('🔍 /api/obras - Datos obtenidos:', data?.length || 0, 'registros');
      res.json(data);
      return;
    }
    
    // Endpoint no encontrado
    res.status(404).json({ error: 'Endpoint no encontrado' });
    
  } catch (error) {
    console.error('❌ Error en la función:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};
