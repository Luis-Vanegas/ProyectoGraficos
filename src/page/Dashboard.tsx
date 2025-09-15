import { useEffect, useMemo, useState } from 'react';

import { F } from '../dataConfig';
// import type * as GeoJSON from 'geojson';
import {
  applyFilters,
  kpis,
  buildTwoSeriesDataset,
  getFilterOptions,
  cleanDependentFilters,
  type Row,
  type Filters,
  computeVigencias
} from '../utils/utils/metrics';

import Kpi from '../components/Kpi';
import ComboBars from '../components/comboBars';
import SimpleBarChart from '../components/SimpleBarChart';
import WorksTable from '../components/WorksTable';
import AlertsTable from '../components/AlertsTable';
import Navigation from '../components/Navigation';
import MapLibreVisor from '../components/MapLibreVisor';
import VigenciasTable from '../components/VigenciasTable';
import HeaderIcons from '../components/HeaderIcons';
// import Chatbot from '../components/Chatbot';
// import ChatbotLearningPanel from '../components/ChatbotLearningPanel';

// ============================================================================
// PALETA DE COLORES CORPORATIVOS - ALCALDÍA DE MEDELLÍN
// ============================================================================
const CORPORATE_COLORS = {
  primary: '#79BC99',      // Verde principal - usado para elementos destacados
  secondary: '#4E8484',    // Verde azulado - usado para elementos secundarios
  accent: '#3B8686',       // Verde oscuro - usado para acentos y textos importantes
  white: '#FFFFFF',        // Blanco puro - usado para fondos y textos claros
  lightGray: '#F8F9FA',    // Gris claro - usado para fondos secundarios
  darkGray: '#2C3E50',     // Gris oscuro - usado para textos principales
  mediumGray: '#6C757D',   // Gris medio - usado para textos secundarios
  border: '#E9ECEF'        // Gris borde - usado para separadores y bordes
};

