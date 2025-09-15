import { useState } from 'react';
import { F } from '../dataConfig';
import { formatDate, calcularAlertasEncontradas } from '../utils/utils/metrics';
import type { Row } from '../utils/utils/metrics';

interface HeaderIconsProps {
  rows: Row[];
  filtered: Row[];
}

interface ObraCalendario {
  id: string | number;
  nombre: string;
  fechaEntrega: string;
  año: number;
  estado: 'entregada' | 'no-entregada';
  dependencia?: string;
  comuna?: string;
}

export default function HeaderIcons({ filtered }: HeaderIconsProps) {
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [showAlertsPopup, setShowAlertsPopup] = useState(false);

  // Función para aplicar la corrección de fecha de entrega según la fórmula de Power BI
  const getEntregaRealCorregida = (obra: Row): string | null => {
    const fechaRealEntrega = obra[F.fechaRealDeEntrega];
    const fechaFinRealEjecucion = obra[F.fechaFinRealEjecucionObra];
    
    // Convertir fechas a string para comparación
    const fechaRealStr = String(fechaRealEntrega ?? '');
    const fechaFinRealStr = String(fechaFinRealEjecucion ?? '');
    
    // Verificar si la fecha real de entrega es 2000-01-01 (fecha por defecto)
    const isFechaRealDefault = fechaRealStr.includes('2000-01-01') || fechaRealStr.includes('2000');
    const hasFechaFinReal = fechaFinRealStr && !fechaFinRealStr.includes('2000-01-01') && !fechaFinRealStr.includes('2000');
    
    // Aplicar la lógica: si fecha real es 2000-01-01 Y existe fecha fin real, usar fecha fin real
    if (isFechaRealDefault && hasFechaFinReal) {
      return fechaFinRealStr;
    }
    
    // Si no, usar la fecha real de entrega original
    return fechaRealStr || null;
  };

  // Determinar si una obra está entregada
  const isObraEntregada = (obra: Row): boolean => {
    const estado = String(obra[F.estadoDeLaObra] ?? '').toLowerCase();
    const fechaCorregida = getEntregaRealCorregida(obra);
    const añoActual = new Date().getFullYear();
    
    // Verificar por estado
    if (estado.includes('entreg')) {
      return true;
    }
    
    // Verificar por fecha de entrega corregida
    if (fechaCorregida) {
      const añoEntrega = parseInt(fechaCorregida.slice(0, 4));
      if (añoEntrega && añoEntrega <= añoActual && añoEntrega > 2000) {
        return true;
      }
    }
    
    return false;
  };

  // Preparar datos del calendario - obras desde 2022
  const obrasCalendario: ObraCalendario[] = filtered
    .filter(obra => {
      const fechaCorregida = getEntregaRealCorregida(obra);
      const fechaEstimada = String(obra[F.fechaEstimadaDeEntrega] ?? '');
      
      // Obtener año de cualquiera de las fechas disponibles
      let año = 0;
      if (fechaCorregida) {
        año = parseInt(fechaCorregida.slice(0, 4));
      } else if (fechaEstimada) {
        año = parseInt(fechaEstimada.slice(0, 4));
      }
      
      return año >= 2022;
    })
    .map(obra => {
      const fechaCorregida = getEntregaRealCorregida(obra);
      const fechaEstimada = String(obra[F.fechaEstimadaDeEntrega] ?? '');
      const entregada = isObraEntregada(obra);
      
      // Usar fecha corregida si existe y está entregada, si no usar fecha estimada
      const fechaFinal = entregada && fechaCorregida ? fechaCorregida : fechaEstimada;
      const año = parseInt(fechaFinal.slice(0, 4)) || new Date().getFullYear();
      
      return {
        id: String(obra[F.id] || Math.random()),
        nombre: String(obra[F.nombre] ?? 'Sin nombre'),
        fechaEntrega: fechaFinal,
        año,
        estado: (entregada ? 'entregada' : 'no-entregada') as 'entregada' | 'no-entregada',
        dependencia: String(obra[F.dependencia] ?? ''),
        comuna: String(obra[F.comunaOCorregimiento] ?? '')
      };
    })
    .sort((a, b) => b.año - a.año); // Ordenar por año descendente

  // Agrupar obras por año
  const obrasPorAño = obrasCalendario.reduce((acc, obra) => {
    if (!acc[obra.año]) {
      acc[obra.año] = { entregadas: [], noEntregadas: [] };
    }
    
    if (obra.estado === 'entregada') {
      acc[obra.año].entregadas.push(obra);
    } else {
      acc[obra.año].noEntregadas.push(obra);
    }
    
    return acc;
  }, {} as Record<number, { entregadas: ObraCalendario[], noEntregadas: ObraCalendario[] }>);

  // Resumen de entregas (conteos visibles en el icono)
  // const _entregaSummary = useMemo(() => {
  //   const entregadas = obrasCalendario.filter(o => o.estado === 'entregada').length;
  //   const noEntregadas = obrasCalendario.filter(o => o.estado === 'no-entregada').length;
  //   return { entregadas, noEntregadas };
  // }, [obrasCalendario]);


  // Helpers para validar campos y ordenar por impacto
  const isValorValido = (val: unknown): boolean => {
    const raw = String(val ?? '').trim();
    if (!raw) return false;
    const l = raw.toLowerCase();
    return l !== 'sin información' && l !== 'sin informacion' && l !== 'no aplica' && l !== 'ninguna' && l !== 'undefined';
  };

  const impactoRank = (val: string): number => {
    const l = val.toLowerCase();
    if (l.includes('alto')) return 0;
    if (l.includes('medio')) return 1;
    if (l.includes('bajo')) return 2;
    return 3;
  };

  const impactoClase = (val: string): string => {
    const l = val.toLowerCase();
    if (l.includes('alto')) return 'severity-alto';
    if (l.includes('medio')) return 'severity-medio';
    if (l.includes('bajo')) return 'severity-bajo';
    return '';
  };

  // Aplicar estrictamente la fórmula de "Alertas encontradas":
  // Presencia de riesgo distinta a Sin información/No aplica/Ninguna
  const alertas = filtered.filter(obra => {
    const presencia = String(obra[F.presenciaDeRiesgo] ?? '').trim().toLowerCase();
    return presencia.length > 0 &&
      presencia !== 'sin información' &&
      presencia !== 'sin informacion' &&
      presencia !== 'no aplica' &&
      presencia !== 'ninguna';
  });

  // Contador según la misma fórmula
  const numeroAlertas = calcularAlertasEncontradas(filtered);

  // Ordenar: impacto (alto>medio>bajo), dependencia, nombre
  const alertasOrdenadas = [...alertas].sort((a, b) => {
    const ia = impactoRank(String(a[F.impactoDelRiesgo] ?? ''));
    const ib = impactoRank(String(b[F.impactoDelRiesgo] ?? ''));
    if (ia !== ib) return ia - ib;
    const da = String(a[F.dependencia] ?? '');
    const db = String(b[F.dependencia] ?? '');
    const cmpDep = da.localeCompare(db);
    if (cmpDep !== 0) return cmpDep;
    const na = String(a[F.nombre] ?? '');
    const nb = String(b[F.nombre] ?? '');
    return na.localeCompare(nb);
  });

  return (
    <>
      {/* Iconos en la parte superior derecha */}
      <div className="header-icons">
        {/* Icono de Calendario */}
        <button 
          className="header-icon calendar-icon"
          onClick={() => setShowCalendarPopup(true)}
          title="Ver calendario de obras"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </button>

        {/* Icono de Alertas */}
        <button 
          className={`header-icon alert-icon ${alertas.length > 0 ? 'has-alerts' : ''}`}
          onClick={() => setShowAlertsPopup(true)}
          title="Ver alertas y riesgos"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {alertas.length > 0 && <span className="alert-indicator"></span>}
        </button>


      </div>

      {/* Popup del Calendario */}
      {showCalendarPopup && (
        <div className="popup-overlay" onClick={() => setShowCalendarPopup(false)}>
          <div className="popup-container calendar-popup" onClick={e => e.stopPropagation()}>
            <div className="popup-header">
              <h3>📅 Calendario de Obras</h3>
              <button 
                className="popup-close"
                onClick={() => setShowCalendarPopup(false)}
              >
                ×
              </button>
            </div>
            
            <div className="popup-content">
              <div className="calendar-summary">
                <div className="summary-stats">
                  <div className="stat-item entregadas">
                    <span className="stat-number">{obrasCalendario.filter(o => o.estado === 'entregada').length}</span>
                    <span className="stat-label">Entregadas</span>
                  </div>
                  <div className="stat-item no-entregadas">
                    <span className="stat-number">{obrasCalendario.filter(o => o.estado === 'no-entregada').length}</span>
                    <span className="stat-label">Por Entregar</span>
                  </div>
                </div>
              </div>

              <div className="years-container">
                {Object.keys(obrasPorAño)
                  .map(Number)
                  .sort((a, b) => b - a)
                  .map(año => (
                  <div key={año} className="year-section">
                    <h4 className="year-title">{año}</h4>
                    
                    {/* Obras Entregadas */}
                    {obrasPorAño[año].entregadas.length > 0 && (
                      <div className="obras-group entregadas-group">
                        <h5 className="group-title">
                          ✅ Entregadas ({obrasPorAño[año].entregadas.length})
                        </h5>
                        <div className="obras-list">
                          {obrasPorAño[año].entregadas.map(obra => (
                            <div key={obra.id} className="obra-item entregada">
                              <div className="obra-name">{obra.nombre}</div>
                              <div className="obra-details">
                                {obra.dependencia && <span className="obra-dependencia">{obra.dependencia}</span>}
                                {obra.comuna && <span className="obra-comuna">{obra.comuna}</span>}
                                <span className="obra-fecha">{formatDate(obra.fechaEntrega)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Obras No Entregadas */}
                    {obrasPorAño[año].noEntregadas.length > 0 && (
                      <div className="obras-group no-entregadas-group">
                        <h5 className="group-title">
                          ⏳ Por Entregar ({obrasPorAño[año].noEntregadas.length})
                        </h5>
                        <div className="obras-list">
                          {obrasPorAño[año].noEntregadas.map(obra => (
                            <div key={obra.id} className="obra-item no-entregada">
                              <div className="obra-name">{obra.nombre}</div>
                              <div className="obra-details">
                                {obra.dependencia && <span className="obra-dependencia">{obra.dependencia}</span>}
                                {obra.comuna && <span className="obra-comuna">{obra.comuna}</span>}
                                <span className="obra-fecha">{formatDate(obra.fechaEntrega)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup de Alertas */}
      {showAlertsPopup && (
        <div className="popup-overlay" onClick={() => setShowAlertsPopup(false)}>
          <div className="popup-container alerts-popup" onClick={e => e.stopPropagation()}>
            <div className="popup-header">
              <div className="header-title-section">
                <div className="header-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <h3>Alertas y Riesgos</h3>
              </div>
              <button 
                className="popup-close"
                onClick={() => setShowAlertsPopup(false)}
              >
                ×
              </button>
            </div>
            
            <div className="popup-content">
              <div className="alerts-summary">
                <div className="summary-card">
                  <div className="summary-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                  </div>
                  <div className="summary-content">
                    <div className="summary-number">{numeroAlertas}</div>
                    <div className="summary-label">Alertas Encontradas</div>
                  </div>
                </div>
              </div>

              <div className="alerts-container">
                {alertasOrdenadas.length === 0 ? (
                  <div className="no-alerts-state">
                    <div className="no-alerts-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                    </div>
                    <h4>No hay alertas activas</h4>
                    <p>Todas las obras están funcionando sin riesgos identificados</p>
                  </div>
                ) : (
                  <div className="alerts-list">
                    {alertasOrdenadas.map((obra, index) => {
                      const impacto = String(obra[F.impactoDelRiesgo] ?? '');
                      const presencia = String(obra[F.presenciaDeRiesgo] ?? '');
                      const descripcion = String(obra[F.descripcionDelRiesgo] ?? '');
                      const estadoRiesgo = String(obra[F.estadoDeRiesgo] ?? '');
                      const claseSeveridad = impactoClase(impacto);
                      return (
                        <div key={index} className={`alert-card ${claseSeveridad}`}>
                          <div className="alert-card-header">
                            <div className="alert-title-section">
                              <h4 className="alert-obra-name">{String(obra[F.nombre] ?? 'Sin nombre')}</h4>
                              <div className="alert-meta">
                                <span className="alert-dependencia">{String(obra[F.dependencia] ?? '')}</span>
                                {isValorValido(impacto) && (
                                  <span className={`severity-badge ${claseSeveridad}`}>
                                    {impacto}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="alert-card-content">
                            {isValorValido(presencia) && (
                              <div className="alert-field">
                                <div className="field-label">Presencia de Riesgo</div>
                                <div className="field-value">{presencia}</div>
                              </div>
                            )}
                            
                            {isValorValido(descripcion) && (
                              <div className="alert-field">
                                <div className="field-label">Descripción</div>
                                <div className="field-value description-text">{descripcion}</div>
                              </div>
                            )}
                            
                            {isValorValido(estadoRiesgo) && (
                              <div className="alert-field">
                                <div className="field-label">Estado del Riesgo</div>
                                <div className="field-value">{estadoRiesgo}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Estilos CSS */}
      <style>{`
        /* ========================================================================
            ICONOS DEL HEADER
        ======================================================================== */
        .header-icons {
          position: fixed;
          top: 80px; /* Más abajo para separar del logo */
          right: 20px;
          display: flex;
          gap: 10px;
          z-index: 1001; /* Mayor que la navegación */
        }

        .header-icon {
          position: relative;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #79BC99;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #4E8484;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 8px rgba(121, 188, 153, 0.15);
        }

        .header-icon.alert-icon.has-alerts {
          border: 2px solid #e74c3c;
          background: rgba(231, 76, 60, 0.05);
          color: #e74c3c;
          box-shadow: 0 0 15px rgba(231, 76, 60, 0.3);
          animation: alertGlow 2s ease-in-out infinite alternate;
        }

        .header-icon:hover {
          background: rgba(121, 188, 153, 0.1);
          border-color: #4E8484;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(121, 188, 153, 0.3);
        }

        .header-icon.alert-icon.has-alerts:hover {
          background: rgba(231, 76, 60, 0.1);
          border-color: #c0392b;
          box-shadow: 0 0 30px rgba(231, 76, 60, 0.7);
          transform: translateY(-3px);
        }

        .header-icon svg {
          width: 20px;
          height: 20px;
        }

        .header-icon.gantt-icon.has-delays {
          border: 2px solid #e67e22;
          background: rgba(230, 126, 34, 0.06);
          color: #e67e22;
          box-shadow: 0 0 15px rgba(230, 126, 34, 0.25);
        }

        .alert-indicator {
          position: absolute;
          top: -3px;
          right: -3px;
          background: #e74c3c;
          border-radius: 50%;
          width: 12px;
          height: 12px;
          border: 2px solid white;
          animation: pulse 2s infinite;
        }

        /* Sin badge de entregas, mantenemos diseño minimal */

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        @keyframes alertGlow {
          0% { 
            box-shadow: 0 0 15px rgba(231, 76, 60, 0.3);
            border-color: #e74c3c;
          }
          100% { 
            box-shadow: 0 0 25px rgba(231, 76, 60, 0.6);
            border-color: #c0392b;
          }
        }

        /* ========================================================================
            POPUPS GENERALES
        ======================================================================== */
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(5px);
        }

        .popup-container {
          background: white;
          border-radius: 20px;
          max-width: 800px;
          width: 90%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border: 2px solid #79BC99;
        }

        .popup-container.gantt-popup {
          max-width: 1000px;
          width: 95%;
          max-height: 85vh;
        }

        @media (max-width: 768px) {
          .popup-container.gantt-popup {
            max-width: 95%;
            width: 98%;
            max-height: 90vh;
          }
        }

        @media (max-width: 480px) {
          .popup-container.gantt-popup {
            max-width: 98%;
            width: 99%;
            max-height: 95vh;
          }
        }

        .popup-header {
          padding: 20px 25px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 18px 18px 0 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #000000;
          border-bottom: 2px solid #79BC99;
        }

        .popup-header h3 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 700;
          color: #000000;
        }

        .popup-close {
          background: rgba(0, 0, 0, 0.1);
          border: 1px solid #79BC99;
          color: #000000;
          font-size: 24px;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .popup-close:hover {
          background: rgba(0, 0, 0, 0.2);
          border-color: #4E8484;
          transform: rotate(90deg);
        }

        .popup-content {
          padding: 25px;
          overflow-y: auto;
          flex: 1;
        }

        /* ========================================================================
            POPUP DEL CALENDARIO
        ======================================================================== */
        .calendar-summary {
          margin-bottom: 25px;
          padding: 20px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          border: 1px solid #79BC99;
        }

        .summary-stats {
          display: flex;
          gap: 30px;
          justify-content: center;
        }

        .stat-item {
          text-align: center;
          padding: 15px;
          border-radius: 10px;
          background: white;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .stat-item.entregadas {
          border-color: #27ae60;
        }

        .stat-item.no-entregadas {
          border-color: #f39c12;
        }

        .stat-item.alerts {
          border-color: #e74c3c;
        }

        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #6c757d;
          font-weight: 500;
        }

        .years-container {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .year-section {
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 20px;
          background: #f8f9fa;
        }

        .year-title {
          margin: 0 0 20px 0;
          font-size: 1.4rem;
          font-weight: bold;
          color: #2c3e50;
          text-align: center;
          padding: 10px;
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%);
          color: white;
          border-radius: 8px;
        }

        .obras-group {
          margin-bottom: 20px;
        }

        .group-title {
          margin: 0 0 15px 0;
          font-size: 1.1rem;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 6px;
        }

        .entregadas-group .group-title {
          background: rgba(39, 174, 96, 0.1);
          color: #27ae60;
        }

        .no-entregadas-group .group-title {
          background: rgba(243, 156, 18, 0.1);
          color: #f39c12;
        }

        .obras-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .obra-item {
          padding: 12px 15px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          background: white;
          transition: all 0.3s ease;
        }

        .obra-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .obra-item.entregada {
          border-left: 4px solid #27ae60;
        }

        .obra-item.no-entregada {
          border-left: 4px solid #f39c12;
        }

        .obra-name {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 5px;
          line-height: 1.3;
        }

        .obra-details {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 0.85rem;
          color: #6c757d;
        }

        .obra-dependencia,
        .obra-comuna,
        .obra-fecha {
          padding: 2px 8px;
          border-radius: 4px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
        }

        .obra-fecha {
          background: #e3f2fd;
          color: #1976d2;
          font-weight: 500;
        }

        /* ========================================================================
            POPUP DE ALERTAS - DISEÑO MEJORADO
        ======================================================================== */
        .popup-header .header-title-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .popup-header .header-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border-radius: 10px;
          color: #dc2626;
          border: 1px solid #fca5a5;
        }

        .alerts-summary {
          margin-bottom: 30px;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: linear-gradient(135deg, #fef7f7 0%, #fdf2f2 100%);
          border-radius: 16px;
          border: 1px solid #fecaca;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.08);
        }

        .summary-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          border-radius: 16px;
          color: white;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
        }

        .summary-content {
          flex: 1;
        }

        .summary-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: #dc2626;
          line-height: 1;
          margin-bottom: 4px;
        }

        .summary-label {
          font-size: 1rem;
          font-weight: 600;
          color: #7f1d1d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .alerts-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .no-alerts-state {
          text-align: center;
          padding: 60px 20px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-radius: 16px;
          border: 1px solid #bbf7d0;
        }

        .no-alerts-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-radius: 20px;
          color: white;
          margin: 0 auto 20px;
          box-shadow: 0 6px 20px rgba(34, 197, 94, 0.25);
        }

        .no-alerts-state h4 {
          margin: 0 0 12px 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #166534;
        }

        .no-alerts-state p {
          margin: 0;
          font-size: 1rem;
          color: #16a34a;
          line-height: 1.5;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .alert-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .alert-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border-color: #d1d5db;
        }

        .alert-card.severity-alto {
          border-left: 4px solid #dc2626;
        }

        .alert-card.severity-medio {
          border-left: 4px solid #d97706;
        }

        .alert-card.severity-bajo {
          border-left: 4px solid #ca8a04;
        }

        .alert-card-header {
          padding: 20px 24px 16px;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border-bottom: 1px solid #e5e7eb;
        }

        .alert-title-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-obra-name {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          line-height: 1.4;
        }

        .alert-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .alert-dependencia {
          padding: 6px 12px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1e40af;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          border: 1px solid #93c5fd;
        }

        .severity-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .severity-badge.severity-alto {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.25);
        }

        .severity-badge.severity-medio {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(217, 119, 6, 0.25);
        }

        .severity-badge.severity-bajo {
          background: linear-gradient(135deg, #ca8a04 0%, #a16207 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(202, 138, 4, 0.25);
        }

        .alert-card-content {
          padding: 20px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .alert-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .field-value {
          font-size: 1rem;
          color: #374151;
          line-height: 1.5;
          font-weight: 500;
        }

        .field-value.description-text {
          background: #f9fafb;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          font-weight: 400;
          line-height: 1.6;
        }

        /* ========================================================================
            RESPONSIVE DESIGN
        ======================================================================== */
        @media (max-width: 768px) {
          .header-icons {
            right: 15px;
            gap: 8px;
            top: 70px; /* Ajustado para móviles */
          }

          .header-icon {
            padding: 6px;
          }

          .header-icon svg {
            width: 18px;
            height: 18px;
          }
        }

          .popup-container {
            width: 95%;
            max-height: 85vh;
          }

          .popup-header {
            padding: 15px 20px;
          }

          .popup-header h3 {
            font-size: 1.1rem;
          }

          .popup-content {
            padding: 20px;
          }

          .summary-stats {
            flex-direction: column;
            gap: 15px;
          }

          .stat-item {
            padding: 12px;
          }

          .stat-number {
            font-size: 1.5rem;
          }

          .year-section {
            padding: 15px;
          }

          .year-title {
            font-size: 1.2rem;
          }

          .obra-details {
            flex-direction: column;
            gap: 5px;
          }

          .alert-title-section {
            gap: 10px;
          }

          .alert-obra-name {
            font-size: 1rem;
          }

          .alert-meta {
            gap: 8px;
          }

          .summary-card {
            padding: 20px;
            gap: 16px;
          }

          .summary-icon {
            width: 50px;
            height: 50px;
          }

          .summary-number {
            font-size: 2rem;
          }

          .alert-card-header {
            padding: 16px 20px 12px;
          }

          .alert-card-content {
            padding: 16px 20px 20px;
            gap: 12px;
          }

          .field-value.description-text {
            padding: 10px;
          }
        }

        @media (max-width: 480px) {
          .header-icons {
            right: 10px;
            gap: 6px;
            top: 65px; /* Ajustado para móviles pequeños */
          }

          .header-icon {
            padding: 5px;
          }

          .header-icon svg {
            width: 16px;
            height: 16px;
          }
        }

          .popup-container {
            width: 98%;
            max-height: 90vh;
          }

          .popup-header {
            padding: 12px 15px;
          }

          .popup-header h3 {
            font-size: 1rem;
          }

          .popup-content {
            padding: 15px;
          }

          .year-section {
            padding: 12px;
          }

          .obra-item {
            padding: 10px 12px;
          }

          .obra-name {
            font-size: 0.95rem;
          }

          .summary-card {
            padding: 16px;
            gap: 12px;
          }

          .summary-icon {
            width: 45px;
            height: 45px;
          }

          .summary-number {
            font-size: 1.75rem;
          }

          .summary-label {
            font-size: 0.875rem;
          }

          .no-alerts-state {
            padding: 40px 15px;
          }

          .no-alerts-icon {
            width: 60px;
            height: 60px;
            margin-bottom: 16px;
          }

          .no-alerts-state h4 {
            font-size: 1.125rem;
          }

          .no-alerts-state p {
            font-size: 0.875rem;
          }

          .alert-card-header {
            padding: 14px 16px 10px;
          }

          .alert-card-content {
            padding: 14px 16px 16px;
            gap: 10px;
          }

          .alert-obra-name {
            font-size: 0.95rem;
          }

          .alert-dependencia {
            padding: 4px 8px;
            font-size: 0.75rem;
          }

          .severity-badge {
            padding: 4px 8px;
            font-size: 0.75rem;
          }

          .field-label {
            font-size: 0.75rem;
          }

          .field-value {
            font-size: 0.875rem;
          }

          .field-value.description-text {
            padding: 8px;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </>
  );
}
