// Suma limpia de "PRESUPUESTO EJECUTADO ADMINISTRACIONES ANTERIORES" desde el API (CommonJS)
// Ejecutar: node sum-admin-anteriores.cjs

const axios = require('axios');

const API_URL = 'https://visorestrategicobackend-gkejc4hthnace6b4.eastus2-01.azurewebsites.net/api/powerbi/obras';
const API_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'ProyectoGraficos/1.0',
  'X-API-KEY': 'pow3rb1_visor_3str4t3g1co_2025'
};

const FIELD = 'PRESUPUESTO EJECUTADO ADMINISTRACIONES ANTERIORES';
const FIELD_2024_2027 = 'PRESUPUESTO EJECUTADO ADMINISTRACIÓN 2024 - 2027';

function toNumberAdminAnterioresRaw(v) {
  if (v == null || v === undefined || v === '') return 0;
  let s = String(v).trim();
  if (!s || s === 'null' || s === 'undefined') return 0;
  s = s.replace(/\s/g, '');
  const isNegativeByParens = /^\(.*\)$/.test(s);
  if (isNegativeByParens) s = s.slice(1, -1);
  s = s.replace(/\$|cop|col/gi, '');
  // Excel: reemplazar todos los puntos por comas
  s = s.replace(/\./g, ',');
  // Mantener solo dígitos, comas y signo
  s = s.replace(/[^0-9,\-]/g, '');
  if (!/\d/.test(s)) return 0;
  const commaCount = (s.match(/,/g) || []).length;
  if (commaCount > 1) {
    const last = s.lastIndexOf(',');
    const integerPart = s.slice(0, last).replace(/,/g, '');
    const decimalPart = s.slice(last + 1);
    s = integerPart + '.' + decimalPart;
  } else if (commaCount === 1) {
    s = s.replace(',', '.');
  }
  let n = Number(s);
  if (!Number.isFinite(n)) n = 0;
  if (isNegativeByParens) n = -n;
  return Math.round(n);
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

  // Deduplicar por 'id' si existe
  const seen = new Set();
  const rows = [];
  for (const r of data) {
    const key = r && r.id != null ? String(r.id) : null;
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    rows.push(r);
  }

  const values = rows.map(row => toNumberAdminAnterioresRaw(row ? row[FIELD] : 0));
  const total = values.reduce((a, b) => a + b, 0);
  // También calcular 2024-2027 con misma lógica
  const values2024 = rows.map(row => toNumberAdminAnterioresRaw(row ? row[FIELD_2024_2027] : 0));
  const total2024 = values2024.reduce((a, b) => a + b, 0);
  const count = rows.length;
  const nonZero = values.filter(v => v !== 0).length;
  const maxVal = Math.max(...values);
  const suspicious = values
    .map((v, i) => ({ v, i }))
    .filter(x => x.v >= 1e13)
    .slice(0, 10);

  console.log('🏛️ Campo:', FIELD);
  console.log('📦 Filas originales:', data.length, '| Filas tras dedupe:', count, '| No-cero:', nonZero);
  console.log('🔢 Total entero (COP):', total);
  console.log('📈 Máximo individual:', maxVal, '=>', formatCOP(maxVal));
  if (suspicious.length) {
    console.log('⚠️ Valores sospechosamente grandes (top 10 >= 1e13):', suspicious);
  }
  console.log('💵 Formateado:', formatCOP(total));

  console.log('\n— — —');
  console.log('🏛️ Campo:', FIELD_2024_2027);
  console.log('🔢 Total entero (COP):', total2024);
  console.log('💵 Formateado:', formatCOP(total2024));
}

main().catch(err => {
  console.error('❌ Error:', err && err.message ? err.message : err);
  process.exit(1);
});


