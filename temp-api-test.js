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

async function testAPI() {
  try {
    console.log('🔍 Probando conexión a la API externa...');
    console.log('URL:', API_URL);
    console.log('---\n');

    const response = await axios.get(API_URL, {
      timeout: 10000,
      headers: API_CONFIG.headers
    });

    console.log('✅ Respuesta exitosa!');
    console.log('Status:', response.status);
    console.log('---\n');

    // Analizar estructura de datos
    console.log('📊 Análisis de estructura de datos:');
    console.log('Tipo de response.data:', typeof response.data);
    console.log('¿Es array?', Array.isArray(response.data));
    
    if (response.data && typeof response.data === 'object') {
      console.log('Claves del objeto:', Object.keys(response.data));
    }

    let actualData = response.data;
    if (Array.isArray(response.data)) {
      console.log('Longitud del array:', response.data.length);
      actualData = response.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log('Datos en response.data.data, longitud:', response.data.data.length);
      actualData = response.data.data;
    } else if (response.data && response.data.rows && Array.isArray(response.data.rows)) {
      console.log('Datos en response.data.rows, longitud:', response.data.rows.length);
      actualData = response.data.rows;
    }

    if (actualData && actualData.length > 0) {
      console.log('\n=== CAMPOS DE LA API ===');
      const fields = Object.keys(actualData[0]);
      console.log('Total de campos:', fields.length);
      fields.forEach((field, index) => {
        console.log(`${index + 1}. ${field}`);
      });
    }

  } catch (error) {
    console.error('❌ Error al conectar con la API:');
    console.error('Mensaje:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPI();
