import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

import { F } from '../dataConfig';
// import type * as GeoJSON from 'geojson';
import {
  applyFilters,
  kpis,
  buildTwoSeriesDataset,
  getFilterOptions,
  // toNumber,
  extractYearFrom,
  // cleanDependentFilters, // TEMPORALMENTE DESHABILITADO
  type Row,
  type Filters,
  computeVigencias,
  formatMoneyColombian
} from '../utils/utils/metrics';

// Reemplazo de KPIs por tarjetas compactas con CountUp
import CountUp from 'react-countup';
import ComboBars from '../components/comboBars';
import SimpleBarChart from '../components/SimpleBarChart';
import WorksTable from '../components/WorksTable';
import AlertsTable from '../components/AlertsTable';
import Navigation from '../components/Navigation';
import MapLibreVisor from '../components/MapLibreVisor';
import VigenciasTable from '../components/VigenciasTable';
import HeaderIcons from '../components/HeaderIcons';
import ImprovedMultiSelect from '../components/ImprovedMultiSelect';

//

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
type UIFilters = {
  proyecto?: string[];
  subproyecto?: string[];
  comuna?: string[];
  dependencia?: string[];
  tipo?: string[];
  estadoDeLaObra?: string[];
  contratista?: string[];
  nombre?: string[];
  desde?: string; // 'YYYY' o 'YYYY-MM'
  hasta?: string; // 'YYYY' o 'YYYY-MM'
  // Campos UI para construir fechas sin romper tipado
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
  
  // Función para contar filtros activos (que no sean undefined o vacíos)
  const getActiveFiltersCount = (filters: UIFilters): number => {
    return Object.keys(filters).filter(key => {
      const value = filters[key as keyof UIFilters];
      return value !== undefined && value !== '';
    }).length;
  };
  
  // Logging para rastrear cambios de estado
  useEffect(() => {
    // Filtros actualizados
  }, [filters]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showMainChart, setShowMainChart] = useState(true);
  const [showMap, setShowMap] = useState(true);
  // Prefiere animación reducida (reservado por si se necesita):
  useReducedMotion?.();
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
        console.log('🔄 Iniciando carga de datos...');
        
        const sres = await fetch('/api/sheets');
        console.log('📋 Respuesta /api/sheets:', sres.status, sres.ok);
        
        if (!sres.ok) {
          throw new Error(`Error ${sres.status}: No se pudo cargar /api/sheets`);
        }
        
        const { sheets } = await sres.json();
        console.log('📋 Hojas disponibles:', sheets);
        const hoja = sheets.includes('Obras') ? 'Obras' : sheets[0];
        console.log('📋 Hoja seleccionada:', hoja);
        
        const dres = await fetch(`/api/data?sheet=${encodeURIComponent(hoja)}`);
        console.log('📊 Respuesta /api/data:', dres.status, dres.ok);
        
        if (!dres.ok) {
          throw new Error(`Error ${dres.status}: No se pudo cargar /api/data`);
        }
        
        const { rows } = await dres.json();
        console.log('📊 Datos cargados:', rows.length, 'filas');
        console.log('📊 Primeras 3 filas:', rows.slice(0, 3));
        
        setRows(rows);
        setStatus(`${rows.length} filas cargadas exitosamente`);
      } catch (e) {
        console.error('❌ Error al cargar datos:', e);
        setStatus(`Error: ${e instanceof Error ? e.message : 'Error desconocido'}`);
      }
    })();
  }, []);

  // (Ya no se usa el flag isMobileStack)

  // (El visor de MapLibre maneja la carga de límites de comunas)

  // ============================================================================
  // CÁLCULOS Y FILTRADO DE DATOS
  // ============================================================================
  
  // Función para combinar los campos de fecha en formato YYYY-MM-DD
  const combineDateFields = (filters: UIFilters): Filters => {
    const newFilters: Filters = { 
      proyecto: filters.proyecto,
      subproyecto: filters.subproyecto,
      comuna: filters.comuna,
      dependencia: filters.dependencia,
      tipo: filters.tipo,
      estadoDeLaObra: filters.estadoDeLaObra,
      contratista: filters.contratista
    };
    
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

  const opciones = useMemo(() => {
    return getFilterOptions(rows, filters);
  }, [rows, filters]);
  const combinedFilters = useMemo(() => {
    return combineDateFields(filters);
  }, [filters]);
  const filtered = useMemo(() => {
    const result = applyFilters(rows, combinedFilters);
    console.log('🔍 Datos después de aplicar filtros:', result.length, 'de', rows.length, 'total');
    return result;
  }, [rows, combinedFilters]);

  // Nota: Se eliminó el filtro por período 2024-2027 para mostrar todas las obras
  // Los KPIs ahora se calculan sobre todos los datos filtrados

  // Calcular KPIs sobre TODOS los datos filtrados, no solo 2024-2027
  const k = useMemo(() => {
    const result = kpis(filtered); // Cambiado de filtered2024_2027 a filtered
    console.log('📊 KPIs calculados:', {
      totalObras: result.totalObras,
      invTotal: result.invTotal,
      ejec: result.ejec,
      pctEjec: result.pctEjec
    });
    return result;
  }, [filtered]); // Cambiado de filtered2024_2027 a filtered
  const vigencias = useMemo(() => {
    const rows = computeVigencias(filtered); // Cambiado de filtered2024_2027 a filtered
    const only = rows.filter(r => r.year >= 2024 && r.year <= 2027);
    try {
      // Log comparativo para validar con Power BI
      // year, estimatedCount, estimatedInvestment, realCount, realInvestment
      // Inversión real corresponde a Presupuesto ejecutado

      // Log de depuración para "Inversión estimada" 2024
      const debug2024 = filtered.filter(r => {
        // Buscar AÑO DE ENTREGA directamente o calcularlo
        const añoEntrega = r['AÑO DE ENTREGA'] ? extractYearFrom(r['AÑO DE ENTREGA']) : null;
        if (añoEntrega === 2024) return true;
        
        // Fallback: calcular desde fecha estimada
        const fechaEstimada = F.fechaEstimadaDeEntrega ? String(r[F.fechaEstimadaDeEntrega] ?? '') : '';
        const yearMatch = fechaEstimada.match(/\b(\d{4})\b/);
        return yearMatch && Number(yearMatch[1]) === 2024;
      });
      console.log(`📊 Obras con AÑO DE ENTREGA = 2024: ${debug2024.length}`);
      
      // const sumaCostoCorregido = debug2024.reduce((sum, r) => {
      //   const costo = r['Costo total actualizado corregido'] ? 
      //     toNumber(r['Costo total actualizado corregido']) : 
      //     (F.costoTotalActualizado ? toNumber(r[F.costoTotalActualizado]) : 0);
      //   return sum + costo;
      // }, 0);
      
      // Mostrar algunas obras de ejemplo
      
      // Debug para "Inversión real" 2024
      const debugReal2024 = filtered.filter(r => {
        const entregada = String((F.obraEntregada ? r[F.obraEntregada] : '') ?? '').toLowerCase().trim();
        if (entregada !== 'si' && entregada !== 'sí') return false;
        
        const añoReal = r['AÑO DE ENTREGA REAL'] ? extractYearFrom(r['AÑO DE ENTREGA REAL']) : null;
        if (añoReal === 2024) return true;
        
        // Fallback: calcular desde fecha real
        const fechaReal = F.fechaRealDeEntrega ? String(r[F.fechaRealDeEntrega] ?? '') : '';
        const yearMatch = fechaReal.match(/\b(\d{4})\b/);
        return yearMatch && Number(yearMatch[1]) === 2024;
      });
      
      console.log(`📊 Obras entregadas con AÑO DE ENTREGA REAL = 2024: ${debugReal2024.length}`);
      
      const sumaPresupuestoEjecutado = debugReal2024.reduce((sum, r) => {
        return sum + Number(r[F.presupuestoEjecutado] ?? 0);
      }, 0);
      console.log(`💰 Suma PRESUPUESTO EJECUTADO: ${sumaPresupuestoEjecutado}`);
      console.log(`🎯 Valor esperado Power BI: 172,10 mil M`);
      
      // Mostrar ejemplos de presupuesto ejecutado
      console.log('📋 Primeras 3 obras entregadas 2024:', debugReal2024.slice(0, 3).map(r => ({
        nombre: r[F.nombre],
        añoReal: r['AÑO DE ENTREGA REAL'],
        presupuestoEjecutado: r[F.presupuestoEjecutado],
        obraEntregada: r[F.obraEntregada]
      })));
    } catch (error) {
      console.error('Error en debug de vigencias:', error);
    }
    return only.sort((a, b) => a.year - b.year);
  }, [filtered]); // Cambiado de filtered2024_2027 a filtered

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
    // ✅ ARREGLADO: Obtener dependencias directamente de las obras filtradas
    const dependencias = Array.from(new Set(
      filtered.map(r => F.dependencia ? String(r[F.dependencia] ?? 'Sin Dependencia') : 'Sin Dependencia')
    )).sort();
    
    
    const total = dependencias.length || 1;
    const saturation = 72; // 0-100
    const lightness = 38;  // 0-100 (más bajo = más oscuro)
    const colorMap: Record<string, string> = {};
    dependencias.forEach((dep, idx) => {
      const hue = Math.round((idx * 360) / total);
      colorMap[dep] = hslToHex(hue, saturation, lightness);
    });
    
    return colorMap;
  }, [filtered]);

  // ============================================================================
  // (Marcadores individuales no usados en modo por comuna)

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
  const handleFilterChange = (filterKey: keyof UIFilters, value: string[]) => {
    // Si el array está vacío, limpiar el filtro
    const newValue = value.length === 0 ? undefined : value;
    
    const newFilters = { ...filters, [filterKey]: newValue };

    // NUEVO: Los filtros ahora se relacionan automáticamente
    // Las opciones se recalculan dinámicamente en el useMemo de 'opciones'
    setFilters(newFilters);
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
        onToggleChart={() => setShowMainChart(v => !v)}
        isChartVisible={showMainChart}
        onToggleMap={() => setShowMap(v => !v)}
        isMapVisible={showMap}
      />

      {/* Botón flotante para abrir el panel de filtros (derecha) */}
      <button
        className={`filters-fab${isFiltersOpen ? ' open' : ''}`}
        title={isFiltersOpen ? 'Cerrar filtros' : 'Abrir filtros'}
        onClick={() => setIsFiltersOpen(v => !v)}
        aria-expanded={isFiltersOpen}
        aria-controls="filtersDrawer"
      >
        {isFiltersOpen ? '✖ Cerrar' : '☰ Filtros'}
      </button>

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
            PANEL LATERAL DE FILTROS (COLAPSABLE A LA DERECHA)
         ======================================================================== */}
        <aside id="filtersDrawer" className={`filters-drawer${isFiltersOpen ? ' open' : ''}`} aria-hidden={!isFiltersOpen}>
          <div className="filters-actions drawer-header">
            <h3 className="drawer-title">Filtros</h3>
            <div className="filters-status">
              {getActiveFiltersCount(filters) > 0 ? (
                <span className="filters-active">
                  <span className="status-icon">🔍</span>
                  Filtros activos ({getActiveFiltersCount(filters)})
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
              disabled={getActiveFiltersCount(filters) === 0}
            >
              <span className="btn-icon" aria-hidden>✖</span>
              Borrar filtros
            </button>
            <button className="drawer-close-btn" aria-label="Cerrar filtros" onClick={() => setIsFiltersOpen(false)}>✖</button>
          </div>
          <div className="drawer-scroll">
          {/* Primera fila de filtros */}
          <div className="filters-container filters-row-main">
            {/* Filtro: Proyectos estratégicos */}
            {F.proyectoEstrategico && (
              <ImprovedMultiSelect
                label="PROYECTOS ESTRATÉGICOS"
                options={opciones.proyectos}
                selectedValues={filters.proyecto || []}
                onSelectionChange={(values) => {
                  handleFilterChange('proyecto', values);
                }}
                placeholder="Todos los proyectos"
              />
            )}

            {/* Filtro: Subproyecto estratégico */}
            {F.subproyectoEstrategico && (
              <ImprovedMultiSelect
                label="SUBPROYECTO"
                options={opciones.subproyectos}
                selectedValues={filters.subproyecto || []}
                onSelectionChange={(values) => handleFilterChange('subproyecto', values)}
                placeholder="Todos los subproyectos"
              />
            )}

            {/* Filtro: Dependencia */}
            {F.dependencia && (
              <ImprovedMultiSelect
                label="DEPENDENCIA"
                options={opciones.dependencias}
                selectedValues={filters.dependencia || []}
                onSelectionChange={(values) => handleFilterChange('dependencia', values)}
                disabled={opciones.dependencias.length === 0}
                placeholder="Todas las dependencias"
              />
            )}

            {/* Filtro: Comuna / Corregimiento */}
            {F.comunaOCorregimiento && (
              <ImprovedMultiSelect
                label="COMUNA / CORREGIMIENTO"
                options={opciones.comunas}
                selectedValues={filters.comuna || []}
                onSelectionChange={(values) => handleFilterChange('comuna', values)}
                disabled={opciones.comunas.length === 0}
                placeholder="Todas las comunas"
              />
            )}
            {/* Filtro: Obra (Nombre) */}
            {F.nombre && (
              <ImprovedMultiSelect
                label="NOMBRE DE LA OBRA"
                options={opciones.nombres}
                selectedValues={filters.nombre || []}
                onSelectionChange={(values) => handleFilterChange('nombre', values)}
                disabled={opciones.nombres.length === 0}
                placeholder="Todas las obras"
              />
            )}
          </div>

          {/* Segunda fila de filtros */}
          <div className="filters-container filters-row-secondary">
            {/* Filtro: Tipo de Intervención */}
            {F.tipoDeIntervecion && (
              <ImprovedMultiSelect
                label="TIPO DE INTERVENCIÓN"
                options={opciones.tipos}
                selectedValues={filters.tipo || []}
                onSelectionChange={(values) => handleFilterChange('tipo', values)}
                disabled={opciones.tipos.length === 0}
                placeholder="Todos los tipos"
              />
            )}

            {/* Filtro: Contratista */}
            {F.contratistaOperador && (
              <ImprovedMultiSelect
                label="CONTRATISTA"
                options={opciones.contratistas || []}
                selectedValues={filters.contratista || []}
                onSelectionChange={(values) => handleFilterChange('contratista', values)}
                disabled={opciones.contratistas?.length === 0}
                placeholder="Todos los contratistas"
              />
            )}

            {/* Filtro: Estado de la Obra */}
            <ImprovedMultiSelect
              label="ESTADO DE LA OBRA"
              options={opciones.estadoDeLaObra}
              selectedValues={filters.estadoDeLaObra || []}
              onSelectionChange={(values) => handleFilterChange('estadoDeLaObra', values)}
              placeholder="Todos los estados"
            />
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
        <div className="drawer-footer">
            <button className="apply-filters-btn" onClick={() => setIsFiltersOpen(false)}>Aplicar y cerrar</button>
          </div>
        </aside>
        {/* Fondo semitransparente al abrir el drawer */}
        {isFiltersOpen && <div className="filters-backdrop" onClick={() => setIsFiltersOpen(false)} />}

        {/* ========================================================================
             SECCIÓN DE KPIs - DISEÑO COMO EN LA IMAGEN
         ======================================================================== */}
        <div className="main-dashboard-section">
          {/* Tarjeta de Presupuestos ocupando el espacio de los KPIs */}
          {(() => {
            const presupuestoEjecutado = k.ejec;
            const presupuestoCuatrienio = k.valorCuatrienio2024_2027;
            const presupuestoAnteriores = Math.max(0, presupuestoEjecutado - presupuestoCuatrienio);
            const invTotal = k.invTotal || 1;
            const pctEjecSobreTotal = Math.round((presupuestoEjecutado / invTotal) * 100);
            const pctCuatSobreTotal = Math.round((presupuestoCuatrienio / invTotal) * 100);
            const pctAntSobreTotal = Math.round((presupuestoAnteriores / invTotal) * 100);
            return (
              <div className="budget-summary-card">
                <div className="modern-kpis-row">
                  <div className="modern-kpi modern-kpi-blue">
                    <div className="modern-kpi-content">
                      <div className="modern-kpi-info">
                        <div className="modern-kpi-label">Total de Obras</div>
                        <div className="modern-kpi-value"><CountUp end={k.totalObras} duration={1.0} separator="." /></div>
                      </div>
                      <div className="modern-kpi-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21H21M19 21H13.5M5 21H3M5 21H10.5M10.5 21V15.5C10.5 15.2239 10.7239 15 11 15H13C13.2761 15 13.5 15.2239 13.5 15.5V21M10.5 21H13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 7H9.01M9 11H9.01M15 7H15.01M15 11H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="modern-kpi modern-kpi-green">
                    <div className="modern-kpi-content">
                      <div className="modern-kpi-info">
                        <div className="modern-kpi-label">Obras Entregadas</div>
                        <div className="modern-kpi-value"><CountUp end={k.entregadas} duration={1.0} separator="." /></div>
                        <div className="modern-kpi-subtitle">{Math.round(k.pctEntregadas * 100)}% del total</div>
                      </div>
                      <div className="modern-kpi-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="modern-kpi modern-kpi-green-light">
                    <div className="modern-kpi-content">
                      <div className="modern-kpi-info">
                        <div className="modern-kpi-label">Inversión total</div>
                        <div className="modern-kpi-value">{formatMoneyColombian(k.invTotal)}</div>
                      </div>
                      <div className="modern-kpi-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modern-budget-row">
                  <div className="modern-budget-item modern-budget-blue">
                    <div className="modern-budget-header">
                      <span className="modern-budget-title">Presupuesto ejecutado</span>
                      <span className="modern-budget-badge">{pctEjecSobreTotal}%</span>
                    </div>
                    <div className="modern-budget-value">
                      {formatMoneyColombian(presupuestoEjecutado)}
                    </div>
                  </div>
                  
                  <div className="modern-budget-item modern-budget-dark">
                    <div className="modern-budget-header">
                      <span className="modern-budget-title">Presupuesto 2024-2027</span>
                      <span className="modern-budget-badge">{pctCuatSobreTotal}%</span>
                    </div>
                    <div className="modern-budget-value">
                      {formatMoneyColombian(presupuestoCuatrienio)}
                    </div>
                  </div>
                  
                  <div className="modern-budget-item modern-budget-green">
                    <div className="modern-budget-header">
                      <span className="modern-budget-title">Presupuesto administraciones anteriores</span>
                      <span className="modern-budget-badge">{pctAntSobreTotal}%</span>
                    </div>
                    <div className="modern-budget-value">
                      {formatMoneyColombian(presupuestoAnteriores)}
                    </div>
                  </div>
                </div>
                {/* Se elimina tarjeta de Alertas y se reordena Inversión total arriba */}
              </div>
            );
          })()}

          {/* (Se eliminó la fila separada de chips; ahora se integran en la misma tarjeta) */}

          {/* (El bloque anterior ahora ocupa el lugar de los KPIs, así que se elimina el duplicado aquí) */}

          {/* Separador visual */}
          <div className="dashboard-separator"></div>

          {/* Mapa principal dentro del tablero */}
          {showMap && (
          <div className="map-main-panel">
            <button
              className="map-close-btn"
              aria-label="Ocultar mapa"
              title="Ocultar mapa"
              onClick={() => {
                setShowMap(false);
                if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              −
            </button>
            <div style={{ height: '60vh', minHeight: 380, width: '100%' }}>
              {(() => {
                const mapQuery = new URLSearchParams();

                if (combinedFilters.estadoDeLaObra) {
                  if (Array.isArray(combinedFilters.estadoDeLaObra)) {
                    combinedFilters.estadoDeLaObra.forEach(val => mapQuery.append('estadoDeLaObra', val));
                  } else {
                    mapQuery.set('estadoDeLaObra', String(combinedFilters.estadoDeLaObra));
                  }
                }
                if (combinedFilters.dependencia) {
                  if (Array.isArray(combinedFilters.dependencia)) {
                    combinedFilters.dependencia.forEach(val => mapQuery.append('dependencia', val));
                  } else {
                    mapQuery.set('dependencia', String(combinedFilters.dependencia));
                  }
                }
                if (combinedFilters.subproyecto) {
                  if (Array.isArray(combinedFilters.subproyecto)) {
                    combinedFilters.subproyecto.forEach(val => mapQuery.append('subproyectoEstrategico', val));
                  } else {
                    mapQuery.set('subproyectoEstrategico', String(combinedFilters.subproyecto));
                  }
                }
                if (combinedFilters.proyecto) {
                  if (Array.isArray(combinedFilters.proyecto)) {
                    combinedFilters.proyecto.forEach(val => mapQuery.append('proyectoEstrategico', val));
                  } else {
                    mapQuery.set('proyectoEstrategico', String(combinedFilters.proyecto));
                  }
                }
                if (combinedFilters.comuna) {
                  if (Array.isArray(combinedFilters.comuna)) {
                    combinedFilters.comuna.forEach(val => mapQuery.append('comuna', val));
                  } else {
                    mapQuery.set('comuna', String(combinedFilters.comuna));
                  }
                }
                if (combinedFilters.tipo) {
                  if (Array.isArray(combinedFilters.tipo)) {
                    combinedFilters.tipo.forEach(val => mapQuery.append('tipo', val));
                  } else {
                    mapQuery.set('tipo', String(combinedFilters.tipo));
                  }
                }
                if (combinedFilters.contratista) {
                  if (Array.isArray(combinedFilters.contratista)) {
                    combinedFilters.contratista.forEach(val => mapQuery.append('contratista', val));
                  } else {
                    mapQuery.set('contratista', String(combinedFilters.contratista));
                  }
                }
                if (combinedFilters.desde) {
                  mapQuery.set('desde', String(combinedFilters.desde));
                }
                if (combinedFilters.hasta) {
                  mapQuery.set('hasta', String(combinedFilters.hasta));
                }

                const obrasParaMapa = filtered.map(row => ({ ...row, id: String(row.id || row.ID || '') }));
                return <MapLibreVisor height={'100%'} query={mapQuery} filteredObras={obrasParaMapa} />;
              })()}
            </div>
          </div>
          )}

          {/* Lista de dependencias como en la imagen */}
          {showMap && (
          <div className="dependencies-section">
            <div className="dependencies-list">
              {Object.keys(mapData).map((dependencia) => (
                <div key={dependencia} className="dependency-item">
                  <span
                    className="dependency-dot"
                    style={{ backgroundColor: dependencyColorMap[dependencia] }}
                  />
                  <span className="dependency-name">{dependencia}</span>
                </div>
              ))}
            </div>
          </div>
          )}
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
        {simpleChartData.length > 0 && showMainChart && (
          <div className="main-chart-section">
            <button
              className="chart-close-btn"
              aria-label="Ocultar gráfico"
              title="Ocultar gráfico"
              onClick={() => {
                setShowMainChart(false);
                if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              −
            </button>
            <SimpleBarChart
              title="Inversión Total vs Presupuesto Ejecutado"
              data={simpleChartData}
              seriesNames={['Inversión Total', 'Presupuesto Ejecutado']}
              width={1200}
              height={500}
              showLegend={true}
                  formatValue={(value: number) => `$${(value / 1000000).toFixed(1)}M`}
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


      {/* ========================================================================
           ESTILOS CSS - DISEÑO MODERNO CON COLORES CORPORATIVOS
       ======================================================================== */}
      <style>{`
        /* ========================================================================
            ESTILOS GENERALES DEL DASHBOARD
        ======================================================================== */
        .dashboard-container {
          min-height: 100vh;
          background: #f5eeee;
          font-family: 'Metropolis', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
          background: var(--white);
          border-radius: 20px;
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.15);
          border: 2px solid var(--primary-green);
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
          border-top-color: var(--primary-green);
          border-radius: 50%;
          animation: spin 1.5s linear infinite;
        }

        .spinner-ring:nth-child(1) {
          border-top-color: var(--primary-green);
          animation-delay: -0.8s;
        }

        .spinner-ring:nth-child(2) {
          border-top-color: var(--primary-blue);
          animation-delay: -0.4s;
        }

        .spinner-ring:nth-child(3) {
          border-top-color: var(--secondary-blue);
          animation-delay: 0s;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          text-align: center;
          color: var(--text-dark);
        }

        .loading-text h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--secondary-blue);
        }

        .loading-text p {
          font-size: 0.9rem;
          color: var(--text-light);
        }

        /* ========================================================================
            SECCIÓN DE FILTROS - DISEÑO MEJORADO
        ======================================================================== */
        /* Drawer lateral de filtros */
        .filters-drawer {
          position: fixed;
          top: 90px;
          left: 0;
          width: min(620px, 96vw);
          height: calc(100vh - 100px);
          background: #FFFFFF;
          border-right: 2px solid #E9ECEF;
          box-shadow: 12px 0 30px rgba(0, 0, 0, 0.2),
                      8px 0 20px rgba(0, 0, 0, 0.12),
                      4px 0 10px rgba(0, 0, 0, 0.08);
          border-top-right-radius: 12px;
          border-bottom-right-radius: 12px;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
          z-index: 1200;
          display: flex;
          flex-direction: column;
        }

        .filters-drawer.open {
          transform: translateX(0);
        }

        .drawer-scroll {
          padding: 20px;
          overflow-y: auto;
          overflow-x: hidden;
          flex: 1 1 auto;
        }

        .drawer-footer {
          padding: 12px 16px;
          border-top: 1px solid #E9ECEF;
          background: #fafafa;
          position: sticky;
          bottom: 0;
          z-index: 2;
          box-shadow: 0 -6px 16px rgba(0,0,0,0.06);
        }

        .apply-filters-btn {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--primary-green);
          background: #00904c;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        .filters-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.25);
          z-index: 1100;
        }

        /* Botón flotante para abrir/cerrar filtros */
        .filters-fab {
          position: fixed;
          top: 96px;
          left: 16px;
          background: var(--brand-green-500);
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 10px 16px;
          font-weight: 700;
          box-shadow: 0 8px 18px rgba(0,0,0,0.18);
          cursor: pointer;
          z-index: 1250;
        }

        .filters-fab.open {
          background: var(--brand-red-500);
          opacity: 0;
          pointer-events: none;
        }

        .drawer-header { gap: 8px; position: sticky; top: 0; background: #fff; z-index: 2; padding-top: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.06); }
        .drawer-title { margin: 0; font-size: 1rem; color: #2C3E50; font-weight: 700; }
        .drawer-close-btn { margin-left: auto; background: transparent; border: none; color: #2C3E50; font-size: 18px; cursor: pointer; }

        /* Optimiza el grid de filtros dentro del drawer */
        .filters-drawer .filters-row-main,
        .filters-drawer .filters-row-secondary {
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .filters-drawer .filters-row-dates {
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .filters-drawer .filter-group { min-width: 0; }
        .filters-drawer .improved-multi-select { width: 100%; }

        @media (min-width: 1400px) {
          .filters-drawer { width: 700px; }
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
          background: #FFB6C1;
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
          background: #C8E6C9;
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
          border: 1px solid var(--primary-green);
          background: #ffffff;
          color: var(--secondary-blue);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 6px rgba(121, 188, 153, 0.08);
        }

        .clear-filters-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: var(--primary-blue);
          box-shadow: 0 6px 16px rgba(121, 188, 153, 0.18);
        }

        .clear-filters-btn:disabled {
          background: #F8F9FA;
          color: var(--text-light);
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
          color: var(--primary-green);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .filter-select, .filter-input {
          padding: 12px 14px;
          border: 1px solid var(--primary-green);
          border-radius: 10px;
          font-size: 0.95rem;
          transition: all 0.25s ease;
          background: var(--white);
          color: var(--text-dark);
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
          background: #E9ECEF;
          border-color: var(--text-light);
          color: var(--text-light);
          font-style: italic;
        }

        /* Estilo para opciones seleccionadas */
        .filter-select option:checked {
          background: var(--primary-green);
          color: white;
          font-weight: 600;
        }

        /* Estilo para la opción "Todos" */
        .filter-select option[value=""] {
          background: #F8F9FA;
          color: var(--text-light);
          font-style: italic;
          font-weight: 500;
        }

        .filter-select:focus, .filter-input:focus {
          outline: none;
          border-color: var(--secondary-blue);
          box-shadow: 0 0 0 4px rgba(59, 134, 134, 0.25);
          transform: translateY(-2px);
          background: var(--white);
        }

        .filter-select:hover, .filter-input:hover {
          border-color: var(--primary-blue);
          transform: translateY(-1px);
          background: var(--white);
        }

        /* ========================================================================
            FILTROS MÚLTIPLES - ESTILOS
        ======================================================================== */
        .multi-select-container {
          position: relative;
          width: 100%;
        }

        .multi-select-trigger {
          background: var(--white);
          border: 2px solid #79BC99;
          border-radius: 12px;
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
          min-height: 48px;
        }

        .multi-select-trigger:hover {
          border-color: #4E8484;
          background: #F0F8FF;
        }

        .multi-select-trigger.open {
          border-color: #3B8686;
          box-shadow: 0 0 0 3px rgba(59, 134, 134, 0.25);
        }

        .multi-select-trigger.disabled {
          background: #1a1d20;
          color: #6a6f73;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .multi-select-text {
          color: #2C3E50;
          font-weight: 500;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .multi-select-arrow {
          color: #3B8686;
          font-size: 12px;
          transition: transform 0.3s ease;
          margin-left: 8px;
        }

        .multi-select-trigger.open .multi-select-arrow {
          transform: rotate(180deg);
        }

        .multi-select-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #79BC99;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.2);
          z-index: 1000;
          max-height: 300px;
          overflow: hidden;
        }

        .multi-select-search {
          padding: 12px;
          border-bottom: 1px solid #E9ECEF;
        }

        .multi-select-search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #E9ECEF;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
        }

        .multi-select-search-input:focus {
          border-color: #79BC99;
          box-shadow: 0 0 0 2px rgba(121, 188, 153, 0.2);
        }

        .multi-select-actions {
          padding: 8px 12px;
          border-bottom: 1px solid #E9ECEF;
          display: flex;
          gap: 8px;
        }

        .multi-select-action-btn {
          background: #79BC99;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .multi-select-action-btn:hover {
          background: #4E8484;
        }

        .multi-select-action-btn.clear {
          background: #dc2626;
        }

        .multi-select-action-btn.clear:hover {
          background: #b91c1c;
        }

        .multi-select-options {
          max-height: 200px;
          overflow-y: auto;
          padding: 8px 0;
        }

        .multi-select-option {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .multi-select-option:hover {
          background-color: #F8F9FA;
        }

        .multi-select-option input[type="checkbox"] {
          margin-right: 12px;
          accent-color: #79BC99;
        }

        .multi-select-option-text {
          color: #2C3E50;
          font-size: 14px;
          flex: 1;
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
            SECCIÓN PRINCIPAL DEL DASHBOARD - DISEÑO COMO EN LA IMAGEN
        ======================================================================== */
        .main-dashboard-section {
          margin-bottom: 20px;
          background: #dbdbdb7b;
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
        }

        .kpis-main-grid {
          margin-bottom: 30px;
        }

        .kpis-main-row {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          align-items: stretch;
          width: 100%;
          overflow-x: auto;
        }
        
        .kpis-main-row > div {
          display: flex;
          flex-direction: column;
          height: 150px;
        }
        
        .kpis-main-row .kpi-wrapper {
          height: 100%;
        }

        .dashboard-separator {
          height: 1px;
          background: var(--brand-yellow-500);
          margin: 15px 0;
          border-radius: 1px;
        }

        .dependencies-section {
          background: #E8F4F8;
          border-radius: 12px;
          padding: 15px;
          border: 1px solid rgba(121, 188, 153, 0.3);
        }

        /* =====================
           NUEVOS KPIs COMPACTOS
           ===================== */
        .compact-kpis-row {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 14px;
        }
        .compact-kpi {
          border-radius: 14px;
          padding: 10px;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          min-height: 92px;
        }
        .compact-kpi.navy { background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); }
        .compact-kpi.green { background:#98C73B; color:#fff; }
        .compact-kpi-label { font-size: 0.72rem; font-weight: 700; opacity: 0.95; text-align:center; }
        .compact-kpi-value { font-size: 1.2rem; font-weight: 800; margin-top: 6px; text-align:center; }
        .compact-kpi-sub { font-size: 0.68rem; font-weight: 600; opacity: 0.9; margin-top: 6px; text-align:center; }

        @media (max-width: 1400px) {
          .compact-kpis-row { grid-template-columns: repeat(5, 1fr); }
        }
        @media (max-width: 1200px) {
          .compact-kpis-row { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .compact-kpis-row { grid-template-columns: repeat(2, 1fr); }
          .compact-kpi { min-height: 100px; padding: 12px; }
          .compact-kpi-value { font-size: 1.2rem; }
        }
        @media (max-width: 480px) {
          .compact-kpis-row { grid-template-columns: 1fr; }
          .compact-kpi { min-height: 96px; padding: 10px; }
          .compact-kpi-value { font-size: 1.1rem; }
        }

        /* =====================
           TARJETA: PRESUPUESTOS - DISEÑO MEJORADO
           ===================== */
        .budget-summary-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 32px;
          border: 2px solid #E5E7EB;
          box-shadow: 0 -2px 8px -2px rgba(0, 0, 0, 0.08),
                      0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-top: -30px;
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          transition: all 0.3s ease;
        }
        
        .budget-summary-card:hover {
          box-shadow: 0 -3px 10px -2px rgba(0, 0, 0, 0.1),
                      0 10px 15px -3px rgba(0, 0, 0, 0.2), 
                      0 4px 6px -2px rgba(0, 0, 0, 0.1),
                      0 20px 25px -5px rgba(0, 0, 0, 0.16);
          transform: translateY(-4px);
        }

        /* Estilos para tarjetas modernas con bordes redondeados */
        .modern-kpis-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .modern-kpi {
          border-radius: 40px;
          padding: 20px 28px;
          box-shadow: 0 -2px 8px -2px rgba(0, 0, 0, 0.08),
                      0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
          transition: all 0.3s ease;
          height: 100px;
          display: flex;
          align-items: center;
        }
        
        .modern-kpi:hover {
          transform: translateY(-4px);
          box-shadow: 0 -3px 10px -2px rgba(0, 0, 0, 0.1),
                      0 10px 15px -3px rgba(0, 0, 0, 0.2), 
                      0 4px 6px -2px rgba(0, 0, 0, 0.1),
                      0 20px 25px -5px rgba(0, 0, 0, 0.16);
        }
        
        .modern-kpi-blue {
          background: linear-gradient(135deg, #4A90A4 0%, #357A8E 100%);
          color: white;
        }
        
        .modern-kpi-green {
          background: linear-gradient(135deg, #7EC850 0%, #6BB13E 100%);
          color: white;
        }
        
        .modern-kpi-green-light {
          background: linear-gradient(135deg, #A2D45E 0%, #8BC34A 100%);
          color: white;
        }
        
        .modern-kpi-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 100%;
          gap: 20px;
        }
        
        .modern-kpi-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 8px;
        }
        
        .modern-kpi-label {
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.3px;
          line-height: 1.3;
          text-align: left;
        }
        
        .modern-kpi-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.1;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
          text-align: left;
        }
        
        .modern-kpi-subtitle {
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.75rem;
          font-weight: 500;
          line-height: 1.3;
          text-align: left;
        }
        
        .modern-kpi-icon {
          flex-shrink: 0;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.35;
        }
        
        .modern-kpi-icon svg {
          width: 100%;
          height: 100%;
          fill: none;
          color: white;
        }
        
        /* Estilos para tarjetas de presupuesto modernas más compactas */
        .modern-budget-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        
        .modern-budget-item {
          border-radius: 32px;
          padding: 20px 28px;
          box-shadow: 0 -2px 8px -2px rgba(0, 0, 0, 0.08),
                      0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
          transition: all 0.3s ease;
          height: 100px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 8px;
        }
        
        .modern-budget-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 -3px 10px -2px rgba(0, 0, 0, 0.1),
                      0 10px 15px -3px rgba(0, 0, 0, 0.2), 
                      0 4px 6px -2px rgba(0, 0, 0, 0.1),
                      0 20px 25px -5px rgba(0, 0, 0, 0.16);
        }
        
        .modern-budget-blue {
          background: linear-gradient(135deg, #4F9FFF 0%, #3B82F6 100%);
          color: white;
        }
        
        .modern-budget-dark {
          background: linear-gradient(135deg, #1E3A5F 0%, #0F2947 100%);
          color: white;
        }
        
        .modern-budget-green {
          background: linear-gradient(135deg, #B0D45E 0%, #9BC24A 100%);
          color: white;
        }
        
        .modern-budget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        
        .modern-budget-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1.3;
        }
        
        .modern-budget-badge {
          background: rgba(255, 255, 255, 0.25);
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
          backdrop-filter: blur(8px);
        }
        
        .modern-budget-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.2;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
        
        /* Media Queries - Responsive para tarjetas modernas */
        /* Pantallas grandes a medianas: mantener 3 columnas */
        @media (max-width: 1100px) and (min-width: 769px) {
          .modern-kpis-row,
          .modern-budget-row {
            grid-template-columns: repeat(2, 1fr);
          }
          
          /* Hacer que la tercera tarjeta de cada fila ocupe el espacio completo */
          .modern-kpis-row > div:nth-child(3) {
            grid-column: 1 / -1;
          }
          
          .modern-budget-row > div:nth-child(3) {
            grid-column: 1 / -1;
          }
        }
        
        @media (max-width: 768px) {
          .modern-kpis-row,
          .modern-budget-row {
            grid-template-columns: 1fr;
          }
          
          .modern-kpi,
          .modern-budget-item {
            height: auto;
            min-height: 90px;
            padding: 18px 24px;
          }
          
          .modern-kpi-value,
          .modern-budget-value {
            font-size: 1.5rem;
          }
          
          .modern-kpi-icon {
            width: 50px;
            height: 50px;
          }
          
          .modern-kpi-label,
          .modern-budget-title {
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 480px) {
          .modern-kpi,
          .modern-budget-item {
            border-radius: 24px;
            padding: 16px 20px;
          }
          
          .modern-kpi-value,
          .modern-budget-value {
            font-size: 1.25rem;
          }
          
          .modern-kpi-icon {
            width: 40px;
            height: 40px;
          }
          
          .modern-budget-badge {
            font-size: 0.7rem;
            padding: 3px 8px;
          }
        }

        .budget-grid-top,
        .budget-grid-bottom {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .budget-top-duo {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%);
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid #E5E7EB;
          min-height: 80px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
          transition: all 0.3s ease;
        }
        
        .budget-top-duo:hover {
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.10);
          transform: translateY(-2px);
        }
        
        .budget-top-duo .duo-cell {
          padding: 20px 16px;
          color: #0F172A;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          position: relative;
          transition: background 0.3s ease;
        }
        
        .budget-top-duo .duo-cell:hover {
          background: linear-gradient(135deg, #F0F8FF 0%, #FFFFFF 100%);
        }
        
        .budget-top-duo .duo-cell + .duo-cell {
          background: linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%);
          border-left: 2px solid #E5E7EB;
        }
        
        .budget-top-duo .duo-cell + .duo-cell:hover {
          background: linear-gradient(135deg, #F0F8FF 0%, #F8FAFC 100%);
        }
        .duo-title { 
          font-weight: 700; 
          font-size: 0.95rem; 
          color: #334155; 
          letter-spacing: 0.3px; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          justify-content: center; 
          width: 100%;
        }
        .duo-title.with-badge .pct-badge.small { position: absolute; right: 12px; top: 12px; margin-left: 0; }
        .duo-value { 
          font-size: 1.5rem; 
          font-weight: 800; 
          margin-top: 8px; 
          text-align: center; 
          color: #0F172A; 
          letter-spacing: -0.5px;
        }

        .pct-badge { background: var(--brand-green-500); color: #FFFFFF; font-weight: 800; font-size: 0.72rem; padding: 4px 9px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 2px 8px rgba(121,188,153,0.25); }
        .pct-badge.small { font-size: 0.68rem; padding: 3px 7px; }

        .budget-item {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px solid rgba(231,236,243,0.9);
          border-radius: 14px;
          padding: 12px;
          position: relative;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.12), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.06),
                      0 8px 12px -2px rgba(0, 0, 0, 0.1), 
                      inset 0 1px 0 rgba(255,255,255,0.6);
        }
        .budget-item.green-alt { background: rgba(255,255,255,0.7); min-height: 60px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }

        .budget-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .budget-title { font-weight: 800; color: #0F172A; font-size: 0.95rem; }
        .budget-value { font-size: 1.12rem; font-weight: 900; color:#0B1220; }

        .budget-integrated {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(231,236,243,0.9);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 10px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.6);
        }
        .integrated-top { background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; }
        .integrated-header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 4px; }
        .integrated-title { font-weight: 800; color:#0F172A; font-size: 0.92rem; }
        .integrated-value { font-size: 1.08rem; font-weight: 900; color:#0B1220; }
        .integrated-duo { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .integrated-cell { background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; }
        .integrated-cell.alt { background: #F8FAFC; }

        /* Hover elegante */
        .budget-item:hover, .integrated-cell:hover, .integrated-top:hover, .budget-top-duo .duo-cell:hover {
          box-shadow: 0 16px 30px rgba(15,23,42,0.12);
          transform: translateY(-2px);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        /* Tarjetas genéricas con glass */
        .chart-card, .table-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 24px;
          border: 2px solid var(--border);
          box-shadow: 0 -2px 8px -2px rgba(0, 0, 0, 0.08),
                      0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
          border-top: 4px solid var(--brand-blue-900);
          transition: all 0.3s ease;
        }
        .chart-card:hover, .table-card:hover { 
          box-shadow: 0 -3px 10px -2px rgba(0, 0, 0, 0.1),
                      0 10px 15px -3px rgba(0, 0, 0, 0.2), 
                      0 4px 6px -2px rgba(0, 0, 0, 0.1),
                      0 20px 25px -5px rgba(0, 0, 0, 0.16);
          transform: translateY(-3px); 
        }
        
        /* Filetes de acento por sección */
        .chart-card { border-top-color: var(--brand-blue-500); }
        .table-card { border-top-color: var(--brand-green-500); }
        .map-main-panel { border-top-color: var(--brand-yellow-500); }

        @media (max-width: 1200px) {
          .budget-top-duo { min-height: 58px; }
          .duo-title { font-size: 0.88rem; }
          .duo-value { font-size: 1.08rem; }
          .budget-item.green-alt { min-height: 58px; }
        }
        @media (max-width: 992px) {
          .budget-grid-top { grid-template-columns: 1fr; }
          .budget-top-duo { min-height: 56px; }
          .budget-summary-card { padding: 12px; }
          .integrated-duo { grid-template-columns: 1fr; }
          .pct-badge.small { font-size: 0.64rem; padding: 2px 6px; }
        }

        .budget-grid-top,
        .budget-grid-bottom {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .budget-top-duo {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          background: transparent; /* permitir contraste entre celdas */
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid #C8CFDA; /* borde más oscuro */
          min-height: 74px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
        }
        .budget-top-duo .duo-cell {
          padding: 12px;
          color: #fff;
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); /* morado elegante */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          position: relative;
        }
        .budget-top-duo .duo-cell + .duo-cell { background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%); /* cian */ }
        .budget-top-duo .duo-cell.no-sep { border-left: none !important; }
        .duo-title { font-weight: 700; font-size: 0.88rem; opacity: 0.95; display: flex; align-items: center; gap: 8px; justify-content: center; width: 100%; }
        .duo-title.with-badge .pct-badge.small { position: absolute; right: 10px; top: 10px; margin-left: 0; }
        .duo-value { font-size: 1.1rem; font-weight: 800; margin-top: 6px; text-align: center; }

        .pct-badge { background: var(--brand-green-500); color: #FFFFFF; font-weight: 800; font-size: 0.72rem; padding: 4px 9px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 2px 8px rgba(121,188,153,0.25); }
        .pct-badge.small { font-size: 0.68rem; padding: 3px 7px; }

        .budget-item {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px solid rgba(231,236,243,0.9);
          border-radius: 14px;
          padding: 12px;
          position: relative;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.12), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.06),
                      0 8px 12px -2px rgba(0, 0, 0, 0.1), 
                      inset 0 1px 0 rgba(255,255,255,0.6);
        }
        .budget-item.green-alt { background: rgba(255,255,255,0.7); min-height: 60px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }

        .budget-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .budget-title { font-weight: 800; color: #0F172A; font-size: 0.95rem; }
        .budget-value { font-size: 1.12rem; font-weight: 900; color:#0B1220; }

        .budget-integrated {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(231,236,243,0.9);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 10px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.6);
        }
        .integrated-top { background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; }
        .integrated-header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 4px; }
        .integrated-title { font-weight: 800; color:#0F172A; font-size: 0.92rem; }
        .integrated-value { font-size: 1.08rem; font-weight: 900; color:#0B1220; }
        .integrated-duo { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .integrated-cell { background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; }
        .integrated-cell.alt { background: #F8FAFC; }

        /* Hover elegante */
        .budget-item:hover, .integrated-cell:hover, .integrated-top:hover, .budget-top-duo .duo-cell:hover {
          box-shadow: 0 16px 30px rgba(15,23,42,0.12);
          transform: translateY(-2px);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        /* Tarjetas genéricas con glass */
        .chart-card, .table-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 24px;
          border: 2px solid var(--border);
          box-shadow: 0 -2px 8px -2px rgba(0, 0, 0, 0.08),
                      0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
          border-top: 4px solid var(--brand-blue-900);
          transition: all 0.3s ease;
        }
        .chart-card:hover, .table-card:hover { 
          box-shadow: 0 -3px 10px -2px rgba(0, 0, 0, 0.1),
                      0 10px 15px -3px rgba(0, 0, 0, 0.2), 
                      0 4px 6px -2px rgba(0, 0, 0, 0.1),
                      0 20px 25px -5px rgba(0, 0, 0, 0.16);
          transform: translateY(-3px); 
        }
        
        /* Filetes de acento por sección */
        .chart-card { border-top-color: var(--brand-blue-500); }
        .table-card { border-top-color: var(--brand-green-500); }
        .map-main-panel { border-top-color: var(--brand-yellow-500); }

        @media (max-width: 1200px) {
          .budget-top-duo { min-height: 58px; }
          .duo-title { font-size: 0.88rem; }
          .duo-value { font-size: 1.08rem; }
          .budget-item.green-alt { min-height: 58px; }
        }
        @media (max-width: 992px) {
          .budget-grid-top { grid-template-columns: 1fr; }
          .budget-top-duo { min-height: 56px; }
          .budget-summary-card { padding: 12px; }
          .integrated-duo { grid-template-columns: 1fr; }
          .pct-badge.small { font-size: 0.64rem; padding: 2px 6px; }
        }

        .budget-grid-top,
        .budget-grid-bottom {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .budget-top-duo {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          background: transparent; /* permitir contraste entre celdas */
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid #C8CFDA; /* borde más oscuro */
          min-height: 74px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
        }
        .budget-top-duo .duo-cell {
          padding: 12px;
          color: #fff;
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); /* morado elegante */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          position: relative;
        }
        .budget-top-duo .duo-cell + .duo-cell { background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%); /* cian */ }
        .budget-top-duo .duo-cell.no-sep { border-left: none !important; }
        .duo-title { font-weight: 700; font-size: 0.88rem; opacity: 0.95; display: flex; align-items: center; gap: 8px; justify-content: center; width: 100%; }
        .duo-title.with-badge .pct-badge.small { position: absolute; right: 10px; top: 10px; margin-left: 0; }
        .duo-value { font-size: 1.1rem; font-weight: 800; margin-top: 6px; text-align: center; }

        .pct-badge.small { font-size: 0.7rem; padding: 2px 6px; }

        /* Igualar altura de Inversión total con el bloque azul */
        .budget-item.green-alt { min-height: 74px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        .budget-item.green-alt .budget-header { justify-content: center; width: 100%; }
        .budget-item.green-alt .budget-value { text-align: center; width: 100%; }

        /* =====================
           BLOQUE INTEGRADO (cuadro rojo)
           ===================== */
        .budget-integrated {
          background: #F8FFF1;
          border: 2px solid #C8CFDA; /* borde más oscuro */
          border-radius: 10px;
          padding: 6px 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
        }
        .integrated-top {
          background: #f5fde9;
          border: 1px solid #C8CFDA; /* borde más oscuro */
          border-radius: 8px;
          padding: 6px 8px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.16);
        }
        .integrated-header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 2px; }
        .integrated-title { font-weight: 700; color:#2C3E50; font-size: 0.82rem; }
        .integrated-value { font-size: 0.92rem; font-weight: 800; color:#8B5CF6; }

        /* Centrado explícito para el bloque solicitado */
        .integrated-top.center { text-align: center; position: relative; }
        .integrated-header.center { justify-content: center; gap: 8px; margin-bottom: 4px; }
        .integrated-value.center { text-align: center; }
        /* Mover el % a la derecha dentro de la tarjeta centrada */
        .integrated-top.center .pct-badge {
          position: absolute;
          right: 8px;
          top: 8px;
        }

        /* Centrado de celdas inferiores y ubicacion del % a la derecha */
        .integrated-cell { position: relative; text-align: center; }
        .integrated-cell .integrated-header { justify-content: center; }
        .integrated-cell .integrated-value { text-align: center; }
        .integrated-cell .pct-badge { position: absolute; right: 8px; top: 8px; }

        .integrated-duo {
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .integrated-cell {
          background: #f5fde9;
          border: 1px solid #C8CFDA; /* borde más oscuro */
          border-radius: 8px;
          padding: 6px 8px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.16);
        }
        .integrated-cell.alt {
          background: #eef9da;
        }

        @media (max-width: 1200px) {
          .budget-grid-top { grid-template-columns: 1fr 1fr; gap: 8px; }
          .budget-top-duo { min-height: 54px; }
          .duo-title { font-size: 0.76rem; }
          .duo-value { font-size: 0.9rem; }
          .budget-item.green-alt { min-height: 54px; }
        }
        @media (max-width: 992px) {
          .budget-grid-top { grid-template-columns: 1fr; }
          .budget-top-duo { min-height: 52px; }
          .budget-summary-card { padding: 8px; }
          .integrated-duo { grid-template-columns: 1fr; }
          .pct-badge.small { font-size: 0.6rem; padding: 2px 6px; }
        }

        .budget-grid-top,
        .budget-grid-bottom {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .budget-top-duo {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          background: transparent; /* permitir contraste entre celdas */
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid #C8CFDA; /* borde más oscuro */
          min-height: 74px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
        }
        .budget-top-duo .duo-cell {
          padding: 12px;
          color: #fff;
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); /* morado elegante */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          position: relative;
        }
        .budget-top-duo .duo-cell + .duo-cell { background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%); /* cian */ }
        .budget-top-duo .duo-cell.no-sep { border-left: none !important; }
        .duo-title { font-weight: 700; font-size: 0.88rem; opacity: 0.95; display: flex; align-items: center; gap: 8px; justify-content: center; width: 100%; }
        .duo-title.with-badge .pct-badge.small { position: absolute; right: 10px; top: 10px; margin-left: 0; }
        .duo-value { font-size: 1.1rem; font-weight: 800; margin-top: 6px; text-align: center; }

        .pct-badge.small { font-size: 0.7rem; padding: 2px 6px; }

        /* Igualar altura de Inversión total con el bloque azul */
        .budget-item.green-alt { min-height: 74px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        .budget-item.green-alt .budget-header { justify-content: center; width: 100%; }
        .budget-item.green-alt .budget-value { text-align: center; width: 100%; }

        /* =====================
           BLOQUE INTEGRADO (cuadro rojo)
           ===================== */
        .budget-integrated {
          background: #F8FFF1;
          border: 2px solid #C8CFDA; /* borde más oscuro */
          border-radius: 10px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
        }
        .integrated-top {
          background: #f5fde9;
          border: 1px solid #C8CFDA; /* borde más oscuro */
          border-radius: 8px;
          padding: 10px 12px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.16);
        }
        .integrated-header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 4px; }
        .integrated-title { font-weight: 700; color:#2C3E50; font-size: 0.9rem; }
        .integrated-value { font-size: 1.05rem; font-weight: 800; color:#8B5CF6; }

        /* Centrado explícito para el bloque solicitado */
        .integrated-top.center { text-align: center; position: relative; }
        .integrated-header.center { justify-content: center; gap: 10px; margin-bottom: 6px; }
        .integrated-value.center { text-align: center; }
        /* Mover el % a la derecha dentro de la tarjeta centrada */
        .integrated-top.center .pct-badge {
          position: absolute;
          right: 10px;
          top: 10px;
        }

        /* Centrado de celdas inferiores y ubicacion del % a la derecha */
        .integrated-cell { position: relative; text-align: center; }
        .integrated-cell .integrated-header { justify-content: center; }
        .integrated-cell .integrated-value { text-align: center; }
        .integrated-cell .pct-badge { position: absolute; right: 10px; top: 10px; }

        .integrated-duo {
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .integrated-cell {
          background: #f5fde9;
          border: 1px solid #C8CFDA; /* borde más oscuro */
          border-radius: 8px;
          padding: 10px 12px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.16);
        }
        .integrated-cell.alt {
          background: #eef9da;
        }

        @media (max-width: 768px) {
          .integrated-duo { grid-template-columns: 1fr; }
        }

        .budget-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .budget-item {
          background: #F8FFF1;
          border: 2px solid #C8CFDA; /* borde más oscuro */
          border-radius: 10px;
          padding: 12px;
          position: relative;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
        }

        /* =====================
           RESPONSIVE - CARDS Y LAYOUT
           ===================== */
        @media (max-width: 1200px) {
          .budget-grid-top { grid-template-columns: 1fr 1fr; gap: 10px; }
          .budget-top-duo { min-height: 70px; }
          .duo-title { font-size: 0.85rem; }
          .duo-value { font-size: 1.05rem; }
          .budget-item.green-alt { min-height: 70px; }
        }
        @media (max-width: 992px) {
          .budget-grid-top { grid-template-columns: 1fr; }
          .budget-top-duo { min-height: 68px; }
          .budget-summary-card { padding: 12px; }
          .integrated-duo { grid-template-columns: 1fr; }
          .pct-badge.small { font-size: 0.64rem; padding: 2px 6px; }
        }
        @media (max-width: 768px) {
          .budget-summary-card { padding: 10px; border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.14); }
          .budget-top-duo { border-radius: 8px; }
          .budget-item, .integrated-cell, .integrated-top { padding: 10px; border-radius: 8px; }
          .duo-title { font-size: 0.8rem; }
          .duo-value, .integrated-value { font-size: 1rem; }
        }
        @media (max-width: 480px) {
          .budget-summary-card { padding: 8px; gap: 8px; }
          .budget-top-duo { min-height: 60px; }
          .budget-item.green-alt { min-height: 60px; }
          .duo-title { font-size: 0.75rem; }
          .duo-value { font-size: 0.95rem; }
          .integrated-title { font-size: 0.85rem; }
          .integrated-value { font-size: 0.95rem; }
          .pct-badge { font-size: 0.68rem; padding: 2px 6px; }
        }

        .budget-item.dark {
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
          border-color: #8B5CF6;
        }
        .budget-item.dark .budget-title { color: #e6f2f8; }
        .budget-item.dark .budget-value { color: #ffffff; }

        .budget-item.green-alt { background:#EFFEDE; }

        .budget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .budget-title {
          font-weight: 700;
          color: #2C3E50;
          font-size: 0.88rem;
        }

        .budget-header.no-badge { justify-content: flex-start; }

        .budget-value {
          font-size: 1.05rem;
          font-weight: 800;
          color: #8B5CF6;
          }

        .pct-badge {
          background: #98C73B;
          color: #FFFFFF;
          font-weight: 800;
          font-size: 0.72rem;
          padding: 3px 7px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,0.08);
        }

        @media (max-width: 768px) {
          .budget-grid-top,
          .budget-row,
          .budget-grid-bottom { grid-template-columns: 1fr; }
        }

        /* =====================
           KPIs CHIPS (fila compacta)
           ===================== */
        .kpi-chips-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 14px;
          margin-bottom: 14px;
        }
        .kpi-chip {
          border-radius: 12px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 80px;
          color: #fff;
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }
        .kpi-chip-label { font-size: 0.68rem; font-weight: 700; opacity: 0.95; text-align:center; }
        .kpi-chip-value { font-size: 1.0rem; font-weight: 800; margin-top: 6px; text-align:center; }

        @media (max-width: 1200px) {
          .kpi-chips-row { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .kpi-chips-row { grid-template-columns: 1fr; }
          .kpi-chip { min-height: 84px; padding: 10px; }
        }

        .dependencies-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-start;
        }

        .dependency-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid rgba(121, 188, 153, 0.2);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
          white-space: nowrap;
          max-width: 100%;
        }

        .dependency-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .dependency-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .dependency-name {
          font-size: 0.75rem;
          color: #2C3E50;
          font-weight: 500;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ========================================================================
            SECCIÓN DE KPIs - DISEÑO MEJORADO (LEGACY)
        ======================================================================== */
        .kpis-section {
          margin-bottom: 22px;
          padding: 20px;
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: var(--panel-shadow);
          border-top: 6px solid var(--brand-blue-900);
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

        /* Estilos para las tarjetas de KPI - Solo para .kpis-grid */
        .kpis-grid .kpi {
          background: #98C73B !important;
          color: #FFFFFF !important;
          border-radius: 16px !important;
          padding: 16px !important;
          box-shadow: 0 6px 18px rgba(152, 199, 59, 0.22) !important;
          border: none !important;
          transition: all 0.25s ease !important;
          position: relative !important;
          overflow: hidden !important;
        }

        /* Estilos base para KPIs del main-row */
        .kpis-main-row .kpi {
          color: #FFFFFF !important;
          border-radius: 40px !important;
          padding: 24px 30px !important;
          border: none !important;
          transition: all 0.3s ease !important;
          position: relative !important;
          overflow: hidden !important;
          height: 150px !important;
          min-height: 150px !important;
          max-height: 150px !important;
          display: flex !important;
          align-items: center !important;
        }
        
        .kpis-main-row .kpi-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 100%;
          gap: 20px;
        }
        
        .kpis-main-row .kpi-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 8px;
        }
        
        .kpis-main-row .kpi-label {
          color: rgba(255, 255, 255, 0.85) !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          letter-spacing: 0.3px !important;
          line-height: 1.3 !important;
          text-align: left !important;
          text-transform: uppercase !important;
        }
        
        .kpis-main-row .kpi-value {
          font-size: 2.25rem !important;
          font-weight: 700 !important;
          color: #ffffff !important;
          line-height: 1.1 !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15) !important;
          text-align: left !important;
          padding: 0 !important;
        }
        
        .kpis-main-row .kpi-subtitle {
          color: rgba(255, 255, 255, 0.75) !important;
          font-size: 0.8rem !important;
          font-weight: 500 !important;
          line-height: 1.3 !important;
          text-align: left !important;
        }
        
        .kpis-main-row .kpi-icon {
          flex-shrink: 0;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.35;
        }
        
        .kpis-main-row .kpi-icon svg {
          width: 100%;
          height: 100%;
          fill: none;
          color: white;
        }

        /* Estilos específicos para KPIs 1 y 2 (TOTAL OBRAS y OBRAS ENTREGADAS) - AZUL - MÁXIMA ESPECIFICIDAD */
        .main-dashboard-section .kpis-main-row .kpi-green-1 .kpi,
        .main-dashboard-section .kpis-main-row .kpi-green-2 .kpi {
          background: linear-gradient(135deg, #4A90A4 0%, #357A8E 100%) !important;
          box-shadow: 0 -2px 8px -2px rgba(0, 0, 0, 0.08),
                      0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14) !important;
        }

        .main-dashboard-section .kpis-main-row .kpi-green-1 .kpi:hover,
        .main-dashboard-section .kpis-main-row .kpi-green-2 .kpi:hover {
          box-shadow: 0 -3px 10px -2px rgba(0, 0, 0, 0.1),
                      0 10px 15px -3px rgba(0, 0, 0, 0.2), 
                      0 4px 6px -2px rgba(0, 0, 0, 0.1),
                      0 20px 25px -5px rgba(0, 0, 0, 0.16) !important;
        }

        /* Estilos específicos para KPIs 3-6 (AZUL MÁS OSCURO) - MÁXIMA ESPECIFICIDAD */
        .main-dashboard-section .kpis-main-row .kpi-blue-3 .kpi,
        .main-dashboard-section .kpis-main-row .kpi-blue-4 .kpi,
        .main-dashboard-section .kpis-main-row .kpi-blue-5 .kpi,
        .main-dashboard-section .kpis-main-row .kpi-blue-6 .kpi,
        .main-dashboard-section .kpis-main-row .kpi-blue-7 .kpi {
          background: linear-gradient(135deg, #2B5D6E 0%, #1E4555 100%) !important;
          box-shadow: 0 -2px 8px -2px rgba(0, 0, 0, 0.08),
                      0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14) !important;
        }

        .main-dashboard-section .kpis-main-row .kpi-blue-3 .kpi:hover,
        .main-dashboard-section .kpis-main-row .kpi-blue-4 .kpi:hover,
        .main-dashboard-section .kpis-main-row .kpi-blue-5 .kpi:hover,
        .main-dashboard-section .kpis-main-row .kpi-blue-6 .kpi:hover,
        .main-dashboard-section .kpis-main-row .kpi-blue-7 .kpi:hover {
          box-shadow: 0 -3px 10px -2px rgba(0, 0, 0, 0.1),
                      0 10px 15px -3px rgba(0, 0, 0, 0.2), 
                      0 4px 6px -2px rgba(0, 0, 0, 0.1),
                      0 20px 25px -5px rgba(0, 0, 0, 0.16) !important;
        }


        .kpis-grid .kpi:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 15px 35px rgba(152, 199, 59, 0.4) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
        }

        .kpis-grid .kpi::before,
        .kpis-main-row .kpi::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 4px !important;
          background: var(--primary-green) !important;
        }

        /* Estilos para el contenido de los KPIs */
        .kpis-grid .kpi .kpi-label,
        .kpis-main-row .kpi .kpi-label {
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          color: rgba(255, 255, 255, 0.9) !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          margin-bottom: 8px !important;
        }

        .kpis-grid .kpi .kpi-value,
        .kpis-main-row .kpi .kpi-value {
          font-size: 1.4rem !important;
          font-weight: 700 !important;
          color: #FFFFFF !important;
          margin-bottom: 5px !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          line-height: 1.2 !important;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }

        .kpis-grid .kpi .kpi-subtitle,
        .kpis-main-row .kpi .kpi-subtitle {
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
        .kpis-row-7 { grid-template-columns: repeat(7, 1fr); }

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
          background: #FFFFFF;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid #98C73B;
          transition: all 0.3s ease;
        }

        .chart-card:hover, .table-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(152, 199, 59, 0.2);
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
          background: var(--white);
          border-radius: 15px;
          border: 1px solid var(--primary-green);
          box-shadow: 0 4px 15px rgba(121, 188, 153, 0.1);
        }

        .map-legend h4 {
          margin: 0 0 20px 0;
          color: var(--secondary-blue);
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
          background: var(--white);
          border-radius: 10px;
          border: 1px solid var(--primary-green);
          box-shadow: 0 2px 8px rgba(121, 188, 153, 0.08);
          transition: all 0.3s ease;
        }

        .legend-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(121, 188, 153, 0.15);
          background: var(--white);
        }

        .legend-color {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid var(--primary-green);
          box-shadow: 0 2px 6px rgba(121, 188, 153, 0.3);
        }

        .legend-text {
          font-size: 0.9rem;
          color: var(--text-dark);
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
          border: 1px solid var(--primary-green);
          color: var(--text-dark);
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
          border: 2px solid var(--primary-green);
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
          border: 2px solid rgba(0,0,0,0.08);
          box-shadow: 0 -2px 8px -2px rgba(0, 0, 0, 0.08),
                      0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
          position: relative;
          transition: all 0.3s ease;
        }
        
        .map-container-expanded:hover {
          box-shadow: 0 -3px 10px -2px rgba(0, 0, 0, 0.1),
                      0 10px 15px -3px rgba(0, 0, 0, 0.2), 
                      0 4px 6px -2px rgba(0, 0, 0, 0.1),
                      0 20px 25px -5px rgba(0, 0, 0, 0.16);
          transform: translateY(-2px);
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
          color: var(--text-light);
          background: var(--white);
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
          background: var(--white);
          border-radius: 12px;
        }

        .map-popup {
          padding: 0;
          background: var(--white);
          border-radius: 12px;
        }

        .popup-header {
          padding: 12px 16px;
          border-left: 4px solid;
          background: var(--white);
          border-radius: 12px 12px 0 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .popup-header h4 {
          margin: 0 0 6px 0;
          color: var(--text-dark);
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
          border-bottom: 1px solid var(--primary-green);
          background: var(--white);
        }

        .popup-info p {
          margin: 6px 0;
          font-size: 0.85rem;
          color: var(--text-light);
          line-height: 1.4;
        }

        .popup-info strong {
          color: var(--text-dark);
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
          color: var(--text-light);
          font-weight: 500;
          line-height: 1.3;
        }

        .percentage-bar {
          width: 70px;
          height: 8px;
          background: var(--white);
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
          background: var(--white);
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
          color: var(--text-light);
          font-style: italic;
          background: var(--white);
          border-radius: 15px;
          margin-top: 30px;
          border: 1px solid var(--primary-green);
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
          background: var(--white);
          border-radius: 20px;
          border: 1px solid var(--primary-green);
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.12);
          overflow: hidden;
          width: 100%;
          max-width: 100%;
        }

        .main-chart-section .chart-close-btn {
          position: absolute;
          right: 16px;
          top: 16px;
          background: rgba(0, 0, 0, 0.05);
          color: #000000;
          border: 1px solid var(--primary-green);
          border-radius: 9999px;
          width: 32px;
          height: 32px;
          cursor: pointer;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .main-chart-section .chart-close-btn:hover {
          background: rgba(0, 0, 0, 0.12);
          transform: scale(1.05);
        }

        /* Botón de cerrar para el panel de mapa */
        .map-main-panel {
          position: relative;
          background: #FFFFFF;
          border-radius: 20px;
          border: 2px solid var(--border);
          box-shadow: 0 -2px 8px -2px rgba(0, 0, 0, 0.08),
                      0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
          border-top: 6px solid var(--brand-yellow-500);
          transition: all 0.3s ease;
        }
        
        .map-main-panel:hover {
          box-shadow: 0 -3px 10px -2px rgba(0, 0, 0, 0.1),
                      0 10px 15px -3px rgba(0, 0, 0, 0.2), 
                      0 4px 6px -2px rgba(0, 0, 0, 0.1),
                      0 20px 25px -5px rgba(0, 0, 0, 0.16);
          transform: translateY(-2px);
        }

        .map-main-panel .map-close-btn {
          position: absolute;
          right: 16px;
          top: 16px;
          background: rgba(0, 0, 0, 0.05);
          color: #000000;
          border: 1px solid var(--primary-green);
          border-radius: 9999px;
          width: 32px;
          height: 32px;
          cursor: pointer;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .map-main-panel .map-close-btn:hover {
          background: rgba(0, 0, 0, 0.12);
          transform: scale(1.05);
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
        .main-chart-section .simple-chart-container {
          width: 100% !important;
          max-width: 100% !important;
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
        @media (max-width: 1400px) {
          .kpis-main-row {
            grid-template-columns: repeat(5, 1fr);
            gap: 12px;
          }
        }
        
        @media (max-width: 1200px) {
          .kpis-row-5 { grid-template-columns: repeat(4, 1fr); }
          .kpis-row-6 { grid-template-columns: repeat(4, 1fr); }
          .kpis-row-7 { grid-template-columns: repeat(4, 1fr); }
          .kpis-main-row { 
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          .main-content {
            grid-template-columns: 1fr;
          }
          
          .main-chart-section {
            padding: 15px;
            margin-bottom: 25px;
          }
          
          .main-chart-section text {
            font-size: 12px !important;
          }

          .dependencies-list {
            gap: 6px;
          }

          .dependency-item {
            padding: 5px 8px;
          }

          .dependency-name {
            font-size: 0.7rem;
          }
        }

        @media (max-width: 1024px) {
          .kpis-main-row {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
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
          .kpis-row-7 { grid-template-columns: repeat(2, 1fr); }
          .kpis-main-row { 
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .main-dashboard-section {
            padding: 20px;
            margin-bottom: 25px;
          }

          .dependencies-list {
            gap: 5px;
          }

          .dependency-item {
            padding: 4px 7px;
          }

          .dependency-name {
            font-size: 0.65rem;
          }

          .dependency-dot {
            width: 6px;
            height: 6px;
          }

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
          
          .main-chart-section .recharts-wrapper,
          .main-chart-section .recharts-surface {
            width: 100% !important;
          }
          
          /* Ajustar tamaño de texto en gráficos para móviles */
          .main-chart-section text {
            font-size: 11px !important;
          }
          
          .main-chart-section .recharts-legend-wrapper {
            font-size: 10px !important;
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
          
          /* Gráficos responsive en móviles pequeños */
          .main-chart-section {
            padding: 10px;
            margin-bottom: 15px;
          }
          
          .main-chart-section text {
            font-size: 9px !important;
          }
          
          .main-chart-section .recharts-legend-wrapper {
            font-size: 9px !important;
          }
          
          .chart-card, .table-card {
            padding: 15px;
            border-radius: 12px;
          }

          .kpis-container { gap: 10px; }

          .kpis-grid { gap: 14px; grid-template-columns: 1fr !important; }
          .kpis-row-5 { grid-template-columns: 1fr !important; }
          .kpis-row-6 { grid-template-columns: 1fr !important; }
          .kpis-row-7 { grid-template-columns: 1fr !important; }
          .kpis-main-row { 
            grid-template-columns: 1fr !important;
            gap: 6px;
          }
          
          .kpis-main-row .kpi {
            padding: 12px !important;
            min-height: 100px !important;
          }
          
          .kpis-main-row .kpi .kpi-label {
            font-size: 0.75rem !important;
          }
          
          .kpis-main-row .kpi .kpi-value {
            font-size: 1.2rem !important;
          }
          
          .kpis-main-row .kpi .kpi-subtitle {
            font-size: 0.7rem !important;
          }

          .main-dashboard-section {
            padding: 15px;
            margin-bottom: 20px;
          }

          .dependencies-section {
            padding: 10px;
          }

          .dependencies-list {
            gap: 4px;
          }

          .dependency-item {
            padding: 3px 6px;
          }

          .dependency-name {
            font-size: 0.6rem;
          }

          .dependency-dot {
            width: 5px;
            height: 5px;
          }

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
          
          .main-chart-section text {
            font-size: 8px !important;
          }
          
          .main-chart-section .recharts-legend-wrapper {
            font-size: 8px !important;
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
          
          /* Gráficos ultra responsive para pantallas muy pequeñas */
          .main-chart-section {
            padding: 6px;
            margin-bottom: 12px;
          }
          
          .main-chart-section text {
            font-size: 7px !important;
          }
          
          .main-chart-section .recharts-legend-wrapper {
            font-size: 7px !important;
            padding: 2px !important;
          }
          
          .main-chart-section .recharts-legend-item {
            margin: 2px !important;
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

        /* ESTILOS DE PRUEBA - MÁXIMA PRIORIDAD */
        .main-dashboard-section .kpis-main-row .kpi-green-1 .kpi {
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%) !important;
          box-shadow: 0 6px 18px rgba(0, 41, 69, 0.22) !important;
        }

        .main-dashboard-section .kpis-main-row .kpi-green-2 .kpi {
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%) !important;
          box-shadow: 0 6px 18px rgba(0, 41, 69, 0.22) !important;
        }

        .main-dashboard-section .kpis-main-row .kpi-blue-3 .kpi,
        .main-dashboard-section .kpis-main-row .kpi-blue-4 .kpi,
        .main-dashboard-section .kpis-main-row .kpi-blue-5 .kpi,
        .main-dashboard-section .kpis-main-row .kpi-blue-6 .kpi,
        .main-dashboard-section .kpis-main-row .kpi-blue-7 .kpi {
          background: #98C73B !important;
          box-shadow: 0 6px 18px rgba(152, 199, 59, 0.22) !important;
        }

        /* ======== ESTILO TIPO KPI DE CONSULTAR OBRA (COLORES CORPORATIVOS) ======== */
        .budget-summary-card {
          background: transparent;
          border: none;
          box-shadow: none;
          gap: 16px;
          max-width: 1120px;
          margin-left: auto;
          margin-right: auto;
        }

        .budget-grid-top,
        .budget-grid-bottom { gap: 10px; }

        .budget-top-duo {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          background: transparent;
          border: none;
          min-height: auto;
          box-shadow: none;
        }
        /* Celda 1: Total obras → azul corporativo */
        .budget-top-duo .duo-cell {
          padding: 12px;
          color: var(--text-white);
          background: var(--primary-blue);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          position: relative;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 6px 18px rgba(0, 180, 255, 0.25);
        }
        /* Celda 2: Obras entregadas → verde corporativo */
        .budget-top-duo .duo-cell + .duo-cell {
          background: var(--primary-green);
          color: var(--dark-blue);
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 6px 18px rgba(152, 199, 59, 0.25);
        }
        .duo-title { font-weight: 700; font-size: 0.9rem; color: var(--text-white); opacity: 0.95; }
        .budget-top-duo .duo-cell + .duo-cell .duo-title { color: var(--dark-blue); }
        .duo-value { font-size: 1.2rem; font-weight: 900; margin-top: 6px; text-align: center; color: var(--text-white); }
        .budget-top-duo .duo-cell + .duo-cell .duo-value { color: var(--dark-blue); }
        .pct-badge { background: rgba(255,255,255,0.2); color: var(--text-white); border: 1px solid rgba(255,255,255,0.25); }
        .budget-top-duo .duo-cell + .duo-cell .pct-badge { background: rgba(0,0,0,0.08); color: var(--dark-blue); border-color: rgba(0,0,0,0.12); }

        /* 3) Inversión total (budget-item.green-alt): BLANCO */
        .budget-item.green-alt {
          background: var(--white);
          color: var(--darker-blue);
          min-height: 56px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          border: 1px solid var(--border-light);
          box-shadow: 0 6px 18px rgba(2,6,23,0.08);
        }
        .budget-item.green-alt .budget-title { color: var(--darker-blue); }
        .budget-item.green-alt .budget-value { color: var(--darker-blue); }

        /* 4) Presupuesto ejecutado (integrated-top): AZUL MEDIO #2AA7E1 */
        .integrated-top {
          background: var(--secondary-blue);
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 12px;
          padding: 10px 12px;
          color: var(--text-white);
          box-shadow: 0 6px 18px rgba(42,167,225,0.25);
        }
        .integrated-title { color: var(--text-white); }
        .integrated-value { color: var(--text-white); }
        .integrated-top .pct-badge { background: rgba(255,255,255,0.2); color: var(--text-white); border-color: rgba(255,255,255,0.3); }

        /* 5) Presupuesto 2024-2027 (integrated-cell): AZUL OSCURO */
        .integrated-cell {
          background: var(--darker-blue);
          color: var(--text-white);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 10px 12px;
          box-shadow: 0 6px 18px rgba(0,41,69,0.25);
        }
        .integrated-cell .integrated-title { color: var(--text-white); }
        .integrated-cell .integrated-value { color: var(--text-white); }
        .integrated-cell .pct-badge { background: rgba(255,255,255,0.2); color: var(--text-white); border-color: rgba(255,255,255,0.25); }

        /* 6) Administraciones anteriores (integrated-cell.alt): VERDE */
        .integrated-cell.alt {
          background: var(--primary-green);
          color: var(--dark-blue);
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 6px 18px rgba(152,199,59,0.25);
        }
        .integrated-cell.alt .integrated-title { color: var(--dark-blue); }
        .integrated-cell.alt .integrated-value { color: var(--dark-blue); }
        .integrated-cell.alt .pct-badge { background: rgba(0,0,0,0.08); color: var(--dark-blue); border-color: rgba(0,0,0,0.12); }

        /* Resto de tarjetas por defecto (no etiquetadas) → usar blanco limpio */
        .budget-item {
          background: var(--white);
          color: var(--darker-blue);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 12px;
          position: relative;
          box-shadow: 0 6px 18px rgba(2,6,23,0.08);
        }

        /* ======== OVERRIDES DE ALTA ESPECIFICIDAD (aseguran paleta aplicada) ======== */
        .main-dashboard-section .budget-top-duo .duo-cell {
          background: linear-gradient(135deg, #0075A4 0%, #0075A4 100%) !important; /* morado */
          color: var(--text-white) !important;
          border: 1px solid rgba(255,255,255,0.18) !important;
          box-shadow: 0 6px 18px rgba(0, 41, 69, 0.25) !important;
        }
        .main-dashboard-section .budget-top-duo .duo-cell + .duo-cell {
          background: var(--primary-green) !important; /* #98C73B */
          color: var(--dark-blue) !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
          box-shadow: 0 6px 18px rgba(152, 199, 59, 0.25) !important;
        }
        .main-dashboard-section .budget-top-duo .duo-cell .duo-title,
        .main-dashboard-section .budget-top-duo .duo-cell .duo-value { color: var(--text-white) !important; }
        .main-dashboard-section .budget-top-duo .duo-cell + .duo-cell .duo-title,
        .main-dashboard-section .budget-top-duo .duo-cell + .duo-cell .duo-value { color: var(--dark-blue) !important; }
        .main-dashboard-section .budget-top-duo .duo-cell .pct-badge { background: rgba(255,255,255,0.2) !important; color: var(--text-white) !important; border-color: rgba(255,255,255,0.25) !important; }
        .main-dashboard-section .budget-top-duo .duo-cell + .duo-cell .pct-badge { background: rgba(0,0,0,0.08) !important; color: var(--dark-blue) !important; border-color: rgba(0,0,0,0.12) !important; }

        .main-dashboard-section .budget-item.green-alt {
          background: #5bbe2194 !important;
          color: var(--darker-blue) !important;
          border: 1px solid var(--border-light) !important;
          box-shadow: 0 6px 18px rgba(2,6,23,0.08) !important;
        }
        .main-dashboard-section .budget-item.green-alt .budget-title,
        .main-dashboard-section .budget-item.green-alt .budget-value { color: var(--darker-blue) !important; }

        .main-dashboard-section .budget-integrated .integrated-top {
          background: var(--secondary-blue) !important; /* #2AA7E1 */
          color: var(--text-white) !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
          box-shadow: 0 6px 18px rgba(42,167,225,0.25) !important;
        }
        .main-dashboard-section .budget-integrated .integrated-top .pct-badge { background: rgba(255,255,255,0.2) !important; color: var(--text-white) !important; border-color: rgba(255,255,255,0.3) !important; }

        .main-dashboard-section .budget-integrated .integrated-duo .integrated-cell {
          background: var(--darker-blue) !important;
          color: var(--text-white) !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          box-shadow: 0 6px 18px rgba(0,41,69,0.25) !important;
        }
        .main-dashboard-section .budget-integrated .integrated-duo .integrated-cell.alt {
          background: var(--primary-green) !important;
          color: var(--dark-blue) !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
          box-shadow: 0 6px 18px rgba(152,199,59,0.25) !important;
        }

        .main-dashboard-section .budget-item:not(.green-alt) {
          background: var(--white) !important;
          color: var(--darker-blue) !important;
          border: 1px solid var(--border-light) !important;
          box-shadow: 0 6px 18px rgba(2,6,23,0.08) !important;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

