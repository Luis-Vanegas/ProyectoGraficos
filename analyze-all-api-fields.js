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

async function analyzeAllFields() {
  try {
    console.log('🔍 Analizando TODOS los campos de la API...');
    console.log('URL:', API_URL);
    console.log('---\n');
    
    const response = await axios.get(API_URL, {
      timeout: 30000, // 30 segundos para manejar más datos
      headers: API_CONFIG.headers
    });

    console.log('✅ Datos obtenidos exitosamente!');
    console.log('Status:', response.status);
    
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

    console.log(`📊 Total de registros en la API: ${actualData.length}`);
    
    // Analizar TODOS los campos únicos en todos los registros
    const allFieldsSet = new Set();
    const fieldFrequency = {};
    const fieldSampleValues = {};
    
    console.log('🔍 Analizando campos en todos los registros...');
    
    actualData.forEach((record, index) => {
      const recordFields = Object.keys(record);
      recordFields.forEach(field => {
        allFieldsSet.add(field);
        fieldFrequency[field] = (fieldFrequency[field] || 0) + 1;
        
        // Guardar una muestra del valor para cada campo
        if (!fieldSampleValues[field]) {
          fieldSampleValues[field] = record[field];
        }
      });
      
      // Mostrar progreso cada 100 registros
      if ((index + 1) % 100 === 0) {
        console.log(`  Procesados ${index + 1}/${actualData.length} registros...`);
      }
    });
    
    const allApiFields = Array.from(allFieldsSet).sort();
    console.log(`\n📊 Total de campos únicos encontrados: ${allApiFields.length}`);
    
    // Leer campos de dataConfig.ts
    const configFields = readDataConfig();
    const configFieldValues = Object.values(configFields);
    console.log(`📊 Campos en dataConfig.ts: ${configFieldValues.length}`);
    
    console.log('\n=== ANÁLISIS COMPLETO DE CAMPOS ===\n');
    
    // Mostrar todos los campos de la API con frecuencia
    console.log('📋 TODOS LOS CAMPOS DE LA API (con frecuencia de aparición):');
    allApiFields.forEach((field, index) => {
      const frequency = fieldFrequency[field];
      const percentage = ((frequency / actualData.length) * 100).toFixed(1);
      const sampleValue = fieldSampleValues[field];
      const sampleStr = sampleValue !== null && sampleValue !== undefined 
        ? ` (ej: "${String(sampleValue).substring(0, 50)}${String(sampleValue).length > 50 ? '...' : ''}")`
        : ' (null)';
      console.log(`  ${index + 1}. ${field} - ${frequency}/${actualData.length} registros (${percentage}%)${sampleStr}`);
    });
    
    // Campos en la API pero no en dataConfig.ts
    const missingInConfig = allApiFields.filter(field => !configFieldValues.includes(field));
    console.log('\n🔴 CAMPOS EN LA API PERO FALTANTES EN dataConfig.ts:');
    if (missingInConfig.length > 0) {
      missingInConfig.forEach((field, index) => {
        const frequency = fieldFrequency[field];
        const percentage = ((frequency / actualData.length) * 100).toFixed(1);
        console.log(`  ${index + 1}. ${field} - ${frequency}/${actualData.length} registros (${percentage}%)`);
      });
    } else {
      console.log('  ✅ Todos los campos de la API están en dataConfig.ts');
    }
    
    // Campos en dataConfig.ts pero no en la API
    const missingInAPI = configFieldValues.filter(field => !allApiFields.includes(field));
    console.log('\n🟡 CAMPOS EN dataConfig.ts PERO FALTANTES EN LA API:');
    if (missingInAPI.length > 0) {
      missingInAPI.forEach((field, index) => {
        console.log(`  ${index + 1}. ${field}`);
      });
    } else {
      console.log('  ✅ Todos los campos de dataConfig.ts están en la API');
    }
    
    // Campos coincidentes
    const matchingFields = allApiFields.filter(field => configFieldValues.includes(field));
    console.log(`\n✅ CAMPOS COINCIDENTES: ${matchingFields.length}`);
    
    // Resumen final
    console.log('\n=== RESUMEN FINAL ===');
    console.log(`Total registros analizados: ${actualData.length}`);
    console.log(`Total campos únicos en API: ${allApiFields.length}`);
    console.log(`Total campos en dataConfig.ts: ${configFieldValues.length}`);
    console.log(`Campos coincidentes: ${matchingFields.length}`);
    console.log(`Campos faltantes en dataConfig.ts: ${missingInConfig.length}`);
    console.log(`Campos faltantes en API: ${missingInAPI.length}`);
    
    // Generar recomendaciones detalladas
    if (missingInConfig.length > 0) {
      console.log('\n=== RECOMENDACIONES DETALLADAS ===');
      console.log('Campos que se recomienda agregar a dataConfig.ts:');
      missingInConfig.forEach((field, index) => {
        const frequency = fieldFrequency[field];
        const percentage = ((frequency / actualData.length) * 100).toFixed(1);
        const camelCaseKey = field.toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[^a-zA-Z0-9]/g, '');
        console.log(`  ${camelCaseKey}: '${field}', // ${frequency}/${actualData.length} registros (${percentage}%)`);
      });
    }

  } catch (error) {
    console.error('❌ Error al analizar campos:');
    console.error('Mensaje:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

analyzeAllFields();
