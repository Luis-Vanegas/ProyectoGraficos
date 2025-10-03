// Debug detallado de Inversión total para encontrar diferencias
const axios = require('axios');

const API_URL = 'https://visorestrategicobackend-gkejc4hthnace6b4.eastus2-01.azurewebsites.net/api/powerbi/obras';
const API_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'ProyectoGraficos/1.0',
  'X-API-KEY': 'pow3rb1_visor_3str4t3g1co_2025'
};

const FIELD_ACTUALIZADO = 'COSTO TOTAL ACTUALIZADO';
const FIELD_ESTIMADO = 'COSTO ESTIMADO TOTAL';

function aplicarFormula2(valor) {
  if (valor == null || valor === '' || valor === 'undefined') return 0;
  const s = String(valor).trim();
  if (!s) return 0;
  const antesDelPunto = s.split('.')[0];
  const n = Number(antesDelPunto);
  return Number.isFinite(n) ? n : 0;
}

function calcularCostoFinal(rawActualizado, rawEstimado) {
  const costoActualizado = aplicarFormula2(rawActualizado);
  const costoEstimado = aplicarFormula2(rawEstimado);
  
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
  let countConValor = 0;
  let countBlancos = 0;
  let countCeros = 0;
  let countUsandoEstimado = 0;
  let countUsandoActualizado = 0;
  
  const valoresGrandes = [];
  const ejemplos = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rawActualizado = row ? row[FIELD_ACTUALIZADO] : null;
    const rawEstimado = row ? row[FIELD_ESTIMADO] : null;
    
    const costoActualizado = aplicarFormula2(rawActualizado);
    const costoEstimado = aplicarFormula2(rawEstimado);
    
    const esBlancoActualizado = rawActualizado == null || rawActualizado === '' || rawActualizado === 'undefined';
    const esCeroActualizado = costoActualizado === 0;
    
    const costoFinal = (esBlancoActualizado || esCeroActualizado) ? costoEstimado : costoActualizado;
    
    total += costoFinal;
    
    if (costoFinal > 0) countConValor++;
    if (esBlancoActualizado) countBlancos++;
    if (esCeroActualizado) countCeros++;
    if (esBlancoActualizado || esCeroActualizado) countUsandoEstimado++;
    else countUsandoActualizado++;
    
    if (costoFinal > 1e9) {
      valoresGrandes.push({
        i,
        nombre: row['NOMBRE'] || 'Sin nombre',
        actualizado: rawActualizado,
        estimado: rawEstimado,
        costoFinal,
        usando: (esBlancoActualizado || esCeroActualizado) ? 'ESTIMADO' : 'ACTUALIZADO'
      });
    }
    
    if (i < 10) {
      ejemplos.push({
        i,
        actualizado: rawActualizado,
        estimado: rawEstimado,
        costoActualizado,
        costoEstimado,
        costoFinal,
        usando: (esBlancoActualizado || esCeroActualizado) ? 'ESTIMADO' : 'ACTUALIZADO'
      });
    }
  }

  console.log('\n📈 Estadísticas:');
  console.log(`- Filas con valor > 0: ${countConValor}`);
  console.log(`- Filas con actualizado en blanco: ${countBlancos}`);
  console.log(`- Filas con actualizado = 0: ${countCeros}`);
  console.log(`- Filas usando ESTIMADO: ${countUsandoEstimado}`);
  console.log(`- Filas usando ACTUALIZADO: ${countUsandoActualizado}`);
  
  console.log('\n🔍 Primeros 10 ejemplos:');
  ejemplos.forEach(e => {
    console.log(`Fila ${e.i}: ${e.actualizado} | ${e.estimado} -> ${e.costoFinal} (${e.usando})`);
  });
  
  console.log('\n💰 Valores más grandes (>1e9):');
  valoresGrandes.slice(0, 10).forEach(v => {
    console.log(`${v.nombre}: ${v.costoFinal.toLocaleString()} (${v.usando})`);
  });
  
  console.log(`\n🔢 Total final: ${total.toLocaleString()}`);
  console.log(`💵 Formateado: $${total.toLocaleString('es-CO')}`);
}

main().catch(err => {
  console.error('❌ Error:', err && err.message ? err.message : err);
  process.exit(1);
});

