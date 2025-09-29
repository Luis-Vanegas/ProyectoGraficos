// Script simple para probar la API externa
const https = require('https');

const options = {
  hostname: 'visorestrategicobackend-gkejc4hthnace6b4.eastus2-01.azurewebsites.net',
  port: 443,
  path: '/api/powerbi/obras',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'ProyectoGraficos/1.0',
    'X-API-KEY': 'pow3rb1_visor_3str4t3g1co_2025'
  }
};

console.log('🔍 Probando API externa...');
console.log('URL:', `https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
  console.log('✅ Respuesta recibida!');
  console.log('Status:', res.statusCode);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      
      console.log('📊 Análisis de datos:');
      console.log('Tipo:', typeof jsonData);
      console.log('¿Es array?', Array.isArray(jsonData));
      
      if (Array.isArray(jsonData)) {
        console.log('Longitud:', jsonData.length);
        if (jsonData.length > 0) {
          console.log('Campos disponibles:', Object.keys(jsonData[0]));
          console.log('Total de campos:', Object.keys(jsonData[0]).length);
          console.log('\nPrimer registro:');
          console.log(JSON.stringify(jsonData[0], null, 2));
        }
      } else if (jsonData && typeof jsonData === 'object') {
        console.log('Claves del objeto:', Object.keys(jsonData));
        if (jsonData.data && Array.isArray(jsonData.data)) {
          console.log('Datos en .data, longitud:', jsonData.data.length);
          if (jsonData.data.length > 0) {
            console.log('Campos del primer registro:', Object.keys(jsonData.data[0]));
            console.log('\nPrimer registro:');
            console.log(JSON.stringify(jsonData.data[0], null, 2));
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error al parsear JSON:', error.message);
      console.log('Respuesta raw (primeros 500 chars):');
      console.log(data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error en la petición:', error.message);
});

req.end();