// ============================================================================
// UTILIDAD: CONVERTIR HSL A HEX PARA GENERAR COLORES DISTINTOS ILIMITADOS
// ============================================================================
const hslToHex = (h: number, s: number, l: number): string => {
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const lig = Math.max(0, Math.min(100, l)) / 100;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lig - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// 

// 

// ============================================================================
// COMPONENTE PRINCIPAL DEL DASHBOARD
// ============================================================================
type UIFilters = Filters & {
  desdeDia?: string;
  desdeMes?: string;
  desdeAnio?: string;
  hastaDia?: string;
  hastaMes?: string;
  hastaAnio?: string;
};

const Dashboard = () => {
  // ============================================================================
  // ESTADOS Y VARIABLES
  // ============================================================================
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('Cargando...');
  const [filters, setFilters] = useState<UIFilters>({});
  const [isMobileStack, setIsMobileStack] = useState(false);
  // const [showLearningPanel, setShowLearningPanel] = useState(false);
  // Estado no utilizado en esta vista (selección se maneja en MapLibre)
  // const [selectedComuna] = useState<string | null>(null);
  // const [comunasGeo, setComunasGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  // Eliminado: referencia a Leaflet


  // ============================================================================
  // EFECTOS Y CARGA DE DATOS
  // ============================================================================
  useEffect(() => {
    (async () => {
      try {
        const sres = await fetch('/api/sheets');
        const { sheets } = await sres.json();
        const hoja = sheets.includes('Obras') ? 'Obras' : sheets[0];
        const dres = await fetch(`/api/data?sheet=${encodeURIComponent(hoja)}`);
        const { rows } = await dres.json();
        setRows(rows);
        setStatus(`${rows.length} filas cargadas exitosamente`);
      } catch (e) {
        console.error('Error al cargar datos:', e);
        setStatus('Error: No se pudieron cargar los datos');
      }
    })();
  }, []);

  // Detecta móvil para forzar KPIs en columna
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 480px)');
    const apply = () => setIsMobileStack(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // (El visor de MapLibre maneja la carga de límites de comunas)

  // ============================================================================
  // CÁLCULOS Y FILTRADO DE DATOS
  // ============================================================================
  
  // Función para combinar los campos de fecha en formato YYYY-MM-DD
  const combineDateFields = (filters: UIFilters): Filters => {
    const newFilters: UIFilters = { ...filters };
    
    // Combinar fecha desde
    if (filters.desdeDia && filters.desdeMes && filters.desdeAnio) {
      newFilters.desde = `${filters.desdeAnio}-${filters.desdeMes}-${filters.desdeDia}`;
    }
    
    // Combinar fecha hasta
    if (filters.hastaDia && filters.hastaMes && filters.hastaAnio) {
      newFilters.hasta = `${filters.hastaAnio}-${filters.hastaMes}-${filters.hastaDia}`;
    }
    
    return newFilters;
  };

  const opciones = useMemo(() => getFilterOptions(rows, filters), [rows, filters]);
  const combinedFilters = useMemo(() => combineDateFields(filters), [filters]);
  const filtered = useMemo(() => applyFilters(rows, combinedFilters), [rows, combinedFilters]);
  const k = useMemo(() => kpis(filtered), [filtered]);
  const vigencias = useMemo(() => {
    const rows = computeVigencias(filtered);
    const only = rows.filter(r => r.year >= 2024 && r.year <= 2027);
    return only.sort((a, b) => a.year - b.year);
  }, [filtered]);

  // Dataset para el gráfico "Inversión total vs Presupuesto ejecutado"
  const comboDataset = useMemo(() => {
    if (!F.costoTotalActualizado || !F.presupuestoEjecutado) return [];
    // Dataset por nombre de la obra
    return buildTwoSeriesDataset(
      filtered,
      F.nombre,
      F.costoTotalActualizado,
      F.presupuestoEjecutado,
      15
    );
  }, [filtered]);

  // Datos para el nuevo gráfico SimpleBarChart
  const simpleChartData = useMemo(() => {
    if (!comboDataset || comboDataset.length <= 1) return [];
    
    // Convertir el dataset de ECharts al formato del nuevo componente
    return comboDataset.slice(1).map((row: (string | number)[]) => {
      const [label, value1, value2] = row;
      return {
        label: String(label).substring(0, 20) + (String(label).length > 20 ? '...' : ''), // Truncar etiquetas largas
        value1: Number(value1) || 0,
        value2: Number(value2) || 0,
        color1: '#2E8B57', // Verde esmeralda para Inversión Total
        color2: '#FF6B35'  // Naranja coral para Presupuesto Ejecutado
      };
    });
  }, [comboDataset]);

  // ============================================================================
  // CLASIFICACIÓN DE OBRAS
  // ============================================================================
  const entregadas = useMemo(() => {
    return filtered.filter(r => {
      const est = F.estadoDeLaObra ? String(r[F.estadoDeLaObra] ?? '').toLowerCase() : '';
      const okEstado = est.includes('entreg');
      if (okEstado) return true;
      if (F.fechaRealDeEntrega) {
        const y = Number(String(r[F.fechaRealDeEntrega] ?? '').slice(0, 4));
        return !!y && y <= new Date().getFullYear();
      }
      return false;
    });
  }, [filtered]);

  const porEntregar = useMemo(() => {
    return filtered.filter(r => {
      const est = F.estadoDeLaObra ? String(r[F.estadoDeLaObra] ?? '').toLowerCase() : '';
      const noEntregada = est && !est.includes('entreg');
      if (noEntregada) return true;
      if (F.fechaEstimadaDeEntrega) {
        const y = Number(String(r[F.fechaEstimadaDeEntrega] ?? '').slice(0, 4));
        return !!y && y > new Date().getFullYear();
      }
      return false;
    });
  }, [filtered]);

  const alertas = useMemo(() => {
    return filtered.filter(r =>
      F.descripcionDelRiesgo && String(r[F.descripcionDelRiesgo] ?? '').trim().length > 0
    );
  }, [filtered]);

  // ============================================================================
  // DATOS PARA EL MAPA - ORGANIZADOS POR DEPENDENCIA
  // ============================================================================
  const mapData = useMemo(() => {
    const obrasConCoordenadas = filtered.filter(r => {
      const lat = F.latitud ? parseFloat(String(r[F.latitud] ?? '')) : null;
      const lng = F.longitud ? parseFloat(String(r[F.longitud] ?? '')) : null;
      return lat && lng && !isNaN(lat) && !isNaN(lng);
    });

    console.log('Obras con coordenadas encontradas:', obrasConCoordenadas.length);
    console.log('Total de obras filtradas:', filtered.length);
    console.log('Campos de latitud y longitud:', F.latitud, F.longitud);

    // Agrupar por dependencia para organización visual por colores
    const groupedByDependency = obrasConCoordenadas.reduce((acc, obra) => {
      const dependencia = F.dependencia ? String(obra[F.dependencia] ?? 'Sin Dependencia') : 'Sin Dependencia';
      if (!acc[dependencia]) {
        acc[dependencia] = [];
      }
      acc[dependencia].push(obra);
      return acc;
    }, {} as Record<string, Row[]>);

    console.log('Datos del mapa agrupados:', groupedByDependency);
    return groupedByDependency;
  }, [filtered]);

  // ============================================================================
  // MAPEO DE COLORES ÚNICOS POR DEPENDENCIA (SIN REPETICIONES)
  // ============================================================================
  const dependencyColorMap = useMemo(() => {
    const dependencias = Object.keys(mapData).sort();
    const total = dependencias.length || 1;
    const saturation = 72; // 0-100
    const lightness = 38;  // 0-100 (más bajo = más oscuro)
    const colorMap: Record<string, string> = {};
    dependencias.forEach((dep, idx) => {
      const hue = Math.round((idx * 360) / total);
      colorMap[dep] = hslToHex(hue, saturation, lightness);
    });
    return colorMap;
  }, [mapData]);

  // ============================================================================
  // (Marcadores individuales no usados en modo por comuna)

  const showLegend = true;
  // Normalizar nombre de comuna (acepta "15 - Guayabal" o "Guayabal")
  // const normalizeComuna = (value: string): string => {
  //   const str = String(value ?? '').trim();
  //   const parts = str.split('-');
  //   return (parts.length > 1 ? parts.slice(1).join('-') : str).trim().toLowerCase();
  // };

  // Indicador Avance Total (definición eliminada en este archivo)

  // ============================================================================
  // AGRUPACIÓN POR COMUNA: UN SOLO MARCADOR POR COMUNA CON EL CONTEO DE OBRAS
  // ============================================================================
  // type ComunaSummary = {
  //   comuna: string;
  //   countAll: number;
  //   countGeo: number;
  //   lat: number;
  //   lng: number;
  // };

  // Eliminado: agregado en MapLibre

  // Eliminado: no se usa en esta vista

  // ============================================================================
  // MANEJADORES DE EVENTOS
  // ============================================================================
  const handleFilterChange = (filterKey: keyof UIFilters, value: string) => {
    const newValue = value || undefined;
    const newFilters = { ...filters, [filterKey]: newValue };

    // Limpia filtros dependientes automáticamente
    const cleanedFilters = cleanDependentFilters(newFilters, filterKey);
    setFilters(cleanedFilters);
  };

  // ============================================================================
  // RENDERIZADO DEL COMPONENTE
  // ============================================================================
  return (
    <div className="dashboard-container">
      {/* Navegación superior */}
      <Navigation showBackButton={true} title="Reporte General" />

      {/* Iconos de alerta y calendario */}
      <HeaderIcons 
        rows={rows} 
        filtered={filtered} 
        // onShowLearningPanel={() => setShowLearningPanel(true)}
      />

      {/* Contenedor principal del dashboard */}
      <div className="dashboard-content">

        {/* ========================================================================
             INDICADOR DE CARGA - SOLO SE MUESTRA MIENTRAS CARGA
         ======================================================================== */}
        {status === 'Cargando...' && (
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <div className="loading-text">
              <h3>Cargando datos del proyecto...</h3>
              <p>Por favor espera mientras se procesan las obras</p>
            </div>
          </div>
        )}

        {/* ========================================================================
             SECCIÓN DE FILTROS - PRIMERA POSICIÓN
         ======================================================================== */}
        <div className="filters-section">
          <div className="filters-actions">
            <div className="filters-status">
              {Object.keys(filters).length > 0 ? (
                <span className="filters-active">
                  <span className="status-icon">🔍</span>
                  Filtros activos ({Object.keys(filters).length})
                </span>
              ) : (
                <span className="filters-all">
                  <span className="status-icon">📊</span>
                  Mostrando todos los datos
                </span>
              )}
            </div>
            <button
              className="clear-filters-btn"
              onClick={() => setFilters({})}
              title="Borrar todos los filtros"
              disabled={Object.keys(filters).length === 0}
            >
              <span className="btn-icon" aria-hidden>✖</span>
              Borrar filtros
            </button>
          </div>
          {/* Primera fila de filtros */}
          <div className="filters-container filters-row-main">
            {/* Filtro: Proyectos estratégicos */}
            {F.proyectoEstrategico && (
              <div className="filter-group">
                <label className="filter-label">PROYECTOS ESTRATÉGICOS</label>
                <select
                  className="filter-select"
                  value={filters.proyecto ?? ''}
                  onChange={e => handleFilterChange('proyecto', e.target.value)}
                >
                  <option value="">Todos los proyectos</option>
                  {opciones.proyectos.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}

            {/* Filtro: Dependencia */}
            {F.dependencia && (
              <div className="filter-group">
                <label className="filter-label">DEPENDENCIA</label>
                <select
                  className="filter-select"
                  value={filters.dependencia ?? ''}
                  onChange={e => handleFilterChange('dependencia', e.target.value)}
                  disabled={opciones.dependencias.length === 0}
                >
                  <option value="">Todas las dependencias</option>
                  {opciones.dependencias.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}

            {/* Filtro: Comuna / Corregimiento */}
            {F.comunaOCorregimiento && (
              <div className="filter-group">
                <label className="filter-label">COMUNA / CORREGIMIENTO</label>
                <select
                  className="filter-select"
                  value={filters.comuna ?? ''}
                  onChange={e => handleFilterChange('comuna', e.target.value)}
                  disabled={opciones.comunas.length === 0}
                >
                  <option value="">Todas las comunas</option>
                  {opciones.comunas.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Segunda fila de filtros */}
          <div className="filters-container filters-row-secondary">
            {/* Filtro: Tipo de Intervención */}
            {F.tipoDeIntervecion && (
              <div className="filter-group">
                <label className="filter-label">TIPO DE INTERVENCIÓN</label>
                <select
                  className="filter-select"
                  value={filters.tipo ?? ''}
                  onChange={e => handleFilterChange('tipo', e.target.value)}
                  disabled={opciones.tipos.length === 0}
                >
                  <option value="">Todos los tipos</option>
                  {opciones.tipos.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}

            {/* Filtro: Contratista */}
            {F.contratistaOperador && (
              <div className="filter-group">
                <label className="filter-label">CONTRATISTA</label>
                <select
                  className="filter-select"
                  value={filters.contratista ?? ''}
                  onChange={e => handleFilterChange('contratista', e.target.value)}
                  disabled={opciones.contratistas?.length === 0}
                >
                  <option value="">Todos los contratistas</option>
                  {opciones.contratistas?.map(v => <option key={v} value={v}>{v}</option>) || []}
                </select>
              </div>
            )}

            {/* Filtro: Estado de la Obra */}
            <div className="filter-group">
              <label className="filter-label">ESTADO DE LA OBRA</label>
              <select
                className="filter-select"
                value={filters.estadoDeLaObra ?? ''}
                onChange={e => handleFilterChange('estadoDeLaObra', e.target.value)}
              >
                <option value="">Todos los estados</option>
                {opciones.estadoDeLaObra.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Tercera fila - Filtros de fecha */}
          {(F.fechaRealDeEntrega || F.fechaEstimadaDeEntrega) && (
            <div className="filters-container filters-row-dates">
              <div className="filter-group date-filter-group">
                <label className="filter-label">FECHA DESDE</label>
                <div className="date-inputs">
                  <select
                    className="filter-select date-select"
                    value={filters.desdeDia ?? ''}
                    onChange={e => setFilters(f => ({ ...f, desdeDia: e.target.value || undefined }))}
                  >
                    <option value="">Día</option>
                    {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                      <option key={day} value={day.toString().padStart(2, '0')}>
                        {day.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <select
                    className="filter-select date-select"
                    value={filters.desdeMes ?? ''}
                    onChange={e => setFilters(f => ({ ...f, desdeMes: e.target.value || undefined }))}
                  >
                    <option value="">Mes</option>
                    <option value="01">Enero</option>
                    <option value="02">Febrero</option>
                    <option value="03">Marzo</option>
                    <option value="04">Abril</option>
                    <option value="05">Mayo</option>
                    <option value="06">Junio</option>
                    <option value="07">Julio</option>
                    <option value="08">Agosto</option>
                    <option value="09">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                  <select
                    className="filter-select date-select"
                    value={filters.desdeAnio ?? ''}
                    onChange={e => setFilters(f => ({ ...f, desdeAnio: e.target.value || undefined }))}
                  >
                    <option value="">Año</option>
                    {Array.from({length: 7}, (_, i) => 2024 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="filter-group date-filter-group">
                <label className="filter-label">FECHA HASTA</label>
                <div className="date-inputs">
                  <select
                    className="filter-select date-select"
                    value={filters.hastaDia ?? ''}
                    onChange={e => setFilters(f => ({ ...f, hastaDia: e.target.value || undefined }))}
                  >
                    <option value="">Día</option>
                    {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                      <option key={day} value={day.toString().padStart(2, '0')}>
                        {day.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <select
                    className="filter-select date-select"
                    value={filters.hastaMes ?? ''}
                    onChange={e => setFilters(f => ({ ...f, hastaMes: e.target.value || undefined }))}
                  >
                    <option value="">Mes</option>
                    <option value="01">Enero</option>
                    <option value="02">Febrero</option>
                    <option value="03">Marzo</option>
                    <option value="04">Abril</option>
                    <option value="05">Mayo</option>
                    <option value="06">Junio</option>
                    <option value="07">Julio</option>
                    <option value="08">Agosto</option>
                    <option value="09">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                  <select
                    className="filter-select date-select"
                    value={filters.hastaAnio ?? ''}
                    onChange={e => setFilters(f => ({ ...f, hastaAnio: e.target.value || undefined }))}
                  >
                    <option value="">Año</option>
                    {Array.from({length: 7}, (_, i) => 2024 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================
             SECCIÓN DE KPIs - SEGUNDA POSICIÓN
         ======================================================================== */}
        <div className="kpis-section">
          <div className="kpis-container">
            {/* Fila única: 6 KPIs organizados */}
            <div className="kpis-grid kpis-row-6" style={isMobileStack ? { gridTemplateColumns: '1fr', rowGap: 14 } : undefined}>
              <Kpi 
                label="Total obras" 
                value={k.totalObras}
              />
              <Kpi 
                label="Inversión total" 
                value={k.invTotal} 
                format="money" 
                abbreviate 
                digits={1}
                subtitle={`${Math.round(k.pctEjec * 100)}% ejecutado`}
              />
              <Kpi 
                label="Presupuesto ejecutado" 
                value={k.ejec} 
                format="money" 
                abbreviate
                digits={1}
                subtitle={`${Math.round(k.pctEjec * 100)}% de la inversión`}
              />
              <Kpi 
                label="Presupuesto ejecutado administración actual 2024-2027" 
                value={k.valorCuatrienio2024_2027} 
                format="money"
                abbreviate
                digits={1}
                subtitle={`${Math.round(k.porcentajeCuatrienio2024_2027 * 100)}% de la inversión total`}
              />
              <Kpi 
                label="Obras entregadas" 
                value={k.entregadas} 
                subtitle={`${Math.round(k.pctEntregadas * 100)}% del total`}
              />
              <Kpi 
                label="Alertas" 
                value={k.alertasEncontradas}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================
             PANEL PRINCIPAL DEL MAPA - TERCERA POSICIÓN
         ======================================================================== */}
        <div className="map-main-panel">
          
          {/* Leyenda compacta (chips) sin título para ahorrar espacio */}
          {showLegend && (
          <div className="map-legend map-legend-compact">
            <div className="legend-chips">
              {Object.keys(mapData).map((dependencia) => (
                <div key={dependencia} className="legend-chip" title={dependencia}>
                  <span
                    className="legend-dot"
                    style={{ backgroundColor: dependencyColorMap[dependencia] }}
                  />
                  <span className="legend-label">{dependencia}</span>
                </div>
              ))}
            </div>
          </div>
          )}
          

          
          {/* Mapa principal: responsive y conectado a filtros externos */}
          <div style={{ height: '60vh', minHeight: 380, width: '100%' }}>
            <MapLibreVisor height={'100%'} query={new URLSearchParams({
              ...(combinedFilters.estadoDeLaObra ? { estado: String(combinedFilters.estadoDeLaObra) } : {}),
              ...(combinedFilters.dependencia ? { dependencia: String(combinedFilters.dependencia) } : {}),
              ...(combinedFilters.proyecto ? { proyectoEstrategico: String(combinedFilters.proyecto) } : {}),
              // Comuna puede venir como nombre; el backend acepta comunaNombre
              ...(combinedFilters.comuna ? { comunaNombre: String(combinedFilters.comuna) } : {}),
              ...(combinedFilters.tipo ? { tipo: String(combinedFilters.tipo) } : {}),
              ...(combinedFilters.contratista ? { contratista: String(combinedFilters.contratista) } : {}),
              ...(combinedFilters.desde ? { desde: String(combinedFilters.desde) } : {}),
              ...(combinedFilters.hasta ? { hasta: String(combinedFilters.hasta) } : {}),
            })} />
          </div>
        </div>

        {/* ========================================================================
             TABLA DE VIGENCIAS - CUARTA POSICIÓN
         ======================================================================== */}
        <div className="table-card" style={{ marginBottom: 20 }}>
          <VigenciasTable data={vigencias} />
        </div>

        {/* ========================================================================
             GRÁFICO PRINCIPAL - Inversión vs Presupuesto Ejecutado
         ======================================================================== */}
        {simpleChartData.length > 0 && (
          <div className="main-chart-section">
            <SimpleBarChart
              title="Inversión Total vs Presupuesto Ejecutado"
              data={simpleChartData}
              seriesNames={['Inversión Total', 'Presupuesto Ejecutado']}
              width={1200}
              height={500}
              showLegend={true}
              formatValue={(value) => `$${(value / 1000000).toFixed(1)}M`}
            />
          </div>
        )}

        {/* ========================================================================
             SECCIÓN DE CONTENIDO INFERIOR - GRÁFICOS Y TABLAS
         ======================================================================== */}
        <div className="content-section" style={{ display: 'none' }}>
          {/* Oculto la tarjeta inferior mientras el MapLibre muestra overlay propio */}
          {/* Gráfico principal de inversión */}
          {comboDataset.length > 0 && (
            <div className="chart-card">
              <ComboBars
                title=""
                dataset={comboDataset}
                dim={F.dependencia}
                v1={F.costoTotalActualizado}
                v2={F.presupuestoEjecutado}
              />
            </div>
          )}

          {/* Tablas de información */}
          <div className="tables-grid">
            {/* Tabla de obras entregadas */}
            <div className="table-card">
              <WorksTable
                title=""
                works={entregadas}
                type="entregadas"
                maxRows={6}
              />
            </div>

            {/* Tabla de obras por entregar */}
            <div className="table-card">
              <WorksTable
                title=""
                works={porEntregar}
                type="porEntregar"
                maxRows={4}
              />
            </div>

            {/* Tabla de alertas y riesgos */}
            <div className="table-card">
              <AlertsTable
                alerts={alertas}
                maxRows={6}
              />
            </div>
          </div>
        </div>

        {/* Indicador de estado de carga */}
        <div className="status-indicator">
          <span className="status-icon">📊</span>
          {status}
        </div>
      </div>

      {/* Chatbot y Panel de Aprendizaje - DESHABILITADO */}
      {/* <Chatbot 
        data={rows} 
        filters={combinedFilters}
        onFiltersChange={(newFilters) => setFilters(newFilters)}
      />
      
      <ChatbotLearningPanel 
        isOpen={showLearningPanel}
        onClose={() => setShowLearningPanel(false)}
      /> */}

      {/* ========================================================================
           ESTILOS CSS - DISEÑO MODERNO CON COLORES CORPORATIVOS
       ======================================================================== */}
      <style>{`
        /* ========================================================================
            ESTILOS GENERALES DEL DASHBOARD
        ======================================================================== */
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 50%, #F0F8FF 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .dashboard-content {
          padding: 100px 16px 16px 16px;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* ========================================================================
            INDICADOR DE CARGA - SOLO SE MUESTRA MIENTRAS CARGA
        ======================================================================== */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px; /* Altura fija para el indicador de carga */
          background: linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 100%);
          border-radius: 20px;
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.15);
          border: 2px solid ${CORPORATE_COLORS.primary};
          margin-bottom: 30px;
        }

        .loading-spinner {
          position: relative;
          width: 80px;
          height: 80px;
          margin-bottom: 20px;
        }

        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 4px solid transparent;
          border-top-color: ${CORPORATE_COLORS.primary};
          border-radius: 50%;
          animation: spin 1.5s linear infinite;
        }

        .spinner-ring:nth-child(1) {
          border-top-color: ${CORPORATE_COLORS.primary};
          animation-delay: -0.8s;
        }

        .spinner-ring:nth-child(2) {
          border-top-color: ${CORPORATE_COLORS.secondary};
          animation-delay: -0.4s;
        }

        .spinner-ring:nth-child(3) {
          border-top-color: ${CORPORATE_COLORS.accent};
          animation-delay: 0s;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          text-align: center;
          color: ${CORPORATE_COLORS.darkGray};
        }

        .loading-text h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: ${CORPORATE_COLORS.accent};
        }

        .loading-text p {
          font-size: 0.9rem;
          color: ${CORPORATE_COLORS.mediumGray};
        }

        /* ========================================================================
            SECCIÓN DE FILTROS - DISEÑO MEJORADO
        ======================================================================== */
        .filters-section {
          background: linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 100%);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 18px;
          box-shadow: 0 6px 18px rgba(121, 188, 153, 0.12);
          border: 1px solid ${CORPORATE_COLORS.primary};
        }

        .filters-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .filters-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filters-active {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #FFE4E1 0%, #FFB6C1 100%);
          border: 1px solid #FF6B6B;
          border-radius: 20px;
          color: #D63031;
          font-size: 0.85rem;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.15);
        }

        .filters-all {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%);
          border: 1px solid #4CAF50;
          border-radius: 20px;
          color: #2E7D32;
          font-size: 0.85rem;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
        }

        .filters-status .status-icon {
          font-size: 1rem;
        }

        .clear-filters-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid ${CORPORATE_COLORS.primary};
          background: #ffffff;
          color: ${CORPORATE_COLORS.accent};
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 6px rgba(121, 188, 153, 0.08);
        }

        .clear-filters-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: ${CORPORATE_COLORS.secondary};
          box-shadow: 0 6px 16px rgba(121, 188, 153, 0.18);
        }

        .clear-filters-btn:disabled {
          background: #F8F9FA;
          color: ${CORPORATE_COLORS.mediumGray};
          border-color: #E9ECEF;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .clear-filters-btn:disabled:hover {
          transform: none;
          box-shadow: 0 1px 6px rgba(121, 188, 153, 0.08);
        }

        .clear-filters-btn .btn-icon {
          display: inline-flex;
          width: 18px;
          height: 18px;
          align-items: center;
          justify-content: center;
        }

        .filters-container {
          display: grid;
          gap: 14px;
          align-items: end;
          margin-bottom: 12px;
        }

        .filters-row-main {
          grid-template-columns: repeat(3, 1fr);
        }

        .filters-row-secondary {
          grid-template-columns: repeat(3, 1fr);
        }

        .filters-row-dates {
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }

        .filter-label {
          font-weight: 600;
          color: ${CORPORATE_COLORS.primary};
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .filter-select, .filter-input {
          padding: 12px 14px;
          border: 1px solid ${CORPORATE_COLORS.primary};
          border-radius: 10px;
          font-size: 0.95rem;
          transition: all 0.25s ease;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          color: ${CORPORATE_COLORS.darkGray};
          box-shadow: 0 1px 6px rgba(121, 188, 153, 0.08);
          width: 100%;
          box-sizing: border-box;
          min-height: 48px;
          display: flex;
          align-items: center;
        }

        /* Estilo especial para cuando el filtro está en "Todos" */
        .filter-select:has(option[value=""]:checked),
        .filter-select[value=""] {
          background: linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%);
          border-color: ${CORPORATE_COLORS.mediumGray};
          color: ${CORPORATE_COLORS.mediumGray};
          font-style: italic;
        }

        /* Estilo para opciones seleccionadas */
        .filter-select option:checked {
          background: ${CORPORATE_COLORS.primary};
          color: white;
          font-weight: 600;
        }

        /* Estilo para la opción "Todos" */
        .filter-select option[value=""] {
          background: #F8F9FA;
          color: ${CORPORATE_COLORS.mediumGray};
          font-style: italic;
          font-weight: 500;
        }

        .filter-select:focus, .filter-input:focus {
          outline: none;
          border-color: ${CORPORATE_COLORS.accent};
          box-shadow: 0 0 0 4px rgba(59, 134, 134, 0.25);
          transform: translateY(-2px);
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
        }

        .filter-select:hover, .filter-input:hover {
          border-color: ${CORPORATE_COLORS.secondary};
          transform: translateY(-1px);
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
        }

        /* Estilos específicos para móviles en filtros */
        @media (max-width: 768px) {
          .filters-section {
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
          }

          .filters-actions {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .filters-status {
            justify-content: center;
          }

          .filters-active, .filters-all {
            font-size: 0.8rem;
            padding: 5px 10px;
          }

          .filters-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }

          .filter-group {
            gap: 8px;
          }

          .filter-label {
            font-size: 0.85rem;
            letter-spacing: 0.3px;
          }

          .filter-select, .filter-input {
            padding: 12px 14px;
            font-size: 0.95rem;
            border-radius: 10px;
          }
        }

        @media (max-width: 480px) {
          .filters-section {
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 15px;
          }

          .filters-actions {
            gap: 10px;
          }

          .filters-active, .filters-all {
            font-size: 0.75rem;
            padding: 4px 8px;
          }

          .filters-container {
            gap: 12px;
          }

          .filter-group {
            gap: 6px;
          }

          .filter-label {
            font-size: 0.8rem;
            letter-spacing: 0.2px;
          }

          .filter-select, .filter-input {
            padding: 10px 12px;
            font-size: 0.9rem;
            border-radius: 8px;
          }
        }

        /* ========================================================================
            SECCIÓN DE KPIs - DISEÑO MEJORADO
        ======================================================================== */
        .kpis-section {
          margin-bottom: 22px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(212, 230, 241, 0.35) 0%, rgba(232, 244, 248, 0.35) 100%);
          border-radius: 18px;
          border: 1px solid rgba(121, 188, 153, 0.25);
        }

        .kpis-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .kpis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          align-items: stretch;
        }

        /* Estilos para las tarjetas de KPI - Colores corporativos */
        .kpis-grid .kpi {
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%) !important;
          color: white !important;
          border-radius: 16px !important;
          padding: 16px !important;
          box-shadow: 0 6px 18px rgba(121, 188, 153, 0.22) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          transition: all 0.25s ease !important;
          position: relative !important;
          overflow: hidden !important;
        }

        .kpis-grid .kpi:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 15px 35px rgba(121, 188, 153, 0.4) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
        }

        .kpis-grid .kpi::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 4px !important;
          background: linear-gradient(90deg, #3B8686, #79BC99, #4E8484) !important;
        }

        /* Estilos para el contenido de los KPIs */
        .kpis-grid .kpi .kpi-label {
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          color: rgba(255, 255, 255, 0.9) !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          margin-bottom: 8px !important;
        }

        .kpis-grid .kpi .kpi-value {
          font-size: 1.4rem !important;
          font-weight: 700 !important;
          color: #FFFFFF !important;
          margin-bottom: 5px !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          line-height: 1.2 !important;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }

        .kpis-grid .kpi .kpi-subtitle {
          font-size: 0.85rem !important;
          color: rgba(255, 255, 255, 0.8) !important;
          font-weight: 500 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        /* Estilos específicos para cada fila de KPIs */
        .kpis-row-1 { 
          grid-template-columns: repeat(1, 1fr);
          max-width: 500px;
          margin: 0 auto;
        }
        .kpis-row-2 { grid-template-columns: repeat(2, 1fr); }
        .kpis-row-5 { grid-template-columns: repeat(5, 1fr); }
        .kpis-row-6 { grid-template-columns: repeat(6, 1fr); }

        .kpis-row-3 {
          grid-template-columns: repeat(1, 1fr);
          max-width: 400px;
          margin: 0 auto;
        }

        /* ========================================================================
            LAYOUT PRINCIPAL
        ======================================================================== */
        .main-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
        }

        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        /* ========================================================================
            SECCIÓN DE CONTENIDO INFERIOR
        ======================================================================== */
        .content-section {
          margin-bottom: 40px;
        }

        .tables-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 30px;
          margin-top: 30px;
        }

        /* ========================================================================
            TARJETAS DE CONTENIDO
        ======================================================================== */
        .chart-card, .table-card {
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.12);
          border: 1px solid ${CORPORATE_COLORS.primary};
          transition: all 0.3s ease;
        }

        .chart-card:hover, .table-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(121, 188, 153, 0.2);
        }

        /* ========================================================================
            LAYOUT PRINCIPAL
        ======================================================================== */
        .main-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
        }

        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        /* ========================================================================
            LAYOUT PRINCIPAL
        ======================================================================== */
        .main-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
        }

        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        /* ========================================================================
            LEYENDA DEL MAPA
        ======================================================================== */
        .map-legend {
          margin-bottom: 25px;
          padding: 20px;
          background: linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 100%);
          border-radius: 15px;
          border: 1px solid ${CORPORATE_COLORS.primary};
          box-shadow: 0 4px 15px rgba(121, 188, 153, 0.1);
        }

        .map-legend h4 {
          margin: 0 0 20px 0;
          color: ${CORPORATE_COLORS.accent};
          font-size: 1.1rem;
          font-weight: 600;
        }

        .legend-items {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 15px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 10px;
          border: 1px solid ${CORPORATE_COLORS.primary};
          box-shadow: 0 2px 8px rgba(121, 188, 153, 0.08);
          transition: all 0.3s ease;
        }

        .legend-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(121, 188, 153, 0.15);
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
        }

        .legend-color {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid ${CORPORATE_COLORS.primary};
          box-shadow: 0 2px 6px rgba(121, 188, 153, 0.3);
        }

        .legend-text {
          font-size: 0.9rem;
          color: ${CORPORATE_COLORS.darkGray};
          font-weight: 500;
        }

        /* =====================
           Leyenda compacta (chips)
           ===================== */
        .map-legend-compact {
          padding: 10px 12px;
          border-radius: 12px;
          margin-bottom: 12px;
        }
        .legend-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .legend-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid ${CORPORATE_COLORS.primary};
          color: ${CORPORATE_COLORS.darkGray};
          font-size: 12px;
          line-height: 1;
          white-space: nowrap;
          max-width: 100%;
        }
        .legend-chip .legend-label {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid ${CORPORATE_COLORS.primary};
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          flex: 0 0 auto;
        }
        @media (max-width: 1200px) {
          .legend-chip { font-size: 11px; padding: 5px 8px; }
          .legend-dot { width: 9px; height: 9px; }
        }
        @media (max-width: 768px) {
          .map-legend-compact { padding: 8px 10px; }
          .legend-chips { gap: 6px; }
          .legend-chip { font-size: 10px; padding: 4px 7px; }
          .legend-dot { width: 8px; height: 8px; }
        }
        @media (max-width: 480px) {
          .legend-chip { font-size: 9.5px; padding: 4px 6px; }
          .legend-dot { width: 7px; height: 7px; }
        }

        /* ========================================================================
            CONTENEDOR DEL MAPA
        ======================================================================== */
        .map-container-expanded {
          width: 100%;
          height: 600px;
          border-radius: 15px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 6px 18px rgba(0,0,0,0.08);
          position: relative;
        }

        .map-container-expanded .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          border-radius: 15px;
        }

        .map-container-expanded .responsive-map {
          width: 100% !important;
          height: 100% !important;
        }

        /* Mensaje cuando no hay datos */
        .no-data-message {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: 1.2rem;
          color: ${CORPORATE_COLORS.mediumGray};
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 15px;
          text-align: center;
          padding: 20px;
        }

        /* ========================================================================
            POPUP PERSONALIZADO DEL MAPA
        ======================================================================== */
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 24px rgba(0,0,0,0.15);
        }

        .custom-popup .leaflet-popup-content {
          margin: 0;
          padding: 0;
          min-width: 240px;
          max-width: 280px;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 12px;
        }

        .map-popup {
          padding: 0;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 12px;
        }

        .popup-header {
          padding: 12px 16px;
          border-left: 4px solid;
          background: linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 100%);
          border-radius: 12px 12px 0 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .popup-header h4 {
          margin: 0 0 6px 0;
          color: ${CORPORATE_COLORS.darkGray};
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.3;
        }

        .popup-dependency {
          color: #00904c;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .popup-info {
          padding: 10px 16px;
          border-bottom: 1px solid ${CORPORATE_COLORS.primary};
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
        }

        .popup-info p {
          margin: 6px 0;
          font-size: 0.85rem;
          color: ${CORPORATE_COLORS.mediumGray};
          line-height: 1.4;
        }

        .popup-info strong {
          color: ${CORPORATE_COLORS.darkGray};
        }

        .popup-percentages {
          padding: 10px 16px;
        }

        .popup-percentages h5 {
          margin: 0 0 12px 0;
          color: #00904c;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .percentage-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .percentage-item {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: center;
        }

        .percentage-label {
          font-size: 0.8rem;
          color: ${CORPORATE_COLORS.mediumGray};
          font-weight: 500;
          line-height: 1.3;
        }

        .percentage-bar {
          width: 70px;
          height: 8px;
          background: linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 100%);
          border-radius: 4px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .percentage-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        /* Estilos para clusters y marcadores tipo botón naranja */
        .custom-cluster { background: transparent; }
        .custom-cluster .cluster-count {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #F77F26;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          border: 3px solid rgba(0,0,0,0.15);
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .custom-marker { background: transparent; }
        .custom-marker .marker-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #F77F26;
          border: 3px solid rgba(0,0,0,0.15);
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        .percentage-value {
          font-size: 0.75rem;
          color: #00904c;
          font-weight: 600;
          min-width: 30px;
          text-align: right;
        }

        /* Overlay lateral dentro del mapa */
        .comuna-overlay {
          position: absolute;
          top: 12px;
          right: 12px;
          width: min(420px, 90%);
          max-height: calc(100% - 24px);
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E9ECEF;
          box-shadow: 0 10px 24px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1000;
        }
        .overlay-header {
          display: flex; align-items: center; justify-content: space-between;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-bottom: 1px solid #E9ECEF; padding: 10px 12px;
        }
        .overlay-title { font-weight: 700; color: #2C3E50; }
        .overlay-close { background: transparent; border: none; font-size: 20px; cursor: pointer; color: #2C3E50; }
        .overlay-body { padding: 12px; overflow: auto; }
        .overlay-item { padding: 10px 0; border-bottom: 1px solid #E9ECEF; }
        .item-title { font-weight: 700; margin-bottom: 6px; }
        .item-ind { margin-top: 6px; color: #2C3E50; }
        .bars { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
        .bar-row { display: grid; grid-template-columns: 130px 1fr 40px; gap: 8px; align-items: center; }
        .bar-label { color: #6C757D; font-size: 0.85rem; }
        .bar-bg { background: #E8F4F8; height: 8px; border-radius: 4px; overflow: hidden; }
        .bar-fill { background: #3B8686; height: 100%; }
        .bar-val { text-align: right; color: #00904c; font-weight: 600; }

        /* ========================================================================
            INDICADOR DE ESTADO
        ======================================================================== */
        .status-indicator {
          text-align: center;
          padding: 25px;
          color: ${CORPORATE_COLORS.mediumGray};
          font-style: italic;
          background: linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 100%);
          border-radius: 15px;
          margin-top: 30px;
          border: 1px solid ${CORPORATE_COLORS.primary};
          box-shadow: 0 4px 15px rgba(121, 188, 153, 0.1);
        }

        .status-icon {
          margin-right: 10px;
          font-size: 1.2rem;
        }

        /* ========================================================================
            SECCIÓN DEL GRÁFICO PRINCIPAL
        ======================================================================== */
        .main-chart-section {
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 20px;
          border: 1px solid ${CORPORATE_COLORS.primary};
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.12);
          overflow: hidden;
          width: 100%;
          max-width: 100%;
        }

        .main-chart-section .simple-chart-container {
          background: transparent;
          border: none;
          box-shadow: none;
          padding: 0;
          width: 100%;
          max-width: 100%;
        }

        /* Hacer que el gráfico ocupe todo el ancho disponible */
        .main-chart-section .simple-chart-container .chart-svg {
          width: 100%;
          max-width: 100%;
        }

        /* ========================================================================
            SCROLL SUAVE Y ORGANIZACIÓN
        ======================================================================== */
        .dashboard-content {
          scroll-behavior: smooth;
          overflow-x: hidden;
        }

        .dashboard-content > * {
          scroll-margin-top: 100px;
        }

        /* ========================================================================
            DISEÑO RESPONSIVE
        ======================================================================== */
        @media (max-width: 1200px) {
          .kpis-row-5 { grid-template-columns: repeat(4, 1fr); }
          .kpis-row-6 { grid-template-columns: repeat(4, 1fr); }
          .main-content {
            grid-template-columns: 1fr;
          }
          
          .main-chart-section {
            padding: 15px;
            margin-bottom: 25px;
          }
        }

        @media (max-width: 768px) {
          .dashboard-content {
            padding: 90px 10px 10px 10px;
          }

          .filters-section {
            padding: 20px;
            margin-bottom: 20px;
          }

          .filters-actions { margin-bottom: 10px; }

          .filters-container {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .filter-group {
            gap: 8px;
          }

          .filter-label {
            font-size: 0.85rem;
            letter-spacing: 0.3px;
          }

          .filter-select, .filter-input {
            padding: 12px 14px;
            font-size: 0.95rem;
            border-radius: 10px;
          }

          .kpis-section { padding: 16px; margin-bottom: 18px; }

          .kpis-container {
            gap: 12px;
          }

          .kpis-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .kpis-row-5 { grid-template-columns: repeat(2, 1fr); }
          .kpis-row-6 { grid-template-columns: repeat(2, 1fr); }

          .kpis-grid .kpi {
            padding: 14px !important;
          }

          .kpis-grid .kpi .kpi-value { font-size: 1.25rem !important; }

          .kpis-grid .kpi .kpi-label {
            font-size: 0.78rem !important;
          }

          .map-main-panel {
            padding: 20px;
            margin-bottom: 25px;
          }

          .map-legend {
            padding: 15px;
            margin-bottom: 20px;
          }

          .map-legend h4 {
            font-size: 1rem;
            margin-bottom: 15px;
          }

          .legend-items {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .legend-item {
            padding: 6px 10px;
          }

          .map-container-expanded {
            height: 400px;
          }

          .chart-card, .table-card {
            padding: 20px;
          }

          .content-section {
            margin-bottom: 25px;
          }

          .tables-grid {
            grid-template-columns: 1fr;
            gap: 20px;
            margin-top: 20px;
          }

          .custom-popup .leaflet-popup-content {
            min-width: 200px;
            max-width: 240px;
          }

          .percentage-item {
            grid-template-columns: 1fr;
            gap: 5px;
          }

          .percentage-bar {
            width: 100%;
          }

          /* Estilos específicos para el gráfico principal en móviles */
          .main-chart-section {
            padding: 12px;
            margin-bottom: 20px;
            border-radius: 15px;
          }
        }

        @media (max-width: 480px) {
          .dashboard-content {
            padding: 80px 8px 8px 8px;
          }

          .filters-section {
            padding: 15px;
            margin-bottom: 15px;
          }

          .filters-actions { margin-bottom: 10px; }

          .filters-container {
            gap: 12px;
          }

          .filter-group {
            gap: 6px;
          }

          .filter-label {
            font-size: 0.8rem;
            letter-spacing: 0.2px;
          }

          .filter-select, .filter-input {
            padding: 10px 12px;
            font-size: 0.9rem;
            border-radius: 8px;
          }

          .kpis-section { padding: 12px; margin-bottom: 14px; }

          .kpis-container { gap: 10px; }

          .kpis-grid { gap: 14px; grid-template-columns: 1fr !important; }
          .kpis-row-5 { grid-template-columns: 1fr !important; }
          .kpis-row-6 { grid-template-columns: 1fr !important; }

          .kpis-grid .kpi {
            padding: 12px !important;
          }

          .kpis-grid .kpi .kpi-value { font-size: 1.15rem !important; }

          .kpis-grid .kpi .kpi-label {
            font-size: 0.72rem !important;
          }

          /* Ocultar subtítulos en móviles pequeños para ahorrar espacio */
          .kpis-grid .kpi .kpi-subtitle { display: none !important; }

          .map-main-panel {
            padding: 15px;
            margin-bottom: 20px;
          }

          .map-legend {
            padding: 12px;
            margin-bottom: 15px;
          }

          .map-legend h4 {
            font-size: 0.95rem;
            margin-bottom: 12px;
          }

          .legend-items {
            gap: 8px;
          }

          .legend-item {
            padding: 5px 8px;
          }

          .legend-color {
            width: 16px;
            height: 16px;
          }

          .legend-text {
            font-size: 0.8rem;
          }

          .map-container-expanded {
            height: 350px;
          }

          .chart-card, .table-card {
            padding: 15px;
          }

          .content-section {
            margin-bottom: 20px;
          }

          .tables-grid {
            gap: 15px;
            margin-top: 15px;
          }

          .custom-popup .leaflet-popup-content {
            min-width: 180px;
            max-width: 220px;
          }

          .popup-header h4 {
            font-size: 0.9rem;
          }

          .popup-info p {
            font-size: 0.8rem;
          }

          .percentage-label {
            font-size: 0.75rem;
          }

          .percentage-value {
            font-size: 0.7rem;
          }

          /* Estilos específicos para el gráfico principal en móviles pequeños */
          .main-chart-section {
            padding: 8px;
            margin-bottom: 15px;
            border-radius: 12px;
          }
        }

        @media (max-width: 360px) {
          .dashboard-content {
            padding: 75px 5px 5px 5px;
          }

          .filters-section {
            padding: 12px;
          }

          .kpis-section {
            padding: 12px;
          }

          .map-main-panel {
            padding: 12px;
          }

          .map-container-expanded {
            height: 300px;
          }

          .chart-card, .table-card {
            padding: 12px;
          }

          .kpis-grid .kpi {
            padding: 15px !important;
          }

          .kpis-grid .kpi .kpi-value {
            font-size: 1.4rem !important;
          }

          /* Estilos específicos para el gráfico principal en pantallas muy pequeñas */
          .main-chart-section {
            padding: 6px;
            margin-bottom: 12px;
            border-radius: 10px;
          }
        }

        /* Estilos para los inputs de fecha tipo calendario */
        .date-inputs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          align-items: end;
        }

        .date-select {
          min-width: 0;
        }

        /* Contenedor específico para filtros de fecha */
        .filter-group:has(.date-inputs) {
          min-width: 280px;
        }

        .date-inputs .filter-select {
          border: 2px solid #79BC99;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          background: white;
          color: #2c3e50;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .date-inputs .filter-select:hover {
          border-color: #4E8484;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .date-inputs .filter-select:focus {
          outline: none;
          border-color: #3B8686;
          box-shadow: 0 0 0 3px rgba(121, 188, 153, 0.2);
        }

        .date-inputs .date-day,
        .date-inputs .date-month,
        .date-inputs .date-year {
          width: 100%;
        }

        /* Responsive para tablets */
        @media (max-width: 1024px) {
          .date-inputs { gap: 8px; }
        }

        /* Responsive para móviles */
        @media (max-width: 768px) {
          .date-inputs {
            grid-template-columns: 1fr;
            gap: 8px;
            width: 100%;
          }
        }

        /* Responsive para móviles pequeños */
        @media (max-width: 480px) {
          .date-inputs {
            gap: 6px;
          }
          
          .date-inputs .filter-select {
            padding: 6px 10px;
            font-size: 13px;
            max-width: 180px;
          }
        }

        /* Mejorar la apariencia de los filtros de fecha */
        .filter-group:has(.date-inputs) .filter-label {
          margin-bottom: 6px;
          color: #2c3e50;
          font-weight: 600;
        }

        /* Ajustar el grid de filtros para fechas */
        @media (max-width: 1200px) {
          .filter-group:has(.date-inputs) {
            min-width: 260px;
          }
        }

        @media (max-width: 768px) {
          .filter-group:has(.date-inputs) {
            min-width: auto;
            width: 100%;
          }
          
          .date-inputs {
            justify-content: center;
          }
        }

        /* ========================================================================
             ESTILOS PARA FILTROS ORGANIZADOS EN FILAS
         ======================================================================== */
        
        /* Contenedor de filtros organizados en filas */
        .filters-container {
          /* Mantener grilla definida arriba */
          width: 100%;
        }

        /* Fila de filtros */
        .filters-row {
          display: grid;
          gap: 20px;
          width: 100%;
        }

        /* Primera fila: 4 columnas */
        .filters-row-1 {
          grid-template-columns: repeat(4, 1fr);
        }

        /* Segunda fila: 3 columnas */
        .filters-row-2 {
          grid-template-columns: repeat(3, 1fr);
        }

        /* Filtro de fechas: ocupar 1 columna en desktop, 2 en md si caben */
        .date-filter-group {
          grid-column: span 1;
        }

        /* Contenedor de rango de fechas */
        .date-range-inputs {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Grupo de entrada de fecha */
        .date-input-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Etiqueta de fecha */
        .date-label {
          font-size: 12px;
          font-weight: 600;
          color: #2c3e50;
          min-width: 45px;
        }

        /* Responsive para tablets */
        @media (max-width: 1200px) {
          .filters-row-main,
          .filters-row-secondary {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .filters-row-dates {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        /* Responsive para móviles */
        @media (max-width: 768px) {
          .filters-row-main,
          .filters-row-secondary,
          .filters-row-dates {
            grid-template-columns: 1fr;
          }
          
          .filters-container {
            margin-bottom: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

