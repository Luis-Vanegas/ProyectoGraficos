import { useState, useEffect, useMemo } from 'react';
import { F } from '../dataConfig';
import { 
  applyFilters, 
  getFilterOptions,
  cleanDependentFilters,
  type Row, 
  type Filters
} from '../utils/utils/metrics';
import Navigation from '../components/Navigation';
import WorksTable from '../components/WorksTable';

export default function ConsultarObra() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('Cargando...');
  const [filters, setFilters] = useState<Filters>({});
  const [searchTerm, setSearchTerm] = useState('');

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
        setStatus(`${rows.length} obras cargadas`);
      } catch (e) {
        console.error(e);
        setStatus('No se pudieron cargar los datos');
      }
    })();
  }, []);

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

  // Opciones de filtros dinámicas
  const opciones = useMemo(() => getFilterOptions(rows, filters), [rows, filters]);
  const combinedFilters = useMemo(() => combineDateFields(filters), [filters]);

  // Aplica filtros y búsqueda
  const filtered = useMemo(() => {
    let filteredRows = applyFilters(rows, combinedFilters);
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredRows = filteredRows.filter(row => {
        // Buscar en campos relevantes
        const campos = [
          F.nombreDeLaObra,
          F.descripcionDeLaObra,
          F.proyectoEstrategico,
          F.dependencia,
          F.comunaOCorregimiento,
          F.tipoDeIntervecion
        ].filter(Boolean);
        
        return campos.some(campo => {
          const valor = String(row[campo] ?? '').toLowerCase();
          return valor.includes(term);
        });
      });
    }
    
    return filteredRows;
  }, [rows, filters, searchTerm]);

  // Función para manejar cambios en filtros
  const handleFilterChange = (filterKey: keyof Filters, value: string) => {
    const newValue = value || undefined;
    const newFilters = { ...filters, [filterKey]: newValue };
    const cleanedFilters = cleanDependentFilters(newFilters, filterKey);
    setFilters(cleanedFilters);
  };

  return (
    <div className="shell">
      <Navigation showBackButton={true} title="Consultar Obra" />
      <div className="container" style={{ paddingTop: '80px' }}>
        
        {/* Barra de búsqueda */}
        <div className="panel">
          <div className="search-section">
            <label className="search-label">
              🔍 Buscar obra
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre, descripción, proyecto, dependencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filtros */}
          <div className="filters-grid">
            {/* Proyectos estratégicos */}
            {F.proyectoEstrategico && (
              <label className="filter-item">
                <span className="filter-label">Proyectos estratégicos</span>
                <select
                  className="filter-select"
                  value={filters.proyecto ?? ''}
                  onChange={e => handleFilterChange('proyecto', e.target.value)}
                >
                  <option value="">Todos</option>
                  {opciones.proyectos.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            )}

            {/* Dependencia */}
            {F.dependencia && (
              <label className="filter-item">
                <span className="filter-label">Dependencia</span>
                <select
                  className="filter-select"
                  value={filters.dependencia ?? ''}
                  onChange={e => handleFilterChange('dependencia', e.target.value)}
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
                  onChange={e => handleFilterChange('comuna', e.target.value)}
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
                  onChange={e => handleFilterChange('tipo', e.target.value)}
                  disabled={opciones.tipos.length === 0}
                >
                  <option value="">Todos</option>
                  {opciones.tipos.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            )}

            {/* Contratista */}
            {F.contratista && (
              <label className="filter-item">
                <span className="filter-label">Contratista</span>
                <select
                  className="filter-select"
                  value={filters.contratista ?? ''}
                  onChange={e => handleFilterChange('contratista', e.target.value)}
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
                value={filters.estado ?? ''}
                onChange={e => handleFilterChange('estado', e.target.value)}
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

        {/* Resultados */}
        <div className="panel">
          <div className="results-header">
            <h3>Resultados de la búsqueda</h3>
            <div className="results-count">
              {filtered.length} obras encontradas
            </div>
          </div>

          {filtered.length > 0 ? (
            <WorksTable
              title=""
              works={filtered}
              type="consulta"
              maxRows={20}
            />
          ) : (
            <div className="no-results">
              {searchTerm || Object.keys(filters).some(k => filters[k as keyof Filters]) 
                ? 'No se encontraron obras con los criterios especificados'
                : 'Ingresa un término de búsqueda o selecciona filtros para encontrar obras'
              }
            </div>
          )}
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

        .search-section {
          margin-bottom: 25px;
        }

        .search-label {
          display: block;
          margin-bottom: 12px;
          font-weight: 600;
          font-size: 1.1rem;
          color: #333;
        }

        .search-input {
          width: 100%;
          padding: 15px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 10px;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .search-input:focus {
          border-color: #00904c;
          box-shadow: 0 0 0 3px rgba(0, 144, 76, 0.1);
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

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .results-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.3rem;
        }

        .results-count {
          background: #00904c;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .no-results {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 18px;
          background: #f8f9fa;
          border-radius: 10px;
          border: 2px dashed #ddd;
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
          
          .search-section {
            margin-bottom: 20px;
          }
          
          .search-label {
            font-size: 1rem;
            margin-bottom: 10px;
          }
          
          .search-input {
            padding: 12px;
            font-size: 15px;
            border-radius: 8px;
          }
          
          .filters-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .filter-select {
            padding: 10px;
            font-size: 14px;
          }
          
          .results-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .results-header h3 {
            font-size: 1.2rem;
          }
          
          .no-results {
            padding: 30px 20px;
            font-size: 16px;
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
          
          .search-section {
            margin-bottom: 15px;
          }
          
          .search-label {
            font-size: 0.9rem;
            margin-bottom: 8px;
          }
          
          .search-input {
            padding: 10px;
            font-size: 14px;
            border-radius: 6px;
          }
          
          .filters-grid {
            gap: 12px;
          }
          
          .filter-select {
            padding: 8px;
            font-size: 13px;
            border-radius: 6px;
          }
          
          .results-header h3 {
            font-size: 1.1rem;
          }
          
          .no-results {
            padding: 25px 15px;
            font-size: 15px;
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
            font-size: 0.95rem;
            margin-bottom: 8px;
          }
          
          .search-input {
            padding: 10px;
            font-size: 14px;
            border-radius: 6px;
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
          
          .results-header h3 {
            font-size: 1.1rem;
          }
          
          .results-count {
            padding: 6px 12px;
            font-size: 13px;
          }
          
          .no-results {
            padding: 25px 15px;
            font-size: 15px;
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
          
          .search-input {
            padding: 8px;
            font-size: 13px;
          }
          
          .filter-select {
            padding: 6px;
            font-size: 12px;
          }
          
          .results-header h3 {
            font-size: 1rem;
          }
          
          .no-results {
            padding: 20px 12px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
