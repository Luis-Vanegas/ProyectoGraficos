// Calcular "Inversión total" con las fórmulas exactas de Excel
// Ejecutar: node sum-inversion-total.cjs

const axios = require('axios');

const API_URL = 'https://visorestrategicobackend-gkejc4hthnace6b4.eastus2-01.azurewebsites.net/api/powerbi/obras';
const API_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'ProyectoGraficos/1.0',
  'X-API-KEY': 'pow3rb1_visor_3str4t3g1co_2025'
};

const FIELD_ACTUALIZADO = 'COSTO TOTAL ACTUALIZADO';
const FIELD_ESTIMADO = 'COSTO ESTIMADO TOTAL';

// Replicar fórmula 2: =(SI(ESBLANCO([@Columna7]);0;TEXTOANTES([@Columna7];".";;;;[@Columna7])))*1
function aplicarFormula2(valor) {
  if (valor == null || valor === '' || valor === 'undefined') return 0;
  const s = String(valor).trim();
  if (!s) return 0;
  
  // TEXTOANTES([@Columna7];".";;;;[@Columna7]) - tomar todo antes del primer punto
  const antesDelPunto = s.split('.')[0];
  // *1 - convertir a número
  const n = Number(antesDelPunto);
  return Number.isFinite(n) ? n : 0;
}

// Replicar fórmula 1: =SI(O(ESBLANCO([@[COSTO TOTAL ACTUALIZADO]]);[@[COSTO TOTAL ACTUALIZADO]]=0);[@[COSTO ESTIMADO TOTAL]];[@[COSTO TOTAL ACTUALIZADO]])
function calcularCostoFinal(rawActualizado, rawEstimado) {
  const costoActualizado = aplicarFormula2(rawActualizado);
  const costoEstimado = aplicarFormula2(rawEstimado);
  
  const esBlancoActualizado = rawActualizado == null || rawActualizado === '' || rawActualizado === 'undefined';
  const esCeroActualizado = costoActualizado === 0;
  
  return (esBlancoActualizado || esCeroActualizado) ? costoEstimado : costoActualizado;
}

function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
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
    console.log(Object.keys(data || {}));
    process.exit(2);
  }

  const total = data.reduce((sum, row) => {
    const rawActualizado = row ? row[FIELD_ACTUALIZADO] : null;
    const rawEstimado = row ? row[FIELD_ESTIMADO] : null;
    const costoFinal = calcularCostoFinal(rawActualizado, rawEstimado);
    return sum + costoFinal;
  }, 0);

  console.log('💰 Campo: Inversión total (COSTO TOTAL ACTUALIZADO vs ESTIMADO)');
  console.log('🔢 Total entero (COP):', total);
  console.log('💵 Formateado:', formatCOP(total));
}

main().catch(err => {
  console.error('❌ Error:', err && err.message ? err.message : err);
  process.exit(1);
});

