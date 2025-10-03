// Cálculo simple y directo del total
const axios = require('axios');

const API_URL = 'https://visorestrategicobackend-gkejc4hthnace6b4.eastus2-01.azurewebsites.net/api/powerbi/obras';
const API_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'ProyectoGraficos/1.0',
  'X-API-KEY': 'pow3rb1_visor_3str4t3g1co_2025'
};

const FIELD_ACTUALIZADO = 'COSTO TOTAL ACTUALIZADO';
const FIELD_ESTIMADO = 'COSTO ESTIMADO TOTAL';

function procesarValor(valor) {
  if (valor == null || valor === '' || valor === 'undefined') return 0;
  const s = String(valor).trim();
  if (!s) return 0;
  const antesDelPunto = s.split('.')[0];
  const n = Number(antesDelPunto);
  return Number.isFinite(n) ? n : 0;
}

function calcularCostoFinal(rawActualizado, rawEstimado) {
  const costoActualizado = procesarValor(rawActualizado);
  const costoEstimado = procesarValor(rawEstimado);
  
  const esBlancoActualizado = rawActualizado == null || rawActualizado === '' || rawActualizado === 'undefined';
  const esCeroActualizado = costoActualizado === 0;
  
  return (esBlancoActualizado || esCeroActualizado) ? costoEstimado : costoActualizado;
}

async function main() {
  console.log('⏳ Descargando datos del API...');
  const res = await axios.get(API_URL, { headers: API_HEADERS, timeout: 20000 });
  let data = res.data;
  if (Array.isArray(data)) {
    // ok
  } else if (data && Array.isArray(data.data)) {
    data = data.data;
  } else if (data && Array.isArray(data.rows)) {
    data = data.rows;
  } else {
    console.log('Estructura inesperada de respuesta, abortando.');
    process.exit(2);
  }

  console.log(`📊 Total de filas: ${data.length}`);
  
  let total = 0;
  let countUsandoActualizado = 0;
  let countUsandoEstimado = 0;
  let countBlancos = 0;
  let countCeros = 0;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rawActualizado = row ? row[FIELD_ACTUALIZADO] : null;
    const rawEstimado = row ? row[FIELD_ESTIMADO] : null;
    
    const costoActualizado = procesarValor(rawActualizado);
    const costoEstimado = procesarValor(rawEstimado);
    
    const esBlancoActualizado = rawActualizado == null || rawActualizado === '' || rawActualizado === 'undefined';
    const esCeroActualizado = costoActualizado === 0;
    
    const costoFinal = (esBlancoActualizado || esCeroActualizado) ? costoEstimado : costoActualizado;
    
    total += costoFinal;
    
    if (esBlancoActualizado) countBlancos++;
    if (esCeroActualizado) countCeros++;
    if (esBlancoActualizado || esCeroActualizado) countUsandoEstimado++;
    else countUsandoActualizado++;
  }
  
  console.log('\n📈 Resumen:');
  console.log(`- Filas usando ACTUALIZADO: ${countUsandoActualizado}`);
  console.log(`- Filas usando ESTIMADO: ${countUsandoEstimado}`);
  console.log(`- Filas con actualizado en blanco: ${countBlancos}`);
  console.log(`- Filas con actualizado = 0: ${countCeros}`);
  
  console.log(`\n🔢 TOTAL: ${total.toLocaleString()}`);
  console.log(`💵 Formateado: $${total.toLocaleString('es-CO')}`);
  
  // Verificar algunas filas específicas
  console.log('\n🔍 Verificación de filas específicas:');
  const indicesVerificar = [0, 1, 2, 18, 19, 100, 200, 500, 1000];
  for (const i of indicesVerificar) {
    if (i < data.length) {
      const row = data[i];
      const rawActualizado = row ? row[FIELD_ACTUALIZADO] : null;
      const rawEstimado = row ? row[FIELD_ESTIMADO] : null;
      const costoFinal = calcularCostoFinal(rawActualizado, rawEstimado);
      const nombre = (row['NOMBRE'] || 'Sin nombre').substring(0, 40);
      console.log(`Fila ${i}: ${nombre}... -> ${costoFinal.toLocaleString()}`);
    }
  }
}

main().catch(err => {
  console.error('❌ Error:', err && err.message ? err.message : err);
  process.exit(1);
});

