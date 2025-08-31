import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
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

// Configuración del ícono personalizado para Leaflet
const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

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

  // Datos para el mapa (obras con coordenadas)
  const mapData = useMemo(() => {
    return filtered.filter(r => {
      // Filtrar obras que tengan coordenadas (latitud y longitud)
      const lat = F.latitud ? parseFloat(String(r[F.latitud] ?? '')) : null;
      const lng = F.longitud ? parseFloat(String(r[F.longitud] ?? '')) : null;
      return lat && lng && !isNaN(lat) && !isNaN(lng);
    }).slice(0, 50); // Limitar a 50 marcadores para mejor rendimiento
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

            {/* Mapa de obras */}
            <div className="map-card">
              <h3 className="card-title">Ubicación de Obras</h3>
              <div className="map-container">
                <MapContainer 
                  center={[6.2442, -75.5812]} // Coordenadas de Medellín
                  zoom={11} 
                  style={{ height: '400px', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                                     {mapData.map((obra, index) => {
                     const lat = F.latitud ? parseFloat(String(obra[F.latitud] ?? '')) : 0;
                     const lng = F.longitud ? parseFloat(String(obra[F.longitud] ?? '')) : 0;
                     const nombre = F.nombre ? String(obra[F.nombre] ?? '') : 'Obra sin nombre';
                     
                     return (
                       <Marker 
                         key={index} 
                         position={[lat, lng]} 
                         icon={customIcon}
                       >
                         <Popup>
                           <div className="map-popup">
                             <h4>{nombre}</h4>
                             {F.proyectoEstrategico && (
                               <p><strong>Proyecto:</strong> {String(obra[F.proyectoEstrategico] ?? '')}</p>
                             )}
                             {F.dependencia && (
                               <p><strong>Dependencia:</strong> {String(obra[F.dependencia] ?? '')}</p>
                             )}
                           </div>
                         </Popup>
                       </Marker>
                     );
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
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
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
          border: 1px solid #e9ecef;
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

        .map-container {
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #e9ecef;
        }

        .map-popup h4 {
          color: #00904c;
          margin: 0 0 10px 0;
          font-size: 1rem;
        }

        .map-popup p {
          margin: 5px 0;
          font-size: 0.9rem;
          color: #666;
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
        }
      `}</style>
    </div>
  );
}
