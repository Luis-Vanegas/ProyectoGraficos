// Suma limpia de "PRESUPUESTO EJECUTADO ADMINISTRACIONES ANTERIORES" desde el API
// Ejecutar: node sum-admin-anteriores.js

const axios = require('axios');

const API_URL = 'https://visorestrategicobackend-gkejc4hthnace6b4.eastus2-01.azurewebsites.net/api/powerbi/obras';
const API_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'ProyectoGraficos/1.0',
  'X-API-KEY': 'pow3rb1_visor_3str4t3g1co_2025'
};

const FIELD = 'PRESUPUESTO EJECUTADO ADMINISTRACIONES ANTERIORES';

function toNumberAdminAnterioresRaw(v) {
  if (v == null || v === undefined || v === '') return 0;
  let s = String(v).trim();
  if (!s || s === 'null' || s === 'undefined') return 0;
  s = s.replace(/\s/g, '');
  const isNegativeByParens = /^\(.*\)$/.test(s);
  if (isNegativeByParens) s = s.slice(1, -1);
  s = s.replace(/\$|cop|col|\u20a1|\u20b1|\u20b2|\u20b5|\u20a8|\u20a9|\u20aa|\u20ab|\u20ad|\u20ae|\u20af|\u20b0|\u20b3|\u20b4|\u20b6|\u20b7|\u20b8|\u20b9|\u20ba|\u20bb|\u20bc|\u20bd|\u20be/gi, '');
  s = s.replace(/[^0-9.,\-]/g, '');
  if (!/\d/.test(s)) return 0;

  if (/^\d{1,3}(\.\d{3})*,\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(,\d{3})*\.\d{1,2}$/.test(s)) {
    s = s.replace(/,/g, '');
  } else if (/^\d+\.\d+$/.test(s)) {
    if (/^\d+\.\d{3,}$/.test(s)) s = s.replace('.', '');
  } else if (/^\d+(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  } else if (/^\d+(,\d{3})+$/.test(s)) {
    s = s.replace(/,/g, '');
  } else if (/^\d+(,\d+)?$/.test(s)) {
    const parts = s.split(',');
    if (parts.length > 1) {
      const dec = parts.pop();
      s = parts.join('') + '.' + dec;
    }
  } else if (/^\d+(\.\d+)?$/.test(s)) {
    const dotCount = (s.match(/\./g) || []).length;
    if (dotCount > 1) s = s.replace(/\./g, '');
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

  const total = data.reduce((sum, row) => {
    const raw = row ? row[FIELD] : 0;
    const val = toNumberAdminAnterioresRaw(raw);
    return sum + val;
  }, 0);

  console.log('🏛️ Campo:', FIELD);
  console.log('🔢 Total entero (COP):', total);
  console.log('💵 Formateado:', formatCOP(total));
}

main().catch(err => {
  console.error('❌ Error:', err && err.message ? err.message : err);
  process.exit(1);
});




