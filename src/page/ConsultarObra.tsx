import { useState, useEffect, useMemo, useCallback } from 'react';
import { F } from '../dataConfig';
import { 
  getFilterOptions,
  applyFilters,
  cleanDependentFilters,
  kpis,
  type Filters,
  type Row
} from '../utils/utils/metrics';
import Navigation from '../components/Navigation';
import GanttChartModern from '../components/GanttChartModern';
import ImprovedMultiSelect from '../components/ImprovedMultiSelect';
import NotificationCenter from '../components/NotificationCenter';
import ProjectProgressIndicator from '../components/ProjectProgressIndicator';
import { IconButton, Badge } from '@mui/material';
import { NotificationsActive } from '@mui/icons-material';

// Importar las imágenes de las comunas
import comuna1Image from '../assets/comuna1.jpeg';
import comuna3Image from '../assets/comuna3.jpg';

export default function ConsultarObra() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [showStages, setShowStages] = useState<boolean>(false);

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
      } catch {
        // Error al cargar datos
      }
    })();
  }, []);

  // Opciones de filtros dinámicas (relacionadas)
  const opciones = useMemo(() => getFilterOptions(rows, filters), [rows, filters]);

  // Filtrar filas según filtros
  const filteredRows = useMemo(() => applyFilters(rows, filters), [rows, filters]);

  // Calcular métricas totales para mostrar el presupuesto ejecutado total
  const totalMetrics = useMemo(() => kpis(filteredRows), [filteredRows]);

  // Calcular número de notificaciones
  useEffect(() => {
    if (!filteredRows || filteredRows.length === 0) {
      setNotificationCount(0);
      return;
    }

    let count = 0;

    // Obras retrasadas
    const obrasRetrasadas = filteredRows.filter(row => {
      const fechaEstimada = row[F.fechaEstimadaDeEntrega];
      const fechaReal = row[F.fechaRealDeEntrega];
      const estadoObra = String(row[F.estadoDeLaObra] || '').toLowerCase();
      
      if (fechaEstimada && fechaReal) {
        const fechaEst = new Date(fechaEstimada);
        const fechaRealDate = new Date(fechaReal);
        return fechaRealDate > fechaEst;
      }
      
      if (fechaEstimada && !fechaReal && !estadoObra.includes('entreg')) {
        const fechaEst = new Date(fechaEstimada);
        const hoy = new Date();
        return fechaEst < hoy;
      }
      
      return false;
    });

    // Obras por vencer
    const obrasPorVencer = filteredRows.filter(row => {
      const fechaEstimada = row[F.fechaEstimadaDeEntrega];
      const estadoObra = String(row[F.estadoDeLaObra] || '').toLowerCase();
      
      if (!fechaEstimada || estadoObra.includes('entreg')) return false;
      
      const fechaEst = new Date(fechaEstimada);
      const hoy = new Date();
      const diasRestantes = Math.ceil((fechaEst.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      return diasRestantes <= 30 && diasRestantes > 0;
    });

    // Obras con presupuesto bajo
    const obrasPresupuestoBajo = filteredRows.filter(row => {
      const presupuestoEjecutado = Number(row[F.presupuestoEjecutado]) || 0;
      const costoTotal = Number(row[F.costoTotalActualizado]) || 0;
      const estadoObra = String(row[F.estadoDeLaObra] || '').toLowerCase();
      
      if (costoTotal === 0 || estadoObra.includes('entreg')) return false;
      
      const porcentaje = (presupuestoEjecutado / costoTotal) * 100;
      return porcentaje < 30 && porcentaje > 0;
    });

    // Obras con riesgo
    const obrasConRiesgo = filteredRows.filter(row => {
      const descripcionRiesgo = row[F.descripcionDelRiesgo];
      return descripcionRiesgo && String(descripcionRiesgo).trim().length > 0;
    });

    count = obrasRetrasadas.length + obrasPorVencer.length + obrasPresupuestoBajo.length + obrasConRiesgo.length;
    setNotificationCount(count);
  }, [filteredRows]);

  // Selección priorizada: obra -> proyecto (toma la primera si hay múltiples)
  const currentData = useMemo(() => {
    if (filters?.nombre && filters.nombre.length > 0) {
      const name = filters.nombre[0];
      return filteredRows.find(r => String(r[F.nombre] ?? '') === name) || null;
    }
    if (filters?.proyecto && filters.proyecto.length > 0) {
      const proj = filters.proyecto[0];
      return filteredRows.find(r => String(r[F.proyectoEstrategico] ?? '') === proj) || null;
    }
    return null;
  }, [filteredRows, filters]);

  // Handlers de filtros
  const updateFilter = useCallback((key: keyof Filters, values: string[]) => {
    setFilters(prev => {
      const next = { ...prev, [key]: values } as Filters;
      return cleanDependentFilters(next, key);
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);



  // Función para obtener el icono apropiado según el tipo de dato
  const getIconForField = (fieldType: string) => {
    const iconMap: { [key: string]: string } = {
      'comuna': '📍',
      'empleos': '👥',
      'area': '📏',
      'intervencion': '🔧',
      'espacio': '🏞️',
      'contratista': '🏗️',
      'dependencia': '🏛️',
      'alerta': '⚠️',
      'criterio': '📋'
    };
    return iconMap[fieldType] || '📊';
  };

  // Función para obtener la imagen de la comuna
  const getComunaImage = (comunaName: string) => {
    const comunaImages: { [key: string]: string } = {
      '01 - Popular': comuna1Image,
      '03 - Manrique': comuna3Image,
      'Popular': comuna1Image,
      'Manrique': comuna3Image,
      // Agregar más comunas según tengas las imágenes
    };
    
    // Buscar por nombre exacto o por coincidencia parcial
    const exactMatch = comunaImages[comunaName];
    if (exactMatch) return exactMatch;
    
    // Buscar coincidencia parcial
    const partialMatch = Object.keys(comunaImages).find(key => 
      comunaName.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(comunaName.toLowerCase())
    );
    
    return partialMatch ? comunaImages[partialMatch] : null;
  };


  // Función para parsear porcentajes (copiada del servidor)
  const parsePct = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return Math.max(0, Math.min(100, val));
    let s = String(val).trim();
    const sLower = s.toLowerCase();
    if (sLower.includes('no aplica')) return 0;
    if (sLower.includes('sin información') || sLower.includes('sin informacion')) return 0;
    s = s.replace('%', '').replace(/,/g, '.');
    if (s === '' || sLower === 'n/a') return 0;
    let n = Number(s);
    if (!Number.isFinite(n)) return 0;
    if (n > 0 && n <= 1) n *= 100;
    return Math.max(0, Math.min(100, n));
  };

  // Datos para gráficos de etapas (donas) - ahora dinámicos
  const stagesData = useMemo(() => {
    if (!currentData) return [];
    
    const stages = [
      {
        name: 'Planeación (MGA)',
        value: parsePct(currentData[F.porcentajePlaneacionMGA]),
        color: '#2196f3'
      },
      {
        name: 'Estudios preliminares',
        value: parsePct(currentData[F.porcentajeEstudiosPreliminares]),
        color: '#ff9800'
      },
      {
        name: 'Viabilización(DAP)',
        value: parsePct(currentData[F.porcentajeViabilizacionDAP]),
        color: '#4caf50'
      },
      {
        name: 'Gestión Predial',
        value: parsePct(currentData[F.porcentajeGestionPredial]),
        color: '#9c27b0'
      },
      {
        name: 'Contratación',
        value: parsePct(currentData[F.porcentajeContratacion]),
        color: '#607d8b'
      },
      {
        name: 'Inicio',
        value: parsePct(currentData[F.porcentajeInicio]),
        color: '#795548'
      },
      {
        name: 'Diseños',
        value: parsePct(currentData[F.porcentajeDisenos]),
        color: '#e91e63'
      },
      {
        name: 'Ejecución de Obra',
        value: parsePct(currentData[F.porcentajeEjecucionObra]) || parsePct(currentData[F.presupuestoPorcentajeEjecutado]),
        color: '#ff5722'
      },
      {
        name: 'Entrega Obra',
        value: parsePct(currentData[F.porcentajeEntregaObra]),
        color: '#3f51b5'
      },
      {
        name: 'Liquidación',
        value: parsePct(currentData[F.porcentajeLiquidacion]),
        color: '#009688'
      }
    ];
    
    return stages;
  }, [currentData]);

  // Componente de medidor semicircular
  const SemicircularGauge = ({ percentage, title, color }: { percentage: number; title: string; color: string }) => {
    const radius = 40;
    const strokeWidth = 5;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
      <div className="gauge-container">
        <div className="gauge-title">{title}</div>
        <div className="gauge-wrapper">
          <svg
            className="gauge-svg"
            height={radius * 2}
            width={radius * 2}
          >
            {/* Fondo del gauge */}
            <circle
              stroke="#E9ECEF"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="gauge-background"
            />
            {/* Progreso del gauge */}
            <circle
              stroke={color}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="gauge-progress"
              transform={`rotate(-90 ${radius} ${radius})`}
            />
          </svg>
          <div className="gauge-percentage">{percentage.toFixed(2)}%</div>
          </div>
        <div className="gauge-labels">
          <span className="gauge-label-start">0.00%</span>
          <span className="gauge-label-end">100.00%</span>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="consultar-obra-container"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'block',
        background: 'linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 50%, #F0F8FF 100%)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      <Navigation showBackButton={true} title="Consultar Obra" />
      
      {/* Botón de notificaciones */}
      <Badge
        badgeContent={notificationCount}
        color="error"
        sx={{
          position: 'fixed',
          top: 100,
          right: 20,
          zIndex: 1000,
        }}
      >
        <IconButton
          className="notifications-fab"
          title="Ver alertas"
          onClick={() => setShowNotifications(true)}
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
              background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
            },
            '&:active': {
              transform: 'translateY(0)',
              boxShadow: '0 1px 4px rgba(220, 38, 38, 0.3)',
            }
          }}
        >
          <NotificationsActive sx={{ fontSize: 20 }} />
        </IconButton>
      </Badge>
      
      {/* Botón flotante para abrir el panel de filtros */}
      <button
        className={`filters-fab${isSidebarOpen ? ' open' : ''}`}
        title={isSidebarOpen ? 'Cerrar filtros' : 'Abrir filtros'}
        onClick={() => setIsSidebarOpen(v => !v)}
        aria-expanded={isSidebarOpen}
        aria-controls="filtersDrawer"
      >
        {isSidebarOpen ? '✖ Cerrar' : '☰ Filtros'}
      </button>

      {/* Panel lateral de filtros (colapsable) */}
      <aside id="filtersDrawer" className={`filters-drawer${isSidebarOpen ? ' open' : ''}`} aria-hidden={!isSidebarOpen}>
        <div className="filters-actions drawer-header">
          <h3 className="drawer-title">Filtros</h3>
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
            onClick={clearFilters}
            title="Borrar todos los filtros"
            disabled={Object.keys(filters).length === 0}
          >
            <span className="btn-icon" aria-hidden>✖</span>
            Borrar filtros
          </button>
          <button className="drawer-close-btn" aria-label="Cerrar filtros" onClick={() => setIsSidebarOpen(false)}>✖</button>
        </div>
        <div className="drawer-scroll">
          {/* Primera fila de filtros */}
          <div className="filters-container filters-row-main">
            <ImprovedMultiSelect
              label="PROYECTOS ESTRATÉGICOS"
              options={opciones.proyectos}
              selectedValues={filters.proyecto ?? []}
              onSelectionChange={(vals) => updateFilter('proyecto', vals)}
              placeholder="Todos los proyectos"
            />
            <ImprovedMultiSelect
              label="NOMBRE DE LA OBRA"
              options={opciones.nombres}
              selectedValues={filters.nombre ?? []}
              onSelectionChange={(vals) => updateFilter('nombre', vals)}
              placeholder="Todas las obras"
            />
            <ImprovedMultiSelect
              label="COMUNA / CORREGIMIENTO"
              options={opciones.comunas}
              selectedValues={filters.comuna ?? []}
              onSelectionChange={(vals) => updateFilter('comuna', vals)}
              placeholder="Todas las comunas"
            />
          </div>

          {/* Segunda fila de filtros */}
          <div className="filters-container filters-row-secondary">
            <ImprovedMultiSelect
              label="DEPENDENCIA"
              options={opciones.dependencias}
              selectedValues={filters.dependencia ?? []}
              onSelectionChange={(vals) => updateFilter('dependencia', vals)}
              placeholder="Todas las dependencias"
            />
            <ImprovedMultiSelect
              label="TIPO DE INTERVENCIÓN"
              options={opciones.tipos}
              selectedValues={filters.tipo ?? []}
              onSelectionChange={(vals) => updateFilter('tipo', vals)}
              placeholder="Todos los tipos"
            />
            <ImprovedMultiSelect
              label="ESTADO DE LA OBRA"
              options={opciones.estadoDeLaObra}
              selectedValues={filters.estadoDeLaObra ?? []}
              onSelectionChange={(vals) => updateFilter('estadoDeLaObra', vals)}
              placeholder="Todos los estados"
            />
          </div>

          {/* Tercera fila de filtros */}
          <div className="filters-container filters-row-tertiary">
            <ImprovedMultiSelect
              label="CONTRATISTA"
              options={opciones.contratistas}
              selectedValues={filters.contratista ?? []}
              onSelectionChange={(vals) => updateFilter('contratista', vals)}
              placeholder="Todos los contratistas"
            />
          </div>
        </div>
        <div className="drawer-footer">
          <button className="apply-filters-btn" onClick={() => setIsSidebarOpen(false)}>Aplicar y cerrar</button>
        </div>
      </aside>
      
      {/* Fondo semitransparente al abrir el drawer */}
      {isSidebarOpen && <div className="filters-backdrop" onClick={() => setIsSidebarOpen(false)} />}

      {/* Contenido principal */}
      <div className="main-content">
        {/* Layout principal con dos columnas */}
        <div className="main-layout">
          {/* Columna izquierda - Fechas y Descripción */}
          <div className="left-column">
        {/* Sección de fechas de entrega */}
            <div className="delivery-dates-section-left">
          <h3 className="delivery-dates-title" style={{color: '#2d3748', fontWeight: '600'}}>Fechas de Entrega</h3>
              <div className="delivery-dates-grid-left">
            <div className="delivery-date-card estimated">
              <div className="delivery-date-label">FECHA ESTIMADA DE ENTREGA</div>
              <div className="delivery-date-value">
                {currentData && currentData[F.fechaEstimadaDeEntrega] ? 
                  new Date(currentData[F.fechaEstimadaDeEntrega] as string).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 
                  'No especificada'
                }
          </div>
        </div>

            <div className="delivery-date-card real">
              <div className="delivery-date-label">FECHA REAL DE ENTREGA</div>
              <div className="delivery-date-value">
                {currentData && currentData[F.fechaRealDeEntrega] ? 
                  new Date(currentData[F.fechaRealDeEntrega] as string).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 
                  'No especificada'
                }
              </div>
            </div>
            
              </div>
            </div>
            
            {/* Indicador de avance del proyecto */}
            <ProjectProgressIndicator 
              data={currentData} 
              allData={filteredRows} 
              onToggleStages={() => setShowStages(!showStages)}
            />

            {/* Descripción debajo del indicador */}
            <div className="description-card" style={{ marginTop: '20px' }}>
              <div className="card-header">
                <span className="detail-icon">{getIconForField('criterio')}</span>
                <span className="card-title">Descripción</span>
                  </div>
              <div className="description-content-new">
              {currentData ? (
                  String(currentData[F.descripcion] ?? 'Sin descripción')
              ) : (
                  'Usa el botón de filtros para seleccionar un proyecto u obra.'
              )}
                </div>
                  </div>
                </div>
            
          {/* Columna derecha - Detalles y métricas */}
          <div className="right-column">
            {/* Sección de métricas financieras */}
            <div className="financial-section">
              <div className="financial-card total-investment">
                <div className="financial-label">INVERSIÓN TOTAL</div>
                <div className="financial-value">
                  {currentData ? 
                    `$${((Number(currentData[F.costoTotalActualizado] ?? 0) / 1000000000).toFixed(2))} bill.` : 
                    '$10,69 bill.'
                  }
                  </div>
                </div>
              <div className="financial-card budget-executed">
                <div className="financial-label">PRESUPUESTO EJECUTADO</div>
                <div className="financial-value">
                  {currentData ? 
                    `$${((Number(currentData[F.presupuestoEjecutado] ?? 0) / 1000000000).toFixed(2))} bill.` : 
                    `$${(totalMetrics.ejec / 1000000000).toFixed(2)} bill.`
                  }
                </div>
                </div>
              <div className="financial-card budget-2024-2025">
                <div className="financial-label">PRESUPUESTO 2024-2025</div>
                <div className="financial-value">
                  {currentData ? 
                    `$${((Number(currentData[F.costoTotalActualizado] ?? 0) * 1.15 / 1000000000).toFixed(2))} bill.` : 
                    '$12.29 bill.'
                  }
                </div>
                  </div>
                </div>

              {/* Grid de detalles organizados */}
              <div className="details-grid-new">
                {/* Comuna con imagen */}
                <div className="detail-card">
                  <div className="detail-header">
                    <div className="comuna-image-container">
                      {(() => {
                        const comunaName = currentData ? String(currentData[F.comunaOCorregimiento] ?? '01 - Popular') : '01 - Popular';
                        const imageSrc = getComunaImage(comunaName);
                        
                        if (imageSrc) {
                          return (
                            <img 
                              src={imageSrc} 
                              alt={`Comuna ${comunaName}`} 
                              className="comuna-image"
                              onError={(e) => {
                                console.log('Error loading image:', imageSrc);
                                e.currentTarget.style.display = 'none';
                              }}
                              onLoad={() => console.log('Image loaded successfully:', imageSrc)}
                            />
                          );
                        } else {
                          console.log('No image found for comuna:', comunaName);
                          return <span className="detail-icon">{getIconForField('comuna')}</span>;
                        }
                      })()}
              </div>
                    <span className="detail-label">Comuna / Corregimiento</span>
            </div>
                  <div className="detail-value">
                {currentData ? String(currentData[F.comunaOCorregimiento] ?? '01 - Popular') : '01 - Popular'}
                  </div>
                </div>
            
                {/* Empleos generados */}
                <div className="detail-card">
                  <div className="detail-header">
                    <span className="detail-icon">{getIconForField('empleos')}</span>
                    <span className="detail-label">Empleos generados</span>
                  </div>
                  <div className="detail-value">
                {currentData ? String(currentData[F.empleosGenerados] ?? '6298') : '6298'}
          </div>
        </div>

                {/* Área Construida */}
                <div className="detail-card">
                  <div className="detail-header">
                    <span className="detail-icon">{getIconForField('area')}</span>
                    <span className="detail-label">Área Construida m2</span>
                  </div>
                  <div className="detail-value">
                {currentData ? String(currentData[F.areaConstruida] ?? '498573') : '498573'}
            </div>
          </div>

                {/* Tipo de intervención */}
                <div className="detail-card">
                  <div className="detail-header">
                    <span className="detail-icon">{getIconForField('intervencion')}</span>
                    <span className="detail-label">Tipo de intervención</span>
              </div>
                  <div className="detail-value">
                {currentData ? String(currentData[F.tipoDeIntervecion] ?? 'Restitución') : 'Restitución'}
            </div>
            </div>

                {/* Área espacio público */}
                <div className="detail-card">
                  <div className="detail-header">
                    <span className="detail-icon">{getIconForField('espacio')}</span>
                    <span className="detail-label">Área espacio público m2</span>
                  </div>
                  <div className="detail-value">
                {currentData ? String(currentData[F.areaEspacioPublico] ?? '272517') : '272517'}
            </div>
          </div>

                {/* Contratista */}
                <div className="detail-card">
                  <div className="detail-header">
                    <span className="detail-icon">{getIconForField('contratista')}</span>
                    <span className="detail-label">Contratista</span>
                  </div>
                  <div className="detail-value">
                {currentData ? String(currentData[F.contratistaOperador] ?? 'No especificado') : 'No especificado'}
              </div>
            </div>
            
                {/* Dependencia */}
                <div className="detail-card">
                  <div className="detail-header">
                    <span className="detail-icon">{getIconForField('dependencia')}</span>
                    <span className="detail-label">Dependencia</span>
              </div>
                  <div className="detail-value">
                {currentData ? String(currentData[F.dependencia] ?? 'Agencia de Educación Superior de Medell...') : 'Agencia de Educación Superior de Medell...'}
              </div>
            </div>
            
                {/* Alerta */}
                <div className="detail-card">
                  <div className="detail-header">
                    <span className="detail-icon">{getIconForField('alerta')}</span>
                    <span className="detail-label">Alerta</span>
              </div>
                  <div className="detail-value">
                {currentData ? String(currentData[F.descripcionDelRiesgo] ?? 'Sin alertas') : 'Sin alertas'}
              </div>
            </div>
            
              </div>
            </div>
          </div>
        </div>



        {/* Contenedor para las secciones inferiores */}
        <div className="bottom-sections-container">
        {/* Sección de etapas con gráficos de dona */}
          {showStages && (
            <div className="stages-section">
            <h3 className="stages-title" style={{color: '#2d3748', fontWeight: '600'}}>Etapas</h3>
            <div className="stages-grid">
              {stagesData.map((stage, index) => (
                <div key={index} className="stage-card">
                  <SemicircularGauge 
                    percentage={stage.value} 
                    title={stage.name}
                    color={stage.color}
                  />
                </div>
              ))}
            </div>
          </div>
          )}

        {/* Gráfico de Gantt */}
          <div className="gantt-section">
          <h3 className="gantt-title" style={{color: '#2d3748', fontWeight: '600'}}>Cronograma del Proyecto</h3>
          <div className="gantt-container">
            <GanttChartModern 
              rows={currentData ? [currentData] : []} 
              limit={10}
              mode="phase"
            />
            </div>
          </div>
        </div>
          {/* Estilos CSS */}
        <style>{`
        html, body {
          overflow-x: hidden !important;
        }

        .consultar-obra-container {
          min-height: 100vh !important;
          width: 100% !important;
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
          background: linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 50%, #F0F8FF 100%) !important;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
          box-sizing: border-box !important;
        }

        .main-content {
          width: 100%;
          display: block;
          padding: 95px 10px 15px 10px;
          box-sizing: border-box;
          margin: 0;
        }

        /* ========================================================================
            SECCION DE FILTROS - DISENO MEJORADO
        ======================================================================== */
        /* Drawer lateral de filtros */
        .filters-drawer {
          position: fixed;
          top: 90px;
          left: 0;
          width: min(620px, 96vw);
          height: calc(100vh - 100px);
          background: #FFFFFF;
          border-right: 1px solid #E9ECEF;
          box-shadow: 12px 0 30px rgba(0,0,0,0.15);
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
          background: linear-gradient(135deg, #00904c, #0bbf6a);
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
          background: linear-gradient(135deg, #dc2626, #ef4444);
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
        .filters-drawer .filters-row-tertiary {
          grid-template-columns: 1fr;
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

        .filters-row-tertiary {
          grid-template-columns: 1fr;
        }

        /* ========================================================================
            NUEVO LAYOUT PRINCIPAL - DISENO PROFESIONAL
        ======================================================================== */
        .main-layout {
          display: grid;
          grid-template-columns: minmax(260px, 22%) 1fr;
          gap: 20px;
          margin-bottom: 0px;
          align-items: start;
          width: 100%;
          box-sizing: border-box;
          grid-auto-rows: min-content;
        }

        .left-column {
          display: flex;
          flex-direction: column;
          gap: 0;
          align-self: start;
        }

        .right-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          min-width: 0;
          align-self: start;
        }

        /* Sección de fechas en columna izquierda */
        .delivery-dates-section-left {
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 10px;
          padding: 12px;
          box-shadow: 0 6px 20px rgba(121, 188, 153, 0.1);
          border: 1px solid #79BC99;
          margin-bottom: 8px;
          flex-shrink: 0;
        }

        .delivery-dates-grid-left {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          width: 100%;
        }

        /* Tarjeta de descripción mejorada */
        .description-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
          border: 1px solid #e9ecef;
          display: flex;
          flex-direction: column;
          height: auto;
          flex: 1;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e9ecef;
        }

        .card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #2d3748;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .description-content-new {
          font-size: 0.85rem;
          line-height: 1.4;
          color: #4a5568;
          text-align: justify;
          flex: 1;
          padding-top: 8px;
          padding-right: 8px;
        }

        /* Sección financiera mejorada */
        .financial-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
          width: 100%;
        }

        .financial-card {
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%);
          color: white;
          border-radius: 10px;
          padding: 14px;
          text-align: center;
          box-shadow: 0 6px 20px rgba(121, 188, 153, 0.25);
          transition: transform 0.3s ease;
        }

        .financial-card:hover {
          transform: translateY(-3px);
        }

        .financial-card.budget-executed {
          background: linear-gradient(135deg, #3B8686 0%, #2E8B57 100%);
        }

        .financial-card.budget-2024-2025 {
          background: linear-gradient(135deg, #2E8B57 0%, #228B22 100%);
        }

        .financial-label {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          opacity: 0.9;
        }

        .financial-value {
          font-size: 1.5rem;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* Grid de detalles mejorado */
        .details-grid-new {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          width: 100%;
          align-content: start;
          grid-auto-rows: min-content;
        }

        .detail-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 10px;
          padding: 10px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          height: auto;
        }

        .detail-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          border-color: #79BC99;
        }

        /* ========================================================================
            SECCION DE SELECCION DE PROYECTOS - MANTENIDA PARA COMPATIBILIDAD
        ======================================================================== */
        .project-selection-section {
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%) !important;
          border-radius: 15px !important;
          padding: 25px !important;
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.12) !important;
          border: 1px solid #79BC99 !important;
        }

        .selection-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 25px;
        }

        .selection-item {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .selection-label {
          font-weight: 600 !important;
          color: #2d3748 !important;
          font-size: 1rem !important;
        }

        .selection-select {
          padding: 12px 15px !important;
          border: 2px solid #79BC99 !important;
          border-radius: 10px !important;
          font-size: 16px !important;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%) !important;
          color: #2d3748 !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
        }

        .selection-select:focus {
          outline: none;
          border-color: #3B8686;
          box-shadow: 0 0 0 3px rgba(59, 134, 134, 0.25);
        }

        .selection-select:disabled {
          background: #F8F9FA;
          color: #6C757D;
          cursor: not-allowed;
        }

        .description-section {
          margin-top: 20px;
        }

        .description-label {
          display: block;
          font-weight: 600;
          color: #2C3E50;
          font-size: 1rem;
          margin-bottom: 10px;
        }

        .description-content {
          background: #F8F9FA;
          border: 1px solid #E9ECEF;
          border-radius: 10px;
          padding: 15px;
          min-height: 80px;
        }

        .description-content p {
          margin: 0;
          color: #6C757D;
          line-height: 1.5;
        }

        /* ========================================================================
            SECCION DE DETALLES DEL PROYECTO
        ======================================================================== */
        .project-details-section {
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.12);
          border: 1px solid #79BC99;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 15px;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%) !important;
          border-radius: 10px;
          border: 1px solid #79BC99 !important;
          box-shadow: 0 4px 15px rgba(121, 188, 153, 0.1) !important;
        }

        .detail-label {
          font-weight: 600 !important;
          color: #2d3748 !important;
          font-size: 0.9rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }

        .detail-value {
          font-weight: 500 !important;
          color: #2d3748 !important;
          font-size: 1rem !important;
        }

        /* Estilos mejorados para los headers con iconos */
        .detail-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e9ecef;
        }

        .detail-icon {
          font-size: 1.1rem;
          color: #79BC99;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: rgba(121, 188, 153, 0.1);
          border-radius: 5px;
        }

        .detail-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 0.95rem;
          font-weight: 600;
          color: #2d3748;
          line-height: 1.3;
        }

        /* Estilos mejorados para las imágenes de comunas */
        .comuna-image-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid #79BC99;
          background: rgba(121, 188, 153, 0.1);
          flex-shrink: 0;
        }

        .comuna-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        /* ========================================================================
            MEDIDORES SEMICIRCULARES (GAUGES)
        ======================================================================== */
        .gauge-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0;
          background: transparent;
          border: none;
          box-shadow: none;
          min-height: 140px;
          justify-content: center;
          width: 100%;
        }

        .gauge-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #4a5568;
          text-align: center;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          line-height: 1.2;
          max-width: 100%;
          word-wrap: break-word;
        }

        .gauge-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          width: 80px;
          height: 80px;
        }

        .gauge-svg {
          transform: rotate(-90deg);
          filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1));
        }

        .gauge-background {
          opacity: 0.2;
          stroke: #e9ecef;
        }

        .gauge-progress {
          transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .gauge-percentage {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.1rem;
          font-weight: 800;
          color: #2d3748;
          text-align: center;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .gauge-labels {
          display: flex;
          justify-content: space-between;
          width: 100%;
          max-width: 100px;
          font-size: 0.6rem;
          color: #718096;
          font-weight: 500;
        }

        .gauge-label-start,
        .gauge-label-end {
          font-size: 0.6rem;
          color: #718096;
          font-weight: 500;
        }

        /* ========================================================================
            SECCION DE RESUMEN FINANCIERO
        ======================================================================== */
        .financial-overview-section {
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.12);
          border: 1px solid #79BC99;
        }

        .financial-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .financial-card {
          text-align: center;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }

        .financial-card:hover {
          transform: translateY(-5px);
        }

        .total-investment {
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%) !important;
          color: white !important;
        }

        .budget-executed {
          background: linear-gradient(135deg, #3B8686 0%, #2E8B57 100%) !important;
          color: white !important;
        }

        .financial-label {
          font-size: 0.9rem !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          margin-bottom: 10px !important;
          color: white !important;
          opacity: 0.9 !important;
        }

        .financial-value {
          font-size: 2.5rem !important;
          font-weight: 700 !important;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          color: white !important;
        }

        /* ========================================================================
            SECCION DE FECHAS DE ENTREGA
        ======================================================================== */

        .delivery-dates-title {
          margin: 0 0 12px 0 !important;
          color: #2d3748 !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
          text-align: center !important;
        }

        .delivery-dates-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          width: 100%;
        }

        .delivery-date-card {
          text-align: center;
          padding: 8px 6px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: transform 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .delivery-date-card:hover {
          transform: translateY(-5px);
        }

        .delivery-date-card.estimated {
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          border: 2px solid #2196F3;
        }

        .delivery-date-card.real {
          background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
          border: 2px solid #FF9800;
        }

        .delivery-date-card.corrected {
          background: linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%);
          border: 2px solid #4CAF50;
        }

        .delivery-date-label {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 6px;
          color: #2d3748;
        }

        .delivery-date-value {
          font-size: 0.85rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 6px;
          line-height: 1.2;
        }

        .delivery-date-note {
          font-size: 0.65rem;
          color: #718096;
          font-style: italic;
          margin-top: 5px;
        }

        /* ========================================================================
            CONTENEDOR DE SECCIONES INFERIORES
        ======================================================================== */
        .bottom-sections-container {
          width: 100%;
          margin: 15px auto 0 auto;
          box-sizing: border-box;
        }

        /* ========================================================================
            SECCION DE ETAPAS
        ======================================================================== */
        .stages-section {
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.12);
          border: 1px solid #79BC99;
          width: 100%;
          margin-bottom: 15px;
          box-sizing: border-box;
        }

        .stages-title {
          margin: 0 0 15px 0 !important;
          color: #2d3748 !important;
          font-size: 1.3rem !important;
          font-weight: 600 !important;
          text-align: center !important;
        }

        .stages-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          width: 100%;
        }

        .stage-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 15px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 15px;
          border: 2px solid #e9ecef;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stage-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: #4CAF50;
        }

        .stage-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border-color: #4CAF50;
        }

        .stage-card:nth-child(1)::before {
          background: #4CAF50;
        }

        .stage-card:nth-child(2)::before {
          background: #00BCD4;
        }

        .stage-card:nth-child(3)::before {
          background: #009688;
        }

        .stage-card:nth-child(4)::before {
          background: #8BC34A;
        }

        .stage-card:nth-child(5)::before {
          background: #4CAF50;
        }

        .stage-chart {
          width: 100%;
          height: 120px;
          margin-bottom: 15px;
        }

        .stage-info {
          text-align: center;
        }

        .stage-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #2C3E50;
          margin-bottom: 5px;
        }

        .stage-progress {
          font-size: 1.2rem;
          font-weight: 700;
          color: #79BC99;
        }

        /* ========================================================================
            SECCION DE GANTT
        ======================================================================== */
        .gantt-section {
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.12);
          border: 1px solid #79BC99;
          width: 100%;
          box-sizing: border-box;
        }

        .gantt-title {
          margin: 0 0 15px 0 !important;
          color: #2d3748 !important;
          font-size: 1.3rem !important;
          font-weight: 600 !important;
          text-align: center !important;
        }

        .gantt-container {
          width: 100%;
          overflow-x: auto;
        }

        /* ========================================================================
            DISENO RESPONSIVE COMPLETO Y OPTIMIZADO
        ======================================================================== */
        
        /* ========================================================================
            RESPONSIVE DESIGN PARA NUEVO LAYOUT
        ======================================================================== */
        
        /* Pantallas muy grandes (1600px+) */
        @media (min-width: 1600px) {
          .main-layout {
            grid-template-columns: minmax(280px, 20%) 1fr;
            gap: 25px;
          }
          
          .details-grid-new {
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
          }
          
          .financial-section {
            gap: 18px;
          }
          
          .right-column {
            gap: 25px;
          }
        }
        
        /* Desktop estándar (1200px-1600px) */
        @media (min-width: 1200px) and (max-width: 1599px) {
          .main-layout {
            grid-template-columns: minmax(270px, 25%) 1fr;
            gap: 22px;
          }
          
          .details-grid-new {
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
          }
          
          .financial-section {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
          
          .right-column {
            gap: 22px;
          }
        }

        /* Tablets landscape (1000px-1200px) */
        @media (min-width: 1000px) and (max-width: 1199px) {
          .main-layout {
            grid-template-columns: minmax(250px, 30%) 1fr;
            gap: 20px;
          }
          
          .details-grid-new {
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          
          .financial-section {
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
          }
          
          .financial-card {
            padding: 12px;
          }
          
          .financial-value {
            font-size: 1.4rem;
          }
          
          .right-column {
            gap: 18px;
          }
        }

        /* Tablets portrait (768px-1000px) */
        @media (min-width: 768px) and (max-width: 999px) {
          .main-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .description-card {
            height: auto;
            padding: 16px;
          }
          
          .financial-section {
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 18px;
          }
          
          .details-grid-new {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          
          .right-column {
            gap: 16px;
          }
        }
        
        /* ========================================================================
            TABLETS LANDSCAPE (1024px - 1200px)
        ======================================================================== */
        @media (max-width: 1200px) {
          .main-content {
            padding: 105px 15px 15px 15px;
          }
          .layout {
            grid-template-columns: 260px 1fr;
            gap: 16px;
          }
          
          .project-selection-section,
          .project-details-section,
          .financial-overview-section,
          .delivery-dates-section,
          .stages-section,
          .gantt-section {
            padding: 22px;
          }
          
          .selection-row { gap: 20px; }
          
          .selection-select {
            padding: 11px 14px;
            font-size: 15px;
          }
          
          .details-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 18px;
          }
          
          .detail-item {
            padding: 14px;
          }
          
          .financial-cards {
            gap: 25px;
          }
          
          .financial-card {
            padding: 25px;
          }
          
          .financial-value {
            font-size: 2.2rem;
          }
          
          .delivery-dates-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            width: 100%;
          }
          
          .delivery-date-card {
            padding: 16px 12px;
          }
          
          .delivery-date-value {
            font-size: 0.95rem;
          }
          
          .stages-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
            width: 100%;
          }
          
          .stage-card {
            padding: 18px 12px;
          }
          
          .stage-chart {
            height: 110px;
          }
        }

        /* ========================================================================
            TABLETS PORTRAIT (768px - 1024px)
        ======================================================================== */
        @media (max-width: 1024px) {
          .main-content {
            padding: 100px 12px 12px 12px;
          }
          
          .main-layout {
            grid-template-columns: 1fr;
            gap: 25px;
            min-height: auto;
          }
          
          .description-card {
            padding: 22px;
            height: auto;
          }
          
          .description-content-new {
            font-size: 1rem;
          }
          
          .financial-section {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 15px;
          }
          
          .financial-card {
            padding: 18px;
          }
          
          .financial-value {
            font-size: 1.7rem;
          }
          
          .details-grid-new {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .filters-drawer {
            width: min(580px, 95vw);
            top: 80px;
            height: calc(100vh - 80px);
          }
          .filters-drawer .filters-row-main,
          .filters-drawer .filters-row-secondary {
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .filters-drawer .filters-row-tertiary {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .project-selection-section,
          .project-details-section,
          .financial-overview-section,
          .stages-section,
          .gantt-section {
            padding: 20px;
            border-radius: 12px;
          }
          
          .selection-row { gap: 18px; margin-bottom: 18px; }
          
          .selection-select {
            padding: 10px 12px;
            font-size: 14px;
          }
          
          .description-content {
            padding: 14px;
            min-height: 70px;
          }
          
          .details-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
          }
          
          .detail-item {
            padding: 13px;
          }
          
          .detail-label {
            font-size: 0.85rem;
          }
          
          .detail-value {
            font-size: 0.95rem;
          }
          
          .financial-cards {
            gap: 20px;
          }
          
          .financial-card {
            padding: 22px;
          }
          
          .financial-value {
            font-size: 2rem;
          }
          
          .delivery-dates-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            max-width: 100%;
          }
          
          .delivery-date-card {
            padding: 15px 12px;
          }
          
          .delivery-date-value {
            font-size: 0.9rem;
          }
          
          .stages-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 12px;
            width: 100%;
          }
          
          .stage-card {
            padding: 16px 10px;
          }
          
          .stage-chart {
            height: 100px;
            margin-bottom: 12px;
          }
          
          .stage-name {
            font-size: 0.85rem;
          }
          
          .stage-progress {
            font-size: 1.1rem;
          }
        }

        /* ========================================================================
            MÓVILES LANDSCAPE (480px - 768px)
        ======================================================================== */
        /* Móviles landscape (480px-768px) */
        @media (min-width: 480px) and (max-width: 768px) {
          .main-content {
            padding: 85px 8px 10px 8px;
          }
          
          .main-layout {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .description-card {
            padding: 14px;
            height: auto;
          }
          
          .card-title {
            font-size: 0.95rem;
          }
          
          .description-content-new {
            font-size: 0.85rem;
            line-height: 1.4;
          }
          
          .financial-section {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 14px;
          }
          
          .financial-card {
            padding: 16px;
          }
          
          .financial-value {
            font-size: 1.5rem;
          }
          
          .details-grid-new {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .detail-card {
            padding: 16px;
          }
          
          .detail-icon {
            width: 24px;
            height: 24px;
            font-size: 1.1rem;
          }
          
          .comuna-image-container {
            width: 28px;
            height: 28px;
          }
          .filters-drawer {
            width: min(500px, 92vw);
            top: 70px;
            height: calc(100vh - 70px);
          }
          .filters-drawer .filters-row-main,
          .filters-drawer .filters-row-secondary {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .filters-drawer .filters-row-tertiary {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .project-selection-section,
          .project-details-section,
          .financial-overview-section,
          .stages-section,
          .gantt-section {
            padding: 18px;
            border-radius: 12px;
          }
          
          .selection-row { grid-template-columns: 1fr; gap: 15px; margin-bottom: 18px; }
          
          .selection-label {
            font-size: 0.95rem;
          }
          
          .selection-select {
            padding: 10px 12px;
            font-size: 14px;
          }
          
          .description-section {
            margin-top: 15px;
          }
          
          .description-content {
            padding: 12px;
            min-height: 65px;
          }
          
          .description-content p {
            font-size: 0.9rem;
            line-height: 1.4;
          }
          
          .details-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .detail-item {
            padding: 12px;
          }
          
          .detail-label {
            font-size: 0.8rem;
          }
          
          .detail-value {
            font-size: 0.9rem;
          }
          
          .financial-cards {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .financial-card {
            padding: 20px;
          }
          
          .financial-label {
            font-size: 0.85rem;
          }
          
          .financial-value {
            font-size: 1.8rem;
          }
          
          .stages-title,
          .gantt-title {
            font-size: 1.3rem;
            margin-bottom: 20px;
          }
          
          .stages-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            max-width: 100%;
          }
          
          .stage-card {
            padding: 16px 10px;
          }
          
          .stage-chart {
            height: 90px;
            margin-bottom: 10px;
          }
          
          .stage-name {
            font-size: 0.8rem;
          }
          
          .stage-progress {
            font-size: 1rem;
          }
        }

        /* ========================================================================
            MÓVILES PORTRAIT (360px - 480px)
        ======================================================================== */
        @media (max-width: 480px) {
          .main-content {
            padding: 90px 8px 8px 8px;
          }
          .filters-drawer {
            width: min(450px, 90vw);
            top: 60px;
            height: calc(100vh - 60px);
          }
          .filters-drawer .filters-row-main,
          .filters-drawer .filters-row-secondary {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .filters-drawer .filters-row-tertiary {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          
          .project-selection-section,
          .project-details-section,
          .financial-overview-section,
          .stages-section,
          .gantt-section {
            padding: 15px;
            border-radius: 10px;
          }
          
          .selection-row {
            gap: 12px;
            margin-bottom: 15px;
          }
          
          .selection-label {
            font-size: 0.9rem;
          }
          
          .selection-select {
            padding: 8px 10px;
            font-size: 13px;
          }
          
          .description-section {
            margin-top: 12px;
          }
          
          .description-content {
            padding: 10px;
            min-height: 55px;
          }
          
          .description-content p {
            font-size: 0.85rem;
            line-height: 1.3;
          }
          
          .details-grid {
            gap: 10px;
          }
          
          .detail-item {
            padding: 10px;
          }
          
          .detail-label {
            font-size: 0.75rem;
          }
          
          .detail-value {
            font-size: 0.85rem;
          }
          
          .financial-card {
            padding: 15px;
          }
          
          .financial-label {
            font-size: 0.8rem;
          }
          
          .financial-value {
            font-size: 1.6rem;
          }
          
          .stages-title,
          .gantt-title {
            font-size: 1.2rem;
            margin-bottom: 18px;
          }
          
          .stages-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            max-width: 100%;
          }
          
          .stage-card {
            padding: 14px 8px;
          }
          
          .stage-chart {
            height: 80px;
            margin-bottom: 8px;
          }
          
          .stage-name {
            font-size: 0.75rem;
          }
          
          .stage-progress {
            font-size: 0.9rem;
          }
        }

        /* ========================================================================
            MÓVILES PEQUEÑOS (320px - 360px)
        ======================================================================== */
        @media (max-width: 360px) {
          .main-content {
            padding: 70px 6px 6px 6px;
          }
          .filters-drawer {
            width: min(400px, 88vw);
            top: 56px;
            height: calc(100vh - 56px);
          }
          .filters-drawer .filters-row-main,
          .filters-drawer .filters-row-secondary {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .filters-drawer .filters-row-tertiary {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .project-selection-section,
          .project-details-section,
          .financial-overview-section,
          .stages-section,
          .gantt-section {
            padding: 12px;
          border-radius: 8px;
          }
          
          .selection-row {
            gap: 10px;
            margin-bottom: 12px;
          }
          
          .selection-label {
            font-size: 0.85rem;
          }
          
          .selection-select {
            padding: 6px 8px;
            font-size: 12px;
          }
          
          .description-content {
            padding: 8px;
            min-height: 50px;
          }
          
          .description-content p {
            font-size: 0.8rem;
            line-height: 1.2;
          }
          
          .details-grid {
            gap: 8px;
          }
          
          .detail-item {
            padding: 8px;
          }
          
          .detail-label {
            font-size: 0.7rem;
          }
          
          .detail-value {
            font-size: 0.8rem;
          }
          
          .financial-card {
            padding: 12px;
          }
          
          .financial-label {
            font-size: 0.75rem;
          }
          
          .financial-value {
            font-size: 1.4rem;
          }
          
          .stages-title,
          .gantt-title {
            font-size: 1.1rem;
            margin-bottom: 15px;
          }
          
          .stages-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            max-width: 100%;
          }
          
          .stage-card {
            padding: 12px 6px;
          }
          
          .stage-chart {
            height: 70px;
            margin-bottom: 6px;
          }
          
          .stage-name {
            font-size: 0.7rem;
          }
          
          .stage-progress {
            font-size: 0.85rem;
          }
        }

        /* ========================================================================
            MÓVILES MUY PEQUEÑOS (hasta 320px)
        ======================================================================== */
        @media (max-width: 320px) {
          .main-content {
            padding: 85px 4px 4px 4px;
            gap: 10px;
          }
          .filters-drawer {
            width: min(350px, 85vw);
            top: 50px;
            height: calc(100vh - 50px);
          }
          .filters-drawer .filters-row-main,
          .filters-drawer .filters-row-secondary {
            grid-template-columns: 1fr;
            gap: 6px;
          }
          .filters-drawer .filters-row-tertiary {
            grid-template-columns: 1fr;
            gap: 6px;
          }
          
          .project-selection-section,
          .project-details-section,
          .financial-overview-section,
          .stages-section,
          .gantt-section {
            padding: 10px;
            border-radius: 6px;
          }
          
          .selection-select {
            padding: 5px 6px;
            font-size: 11px;
          }
          
          .description-content {
            padding: 6px;
            min-height: 45px;
          }
          
          .description-content p {
            font-size: 0.75rem;
          }
          
          .detail-item {
            padding: 6px;
          }
          
          .detail-label {
            font-size: 0.65rem;
          }
          
          .detail-value {
            font-size: 0.75rem;
          }
          
          .financial-card {
            padding: 10px;
          }
          
          .financial-label {
            font-size: 0.7rem;
          }
          
          .financial-value {
            font-size: 1.2rem;
          }
          
          .stages-title,
          .gantt-title {
            font-size: 1rem;
            margin-bottom: 12px;
          }
          
          .stages-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
            max-width: 100%;
          }
          
          .stage-card {
            padding: 10px 4px;
          }
          
          .stage-chart {
            height: 60px;
            margin-bottom: 4px;
          }
          
          .stage-name {
            font-size: 0.65rem;
          }
          
          .stage-progress {
            font-size: 0.8rem;
          }
        }

        /* ========================================================================
            ORIENTACIÓN LANDSCAPE EN MÓVILES
        ======================================================================== */
        @media (max-height: 500px) and (orientation: landscape) {
          .main-content {
            padding: 60px 10px 10px 10px;
          }
          .layout { grid-template-columns: 1fr; }
          .sidebar { position: relative; top: 0; }
          
          .project-selection-section,
          .project-details-section,
          .financial-overview-section,
          .stages-section,
          .gantt-section {
            padding: 12px;
          }
          
          .selection-row {
            margin-bottom: 10px;
          }
          
          .description-content {
            min-height: 40px;
            padding: 8px;
          }
          
          .details-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
          }
          
          .detail-item {
            padding: 8px;
          }
          
          .financial-cards {
            gap: 10px;
          }
          
          .financial-card {
            padding: 12px;
          }
          
          .financial-value {
            font-size: 1.5rem;
          }
          
          .stages-grid {
            grid-template-columns: 1fr;
            gap: 8px;
            max-width: 100%;
          }
          
          .stage-card {
            padding: 12px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
          
          .stage-card .gauge-container {
            flex-direction: row;
            min-height: auto;
            width: auto;
            gap: 15px;
          }
          
          .stage-card .gauge-title {
            margin-bottom: 0;
            text-align: left;
            flex: 1;
          }
          
          .stage-card .gauge-wrapper {
            width: 60px;
            height: 60px;
            margin-bottom: 0;
          }
          
          .stage-chart {
            height: 60px;
            margin-bottom: 4px;
          }
          
          .stages-title,
          .gantt-title {
            font-size: 1rem;
            margin-bottom: 10px;
          }
        }

        /* ========================================================================
            MEJORAS DE ACCESIBILIDAD Y USABILIDAD
        ======================================================================== */
        
        /* Mejorar el contraste en modo oscuro */
        @media (prefers-color-scheme: dark) {
          .consultar-obra-container {
            background: linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 50%, #F0F8FF 100%);
          }
          
          .project-selection-section,
          .project-details-section,
          .financial-overview-section,
          .stages-section,
          .gantt-section {
            background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
            border-color: #79BC99;
          }
          
          .selection-label,
          .description-label,
          .stages-title,
          .gantt-title {
            color: #2d3748;
          }
          
          .selection-select {
            background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
            border-color: #79BC99;
            color: #2d3748;
          }
          
          .description-content {
            background: #F8F9FA;
            border-color: #E9ECEF;
          }
          
          .description-content p {
            color: #4a5568;
          }
          
          .detail-item {
            background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
            border-color: #79BC99;
          }
          
          .detail-label {
            color: #2d3748;
          }
          
          .detail-value {
            color: #2d3748;
          }
          
          .stage-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-color: #e9ecef;
          }
          
          .stage-name {
            color: #2d3748;
          }
        }

        /* Mejorar la legibilidad para usuarios con problemas de visión */
        @media (prefers-reduced-motion: no-preference) {
          .financial-card:hover,
          .stage-card:hover {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .financial-card:hover,
          .stage-card:hover {
            transform: none;
            transition: none;
          }
        }

        /* Mejorar el enfoque para navegación por teclado */
        .selection-select:focus,
        .financial-card:focus,
        .stage-card:focus {
          outline: 3px solid #79BC99;
          outline-offset: 2px;
        }

        /* Optimizar para pantallas de alta densidad */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .financial-value,
          .stage-progress {
            font-weight: 600;
          }
        }

        /* Modal de notificaciones */
        .notifications-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .notifications-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .notifications-content {
          position: relative;
          z-index: 2001;
          max-width: 90vw;
          max-height: 90vh;
        }
      `}</style>

      {/* Modal de notificaciones */}
      {showNotifications && (
        <div className="notifications-modal">
          <div className="notifications-backdrop" onClick={() => setShowNotifications(false)} />
          <div className="notifications-content">
            <NotificationCenter 
              data={rows} 
              onClose={() => setShowNotifications(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
