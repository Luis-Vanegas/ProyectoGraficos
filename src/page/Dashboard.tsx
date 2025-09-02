import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { F } from '../dataConfig';
import { 
  applyFilters, 
  kpis, 
  buildTwoSeriesDataset, 
  getFilterOptions,
  cleanDependentFilters,
  type Row, 
  type Filters
} from '../utils/utils/metrics';

import Kpi from '../components/Kpi';
import ComboBars from '../components/comboBars';
import WorksTable from '../components/WorksTable';
import AlertsTable from '../components/AlertsTable';
import Navigation from '../components/Navigation';

// Colores para diferentes proyectos estratégicos
const PROJECT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
];

// Función para obtener color basado en el nombre del proyecto
const getProjectColor = (projectName: string): string => {
  if (!projectName) return '#95A5A6';
  const hash = projectName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
};

// Función para obtener todos los campos de porcentaje
const getPercentageFields = (obra: Row) => {
  const percentageFields = [
    { key: 'presupuestoPorcentajeEjecutado', label: 'Presupuesto Ejecutado' },
    { key: 'porcentajeEjecucionObra', label: 'Ejecución de Obra' },
    { key: 'porcentajeDisenos', label: 'Diseños' },
    { key: 'porcentajeViabilizacionDAP', label: 'Viabilización DAP' },
    { key: 'porcentajeContratacion', label: 'Contratación' },
    { key: 'porcentajeLiquidacion', label: 'Liquidación' },
    { key: 'porcentajePlaneacionMGA', label: 'Planeación MGA' },
    { key: 'porcentajeEstudiosPreliminares', label: 'Estudios Preliminares' },
    { key: 'porcentajeInicio', label: 'Inicio' },
    { key: 'porcentajeGestionPredial', label: 'Gestión Predial' },
    { key: 'porcentajeDotacionYPuestaEnOperacion', label: 'Dotación y Puesta en Operación' }
  ];

  return percentageFields
    .map(field => {
      const value = obra[F[field.key as keyof typeof F] as keyof typeof F];
      if (value !== undefined && value !== null && value !== '') {
        return {
          label: field.label,
          value: typeof value === 'number' ? value : parseFloat(String(value)),
          key: field.key
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};

export default function Dashboard() {
  // --- datos crudos del backend ---
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('Cargando...');

  // --- filtros seleccionados ---
  const [filters, setFilters] = useState<Filters>({});
  // dimensión para el gráfico de barras (eje X)
  const [dimension, setDimension] = useState<string>(F.dependencia || F.comunaOCorregimiento || F.tipoDeIntervecion);

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const sres = await fetch('/api/sheets');
        const { sheets } = await sres.json();
        const hoja = sheets.includes('Obras') ? 'Obras' : sheets[0];
        const dres = await fetch(`/api/data?sheet=${encodeURIComponent(hoja)}`);
        const { rows } = await dres.json();
        setRows(rows);
        setStatus(`${rows.length} filas`);
      } catch (e) {
        console.error(e);
        setStatus('No se pudieron cargar los datos');
      }
    })();
  }, []);

  // Opciones de filtros dinámicas (relacionadas)
  const opciones = useMemo(() => getFilterOptions(rows, filters), [rows, filters]);

  // Aplica filtros
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);

  // KPIs (con filtros aplicados)
  const k = useMemo(() => kpis(filtered), [filtered]);

  // Dataset para "Inversión total vs Presupuesto ejecutado"
  const comboDataset = useMemo(() => {
    if (!dimension || !F.costoTotalActualizado || !F.presupuestoEjecutado) return [];
    return buildTwoSeriesDataset(filtered, dimension, F.costoTotalActualizado, F.presupuestoEjecutado, 12);
  }, [filtered, dimension]);

  // Listas: entregadas / por entregar
  const entregadas = useMemo(() => {
    return filtered.filter(r => {
      // Estado contiene "entreg" O la fecha real es <= año actual
      const est = F.estadoDeLaObra ? String(r[F.estadoDeLaObra] ?? '').toLowerCase() : '';
      const okEstado = est.includes('entreg');
      if (okEstado) return true;
      if (F.fechaRealDeEntrega) {
        const y = Number(String(r[F.fechaRealDeEntrega] ?? '').slice(0,4));
        return !!y && y <= new Date().getFullYear();
      }
      return false;
    });
  }, [filtered]);

  const porEntregar = useMemo(() => {
    return filtered.filter(r => {
      // Si el estado NO contiene "entreg" Y la fecha estimada es > año actual
      const est = F.estadoDeLaObra ? String(r[F.estadoDeLaObra] ?? '').toLowerCase() : '';
      const noEntregada = est && !est.includes('entreg');
      if (noEntregada) return true;
      if (F.fechaEstimadaDeEntrega) {
        const y = Number(String(r[F.fechaEstimadaDeEntrega] ?? '').slice(0,4));
        return !!y && y > new Date().getFullYear();
      }
      return false;
    });
  }, [filtered]);

  // Alertas
  const alertas = useMemo(() => {
    return filtered.filter(r => 
      F.descripcionDelRiesgo && String(r[F.descripcionDelRiesgo] ?? '').trim().length > 0
    );
  }, [filtered]);

  // Datos para el mapa (obras con coordenadas) organizados por proyecto
  const mapData = useMemo(() => {
    const obrasConCoordenadas = filtered.filter(r => {
      const lat = F.latitud ? parseFloat(String(r[F.latitud] ?? '')) : null;
      const lng = F.longitud ? parseFloat(String(r[F.longitud] ?? '')) : null;
      return lat && lng && !isNaN(lat) && !isNaN(lng);
    });

    // Agrupar por proyecto estratégico para mejor organización
    const groupedByProject = obrasConCoordenadas.reduce((acc, obra) => {
      const proyecto = F.proyectoEstrategico ? String(obra[F.proyectoEstrategico] ?? 'Sin Proyecto') : 'Sin Proyecto';
      if (!acc[proyecto]) {
        acc[proyecto] = [];
      }
      acc[proyecto].push(obra);
      return acc;
    }, {} as Record<string, Row[]>);

    return groupedByProject;
  }, [filtered]);

  // Función para manejar cambios en filtros con limpieza automática
  const handleFilterChange = (filterKey: keyof Filters, value: string) => {
    const newValue = value || undefined;
    const newFilters = { ...filters, [filterKey]: newValue };
    
    // Limpia filtros dependientes
    const cleanedFilters = cleanDependentFilters(newFilters, filterKey);
    setFilters(cleanedFilters);
  };

  return (
    <div className="dashboard-container">
      <Navigation showBackButton={true} title="Reporte General" />
      
      {/* Contenedor principal con diseño moderno */}
      <div className="dashboard-content">
        
        {/* Sección de filtros con diseño mejorado */}
        <div className="filters-section">
          <div className="filters-container">
            {/* Proyecto estratégico */}
            {F.proyectoEstrategico && (
              <div className="filter-group">
                <label className="filter-label">Proyectos estratégicos</label>
                <select
                  className="filter-select"
                  value={filters.proyecto ?? ''}
                  onChange={e => handleFilterChange('proyecto', e.target.value)}
                >
                  <option value="">Todos</option>
                  {opciones.proyectos.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}

            {/* Dependencia */}
            {F.dependencia && (
              <div className="filter-group">
                <label className="filter-label">Dependencia</label>
                <select
                  className="filter-select"
                  value={filters.dependencia ?? ''}
                  onChange={e => handleFilterChange('dependencia', e.target.value)}
                  disabled={opciones.dependencias.length === 0}
                >
                  <option value="">Todas</option>
                  {opciones.dependencias.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}

            {/* Comuna / Corregimiento */}
            {F.comunaOCorregimiento && (
              <div className="filter-group">
                <label className="filter-label">Comuna / Corregimiento</label>
                <select
                  className="filter-select"
                  value={filters.comuna ?? ''}
                  onChange={e => handleFilterChange('comuna', e.target.value)}
                  disabled={opciones.comunas.length === 0}
                >
                  <option value="">Todas</option>
                  {opciones.comunas.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}

            {/* Tipo de Intervención */}
            {F.tipoDeIntervecion && (
              <div className="filter-group">
                <label className="filter-label">Tipo de Intervención</label>
                <select
                  className="filter-select"
                  value={filters.tipo ?? ''}
                  onChange={e => handleFilterChange('tipo', e.target.value)}
                  disabled={opciones.tipos.length === 0}
                >
                  <option value="">Todas</option>
                  {opciones.tipos.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}

            {/* Fecha de entrega */}
            {(F.fechaRealDeEntrega || F.fechaEstimadaDeEntrega) && (
              <>
                <div className="filter-group">
                  <label className="filter-label">Desde (YYYY o YYYY-MM)</label>
                  <input
                    className="filter-input"
                    placeholder="2024 o 2024-04"
                    value={filters.desde ?? ''}
                    onChange={e=>setFilters(f=>({...f, desde: e.target.value || undefined}))}
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Hasta</label>
                  <input
                    className="filter-input"
                    placeholder="2026 o 2026-12"
                    value={filters.hasta ?? ''}
                    onChange={e=>setFilters(f=>({...f, hasta: e.target.value || undefined}))}
                  />
                </div>
              </>
            )}

            {/* Dimensión del gráfico */}
            <div className="filter-group">
              <label className="filter-label">Dimensión gráfico</label>
              <select 
                className="filter-select"
                value={dimension ?? ''} 
                onChange={e => setDimension(e.target.value)}
              >
                {[F.dependencia, F.comunaOCorregimiento, F.tipoDeIntervecion].filter(Boolean).map(d => (
                  <option key={d} value={d!}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sección de KPIs con diseño moderno */}
        <div className="kpis-section">
          <div className="kpis-grid">
            <Kpi 
              label="Total obras" 
              value={k.totalObras} 
              trend="neutral"
            />
            <Kpi 
              label="Inversión total" 
              value={k.invTotal} 
              format="money" 
              compactMoney 
              subtitle={`${Math.round(k.pctEjec * 100)}% ejecutado`}
              trend="up"
            />
            <Kpi 
              label="Entregadas" 
              value={k.entregadas} 
              subtitle={`${Math.round(k.pctEntregadas * 100)}% del total`}
              trend="up"
            />
            <Kpi 
              label="Presupuesto ejecutado" 
              value={k.ejec} 
              format="money" 
              compactMoney 
              subtitle={`${Math.round(k.pctEjec * 100)}% de la inversión`}
              trend="up"
            />
          </div>
        </div>

        {/* Layout principal con mapa y gráficos */}
        <div className="main-content">
          {/* Columna izquierda - Gráfico y mapa */}
          <div className="left-column">
            {/* Gráfico principal */}
            {comboDataset.length > 0 && (
              <div className="chart-card">
                <ComboBars
                  title="Inversión total vs Presupuesto ejecutado"
                  dataset={comboDataset}
                  dim={dimension!}
                  v1={F.costoTotalActualizado}
                  v2={F.presupuestoEjecutado}
                />
              </div>
            )}

            {/* Mapa de obras mejorado */}
            <div className="map-card">
              <h3 className="card-title">Ubicación de Obras por Proyecto Estratégico</h3>
              <div className="map-legend">
                <h4>Leyenda de Proyectos:</h4>
                <div className="legend-items">
                  {Object.keys(mapData).map((proyecto) => (
                    <div key={proyecto} className="legend-item">
                      <div 
                        className="legend-color" 
                        style={{ backgroundColor: getProjectColor(proyecto) }}
                      ></div>
                      <span className="legend-text">{proyecto}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="map-container">
                                 <MapContainer 
                   center={[6.5, -75.5]} // Coordenadas centradas en Antioquia
                   zoom={8} // Zoom para ver toda Antioquia
                   style={{ height: '500px', width: '100%' }}
                   className="responsive-map"
                 >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Renderizar marcadores agrupados por proyecto */}
                  {Object.entries(mapData).map(([proyecto, obras]) => {
                    const projectColor = getProjectColor(proyecto);
                    
                    return obras.map((obra, obraIndex) => {
                      const lat = F.latitud ? parseFloat(String(obra[F.latitud] ?? '')) : 0;
                      const lng = F.longitud ? parseFloat(String(obra[F.longitud] ?? '')) : 0;
                      const nombre = F.nombre ? String(obra[F.nombre] ?? '') : 'Obra sin nombre';
                      const dependencia = F.dependencia ? String(obra[F.dependencia] ?? '') : '';
                      const comuna = F.comunaOCorregimiento ? String(obra[F.comunaOCorregimiento] ?? '') : '';
                      const porcentajes = getPercentageFields(obra);
                      
                      return (
                        <CircleMarker
                          key={`${proyecto}-${obraIndex}`}
                          center={[lat, lng]}
                          radius={8}
                          fillColor={projectColor}
                          color={projectColor}
                          weight={2}
                          opacity={0.8}
                          fillOpacity={0.6}
                        >
                                                     <Popup className="custom-popup">
                             <div className="map-popup">
                               <div className="popup-header" style={{ borderLeftColor: projectColor }}>
                                 <h4>{nombre.length > 30 ? nombre.substring(0, 30) + '...' : nombre}</h4>
                                 <div className="popup-project">{proyecto.length > 25 ? proyecto.substring(0, 25) + '...' : proyecto}</div>
                               </div>
                               
                               <div className="popup-info">
                                 {dependencia && (
                                   <p><strong>Dep:</strong> {dependencia.length > 20 ? dependencia.substring(0, 20) + '...' : dependencia}</p>
                                 )}
                                 {comuna && (
                                   <p><strong>Com:</strong> {comuna.length > 20 ? comuna.substring(0, 20) + '...' : comuna}</p>
                                 )}
                               </div>

                               {porcentajes.length > 0 && (
                                 <div className="popup-percentages">
                                   <h5>Avance:</h5>
                                   <div className="percentage-grid">
                                     {porcentajes.slice(0, 6).map((item, idx) => {
                                       if (!item) return null;
                                       return (
                                         <div key={idx} className="percentage-item">
                                           <div className="percentage-label">{item.label.length > 15 ? item.label.substring(0, 15) + '...' : item.label}</div>
                                           <div className="percentage-bar">
                                             <div 
                                               className="percentage-fill" 
                                               style={{ 
                                                 width: `${Math.min(item.value, 100)}%`,
                                                 backgroundColor: projectColor
                                               }}
                                             ></div>
                                           </div>
                                           <div className="percentage-value">{item.value}%</div>
                                         </div>
                                       );
                                     })}
                                     {porcentajes.length > 6 && (
                                       <div className="percentage-item">
                                         <div className="percentage-label">+{porcentajes.length - 6} más...</div>
                                       </div>
                                     )}
                                   </div>
                                 </div>
                               )}
                             </div>
                           </Popup>
                        </CircleMarker>
                      );
                    });
                  })}
                </MapContainer>
              </div>
            </div>
          </div>

          {/* Columna derecha - Tablas */}
          <div className="right-column">
            {/* Tabla de obras entregadas */}
            <div className="table-card">
              <WorksTable
                title="Obras entregadas"
                works={entregadas}
                type="entregadas"
                maxRows={6}
              />
            </div>

            {/* Tabla de obras por entregar */}
            <div className="table-card">
              <WorksTable
                title="Obras por entregar"
                works={porEntregar}
                type="porEntregar"
                maxRows={4}
              />
            </div>

            {/* Tabla de alertas */}
            <div className="table-card">
              <AlertsTable
                alerts={alertas}
                maxRows={6}
              />
            </div>
          </div>
        </div>

        {/* Estado de carga */}
        <div className="status-indicator">{status}</div>
      </div>

      {/* Estilos CSS para el diseño moderno */}
      <style>{`
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg,rgb(200, 217, 234) 0%,rgb(127, 140, 152) 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .dashboard-content {
          padding: 100px 20px 20px 20px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .filters-section {
          background: white;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 25px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid rgb(72, 157, 242);
        }

        .filters-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-label {
          font-weight: 600;
          color: #00904c;
          font-size: 0.9rem;
        }

        .filter-select, .filter-input {
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background: white;
        }

        .filter-select:focus, .filter-input:focus {
          outline: none;
          border-color: #00904c;
          box-shadow: 0 0 0 3px rgba(0, 144, 76, 0.1);
        }

        .kpis-section {
          margin-bottom: 25px;
        }

        .kpis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .main-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 25px;
        }

        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .chart-card, .map-card, .table-card {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e9ecef;
        }

        .card-title {
          color: #00904c;
          font-size: 1.3rem;
          font-weight: 600;
          margin: 0 0 20px 0;
        }

        /* Estilos para la leyenda del mapa */
        .map-legend {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
          border: 1px solid #e9ecef;
        }

        .map-legend h4 {
          margin: 0 0 15px 0;
          color: #00904c;
          font-size: 1rem;
        }

        .legend-items {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .legend-text {
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
        }

        .map-container {
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #e9ecef;
        }

                 /* Estilos para el popup personalizado */
         .custom-popup .leaflet-popup-content-wrapper {
           border-radius: 8px;
           box-shadow: 0 4px 15px rgba(0,0,0,0.15);
         }

         .custom-popup .leaflet-popup-content {
           margin: 0;
           padding: 0;
           min-width: 220px;
           max-width: 250px;
         }

         .map-popup {
           padding: 0;
         }

         .popup-header {
           padding: 10px 12px;
           border-left: 3px solid;
           background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
           border-radius: 8px 8px 0 0;
         }

         .popup-header h4 {
           margin: 0 0 5px 0;
           color: #2c3e50;
           font-size: 0.95rem;
           font-weight: 600;
           line-height: 1.2;
         }

         .popup-project {
           color: #00904c;
           font-weight: 600;
           font-size: 0.8rem;
         }

         .popup-info {
           padding: 8px 12px;
           border-bottom: 1px solid #e9ecef;
         }

         .popup-info p {
           margin: 4px 0;
           font-size: 0.8rem;
           color: #666;
           line-height: 1.3;
         }

         .popup-info strong {
           color: #2c3e50;
         }

         .popup-percentages {
           padding: 8px 12px;
         }

         .popup-percentages h5 {
           margin: 0 0 8px 0;
           color: #00904c;
           font-size: 0.85rem;
           font-weight: 600;
         }

         .percentage-grid {
           display: flex;
           flex-direction: column;
           gap: 6px;
         }

         .percentage-item {
           display: grid;
           grid-template-columns: 1fr auto;
           gap: 6px;
           align-items: center;
         }

         .percentage-label {
           font-size: 0.75rem;
           color: #666;
           font-weight: 500;
           line-height: 1.2;
         }

         .percentage-bar {
           width: 60px;
           height: 6px;
           background: #e9ecef;
           border-radius: 3px;
           overflow: hidden;
         }

         .percentage-fill {
           height: 100%;
           border-radius: 3px;
           transition: width 0.3s ease;
         }

         .percentage-value {
           font-size: 0.7rem;
           color: #00904c;
           font-weight: 600;
           min-width: 25px;
           text-align: right;
         }

        .status-indicator {
          text-align: center;
          padding: 20px;
          color: #666;
          font-style: italic;
        }

        /* Responsive design */
        @media (max-width: 1200px) {
          .main-content {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-content {
            padding: 90px 15px 15px 15px;
          }

          .filters-container {
            grid-template-columns: 1fr;
          }

          .kpis-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }

          .chart-card, .map-card, .table-card {
            padding: 20px;
          }

          .legend-items {
            grid-template-columns: 1fr;
          }

                     .custom-popup .leaflet-popup-content {
             min-width: 200px;
             max-width: 220px;
           }

           .percentage-item {
             grid-template-columns: 1fr;
             gap: 4px;
           }

           .percentage-bar {
             width: 100%;
           }
        }

        @media (max-width: 480px) {
          .dashboard-content {
            padding: 80px 10px 10px 10px;
          }

          .filters-section {
            padding: 20px;
          }

          .chart-card, .map-card, .table-card {
            padding: 15px;
          }

                     .custom-popup .leaflet-popup-content {
             min-width: 180px;
             max-width: 200px;
           }
        }
      `}</style>
    </div>
  );
}
