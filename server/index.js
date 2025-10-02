const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const config = require('./config');

const app = express();
app.use(cors());

// Configuración desde archivo config.js
const API_URL = config.apiUrl;
const API_CONFIG = {
  headers: config.headers
};

// ============================================================================
// CACHE PARA LOS DATOS (se actualiza según configuración)
// ============================================================================
let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = config.server.cacheDuration;

// Función para obtener datos de la API con cache
async function fetchDataFromAPI() {
  try {
    console.log('🔐 Conectando a la API con headers de autenticación...');
    
    const response = await axios.get(API_URL, {
      timeout: config.server.timeout,
      headers: API_CONFIG.headers
    });
    
    console.log(`✅ Datos obtenidos de la API: ${response.data.length} registros`);
    console.log('🔍 Tipo de respuesta:', typeof response.data);
    console.log('🔍 ¿Es array?', Array.isArray(response.data));
    console.log('🔍 Estructura de respuesta:', Object.keys(response.data || {}));
    
    // Verificar si la respuesta tiene una estructura anidada
    let actualData = response.data;
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log('📦 Datos encontrados en response.data.data');
      actualData = response.data.data;
    } else if (response.data && response.data.rows && Array.isArray(response.data.rows)) {
      console.log('📦 Datos encontrados en response.data.rows');
      actualData = response.data.rows;
    } else if (Array.isArray(response.data)) {
      console.log('📦 Datos encontrados directamente en response.data');
      actualData = response.data;
    } else {
      console.log('⚠️ Estructura de datos inesperada:', response.data);
    }
    
    console.log(`📊 Datos finales: ${actualData.length} registros`);
    return actualData;
  } catch (error) {
    console.error('❌ Error al obtener datos de la API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      // Mensajes específicos según el error
      if (error.response.status === 401) {
        console.error('🔐 Error de autenticación: Verifica tu API key');
      } else if (error.response.status === 403) {
        console.error('🚫 Acceso denegado: Verifica permisos de tu API key');
      } else if (error.response.status === 429) {
        console.error('⏰ Demasiadas peticiones: Espera antes de reintentar');
      }
    }
    throw error;
  }
}

// Función para obtener datos (con cache)
async function getData() {
  const now = Date.now();
  
  // Si no hay cache o expiró, obtener nuevos datos
  if (!cachedData || (now - lastFetch) > CACHE_DURATION) {
    try {
      cachedData = await fetchDataFromAPI();
      lastFetch = now;
      console.log('🔄 Cache actualizado');
    } catch (error) {
      // Si falla la API pero tenemos cache anterior, usar cache
      if (cachedData) {
        console.log('⚠️ Usando cache anterior debido a error en API');
        return cachedData;
      }
      throw error;
    }
  }
  
  return cachedData;
}

// Lista de hojas (ahora campos únicos de la API)
app.get('/api/sheets', async (req, res) => {
  try {
    const data = await getData();
    
    // Obtener campos únicos de los datos
    if (data.length > 0) {
      const fields = Object.keys(data[0]);
      res.json({ sheets: fields });
    } else {
      res.json({ sheets: [] });
    }
  } catch (error) {
    console.error('Error en /api/sheets:', error);
    res.status(500).json({ error: 'Error al obtener campos de la API' });
  }
});

// Datos de la API
app.get('/api/data', async (req, res) => {
  try {
    const data = await getData();
    res.json({ rows: data });
  } catch (error) {
    console.error('Error en /api/data:', error);
    res.status(500).json({ error: 'Error al obtener datos de la API' });
  }
});

// === Nuevo: /api/limites devuelve límites desde archivo público o tu fuente ===
const fs = require('fs');
const limitesPathCandidates = [
  path.join(__dirname, '..', 'public', 'medellin_comunas_corregimientos.geojson'),
  path.join(__dirname, '..', 'public', 'comunas.geojson')
];

app.get('/api/limites', async (req, res) => {
  try {
    let found = null;
    for (const p of limitesPathCandidates) {
      if (fs.existsSync(p)) { found = p; break; }
    }
    if (!found) {
      return res.status(404).json({ error: 'Archivo de límites no encontrado en public/' });
    }
    const raw = fs.readFileSync(found, 'utf8');
    const gj = JSON.parse(raw);
    res.json(gj);
  } catch (e) {
    console.error('Error en /api/limites:', e);
    res.status(500).json({ error: 'Error al leer límites' });
  }
});

