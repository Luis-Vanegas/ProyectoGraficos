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

// ============================================================================
// COMPONENTE PRINCIPAL DEL DASHBOARD - ESCENARIOS DEPORTIVOS
// ============================================================================
type UIFilters = Filters & {
  desdeDia?: string;
  desdeMes?: string;
  desdeAnio?: string;
  hastaDia?: string;
  hastaMes?: string;
  hastaAnio?: string;
};

const EscenariosDeportivosDashboard = () => {
  // ============================================================================
  // ESTADOS Y VARIABLES
  // ============================================================================
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('Cargando...');
  const [filters, setFilters] = useState<UIFilters>({});
  const [isMobileStack, setIsMobileStack] = useState(false);

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

  // Efecto para detectar el tamaño de pantalla y ajustar el layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileStack(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // ============================================================================
  // FILTRADO ESPECÍFICO PARA ESCENARIOS DEPORTIVOS
  // ============================================================================
  // Filtrar datos específicamente para Escenarios Deportivos
  const escenarioDeportivoRows = useMemo(() => {
    if (!F.proyectoEstrategico) return rows;
    
    const filtered = rows.filter(row => {
      const proyectoRow = String(row[F.proyectoEstrategico] ?? '').toLowerCase();
      return proyectoRow.includes('escenarios deportivos') || 
             proyectoRow.includes('deportivo') ||
             proyectoRow.includes('escenario') ||
             proyectoRow.includes('deportivos');
    });
    
    console.log(`Escenarios Deportivos: ${filtered.length} obras de ${rows.length} total`);
    return filtered;
  }, [rows]);

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

  const opciones = useMemo(() => getFilterOptions(escenarioDeportivoRows, filters), [escenarioDeportivoRows, filters]);
  const combinedFilters = useMemo(() => combineDateFields(filters), [filters]);
  const filtered = useMemo(() => applyFilters(escenarioDeportivoRows, combinedFilters), [escenarioDeportivoRows, combinedFilters]);
  const k = useMemo(() => kpis(filtered), [filtered]);
  const vigencias = useMemo(() => {
    const rows = computeVigencias(filtered);
    const only = rows.filter(r => r.year >= 2024 && r.year <= 2027);
    return only.sort((a, b) => a.year - b.year);
  }, [filtered]);

  // Dataset para el gráfico "Inversión total vs Presupuesto ejecutado"
  // Dataset para el gráfico principal de análisis (ComboBars)
  const comboDataset = useMemo(() => {
    if (!F.costoTotalActualizado || !F.presupuestoEjecutado || !F.nombre) return [];
    
    // Filtrar datos válidos antes de construir el dataset
    const validData = filtered.filter(row => {
      const nombre = row[F.nombre!];
      const costo = row[F.costoTotalActualizado!];
      const presupuesto = row[F.presupuestoEjecutado!];
      
      return nombre && 
             nombre !== '' && 
             nombre !== 'Sin información' &&
             (costo !== null && costo !== undefined) &&
             (presupuesto !== null && presupuesto !== undefined);
    });
    
    if (validData.length === 0) {
      console.log('No hay datos válidos para ComboBars');
      return [];
    }
    
    const dataset = buildTwoSeriesDataset(
      validData,
      F.nombre,
      F.costoTotalActualizado,
      F.presupuestoEjecutado,
      15
    );
    
    console.log('ComboBars dataset:', dataset);
    return dataset;
  }, [filtered]);

  // Datos para el gráfico SimpleBarChart (SVG nativo)
  const simpleChartData = useMemo(() => {
    if (!comboDataset || comboDataset.length <= 1) return [];
    
    // Convertir el dataset de ECharts al formato del nuevo componente
    return comboDataset.slice(1).map((row: (string | number)[]) => {
      const [label, value1, value2] = row;
      return {
        label: String(label).substring(0, 20) + (String(label).length > 20 ? '...' : ''), // Truncar etiquetas largas
        value1: Number(value1) || 0,
        value2: Number(value2) || 0,
      };
    });
  }, [comboDataset]);

  // Dataset para gráfico de avance por año
  const avanceDataset = useMemo(() => {
    if (!F.avance2024 || !F.avance2025 || !F.avance2026 || !F.avance2027) return [];
    
    const avanceData = filtered.reduce((acc, row) => {
      const dependencia = F.dependencia ? String(row[F.dependencia] ?? 'Sin Dependencia') : 'Sin Dependencia';
      
      if (!acc[dependencia]) {
        acc[dependencia] = {
          '2024': 0,
          '2025': 0,
          '2026': 0,
          '2027': 0
        };
      }
      
      // Sumar avances por año
      if (F.avance2024) acc[dependencia]['2024'] += parseFloat(String(row[F.avance2024] ?? 0)) || 0;
      if (F.avance2025) acc[dependencia]['2025'] += parseFloat(String(row[F.avance2025] ?? 0)) || 0;
      if (F.avance2026) acc[dependencia]['2026'] += parseFloat(String(row[F.avance2026] ?? 0)) || 0;
      if (F.avance2027) acc[dependencia]['2027'] += parseFloat(String(row[F.avance2027] ?? 0)) || 0;
      
      return acc;
    }, {} as Record<string, Record<string, number>>);
    
    return Object.entries(avanceData).map(([dependencia, avances]) => ({
      name: dependencia,
      ...avances
    }));
  }, [filtered]);

  // Dataset para gráfico de presupuesto por año
  const presupuestoDataset = useMemo(() => {
    if (!F.presupuestoEjecutado2024 || !F.presupuestoEjecutado2025 || !F.presupuestoEjecutado2026 || !F.presupuestoEjecutado2027) return [];
    
    const presupuestoData = filtered.reduce((acc, row) => {
      const dependencia = F.dependencia ? String(row[F.dependencia] ?? 'Sin Dependencia') : 'Sin Dependencia';
      
      if (!acc[dependencia]) {
        acc[dependencia] = {
          '2024': 0,
          '2025': 0,
          '2026': 0,
          '2027': 0
        };
      }
      
      // Sumar presupuestos por año
      if (F.presupuestoEjecutado2024) acc[dependencia]['2024'] += parseFloat(String(row[F.presupuestoEjecutado2024] ?? 0)) || 0;
      if (F.presupuestoEjecutado2025) acc[dependencia]['2025'] += parseFloat(String(row[F.presupuestoEjecutado2025] ?? 0)) || 0;
      if (F.presupuestoEjecutado2026) acc[dependencia]['2026'] += parseFloat(String(row[F.presupuestoEjecutado2026] ?? 0)) || 0;
      if (F.presupuestoEjecutado2027) acc[dependencia]['2027'] += parseFloat(String(row[F.presupuestoEjecutado2027] ?? 0)) || 0;
      
      return acc;
    }, {} as Record<string, Record<string, number>>);
    
    return Object.entries(presupuestoData).map(([dependencia, presupuestos]) => ({
      name: dependencia,
      ...presupuestos
    }));
  }, [filtered]);

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

    console.log('Obras con coordenadas encontradas (Escenarios Deportivos):', obrasConCoordenadas.length);
    console.log('Total de obras filtradas (Escenarios Deportivos):', filtered.length);

    // Agrupar por dependencia para organización visual por colores
    const groupedByDependency = obrasConCoordenadas.reduce((acc, obra) => {
      const dependencia = F.dependencia ? String(obra[F.dependencia] ?? 'Sin Dependencia') : 'Sin Dependencia';
      if (!acc[dependencia]) {
        acc[dependencia] = [];
      }
      acc[dependencia].push(obra);
      return acc;
    }, {} as Record<string, Row[]>);

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

  const showLegend = true;

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
      <Navigation showBackButton={true} title="Dashboard - Escenarios Deportivos" />
      
      {/* Iconos del header */}
      <HeaderIcons rows={rows} filtered={filtered} />

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
              <h3>Cargando datos de Escenarios Deportivos...</h3>
              <p>Por favor espera mientras se procesan las obras deportivas</p>
            </div>
          </div>
        )}

        {/* ========================================================================
             SECCIÓN DE FILTROS - PRIMERA POSICIÓN
         ======================================================================== */}
        <div className="filters-section">
          <div className="filters-container">
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

            {/* Filtros de fecha */}
            {(F.fechaRealDeEntrega || F.fechaEstimadaDeEntrega) && (
              <>
                <div className="filter-group date-filter-group">
                  <label className="filter-label">Fecha desde</label>
                  <div className="date-inputs">
                    <select
                      className="filter-select date-day"
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
                      className="filter-select date-month"
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
                      className="filter-select date-year"
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
                  <label className="filter-label">Fecha hasta</label>
                  <div className="date-inputs">
                    <select
                      className="filter-select date-day"
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
                      className="filter-select date-month"
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
                      className="filter-select date-year"
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
              </>
            )}
          </div>
        </div>

        {/* ========================================================================
             SECCIÓN DE KPIs - SEGUNDA POSICIÓN
         ======================================================================== */}
        <div className="kpis-section">
          <div className="kpis-container">
            {/* Fila única: 5 KPIs compactos */}
            <div className="kpis-grid kpis-row-5">
              <Kpi 
                label="Total escenarios deportivos" 
                value={k.totalObras} 
                trend="neutral"
              />
              <Kpi 
                label="Inversión total deportiva" 
                value={k.invTotal} 
                format="money" 
                abbreviate 
                digits={1}
                subtitle={`${Math.round(k.pctEjec * 100)}% ejecutado`}
                trend="up"
              />
              <Kpi 
                label="Presupuesto ejecutado" 
                value={k.ejec} 
                format="money" 
                abbreviate
                digits={1}
                subtitle={`${Math.round(k.pctEjec * 100)}% de la inversión`}
                trend="up"
              />
              <Kpi 
                label="Escenarios entregados" 
                value={k.entregadas} 
                subtitle={`${Math.round(k.pctEntregadas * 100)}% del total`}
                trend="up"
              />
              <Kpi 
                label="Alertas deportivas" 
                value={k.alertas}
                trend={k.alertas > 0 ? 'down' : 'neutral'}
                subtitle={k.alertas > 0 ? 'Atención requerida' : 'Sin alertas'}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================
             PANEL PRINCIPAL DEL MAPA - TERCERA POSICIÓN
         ======================================================================== */}
        <div className="map-main-panel">
          
          {/* Leyenda del mapa con colores por dependencia (opcional) */}
          {showLegend && (
          <div className="map-legend">
            <h4>Leyenda por Dependencia - Escenarios Deportivos:</h4>
            <div className="legend-items">
              {Object.keys(mapData).map((dependencia) => (
                <div key={dependencia} className="legend-item">
                  <div 
                    className="legend-color" 
                      style={{ backgroundColor: dependencyColorMap[dependencia] }}
                  ></div>
                  <span className="legend-text">{dependencia}</span>
                </div>
              ))}
            </div>
          </div>
          )}
          
          {/* Mapa principal: responsive y conectado a filtros externos */}
          <div style={{ height: '60vh', minHeight: 380, width: '100%' }}>
            <MapLibreVisor height={'100%'} query={new URLSearchParams({
              ...(filters.estadoDeLaObra ? { estado: String(filters.estadoDeLaObra) } : {}),
              ...(filters.dependencia ? { dependencia: String(filters.dependencia) } : {}),
              // Filtro específico para escenarios deportivos
              proyectoEstrategico: 'Escenarios Deportivos',
              ...(filters.comuna ? { comunaCodigo: String(filters.comuna) } : {}),
            })} />
          </div>
        </div>

        {/* ========================================================================
             TABLA DE VIGENCIAS - CUARTA POSICIÓN
         ======================================================================== */}
        <div className="table-card" style={{ marginBottom: 30 }}>
          <VigenciasTable data={vigencias} />
        </div>

        {/* ========================================================================
             SECCIÓN DE CONTENIDO INFERIOR - GRÁFICOS Y TABLAS
         ======================================================================== */}
        <div className="content-section" style={{ display: 'block' }}>
          {/* Gráfico principal de análisis */}
          {simpleChartData.length > 0 && (
            <div className="main-chart-section">
              <SimpleBarChart
                title="Inversión Total vs Presupuesto Ejecutado - Escenarios Deportivos"
                data={simpleChartData}
                seriesNames={['Inversión Total', 'Presupuesto Ejecutado']}
                width={1200}
                height={500}
                showLegend={true}
                formatValue={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
            </div>
          )}

        </div>

        {/* Indicador de estado de carga */}
        <div className="status-indicator">
          <span className="status-icon">⚽</span>
          {status} - Escenarios Deportivos
        </div>
      </div>

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
          padding: 120px 20px 20px 20px;
          max-width: 1600px;
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
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.15);
          border: 2px solid ${CORPORATE_COLORS.primary};
        }

        .filters-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          align-items: end;
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
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-select, .filter-input {
          padding: 14px 16px;
          border: 2px solid ${CORPORATE_COLORS.primary};
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          color: ${CORPORATE_COLORS.darkGray};
          box-shadow: 0 2px 8px rgba(121, 188, 153, 0.1);
          width: 100%;
          box-sizing: border-box;
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

        /* ========================================================================
            SECCIÓN DE KPIs - DISEÑO MEJORADO
        ======================================================================== */
        .kpis-section {
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, rgba(212, 230, 241, 0.3) 0%, rgba(232, 244, 248, 0.3) 100%);
          border-radius: 25px;
          border: 1px solid rgba(121, 188, 153, 0.2);
        }

        .kpis-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .kpis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 18px;
        }

        /* Estilos para las tarjetas de KPI - Colores corporativos */
        .kpis-grid .kpi {
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%) !important;
          color: white !important;
          border-radius: 20px !important;
          padding: 25px !important;
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.25) !important;
          border: 2px solid rgba(255, 255, 255, 0.2) !important;
          transition: all 0.3s ease !important;
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
          font-size: 0.9rem !important;
          font-weight: 600 !important;
          color: rgba(255, 255, 255, 0.9) !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          margin-bottom: 8px !important;
        }

        .kpis-grid .kpi .kpi-value {
          font-size: 1.6rem !important;
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
        }

        /* Estilos específicos para cada fila de KPIs */
        .kpis-row-1 { grid-template-columns: repeat(2, 1fr); }
        .kpis-row-2 { grid-template-columns: repeat(2, 1fr); }
        .kpis-row-5 { grid-template-columns: repeat(5, 1fr); }

        .kpis-row-3 {
          grid-template-columns: repeat(1, 1fr);
          max-width: 400px;
          margin: 0 auto;
        }

        /* ========================================================================
            SECCIÓN DE CONTENIDO INFERIOR
        ======================================================================== */
        .content-section {
          margin-bottom: 40px;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 30px;
          margin-bottom: 30px;
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
            DISEÑO RESPONSIVE
        ======================================================================== */
        @media (max-width: 1200px) {
          .kpis-row-5 { grid-template-columns: repeat(4, 1fr); }
          .filters-container {
            grid-template-columns: repeat(3, 1fr);
          }
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
            gap: 25px;
          }
          .tables-grid {
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
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

          .kpis-section {
            padding: 20px;
            margin-bottom: 25px;
          }

          .kpis-container {
            gap: 20px;
          }

          .kpis-grid { grid-template-columns: 1fr; gap: 15px; }
          .kpis-row-5 { grid-template-columns: repeat(2, 1fr); }

          .kpis-grid .kpi {
            padding: 20px !important;
          }

          .kpis-grid .kpi .kpi-value { font-size: 1.4rem !important; }

          .kpis-grid .kpi .kpi-label {
            font-size: 0.8rem !important;
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

          .chart-card, .table-card {
            padding: 20px;
          }

          .content-section {
            margin-bottom: 25px;
          }

          .charts-grid {
            grid-template-columns: 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }

          .tables-grid {
            grid-template-columns: 1fr;
            gap: 20px;
            margin-top: 20px;
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

          .kpis-section {
            padding: 15px;
            margin-bottom: 20px;
          }

          .kpis-container { gap: 15px; }

          .kpis-grid { gap: 12px; }
          .kpis-row-5 { grid-template-columns: 1fr; }

          .kpis-grid .kpi {
            padding: 18px !important;
          }

          .kpis-grid .kpi .kpi-value { font-size: 1.3rem !important; }

          .kpis-grid .kpi .kpi-label {
            font-size: 0.75rem !important;
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

          .chart-card, .table-card {
            padding: 15px;
          }

          .content-section {
            margin-bottom: 20px;
          }

          .charts-grid {
            gap: 15px;
            margin-bottom: 15px;
          }

          .tables-grid {
            gap: 15px;
            margin-top: 15px;
          }
        }

        /* Estilos para los inputs de fecha tipo calendario */
        .date-inputs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          align-items: end;
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
      `}</style>
    </div>
  );
};

export default EscenariosDeportivosDashboard;
