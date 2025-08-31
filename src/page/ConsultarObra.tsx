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

  // Opciones de filtros dinámicas
  const opciones = useMemo(() => getFilterOptions(rows, filters), [rows, filters]);

  // Aplica filtros y búsqueda
  const filtered = useMemo(() => {
    let filteredRows = applyFilters(rows, filters);
    
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
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              🔍 Buscar obra
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre, descripción, proyecto, dependencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="panel">
          <h3 style={{ marginBottom: '20px' }}>Filtros de búsqueda</h3>
          <div className="toolbar">
            {/* Proyecto estratégico */}
            {F.proyectoEstrategico && (
              <label>
                Proyectos estratégicos
                <select
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
              <label>
                Dependencia
                <select
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
              <label>
                Comuna / Corregimiento
                <select
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
              <label>
                Tipo de Intervención
                <select
                  value={filters.tipo ?? ''}
                  onChange={e => handleFilterChange('tipo', e.target.value)}
                  disabled={opciones.tipos.length === 0}
                >
                  <option value="">Todas</option>
                  {opciones.tipos.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="panel">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px' 
          }}>
            <h3>Resultados de la búsqueda</h3>
            <div style={{ 
              background: '#f0f0f0', 
              padding: '8px 16px', 
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
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
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              fontSize: '18px'
            }}>
              {searchTerm || Object.keys(filters).some(k => filters[k as keyof Filters]) 
                ? 'No se encontraron obras con los criterios especificados'
                : 'Ingresa un término de búsqueda o selecciona filtros para encontrar obras'
              }
            </div>
          )}
        </div>

        {/* Estado de carga */}
        <div style={{ opacity: .7, textAlign: 'center', padding: '20px' }}>{status}</div>
      </div>
    </div>
  );
}
