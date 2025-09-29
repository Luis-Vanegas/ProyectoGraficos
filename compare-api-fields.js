const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración de la API
const API_URL = 'https://visorestrategicobackend-gkejc4hthnace6b4.eastus2-01.azurewebsites.net/api/powerbi/obras';
const API_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'ProyectoGraficos/1.0',
    'X-API-KEY': 'pow3rb1_visor_3str4t3g1co_2025'
  }
};

// Leer dataConfig.ts
function readDataConfig() {
  try {
    const configPath = path.join(__dirname, 'src', 'dataConfig.ts');
    const content = fs.readFileSync(configPath, 'utf8');
    
    // Extraer los campos del objeto F
    const fieldMatches = content.match(/\s+(\w+):\s+'([^']+)'/g);
    const fields = {};
    
    if (fieldMatches) {
      fieldMatches.forEach(match => {
        const [, key, value] = match.match(/\s+(\w+):\s+'([^']+)'/);
        fields[key] = value;
      });
    }
    
    return fields;
  } catch (error) {
    console.error('❌ Error al leer dataConfig.ts:', error.message);
    return {};
  }
}

async function compareFields() {
  try {
    console.log('🔍 Obteniendo datos de la API...');
    
    const response = await axios.get(API_URL, {
      timeout: 10000,
      headers: API_CONFIG.headers
    });

    console.log('✅ Datos obtenidos exitosamente!');
    
    // Determinar estructura de datos
    let actualData = response.data;
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      actualData = response.data.data;
    } else if (response.data && response.data.rows && Array.isArray(response.data.rows)) {
      actualData = response.data.rows;
    } else if (Array.isArray(response.data)) {
      actualData = response.data;
    }

    if (!actualData || actualData.length === 0) {
      console.log('❌ No se encontraron datos en la respuesta');
      return;
    }

    // Obtener campos de la API
    const apiFields = Object.keys(actualData[0]);
    console.log(`📊 Campos de la API: ${apiFields.length}`);
    
    // Leer campos de dataConfig.ts
    const configFields = readDataConfig();
    const configFieldValues = Object.values(configFields);
    console.log(`📊 Campos en dataConfig.ts: ${configFieldValues.length}`);
    
    console.log('\n=== ANÁLISIS COMPARATIVO ===\n');
    
    // Campos en la API pero no en dataConfig.ts
    const missingInConfig = apiFields.filter(field => !configFieldValues.includes(field));
    console.log('🔴 CAMPOS EN LA API PERO FALTANTES EN dataConfig.ts:');
    if (missingInConfig.length > 0) {
      missingInConfig.forEach((field, index) => {
        console.log(`  ${index + 1}. ${field}`);
      });
    } else {
      console.log('  ✅ Todos los campos de la API están en dataConfig.ts');
    }
    
    // Campos en dataConfig.ts pero no en la API
    const missingInAPI = configFieldValues.filter(field => !apiFields.includes(field));
    console.log('\n🟡 CAMPOS EN dataConfig.ts PERO FALTANTES EN LA API:');
    if (missingInAPI.length > 0) {
      missingInAPI.forEach((field, index) => {
        console.log(`  ${index + 1}. ${field}`);
      });
    } else {
      console.log('  ✅ Todos los campos de dataConfig.ts están en la API');
    }
    
    // Campos coincidentes
    const matchingFields = apiFields.filter(field => configFieldValues.includes(field));
    console.log(`\n✅ CAMPOS COINCIDENTES: ${matchingFields.length}`);
    
    // Resumen
    console.log('\n=== RESUMEN ===');
    console.log(`Total campos API: ${apiFields.length}`);
    console.log(`Total campos dataConfig.ts: ${configFieldValues.length}`);
    console.log(`Campos coincidentes: ${matchingFields.length}`);
    console.log(`Campos faltantes en dataConfig.ts: ${missingInConfig.length}`);
    console.log(`Campos faltantes en API: ${missingInAPI.length}`);
    
    // Generar recomendaciones
    if (missingInConfig.length > 0) {
      console.log('\n=== RECOMENDACIONES ===');
      console.log('Se recomienda agregar los siguientes campos a dataConfig.ts:');
      missingInConfig.forEach((field, index) => {
        const camelCaseKey = field.toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[^a-zA-Z0-9]/g, '');
        console.log(`  ${camelCaseKey}: '${field}',`);
      });
    }

  } catch (error) {
    console.error('❌ Error al comparar campos:');
    console.error('Mensaje:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

compareFields();