// === Nuevo: /api/obras adaptado al contrato esperado por el visor ===
// Adapta nombres de columnas existentes a { id, nombre, dependencia, direccion, estado, presupuesto, fechaEntrega, lat, lon, comunaCodigo }
app.get('/api/obras', async (req, res) => {
  try {
    const data = await getData();
    // Helper: indicador avance total (según fórmula proporcionada)
    // Mapa de columnas basado en src/dataConfig.ts
    const P = {
      planeacion: 'PORCENTAJE PLANEACIÓN (MGA)',
      estudios: 'PORCENTAJE ESTUDIOS PRELIMINARES',
      viabilizacion: 'PORCENTAJE VIABILIZACIÓN (DAP)',
      predial: 'PORCENTAJE GESTIÓN PREDIAL',
      contratacion: 'PORCENTAJE CONTRATACIÓN',
      inicio: 'PORCENTAJE INICIO',
      disenos: 'PORCENTAJE DISEÑOS',
      ejecucion: 'PORCENTAJE EJECUCIÓN OBRA',
      entrega: 'PORCENTAJE ENTREGA OBRA',
      liquidacion: 'PORCENTAJE LIQUIDACIÓN',
      presupuestoPctEjec: 'PRESUPUESTO PORCENTAJE EJECUTADO'
    };
    /**
     * Función para parsear porcentajes y determinar redistribución
     * 
     * RETORNA NULL (se redistribuye el peso):
     *   - null, undefined
     *   - Texto: "No aplica", "N/A", "NA", "" (vacío), "Sin información"
     *   - Valores no numéricos
     * 
     * RETORNA NÚMERO (0-100):
     *   - Porcentajes válidos (0%, 50%, 100%, etc.)
     */
    const parsePct = (val) => {
      // 1. Si es null o undefined → SE REDISTRIBUYE
      if (val === undefined || val === null) return null;
      
      // 2. Si es número directo → Retornar limitado entre 0-100
      if (typeof val === 'number') return Math.max(0, Math.min(100, val));
      
      // 3. Convertir a string y limpiar
      let s = String(val).trim();
      const sLower = s.toLowerCase();
      
      // 4. Casos de texto que SE REDISTRIBUYEN (retorna null)
      if (s === '') return null;  // Vacío
      if (sLower === 'n/a' || sLower === 'na') return null;  // N/A, NA
      if (sLower.includes('no aplica')) return null;  // "No aplica"
      if (sLower.includes('no aplicable')) return null;  // "No aplicable"
      if (sLower.includes('sin información') || sLower.includes('sin informacion')) return null;  // "Sin información"
      
      // 5. Intentar convertir a número
      s = s.replace('%', '').replace(/,/g, '.');
      let n = Number(s);
      
      // 6. Si no es un número válido → SE REDISTRIBUYE
      if (!Number.isFinite(n)) return null;
      
      // 7. Convertir decimales (0.5 → 50%)
      if (n > 0 && n <= 1) n *= 100;
      
      // 8. Retornar limitado entre 0-100
      return Math.max(0, Math.min(100, n));
    };
    const getPct = (r, keys) => {
      for (const k of keys) {
        const v = parsePct(r[k]);
        if (v !== null) return v;
      }
      return null;
    };
    const computeIndicador = (r) => {
      // Usar los nombres EXACTOS de la API
      const pPlaneacion = parsePct(r['PORCENTAJE PLANEACIÓN (MGA)']);
      const pEstudios   = parsePct(r['PORCENTAJE ESTUDIOS PRELIMINARES']);
      const pViabili    = parsePct(r['PORCENTAJE VIABILIZACIÓN (DAP)']);
      const pPredial    = parsePct(r['PORCENTAJE GESTIÓN PREDIAL']);
      const pLicencias  = parsePct(r['PORCENTAJE LICENCIAS (CURADURÍA)']);
      const pContra     = parsePct(r['PORCENTAJE CONTRATACIÓN']);
      const pInicio     = parsePct(r['PORCENTAJE INICIO']);
      const pDisenos    = parsePct(r['PORCENTAJE DISEÑOS']);
      let   pEjec       = parsePct(r['PORCENTAJE EJECUCIÓN OBRA']);
      if (pEjec === null) pEjec = parsePct(r['PRESUPUESTO PORCENTAJE EJECUTADO']);
      const pEnt        = parsePct(r['PORCENTAJE ENTREGA OBRA']);
      const pLiq        = parsePct(r['PORCENTAJE LIQUIDACIÓN']);

      const wPlaneacion = 2.0, wEstudios = 1.2, wViabili = 1.2, wPredial = 1.2, wLicencias = 1.2, wContra = 1.2,
            wInicio = 2.0, wDisenos = 5.0, wEjecucion = 78.0, wEntrega = 5.0, wLiq = 2.0;

      const aPlaneacion = pPlaneacion !== null;
      const aEstudios = pEstudios !== null; 
      const aViabili = pViabili !== null; 
      const aPredial = pPredial !== null; 
      const aLicencias = pLicencias !== null;
      const aContra = pContra !== null;
      const aInicio = pInicio !== null; 
      const aDisenos = pDisenos !== null; 
      const aEjec = pEjec !== null; 
      const aEnt = pEnt !== null; 
      const aLiq = pLiq !== null;

      const prepApplicable = aPlaneacion ? 1 : 0;
      const prepNAWeight = aPlaneacion ? 0 : wPlaneacion;
      const prepExtra = prepApplicable === 0 ? 0 : prepNAWeight / prepApplicable;

      const preconApplicable = (aEstudios ? 1 : 0) + (aViabili ? 1 : 0) + (aPredial ? 1 : 0) + (aLicencias ? 1 : 0) + (aContra ? 1 : 0);
      const preconNAWeight = (aEstudios ? 0 : wEstudios) + (aViabili ? 0 : wViabili) + (aPredial ? 0 : wPredial) + (aLicencias ? 0 : wLicencias) + (aContra ? 0 : wContra);
      const preconExtra = preconApplicable === 0 ? 0 : preconNAWeight / preconApplicable;

      const conApplicable = (aInicio ? 1 : 0) + (aDisenos ? 1 : 0) + (aEjec ? 1 : 0) + (aEnt ? 1 : 0);
      const conNAWeight = (aInicio ? 0 : wInicio) + (aDisenos ? 0 : wDisenos) + (aEjec ? 0 : wEjecucion) + (aEnt ? 0 : wEntrega);
      const conExtra = conApplicable === 0 ? 0 : conNAWeight / conApplicable;

      const postApplicable = aLiq ? 1 : 0;
      const postNAWeight = aLiq ? 0 : wLiq;
      const postExtra = postApplicable === 0 ? 0 : postNAWeight / postApplicable;

      const totalApplicable = prepApplicable + preconApplicable + conApplicable + postApplicable;
      const totalNAWeight = prepNAWeight + preconNAWeight + conNAWeight + postNAWeight;
      const globalExtra = totalApplicable === 0 ? 0 : totalNAWeight / totalApplicable;

      // Contribuciones ponderadas (traducción fiel del DAX)
      const cPlaneacion = aPlaneacion ? ((pPlaneacion) * (wPlaneacion + prepExtra + globalExtra)) / 100.0 : 0;
      const cEstudios   = aEstudios   ? ((pEstudios)   * (wEstudios   + preconExtra + globalExtra)) / 100.0 : 0;
      const cViabili    = aViabili    ? ((pViabili)    * (wViabili    + preconExtra + globalExtra)) / 100.0 : 0;
      const cPredial    = aPredial    ? ((pPredial)    * (wPredial    + preconExtra + globalExtra)) / 100.0 : 0;
      const cLicencias  = aLicencias  ? ((pLicencias)  * (wLicencias  + preconExtra + globalExtra)) / 100.0 : 0;
      const cContra     = aContra     ? ((pContra)     * (wContra     + preconExtra + globalExtra)) / 100.0 : 0;
      const cInicio     = aInicio     ? ((pInicio)     * (wInicio     + conExtra   + globalExtra)) / 100.0 : 0;
      const cDisen      = aDisenos    ? ((pDisenos)    * (wDisenos    + conExtra   + globalExtra)) / 100.0 : 0;
      const cEjec       = aEjec       ? ((pEjec)       * (wEjecucion  + conExtra   + globalExtra)) / 100.0 : 0;
      const cEnt        = aEnt        ? ((pEnt)        * (wEntrega    + conExtra   + globalExtra)) / 100.0 : 0;
      const cLiq        = aLiq        ? ((pLiq)        * (wLiq        + postExtra  + globalExtra)) / 100.0 : 0;

      const total = cPlaneacion + cEstudios + cViabili + cPredial + cLicencias + cContra + cInicio + cDisen + cEjec + cEnt + cLiq;
      const bounded = Math.max(0, Math.min(100, total));
      const resultado = Number.isFinite(bounded) ? Math.round(bounded * 100) / 100 : 0;
      
      // Debug para verificar el cálculo del indicador
      console.log('🔍 === CÁLCULO INDICADOR BACKEND ===');
      console.log('📊 Obra:', r['NOMBRE DEL PROYECTO'] || 'Sin nombre');
      console.log('📈 Porcentajes individuales:');
      console.log('  - Planeación:', pPlaneacion);
      console.log('  - Estudios:', pEstudios);
      console.log('  - Viabilización:', pViabili);
      console.log('  - Predial:', pPredial);
      console.log('  - Licencias:', pLicencias);
      console.log('  - Contratación:', pContra);
      console.log('  - Inicio:', pInicio);
      console.log('  - Diseños:', pDisenos);
      console.log('  - Ejecución:', pEjec);
      console.log('  - Entrega:', pEnt);
      console.log('  - Liquidación:', pLiq);
      console.log('⚖️ Contribuciones ponderadas:');
      console.log('  - Planeación:', cPlaneacion);
      console.log('  - Estudios:', cEstudios);
      console.log('  - Viabilización:', cViabili);
      console.log('  - Predial:', cPredial);
      console.log('  - Licencias:', cLicencias);
      console.log('  - Contratación:', cContra);
      console.log('  - Inicio:', cInicio);
      console.log('  - Diseños:', cDisen);
      console.log('  - Ejecución:', cEjec);
      console.log('  - Entrega:', cEnt);
      console.log('  - Liquidación:', cLiq);
      console.log('📊 Total calculado:', total);
      console.log('📊 Resultado final:', resultado);
      console.log('🔍 === FIN CÁLCULO INDICADOR ===');
      
      return resultado;
    };

    // Sanitizador simple de URL de imagen (toma el primer http/https válido)
    const sanitizeImageUrl = (val) => {
      if (val === undefined || val === null) return '';
      const raw = String(val);
      const match = raw.match(/https?:\/\/[^\s"']+/i);
      if (match) return match[0];
      return raw.startsWith('http') ? raw : '';
    };

    // Mapeo de filas con nombres EXACTOS de la API
    const mapRow = (r) => {
      
      return {
      id: String(r['ID'] ?? r['id'] ?? Math.random().toString(36).slice(2)),
      nombre: String(r['NOMBRE'] ?? r['NOMBRE DE LA OBRA'] ?? r['obra'] ?? r['nombre'] ?? ''),
      dependencia: String(r['DEPENDENCIA'] ?? r['Dependencia'] ?? r['dependencia'] ?? ''),
      direccion: String(r['DIRECCIÓN'] ?? r['Dirección'] ?? r['direccion'] ?? ''),
      estado: String(r['ESTADO DE LA OBRA'] ?? r['estado'] ?? ''),
      presupuesto: Number(r['COSTO TOTAL ACTUALIZADO'] ?? r['presupuesto'] ?? 0),
      fechaEntrega: String(r['FECHA REAL DE ENTREGA'] ?? r['fechaEntrega'] ?? ''),
      indicadorAvanceTotal: computeIndicador(r),
      imagenUrl: sanitizeImageUrl(r['URL IMAGEN'] ?? r['URL Imagen'] ?? r['Imagen'] ?? r['IMAGEN'] ?? ''),
      comunaNombre: String(r['COMUNA O CORREGIMIENTO'] ?? r['Comuna o Corregimiento'] ?? r['comuna'] ?? ''),
      proyectoEstrategico: String(r['PROYECTO ESTRATÉGICO'] ?? r['Proyecto Estratégico'] ?? r['proyectoEstrategico'] ?? ''),
      alertaPresencia: String(r['PRESENCIA DE RIESGO'] ?? r['Presencia de riesgo'] ?? r['presenciaRiesgo'] ?? ''),
      alertaDescripcion: String(r['DESCRIPCIÓN DEL RIESGO'] ?? r['Descripción del Riesgo'] ?? r['descripcionRiesgo'] ?? ''),
      lat: r['LATITUD'] != null ? Number(r['LATITUD']) : (r['lat'] != null ? Number(r['lat']) : null),
      lon: r['LONGITUD'] != null ? Number(r['LONGITUD']) : (r['lon'] != null ? Number(r['lon']) : null),
      comunaCodigo: r['COMUNA'] != null ? String(r['COMUNA']).padStart(2, '0') : (r['comunaCodigo'] != null ? String(r['comunaCodigo']).padStart(2, '0') : null),
      // Fechas para Gantt - usando los nombres exactos de dataConfig.ts
      'FECHA INICIO ESTIMADA EJECUCIÓN OBRA': String(r['FECHA INICIO ESTIMADA EJECUCIÓN OBRA'] ?? ''),
      'FECHA FIN ESTIMADA EJECUCIÓN OBRA': String(r['FECHA FIN ESTIMADA EJECUCIÓN OBRA'] ?? ''),
      'FECHA INICIO REAL EJECUCIÓN OBRA': String(r['FECHA INICIO REAL EJECUCIÓN OBRA'] ?? ''),
      'FECHA FIN REAL EJECUCIÓN OBRA': String(r['FECHA FIN REAL EJECUCIÓN OBRA'] ?? ''),
      'FECHA ESTIMADA DE ENTREGA': String(r['FECHA ESTIMADA DE ENTREGA'] ?? ''),
      'FECHA REAL DE ENTREGA': String(r['FECHA REAL DE ENTREGA'] ?? ''),
      
      // Fechas de todas las fases para el modo "phase"
      'FECHA INICIO ESTIMADA PLANEACIÓN (MGA)': String(r['FECHA INICIO ESTIMADA PLANEACIÓN (MGA)'] ?? ''),
      'FECHA FIN ESTIMADA PLANEACIÓN (MGA)': String(r['FECHA FIN ESTIMADA PLANEACIÓN (MGA)'] ?? ''),
      'FECHA INICIO REAL PLANEACIÓN (MGA)': String(r['FECHA INICIO REAL PLANEACIÓN (MGA)'] ?? ''),
      'FECHA FIN REAL PLANEACIÓN (MGA)': String(r['FECHA FIN REAL PLANEACIÓN (MGA)'] ?? ''),
      
      'FECHA INICIO ESTIMADA ESTUDIOS PRELIMINARES': String(r['FECHA INICIO ESTIMADA ESTUDIOS PRELIMINARES'] ?? ''),
      'FECHA FIN ESTIMADA ESTUDIOS PRELIMINARES': String(r['FECHA FIN ESTIMADA ESTUDIOS PRELIMINARES'] ?? ''),
      'FECHA INICIO REAL ESTUDIOS PRELIMINARES': String(r['FECHA INICIO REAL ESTUDIOS PRELIMINARES'] ?? ''),
      'FECHA FIN REAL ESTUDIOS PRELIMINARES': String(r['FECHA FIN REAL ESTUDIOS PRELIMINARES'] ?? ''),
      
      'FECHA INICIO ESTIMADA VIABILIZACIÓN (DAP)': String(r['FECHA INICIO ESTIMADA VIABILIZACIÓN (DAP)'] ?? ''),
      'FECHA FIN ESTIMADA VIABILIZACIÓN (DAP)': String(r['FECHA FIN ESTIMADA VIABILIZACIÓN (DAP)'] ?? ''),
      'FECHA INICIO REAL VIABILIZACIÓN (DAP)': String(r['FECHA INICIO REAL VIABILIZACIÓN (DAP)'] ?? ''),
      'FECHA FIN REAL VIABILIZACIÓN (DAP)': String(r['FECHA FIN REAL VIABILIZACIÓN (DAP)'] ?? ''),
      
      'FECHA INICIO ESTIMADA GESTIÓN PREDIAL': String(r['FECHA INICIO ESTIMADA GESTIÓN PREDIAL'] ?? ''),
      'FECHA FIN ESTIMADA GESTIÓN PREDIAL': String(r['FECHA FIN ESTIMADA GESTIÓN PREDIAL'] ?? ''),
      'FECHA INICIO REAL GESTIÓN PREDIAL': String(r['FECHA INICIO REAL GESTIÓN PREDIAL'] ?? ''),
      'FECHA FIN REAL GESTIÓN PREDIAL': String(r['FECHA FIN REAL GESTIÓN PREDIAL'] ?? ''),
      
      'FECHA INICIO ESTIMADA CONTRATACIÓN': String(r['FECHA INICIO ESTIMADA CONTRATACIÓN'] ?? ''),
      'FECHA FIN ESTIMADA CONTRATACIÓN': String(r['FECHA FIN ESTIMADA CONTRATACIÓN'] ?? ''),
      'FECHA INICIO REAL CONTRATACIÓN': String(r['FECHA INICIO REAL CONTRATACIÓN'] ?? ''),
      'FECHA FIN REAL CONTRATACIÓN': String(r['FECHA FIN REAL CONTRATACIÓN'] ?? ''),
      
      'FECHA INICIO ESTIMADA INICIO': String(r['FECHA INICIO ESTIMADA INICIO'] ?? ''),
      'FECHA FIN ESTIMADA INICIO': String(r['FECHA FIN ESTIMADA INICIO'] ?? ''),
      'FECHA INICIO REAL INICIO': String(r['FECHA INICIO REAL INICIO'] ?? ''),
      'FECHA FIN REAL INICIO': String(r['FECHA FIN REAL INICIO'] ?? ''),
      
      'FECHA INICIO ESTIMADA DISEÑOS': String(r['FECHA INICIO ESTIMADA DISEÑOS'] ?? ''),
      'FECHA FIN ESTIMADA DISEÑOS': String(r['FECHA FIN ESTIMADA DISEÑOS'] ?? ''),
      'FECHA INICIO REAL DISEÑOS': String(r['FECHA INICIO REAL DISEÑOS'] ?? ''),
      'FECHA FIN REAL DISEÑOS': String(r['FECHA FIN REAL DISEÑOS'] ?? ''),
      
      'FECHA INICIO ESTIMADA ENTREGA OBRA': String(r['FECHA INICIO ESTIMADA ENTREGA OBRA'] ?? ''),
      'FECHA FIN ESTIMADA ENTREGA OBRA': String(r['FECHA FIN ESTIMADA ENTREGA OBRA'] ?? ''),
      'FECHA INICIO REAL ENTREGA OBRA': String(r['FECHA INICIO REAL ENTREGA OBRA'] ?? ''),
      'FECHA FIN REAL ENTREGA OBRA': String(r['FECHA FIN REAL ENTREGA OBRA'] ?? ''),
      
      'FECHA INICIO ESTIMADA LIQUIDACIÓN': String(r['FECHA INICIO ESTIMADA LIQUIDACIÓN'] ?? ''),
      'FECHA FIN ESTIMADA LIQUIDACIÓN': String(r['FECHA FIN ESTIMADA LIQUIDACIÓN'] ?? ''),
      'FECHA INICIO REAL LIQUIDACIÓN': String(r['FECHA INICIO REAL LIQUIDACIÓN'] ?? ''),
      'FECHA FIN REAL LIQUIDACIÓN': String(r['FECHA FIN REAL LIQUIDACIÓN'] ?? ''),
      
      // También mantener los nombres camelCase para compatibilidad
      fechaInicioEstimadaEjecucionObra: String(r['FECHA INICIO ESTIMADA EJECUCIÓN OBRA'] ?? ''),
      fechaFinEstimadaEjecucionObra: String(r['FECHA FIN ESTIMADA EJECUCIÓN OBRA'] ?? ''),
      fechaInicioRealEjecucionObra: String(r['FECHA INICIO REAL EJECUCIÓN OBRA'] ?? ''),
      fechaFinRealEjecucionObra: String(r['FECHA FIN REAL EJECUCIÓN OBRA'] ?? ''),
      fechaEstimadaDeEntrega: String(r['FECHA ESTIMADA DE ENTREGA'] ?? ''),
      fechaRealDeEntrega: String(r['FECHA REAL DE ENTREGA'] ?? '')
      };
    };

    // Filtros desde query params (soporte extendido)
    const estado = req.query.estado ? String(req.query.estado).toLowerCase() : undefined;
    const dependencia = req.query.dependencia ? String(req.query.dependencia).toLowerCase() : undefined;
    const proyectoEstrategico = req.query.proyectoEstrategico ? String(req.query.proyectoEstrategico).toLowerCase() : undefined;
    const terminada = req.query.terminada ? String(req.query.terminada) === 'true' : undefined;
    const comunaCodigo = req.query.comunaCodigo ? String(req.query.comunaCodigo) : undefined;
    const comunaNombre = req.query.comunaNombre ? String(req.query.comunaNombre).toLowerCase() : undefined;
    const tipo = req.query.tipo ? String(req.query.tipo).toLowerCase() : undefined;
    const contratista = req.query.contratista ? String(req.query.contratista).toLowerCase() : undefined;
    const desde = req.query.desde ? String(req.query.desde) : undefined; // 'YYYY' o 'YYYY-MM'
    const hasta = req.query.hasta ? String(req.query.hasta) : undefined;

    // Función utilitaria para fecha
    const normFecha = (raw) => {
      const s = String(raw || '');
      if (!s) return null;
      if (/^\d{4}$/.test(s)) return s; // YYYY
      if (/^\d{4}-\d{2}$/.test(s)) return s; // YYYY-MM
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(0,7); // YYYY-MM-DD -> YYYY-MM
      const m = s.match(/\b(\d{4})\b/);
      return m ? m[1] : null;
    };

    // Filtrar sobre datos crudos para poder usar campos originales
    let filtered = data.filter((r) => {
      // Estado
      if (estado) {
        const v = String(r['ESTADO DE LA OBRA'] ?? '').toLowerCase();
        if (!v.includes(estado)) return false;
      }
      // Dependencia
      if (dependencia) {
        const v = String(r['DEPENDENCIA'] ?? '').toLowerCase();
        if (!v.includes(dependencia)) return false;
      }
      // Proyecto estratégico
      if (proyectoEstrategico) {
        const v = String(r['PROYECTO ESTRATÉGICO'] ?? '').toLowerCase();
        if (!v.includes(proyectoEstrategico)) return false;
      }
      // Tipo de intervención
      if (tipo) {
        const v = String(r['TIPO DE INTERVECIÓN'] ?? '').toLowerCase();
        if (!v.includes(tipo)) return false;
      }
      // Contratista
      if (contratista) {
        const v = String(r['CONTRATISTA OPERADOR'] ?? '').toLowerCase();
        if (!v.includes(contratista)) return false;
      }
      // Comuna por código (dos dígitos)
      if (comunaCodigo) {
        const code = r['COMUNA'] != null ? String(r['COMUNA']).padStart(2,'0') : null;
        if (code !== comunaCodigo) return false;
      }
      // Comuna por nombre
      if (comunaNombre) {
        const v = String(r['COMUNA O CORREGIMIENTO'] ?? '').toLowerCase();
        if (!v.includes(comunaNombre)) return false;
      }
      // Terminadas
      if (terminada === true) {
        const v = String(r['ESTADO DE LA OBRA'] ?? '').toLowerCase();
        if (!v.includes('termin')) return false;
      } else if (terminada === false) {
        const v = String(r['ESTADO DE LA OBRA'] ?? '').toLowerCase();
        if (v.includes('termin')) return false;
      }
      // Rango de fechas (usamos FECHA ESTIMADA DE ENTREGA si existe)
      if (desde || hasta) {
        const f = normFecha(r['FECHA ESTIMADA DE ENTREGA']);
        if (desde && f && f < desde) return false;
        if (hasta && f && f > hasta) return false;
      }
      return true;
    });

    // Mapear a contrato esperado por el visor
    let rows = filtered.map(mapRow);
    res.json(rows);
  } catch (e) {
    console.error('Error en /api/obras:', e);
    res.status(500).json({ error: 'Error al transformar obras' });
  }
});

// Endpoint para forzar actualización del cache
app.post('/api/refresh', async (req, res) => {
  try {
    cachedData = null;
    lastFetch = 0;
    await getData(); // Esto actualizará el cache
    res.json({ message: 'Cache actualizado exitosamente' });
  } catch (error) {
    console.error('Error al refrescar cache:', error);
    res.status(500).json({ error: 'Error al actualizar cache' });
  }
});

// Endpoint de estado de la API
app.get('/api/status', async (req, res) => {
  try {
    const data = await getData();
    res.json({ 
      status: 'OK',
      records: data.length,
      lastFetch: new Date(lastFetch).toISOString(),
      cacheAge: Math.round((Date.now() - lastFetch) / 1000) + 's',
      apiUrl: API_URL,
      authConfigured: Object.keys(API_CONFIG.headers).length > 2 // Más de 2 headers básicos
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message,
      lastFetch: lastFetch ? new Date(lastFetch).toISOString() : null,
      apiUrl: API_URL,
      authConfigured: Object.keys(API_CONFIG.headers).length > 2
    });
  }
});

// Endpoint para probar la conexión a la API
app.get('/api/test-connection', async (req, res) => {
  try {
    console.log('🧪 Probando conexión a la API...');
    const response = await axios.get(API_URL, {
      timeout: Math.min(config.server.timeout, 5000), // Máximo 5 segundos para test
      headers: API_CONFIG.headers
    });
    
    res.json({
      status: 'SUCCESS',
      message: 'Conexión exitosa a la API',
      statusCode: response.status,
      dataLength: response.data?.length || 0,
      headers: response.headers
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al conectar con la API',
      error: error.message,
      statusCode: error.response?.status,
      data: error.response?.data
    });
  }
});

// Endpoint simple para ver datos de la API
app.get('/api/sample-data', async (req, res) => {
  try {
    const data = await getData();
    
    // Devolver solo los primeros 3 registros con estructura completa
    const sampleData = data.slice(0, 3);
    
    res.json({
      status: 'SUCCESS',
      totalRecords: data.length,
      sampleRecords: sampleData,
      fields: data.length > 0 ? Object.keys(data[0]) : [],
      fieldCount: data.length > 0 ? Object.keys(data[0]).length : 0
    });
    
  } catch (error) {
    console.error('❌ Error en /api/sample-data:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al obtener datos de muestra',
      error: error.message
    });
  }
});

// Endpoint de debug para diagnosticar problemas
app.get('/api/debug', async (req, res) => {
  try {
    const data = await getData();
    
    // Debug: Ver qué estructura tienen los datos
    console.log('🔍 Debug - Estructura de datos recibida:');
    console.log('Tipo de data:', typeof data);
    console.log('¿Es array?', Array.isArray(data));
    console.log('Longitud:', data ? data.length : 'undefined');
    console.log('Primer elemento:', data && data[0] ? typeof data[0] : 'undefined');
    
    if (!data) {
      return res.json({
        status: 'ERROR',
        message: 'No se recibieron datos de la API',
        dataType: typeof data,
        data: data
      });
    }
    
    if (!Array.isArray(data)) {
      return res.json({
        status: 'ERROR',
        message: 'Los datos no son un array',
        dataType: typeof data,
        data: data
      });
    }
    
    if (data.length === 0) {
      return res.json({
        status: 'WARNING',
        message: 'El array de datos está vacío',
        dataLength: 0,
        sampleData: null
      });
    }
    
    // Verificar que el primer elemento sea un objeto
    const firstRecord = data[0];
    if (!firstRecord || typeof firstRecord !== 'object') {
      return res.json({
        status: 'ERROR',
        message: 'El primer elemento no es un objeto válido',
        firstElementType: typeof firstRecord,
        firstElement: firstRecord,
        dataLength: data.length
      });
    }
    
    // Analizar la estructura de los datos
    const fields = Object.keys(firstRecord);
    const fieldTypes = {};
    
    fields.forEach(field => {
      const value = firstRecord[field];
      fieldTypes[field] = {
        type: typeof value,
        value: value,
        isNull: value === null,
        isUndefined: value === undefined,
        length: value ? String(value).length : 0
      };
    });
    
    // Verificar campos críticos para los filtros
    const criticalFields = [
      'PROYECTO ESTRATÉGICO',
      'COMUNA O CORREGIMIENTO', 
      'DEPENDENCIA',
      'TIPO DE INTERVECIÓN',
      'ESTADO DE LA OBRA',
      'COSTO TOTAL ACTUALIZADO',
      'PRESUPUESTO EJECUTADO'
    ];
    
    const missingFields = criticalFields.filter(field => !fields.includes(field));
    const availableFields = criticalFields.filter(field => fields.includes(field));
    
    res.json({
      status: 'SUCCESS',
      message: 'Análisis de datos completado',
      dataLength: data.length,
      totalFields: fields.length,
      sampleRecord: firstRecord,
      fieldTypes: fieldTypes,
      criticalFields: {
        available: availableFields,
        missing: missingFields
      },
      firstFewRecords: data.slice(0, 3)
    });
    
  } catch (error) {
    console.error('❌ Error en endpoint debug:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al analizar datos',
      error: error.message,
      stack: error.stack
    });
  }
});

// (Opcional) cache-control mínimo
app.set('etag', false);

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${PORT}`);
  console.log(`📊 Conectando a: ${API_URL}`);
  console.log(`⏰ Cache configurado para ${CACHE_DURATION/1000/60} minutos`);
  console.log(`🔐 Headers configurados: ${Object.keys(API_CONFIG.headers).join(', ')}`);
  
  // Verificar si hay autenticación configurada
  const hasAuth = Object.keys(API_CONFIG.headers).some(key => 
    key.toLowerCase().includes('auth') || 
    key.toLowerCase().includes('key') || 
    key.toLowerCase().includes('token')
  );
  
  if (!hasAuth) {
    console.log(`⚠️  ADVERTENCIA: No se detectaron headers de autenticación`);
    console.log(`   Modifica API_CONFIG.headers en el código para agregar tu API key`);
  } else {
    console.log(`✅ Autenticación configurada`);
  }
});
