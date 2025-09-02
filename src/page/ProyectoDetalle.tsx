import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { F } from '../dataConfig';
import { 
  applyFilters, 
  kpis, 
  buildTwoSeriesDataset, 
  getFilterOptions,
  type Row, 
  type Filters
} from '../utils/utils/metrics';
import Navigation from '../components/Navigation';
import Kpi from '../components/Kpi';
import ComboBars from '../components/comboBars';
import WorksTable from '../components/WorksTable';

const proyectoNombres: { [key: string]: string } = {
  'escenarios-deportivos': 'Escenarios Deportivos',
  'jardines-buen-comienzo': 'Jardines Buen Comienzo',
  'escuelas-inteligentes': 'Escuelas Inteligentes',
  'recreos': 'Recreos',
  'primavera-norte': 'Primavera Norte',
  'c5i': 'C5i',
  'tacita-de-plata': 'Tacita de Plata',
  'metro-la-80': 'Metro de La 80',
  'unidad-hospitalaria': 'Unidad Hospitalaria Santa Cruz',
  'otras-obras': 'Otras Obras'
};

export default function ProyectoDetalle() {
  const { proyecto } = useParams<{ proyecto: string }>();
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('Cargando...');
  const [filters, setFilters] = useState<Filters>({});


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

  // Filtrar por proyecto específico
  const proyectoRows = useMemo(() => {
    if (!proyecto || !F.proyectoEstrategico) return rows;
    
    const nombreProyecto = proyectoNombres[proyecto];
    if (!nombreProyecto) return rows;
    
    return rows.filter(row => {
      const proyectoRow = String(row[F.proyectoEstrategico] ?? '').toLowerCase();
      return proyectoRow.includes(nombreProyecto.toLowerCase()) || 
             proyectoRow.includes(proyecto.toLowerCase());
    });
  }, [rows, proyecto]);

  // Opciones de filtros dinámicas
  // Función para combinar los campos de fecha en formato YYYY-MM-DD
  const combineDateFields = (filters: any) => {
    const newFilters = { ...filters };
    
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

  const opciones = useMemo(() => getFilterOptions(proyectoRows, filters), [proyectoRows, filters]);
  const combinedFilters = useMemo(() => combineDateFields(filters), [filters]);
  const filtered = useMemo(() => applyFilters(proyectoRows, combinedFilters), [proyectoRows, combinedFilters]);

  // KPIs
  const k = useMemo(() => kpis(filtered), [filtered]);

  // Dataset para gráfico
  const comboDataset = useMemo(() => {
    if (!F.costoTotalActualizado || !F.presupuestoEjecutado) return [];
    return buildTwoSeriesDataset(filtered, F.dependencia, F.costoTotalActualizado, F.presupuestoEjecutado, 12);
  }, [filtered]);

  // Obras entregadas y por entregar
  const entregadas = useMemo(() => {
    return filtered.filter(r => {
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

  // const nombreProyecto = proyecto ? proyectoNombres[proyecto] || proyecto : 'Proyecto';

  return (
    <div className="shell">
      <Navigation showBackButton={true} title={proyectoNombres[proyecto!] || 'Detalle del Proyecto'} />
      <div className="container" style={{ paddingTop: '80px' }}>
        
        {/* Filtros */}
        <div className="panel">
          <h3 className="panel-title">Filtros de búsqueda</h3>
          <div className="filters-grid">
            {/* Dependencia */}
            {F.dependencia && (
              <label className="filter-item">
                <span className="filter-label">Dependencia</span>
                <select
                  className="filter-select"
                  value={filters.dependencia ?? ''}
                  onChange={e => setFilters(f => ({ ...f, dependencia: e.target.value || undefined }))}
                  disabled={opciones.dependencias.length === 0}
                >
                  <option value="">Todas</option>
                  {opciones.dependencias.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            )}

            {/* Comuna / Corregimiento */}
            {F.comunaOCorregimiento && (
              <label className="filter-item">
                <span className="filter-label">Comuna / Corregimiento</span>
                <select
                  className="filter-select"
                  value={filters.comuna ?? ''}
                  onChange={e => setFilters(f => ({ ...f, comuna: e.target.value || undefined }))}
                  disabled={opciones.comunas.length === 0}
                >
                  <option value="">Todas</option>
                  {opciones.comunas.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            )}

            {/* Tipo de Intervención */}
            {F.tipoDeIntervecion && (
              <label className="filter-item">
                <span className="filter-label">Tipo de Intervención</span>
                <select
                  className="filter-select"
                  value={filters.tipo ?? ''}
                  onChange={e => setFilters(f => ({ ...f, tipo: e.target.value || undefined }))}
                  disabled={opciones.tipos.length === 0}
                >
                  <option value="">Todas</option>
                  {opciones.tipos.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            )}

            {/* Contratista */}
            {F.contratistaOperador && (
              <label className="filter-item">
                <span className="filter-label">Contratista</span>
                <select
                  className="filter-select"
                  value={filters.contratista ?? ''}
                  onChange={e => setFilters(f => ({ ...f, contratista: e.target.value || undefined }))}
                  disabled={opciones.contratistas?.length === 0}
                >
                  <option value="">Todos</option>
                  {opciones.contratistas?.map(v => <option key={v} value={v}>{v}</option>) || []}
                </select>
              </label>
            )}

            {/* Estado de la Obra */}
            <label className="filter-item">
              <span className="filter-label">Estado de la Obra</span>
              <select
                className="filter-select"
                value={filters.estadoDeLaObra ?? ''}
                onChange={e => setFilters(f => ({ ...f, estadoDeLaObra: e.target.value || undefined }))}
              >
                <option value="">Todos los estados</option>
                <option value="entregada">Obra Entregada</option>
                <option value="en-ejecucion">En Ejecución</option>
                <option value="en-planeacion">En Planeación</option>
                <option value="suspendida">Suspendida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </label>

            {/* Filtros de fecha */}
            {(F.fechaRealDeEntrega || F.fechaEstimadaDeEntrega) && (
              <>
                <div className="filter-group">
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
                <div className="filter-group">
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

        {/* KPIs */}
        <div className="panel">
          <div className="kpi-grid">
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

        {/* Layout principal */}
        <div className="dashboard-grid">
          {/* Columna principal */}
          <div className="dashboard-main">
            {/* Gráfico principal */}
            {comboDataset.length > 0 && (
              <div className="panel">
                <div className="chart">
                  <ComboBars
                    title="Inversión total vs Presupuesto ejecutado"
                    dataset={comboDataset}
                    dim={F.dependencia}
                    v1={F.costoTotalActualizado}
                    v2={F.presupuestoEjecutado}
                  />
                </div>
              </div>
            )}

            {/* Tabla de obras entregadas */}
            <div className="panel">
              <WorksTable
                title="Obras entregadas"
                works={entregadas}
                type="entregadas"
                maxRows={8}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="dashboard-sidebar">
            {/* Tabla de obras por entregar */}
            <div className="panel">
              <WorksTable
                title="Obras por entregar"
                works={porEntregar}
                type="porEntregar"
                maxRows={6}
              />
            </div>
          </div>
        </div>

        {/* Estado de carga */}
        <div className="status-indicator">{status}</div>
      </div>

      {/* Estilos CSS con responsive design */}
      <style>{`
        .shell {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .panel {
          background: white;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 25px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          border: 1px solid #e0e0e0;
        }

        .panel-title {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 1.3rem;
          font-weight: 600;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-label {
          font-weight: 600;
          color: #555;
          font-size: 0.95rem;
        }

        .filter-select {
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          transition: all 0.3s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: #00904c;
          box-shadow: 0 0 0 3px rgba(0, 144, 76, 0.1);
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 25px;
        }

        .dashboard-main {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .dashboard-sidebar {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .chart {
          width: 100%;
          height: 400px;
        }

        .status-indicator {
          opacity: 0.7;
          text-align: center;
          padding: 20px;
          color: #666;
          font-style: italic;
        }

        /* ========================================================================
            DISEÑO RESPONSIVE COMPLETO
        ======================================================================== */
        
        @media (max-width: 1200px) {
          .container {
            padding: 0 15px;
          }
          
          .filters-grid {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 18px;
          }
          
          .kpi-grid {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 18px;
          }
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 0 12px;
          }
          
          .panel {
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 12px;
          }
          
          .panel-title {
            font-size: 1.2rem;
            margin-bottom: 15px;
          }
          
          .filters-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .filter-select {
            padding: 10px;
            font-size: 14px;
          }
          
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          
          .dashboard-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .dashboard-main {
            gap: 20px;
          }
          
          .dashboard-sidebar {
            gap: 20px;
          }
          
          .chart {
            height: 350px;
          }
        }
        
        @media (max-width: 480px) {
          .container {
            padding: 0 10px;
          }
          
          .panel {
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 10px;
          }
          
          .panel-title {
            font-size: 1.1rem;
            margin-bottom: 12px;
          }
          
          .filters-grid {
            gap: 12px;
          }
          
          .filter-label {
            font-size: 0.9rem;
          }
          
          .filter-select {
            padding: 8px;
            font-size: 13px;
            border-radius: 6px;
          }
          
          .kpi-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .dashboard-grid {
            gap: 15px;
          }
          
          .dashboard-main {
            gap: 15px;
          }
          
          .dashboard-sidebar {
            gap: 15px;
          }
          
          .chart {
            height: 300px;
          }
          
          .status-indicator {
            padding: 15px;
            font-size: 14px;
          }
        }
        
        @media (max-width: 360px) {
          .container {
            padding: 0 8px;
          }
          
          .panel {
            padding: 12px;
            margin-bottom: 12px;
          }
          
          .filter-select {
            padding: 6px;
            font-size: 12px;
          }
          
          .chart {
            height: 250px;
          }
        }

        /* Estilos para los inputs de fecha tipo calendario */
        .date-inputs {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-start;
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

        .date-inputs .date-day {
          flex: 0 0 70px;
          min-width: 70px;
        }

        .date-inputs .date-month {
          flex: 0 0 120px;
          min-width: 120px;
        }

        .date-inputs .date-year {
          flex: 0 0 90px;
          min-width: 90px;
        }

        /* Responsive para tablets */
        @media (max-width: 1024px) {
          .date-inputs {
            gap: 8px;
          }
          
          .date-inputs .date-day {
            flex: 0 0 65px;
            min-width: 65px;
          }
          
          .date-inputs .date-month {
            flex: 0 0 110px;
            min-width: 110px;
          }
          
          .date-inputs .date-year {
            flex: 0 0 85px;
            min-width: 85px;
          }
        }

        /* Responsive para móviles */
        @media (max-width: 768px) {
          .date-inputs {
            flex-direction: column;
            gap: 8px;
            width: 100%;
          }
          
          .date-inputs .filter-select {
            width: 100%;
            max-width: 200px;
            margin: 0 auto;
          }
          
          .date-inputs .date-day,
          .date-inputs .date-month,
          .date-inputs .date-year {
            flex: none;
            min-width: auto;
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
}
