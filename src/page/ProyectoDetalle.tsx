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
  const opciones = useMemo(() => getFilterOptions(proyectoRows, filters), [proyectoRows, filters]);

  // Aplica filtros
  const filtered = useMemo(() => applyFilters(proyectoRows, filters), [proyectoRows, filters]);

  // KPIs
  const k = useMemo(() => kpis(filtered), [filtered]);

  // Dataset para gráfico
  const comboDataset = useMemo(() => {
    if (!dimension || !F.costoTotalActualizado || !F.presupuestoEjecutado) return [];
    return buildTwoSeriesDataset(filtered, dimension, F.costoTotalActualizado, F.presupuestoEjecutado, 12);
  }, [filtered, dimension]);

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

  const nombreProyecto = proyecto ? proyectoNombres[proyecto] || proyecto : 'Proyecto';

  return (
    <div className="shell">
      <Navigation showBackButton={true} title={nombreProyecto} />
      <div className="container" style={{ paddingTop: '80px' }}>
        
        {/* Filtros */}
        <div className="panel">
          <div className="toolbar">
            {/* Dependencia */}
            {F.dependencia && (
              <label>
                Dependencia
                <select
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
              <label>
                Comuna / Corregimiento
                <select
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
              <label>
                Tipo de Intervención
                <select
                  value={filters.tipo ?? ''}
                  onChange={e => setFilters(f => ({ ...f, tipo: e.target.value || undefined }))}
                  disabled={opciones.tipos.length === 0}
                >
                  <option value="">Todas</option>
                  {opciones.tipos.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            )}

            {/* Dimensión del gráfico */}
            <label>
              Dimensión gráfico
              <select value={dimension ?? ''} onChange={e => setDimension(e.target.value)}>
                {[F.dependencia, F.comunaOCorregimiento, F.tipoDeIntervecion].filter(Boolean).map(d => (
                  <option key={d} value={d!}>{d}</option>
                ))}
              </select>
            </label>
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
                    dim={dimension!}
                    v1={F.costoTotalActualizado}
                    v2={F.presupuestoEjecutado}
                  />
                </div>
              </div>
            )}

            {/* Tabla de obras entregadas */}
            <WorksTable
              title="Obras entregadas"
              works={entregadas}
              type="entregadas"
              maxRows={8}
            />
          </div>

          {/* Sidebar */}
          <div className="dashboard-sidebar">
            {/* Tabla de obras por entregar */}
            <WorksTable
              title="Obras por entregar"
              works={porEntregar}
              type="porEntregar"
              maxRows={6}
            />
          </div>
        </div>

        {/* Estado de carga */}
        <div style={{ opacity: .7, textAlign: 'center', padding: '20px' }}>{status}</div>
      </div>
    </div>
  );
}
