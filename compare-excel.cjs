// Comparación detallada fila por fila para encontrar diferencias con Excel
const axios = require('axios');

const API_URL = 'https://visorestrategicobackend-gkejc4hthnace6b4.eastus2-01.azurewebsites.net/api/powerbi/obras';
const API_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'ProyectoGraficos/1.0',
  'X-API-KEY': 'pow3rb1_visor_3str4t3g1co_2025'
};

const FIELD_ACTUALIZADO = 'COSTO TOTAL ACTUALIZADO';
const FIELD_ESTIMADO = 'COSTO ESTIMADO TOTAL';

// Fórmula exacta: =(SI(ESBLANCO([@Columna7]);0;TEXTOANTES([@Columna7];".";;;;[@Columna7])))*1
function aplicarFormula2(valor) {
  if (valor == null || valor === '' || valor === 'undefined') return 0;
  const s = String(valor).trim();
  if (!s) return 0;
  const antesDelPunto = s.split('.')[0];
  const n = Number(antesDelPunto);
  return Number.isFinite(n) ? n : 0;
}

// Fórmula exacta: =SI(O(ESBLANCO([@[COSTO TOTAL ACTUALIZADO]]);[@[COSTO TOTAL ACTUALIZADO]]=0);[@[COSTO ESTIMADO TOTAL]];[@[COSTO TOTAL ACTUALIZADO]])
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
  console.log('\n🔍 PRIMERAS 20 FILAS DETALLADAS:');
  console.log('Fila | Nombre | Actualizado_Raw | Estimado_Raw | Actualizado_Proc | Estimado_Proc | Final | Usando');
  console.log('-----|--------|-----------------|--------------|------------------|---------------|-------|--------');
  
  let total = 0;
  
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    const rawActualizado = row ? row[FIELD_ACTUALIZADO] : null;
    const rawEstimado = row ? row[FIELD_ESTIMADO] : null;
    
    const costoActualizado = aplicarFormula2(rawActualizado);
    const costoEstimado = aplicarFormula2(rawEstimado);
    
    const esBlancoActualizado = rawActualizado == null || rawActualizado === '' || rawActualizado === 'undefined';
    const esCeroActualizado = costoActualizado === 0;
    
    const costoFinal = (esBlancoActualizado || esCeroActualizado) ? costoEstimado : costoActualizado;
    const usando = (esBlancoActualizado || esCeroActualizado) ? 'ESTIMADO' : 'ACTUALIZADO';
    
    const nombre = (row['NOMBRE'] || 'Sin nombre').substring(0, 30);
    
    console.log(`${i.toString().padStart(4)} | ${nombre.padEnd(30)} | ${String(rawActualizado || '').padEnd(15)} | ${String(rawEstimado || '').padEnd(12)} | ${costoActualizado.toString().padEnd(16)} | ${costoEstimado.toString().padEnd(13)} | ${costoFinal.toString().padEnd(5)} | ${usando}`);
    
    total += costoFinal;
  }
  
  // Calcular total completo
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rawActualizado = row ? row[FIELD_ACTUALIZADO] : null;
    const rawEstimado = row ? row[FIELD_ESTIMADO] : null;
    const costoFinal = calcularCostoFinal(rawActualizado, rawEstimado);
    total += costoFinal;
  }
  
  console.log(`\n🔢 TOTAL COMPLETO: ${total.toLocaleString()}`);
  console.log(`💵 Formateado: $${total.toLocaleString('es-CO')}`);
  
  // Mostrar algunas filas con valores grandes para verificar
  console.log('\n💰 FILAS CON VALORES GRANDES (>10e9):');
  const grandes = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rawActualizado = row ? row[FIELD_ACTUALIZADO] : null;
    const rawEstimado = row ? row[FIELD_ESTIMADO] : null;
    const costoFinal = calcularCostoFinal(rawActualizado, rawEstimado);
    
    if (costoFinal > 10e9) {
      grandes.push({
        i,
        nombre: row['NOMBRE'] || 'Sin nombre',
        actualizado: rawActualizado,
        estimado: rawEstimado,
        costoFinal
      });
    }
  }
  
  grandes.slice(0, 10).forEach(g => {
    console.log(`Fila ${g.i}: ${g.nombre.substring(0, 50)}... -> ${g.costoFinal.toLocaleString()}`);
  });
}

main().catch(err => {
  console.error('❌ Error:', err && err.message ? err.message : err);
  process.exit(1);
});

