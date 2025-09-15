import { useState, useEffect, useMemo } from 'react';
import { F } from '../dataConfig';
import { 
  getFilterOptions,
  type Row
} from '../utils/utils/metrics';
import Navigation from '../components/Navigation';
import GanttChart from '../components/GanttChart';

export default function ConsultarObra() {
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedWork, setSelectedWork] = useState<string>('');

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
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Opciones de filtros dinámicas
  const opciones = useMemo(() => getFilterOptions(rows, {}), [rows]);

  // Obtener datos del proyecto seleccionado
  const selectedProjectData = useMemo(() => {
    if (!selectedProject) return null;
    return rows.find(row => String(row[F.proyectoEstrategico] ?? '') === selectedProject);
  }, [rows, selectedProject]);

  // Obtener datos de la obra seleccionada
  const selectedWorkData = useMemo(() => {
    if (!selectedWork) return selectedProjectData;
    return rows.find(row => String(row[F.nombre] ?? '') === selectedWork);
  }, [rows, selectedWork, selectedProjectData]);

  // Datos actuales para mostrar (obra seleccionada o proyecto)
  const currentData = selectedWorkData || selectedProjectData;


  // Datos para gráficos de etapas (donas)
  const stagesData = useMemo(() => {
    if (!currentData) return [];
    
    const stages = [
      {
        name: 'Estudios preliminares',
        value: 28.63,
        color: '#79BC99'
      },
      {
        name: 'Viabilización(DAP)',
        value: 4.92,
        color: '#4E8484'
      },
      {
        name: 'Gestión Predial',
        value: 1.96,
        color: '#3B8686'
      },
      {
        name: 'Diseños',
        value: 7.22,
        color: '#2E8B57'
      },
      {
        name: 'Ejecución de Obra',
        value: 53.58,
        color: '#228B22'
      }
    ];
    
    return stages;
  }, [currentData]);

  // Componente de medidor semicircular
  const SemicircularGauge = ({ percentage, title }: { percentage: number; title: string }) => {
    const radius = 60;
    const strokeWidth = 8;
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
              stroke="#79BC99"
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
        background: 'linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 50%, #F0F8FF 100%)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      <Navigation showBackButton={true} title="Consultar Obra" />
      
      <div className="main-content">
        {/* Sección de selección de proyectos */}
        <div 
          className="project-selection-section"
          style={{
            background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 25px rgba(121, 188, 153, 0.12)',
            border: '1px solid #79BC99'
          }}
        >
          <div className="selection-row">
            <div className="selection-item">
              <label className="selection-label" style={{color: '#000000', fontWeight: '600'}}>Proyectos estratégicos</label>
                <select
                className="selection-select"
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setSelectedWork('');
                }}
                >
                  <option value="">Todas</option>
                {opciones.proyectos.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
                </select>
            </div>
            
            <div className="selection-item">
              <label className="selection-label" style={{color: '#000000', fontWeight: '600'}}>Nombre de la obra</label>
                <select
                className="selection-select"
                value={selectedWork}
                onChange={(e) => setSelectedWork(e.target.value)}
                disabled={!selectedProject}
                >
                  <option value="">Todas</option>
                {selectedProject && rows
                  .filter(row => String(row[F.proyectoEstrategico] ?? '') === selectedProject)
                  .map(row => (
                    <option key={String(row[F.nombre] ?? '')} value={String(row[F.nombre] ?? '')}>
                      {String(row[F.nombre] ?? '')}
                    </option>
                  ))
                }
                </select>
                  </div>
                </div>
          
          {/* Descripción del proyecto */}
          <div className="description-section">
            <label className="description-label">Descripción</label>
            <div className="description-content">
              {currentData ? (
                <p>
                  {String(currentData[F.descripcion] ?? 'Construcción de piscina semiolímpica recreativa (125 x 25 m. 312.5 m² de lámina de agua), que incluye: Movimiento de tierras y excavación. Cimentación y estructur...')}
                </p>
              ) : (
                <p>Selecciona un proyecto estratégico para ver su descripción</p>
              )}
            </div>
                  </div>
                </div>

        {/* Sección de detalles del proyecto */}
        <div 
          className="project-details-section"
          style={{
            background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 25px rgba(121, 188, 153, 0.12)',
            border: '1px solid #79BC99'
          }}
        >
          <div className="details-grid">
            <div 
              className="detail-item"
              style={{
                background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
                border: '1px solid #79BC99',
                borderRadius: '10px',
                padding: '15px',
                boxShadow: '0 4px 15px rgba(121, 188, 153, 0.1)'
              }}
            >
              <span className="detail-label" style={{color: '#000000', fontWeight: '600'}}>Comuna / Corregimiento</span>
              <span className="detail-value">
                {currentData ? String(currentData[F.comunaOCorregimiento] ?? '01 - Popular') : '01 - Popular'}
              </span>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '85%'}}></div>
              </div>
            </div>
            
            <div 
              className="detail-item"
              style={{
                background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
                border: '1px solid #79BC99',
                borderRadius: '10px',
                padding: '15px',
                boxShadow: '0 4px 15px rgba(121, 188, 153, 0.1)'
              }}
            >
              <span className="detail-label" style={{color: '#000000', fontWeight: '600'}}>Empleos generados</span>
              <span className="detail-value">
                {currentData ? String(currentData[F.empleosGenerados] ?? '6298') : '6298'}
              </span>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '75%'}}></div>
              </div>
            </div>
            
            <div 
              className="detail-item"
              style={{
                background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
                border: '1px solid #79BC99',
                borderRadius: '10px',
                padding: '15px',
                boxShadow: '0 4px 15px rgba(121, 188, 153, 0.1)'
              }}
            >
              <span className="detail-label" style={{color: '#000000', fontWeight: '600'}}>Área Construida m2</span>
              <span className="detail-value">
                {currentData ? String(currentData[F.areaConstruida] ?? '498573') : '498573'}
              </span>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '90%'}}></div>
                  </div>
                </div>
            
            <div 
              className="detail-item"
              style={{
                background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
                border: '1px solid #79BC99',
                borderRadius: '10px',
                padding: '15px',
                boxShadow: '0 4px 15px rgba(121, 188, 153, 0.1)'
              }}
            >
              <span className="detail-label" style={{color: '#000000', fontWeight: '600'}}>Tipo de intervención</span>
              <span className="detail-value">
                {currentData ? String(currentData[F.tipoDeIntervecion] ?? 'Restitución') : 'Restitución'}
              </span>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '60%'}}></div>
                  </div>
                </div>
            
            <div 
              className="detail-item"
              style={{
                background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
                border: '1px solid #79BC99',
                borderRadius: '10px',
                padding: '15px',
                boxShadow: '0 4px 15px rgba(121, 188, 153, 0.1)'
              }}
            >
              <span className="detail-label" style={{color: '#000000', fontWeight: '600'}}>Área espacio público m2</span>
              <span className="detail-value">
                {currentData ? String(currentData[F.areaEspacioPublico] ?? '272517') : '272517'}
              </span>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '80%'}}></div>
                  </div>
                </div>
            
            <div 
              className="detail-item"
              style={{
                background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
                border: '1px solid #79BC99',
                borderRadius: '10px',
                padding: '15px',
                boxShadow: '0 4px 15px rgba(121, 188, 153, 0.1)'
              }}
            >
              <span className="detail-label" style={{color: '#000000', fontWeight: '600'}}>Contratista</span>
              <span className="detail-value">
                {currentData ? String(currentData[F.contratistaOperador] ?? 'No especificado') : 'No especificado'}
              </span>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '70%'}}></div>
                  </div>
                </div>

            <div 
              className="detail-item"
              style={{
                background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
                border: '1px solid #79BC99',
                borderRadius: '10px',
                padding: '15px',
                boxShadow: '0 4px 15px rgba(121, 188, 153, 0.1)'
              }}
            >
              <span className="detail-label" style={{color: '#000000', fontWeight: '600'}}>Dependencia</span>
              <span className="detail-value">
                {currentData ? String(currentData[F.dependencia] ?? 'Agencia de Educación Superior de Medell...') : 'Agencia de Educación Superior de Medell...'}
              </span>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '95%'}}></div>
                  </div>
                </div>

            <div 
              className="detail-item"
              style={{
                background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
                border: '1px solid #79BC99',
                borderRadius: '10px',
                padding: '15px',
                boxShadow: '0 4px 15px rgba(121, 188, 153, 0.1)'
              }}
            >
              <span className="detail-label" style={{color: '#000000', fontWeight: '600'}}>Alerta</span>
              <span className="detail-value">
                {currentData ? String(currentData[F.descripcionDelRiesgo] ?? 'Sin alertas') : 'Sin alertas'}
              </span>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '30%'}}></div>
              </div>
            </div>

            <div 
              className="detail-item"
              style={{
                background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
                border: '1px solid #79BC99',
                borderRadius: '10px',
                padding: '15px',
                boxShadow: '0 4px 15px rgba(121, 188, 153, 0.1)'
              }}
            >
              <span className="detail-label" style={{color: '#000000', fontWeight: '600'}}>Criterio técnico</span>
              <span className="detail-value">
                No especificado
              </span>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '50%'}}></div>
                  </div>
                </div>
          </div>
        </div>

        {/* Sección de resumen financiero */}
        <div 
          className="financial-overview-section"
          style={{
            background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 25px rgba(121, 188, 153, 0.12)',
            border: '1px solid #79BC99'
          }}
        >
          <div className="financial-cards">
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
                  '$2.29 bill.'
                }
              </div>
            </div>
            </div>
          </div>

        {/* Sección de etapas con gráficos de dona */}
        <div 
          className="stages-section"
          style={{
            background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 25px rgba(121, 188, 153, 0.12)',
            border: '1px solid #79BC99'
          }}
        >
          <h3 className="stages-title" style={{color: '#000000', fontWeight: '600'}}>Etapas</h3>
          <div className="stages-grid">
            {stagesData.map((stage, index) => (
              <div key={index} className="stage-card">
                <SemicircularGauge 
                  percentage={stage.value} 
                  title={stage.name} 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Gantt */}
        <div 
          className="gantt-section"
          style={{
            background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 25px rgba(121, 188, 153, 0.12)',
            border: '1px solid #79BC99'
          }}
        >
          <h3 className="gantt-title" style={{color: '#000000', fontWeight: '600'}}>Cronograma del Proyecto</h3>
          <div className="gantt-container">
            <GanttChart 
              rows={currentData ? [currentData] : []} 
              limit={10}
              mode="phase"
            />
            </div>
        </div>
      </div>

      {/* Estilos CSS profesionales y responsive */}
      <style>{`
        .consultar-obra-container {
          min-height: 100vh !important;
          background: linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 50%, #F0F8FF 100%) !important;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }

        .main-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 100px 20px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        /* ========================================================================
            SECCIÓN DE SELECCIÓN DE PROYECTOS
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
          color: #000000 !important;
          font-size: 1rem !important;
        }

        .selection-select {
          padding: 12px 15px !important;
          border: 2px solid #79BC99 !important;
          border-radius: 10px !important;
          font-size: 16px !important;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%) !important;
          color: #000000 !important;
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
            SECCIÓN DE DETALLES DEL PROYECTO
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
          color: #000000 !important;
          font-size: 0.9rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }

        .detail-value {
          font-weight: 500 !important;
          color: #000000 !important;
          font-size: 1rem !important;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(121, 188, 153, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #79BC99 0%, #4E8484 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        /* ========================================================================
            MEDIDORES SEMICIRCULARES (GAUGES)
        ======================================================================== */
        .gauge-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 15px;
          border: 1px solid #79BC99;
          box-shadow: 0 4px 15px rgba(121, 188, 153, 0.1);
          min-height: 200px;
          justify-content: center;
        }

        .gauge-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #000000;
          text-align: center;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .gauge-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .gauge-svg {
          transform: rotate(-90deg);
        }

        .gauge-background {
          opacity: 0.3;
        }

        .gauge-progress {
          transition: stroke-dashoffset 0.5s ease-in-out;
        }

        .gauge-percentage {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.2rem;
          font-weight: 700;
          color: #000000;
          text-align: center;
        }

        .gauge-labels {
          display: flex;
          justify-content: space-between;
          width: 100%;
          max-width: 120px;
          font-size: 0.7rem;
          color: #6C757D;
        }

        .gauge-label-start,
        .gauge-label-end {
          font-size: 0.7rem;
          color: #6C757D;
        }

        /* ========================================================================
            SECCIÓN DE RESUMEN FINANCIERO
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
            SECCIÓN DE ETAPAS
        ======================================================================== */
        .stages-section {
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.12);
          border: 1px solid #79BC99;
        }

        .stages-title {
          margin: 0 0 25px 0 !important;
          color: #000000 !important;
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          text-align: center !important;
        }

        .stages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .stage-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background: #F8F9FA;
          border-radius: 15px;
          border: 1px solid #E9ECEF;
          transition: transform 0.3s ease;
        }

        .stage-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.2);
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
            SECCIÓN DE GANTT
        ======================================================================== */
        .gantt-section {
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(121, 188, 153, 0.12);
          border: 1px solid #79BC99;
        }

        .gantt-title {
          margin: 0 0 25px 0 !important;
          color: #000000 !important;
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          text-align: center !important;
        }

        .gantt-container {
          width: 100%;
          overflow-x: auto;
        }

        /* ========================================================================
            DISEÑO RESPONSIVE COMPLETO Y OPTIMIZADO
        ======================================================================== */
        
        /* ========================================================================
            TABLETS LANDSCAPE (1024px - 1200px)
        ======================================================================== */
        @media (max-width: 1200px) {
          .main-content {
            padding: 90px 15px 15px 15px;
            gap: 25px;
          }
          
          .project-selection-section,
          .project-details-section,
          .financial-overview-section,
          .stages-section,
          .gantt-section {
            padding: 22px;
          }
          
          .selection-row {
            gap: 20px;
          }
          
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
          
          .stages-grid {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 18px;
          }
          
          .stage-card {
            padding: 18px;
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
            padding: 85px 12px 12px 12px;
            gap: 22px;
          }
          
          .project-selection-section,
          .project-details-section,
          .financial-overview-section,
          .stages-section,
          .gantt-section {
            padding: 20px;
            border-radius: 12px;
          }
          
          .selection-row {
            gap: 18px;
            margin-bottom: 18px;
          }
          
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
          
          .stages-grid {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 15px;
          }
          
          .stage-card {
            padding: 16px;
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
        @media (max-width: 768px) {
          .main-content {
            padding: 80px 10px 10px 10px;
            gap: 20px;
          }
          
          .project-selection-section,
          .project-details-section,
          .financial-overview-section,
          .stages-section,
          .gantt-section {
            padding: 18px;
            border-radius: 12px;
          }
          
          .selection-row {
            grid-template-columns: 1fr;
            gap: 15px;
            margin-bottom: 18px;
          }
          
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
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
          }
          
          .stage-card {
            padding: 14px;
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
            padding: 75px 8px 8px 8px;
            gap: 15px;
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
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
          }
          
          .stage-card {
            padding: 12px;
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
          gap: 12px;
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
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          
          .stage-card {
            padding: 10px;
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
            padding: 65px 4px 4px 4px;
            gap: 10px;
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
            gap: 6px;
          }
          
          .stage-card {
            padding: 8px;
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
            gap: 15px;
          }
          
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
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 8px;
          }
          
          .stage-card {
            padding: 8px;
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
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          }
          
          .project-selection-section,
          .project-details-section,
          .financial-overview-section,
          .stages-section,
          .gantt-section {
            background: #2d2d2d;
            border-color: #404040;
          }
          
          .selection-label,
          .description-label,
          .stages-title,
          .gantt-title {
            color: #ffffff;
          }
          
          .selection-select {
            background: #3d3d3d;
            border-color: #555;
            color: #ffffff;
          }
          
          .description-content {
            background: #3d3d3d;
            border-color: #555;
          }
          
          .description-content p {
            color: #cccccc;
          }
          
          .detail-item {
            background: #3d3d3d;
            border-color: #555;
          }
          
          .detail-label {
            color: #aaaaaa;
          }
          
          .detail-value {
            color: #ffffff;
          }
          
          .stage-card {
            background: #3d3d3d;
            border-color: #555;
          }
          
          .stage-name {
            color: #ffffff;
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
      `}</style>
    </div>
  );
}
