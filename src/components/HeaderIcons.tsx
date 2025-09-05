import { useState } from 'react';
import { F } from '../dataConfig';
import { formatDate } from '../utils/utils/metrics';
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

export default function HeaderIcons({ rows, filtered }: HeaderIconsProps) {
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
        id: obra[F.id] || Math.random(),
        nombre: String(obra[F.nombre] ?? 'Sin nombre'),
        fechaEntrega: fechaFinal,
        año,
        estado: entregada ? 'entregada' : 'no-entregada',
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

  // Obtener alertas (obras con riesgos)
  const alertas = filtered.filter(obra => {
    const descripcionRiesgo = String(obra[F.descripcionDelRiesgo] ?? '').trim();
    const presenciaRiesgo = String(obra[F.presenciaDeRiesgo] ?? '').toLowerCase().trim();
    
    return descripcionRiesgo.length > 0 || 
           (presenciaRiesgo !== 'sin información' && 
            presenciaRiesgo !== 'no aplica' && 
            presenciaRiesgo !== 'ninguna' &&
            presenciaRiesgo !== '');
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
              <h3>⚠️ Alertas y Riesgos</h3>
              <button 
                className="popup-close"
                onClick={() => setShowAlertsPopup(false)}
              >
                ×
              </button>
            </div>
            
            <div className="popup-content">
              <div className="alerts-summary">
                <div className="summary-stats">
                  <div className="stat-item alerts">
                    <span className="stat-number">{alertas.length}</span>
                    <span className="stat-label">Alertas Encontradas</span>
                  </div>
                </div>
              </div>

              <div className="alerts-container">
                {alertas.length === 0 ? (
                  <div className="no-alerts">
                    <p>✅ No se encontraron alertas o riesgos activos</p>
                  </div>
                ) : (
                  alertas.map((obra, index) => (
                    <div key={index} className="alert-item">
                      <div className="alert-header">
                        <h5 className="alert-obra-name">{String(obra[F.nombre] ?? 'Sin nombre')}</h5>
                        <span className="alert-dependencia">{String(obra[F.dependencia] ?? '')}</span>
                      </div>
                      
                      {obra[F.presenciaDeRiesgo] && (
                        <div className="alert-detail">
                          <strong>Presencia de Riesgo:</strong> {String(obra[F.presenciaDeRiesgo])}
                        </div>
                      )}
                      
                      {obra[F.descripcionDelRiesgo] && (
                        <div className="alert-detail">
                          <strong>Descripción:</strong> {String(obra[F.descripcionDelRiesgo])}
                        </div>
                      )}
                      
                      {obra[F.impactoDelRiesgo] && (
                        <div className="alert-detail">
                          <strong>Impacto:</strong> {String(obra[F.impactoDelRiesgo])}
                        </div>
                      )}
                      
                      {obra[F.estadoDeRiesgo] && (
                        <div className="alert-detail">
                          <strong>Estado:</strong> {String(obra[F.estadoDeRiesgo])}
                        </div>
                      )}
                    </div>
                  ))
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

        .popup-header {
          padding: 20px 25px;
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%);
          border-radius: 18px 18px 0 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: white;
        }

        .popup-header h3 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 600;
        }

        .popup-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
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
          background: rgba(255, 255, 255, 0.3);
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
            POPUP DE ALERTAS
        ======================================================================== */
        .alerts-summary {
          margin-bottom: 25px;
          padding: 20px;
          background: linear-gradient(135deg, #ffebee 0%, #fce4ec 100%);
          border-radius: 12px;
          border: 1px solid #e74c3c;
        }

        .alerts-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .no-alerts {
          text-align: center;
          padding: 40px;
          color: #27ae60;
          font-size: 1.1rem;
          background: rgba(39, 174, 96, 0.1);
          border-radius: 12px;
        }

        .alert-item {
          padding: 20px;
          border: 1px solid #ffcdd2;
          border-radius: 12px;
          background: #fff;
          border-left: 4px solid #e74c3c;
          transition: all 0.3s ease;
        }

        .alert-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(231, 76, 60, 0.2);
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .alert-obra-name {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #2c3e50;
          flex: 1;
          min-width: 200px;
        }

        .alert-dependencia {
          padding: 4px 12px;
          background: #e3f2fd;
          color: #1976d2;
          border-radius: 15px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .alert-detail {
          margin-bottom: 10px;
          line-height: 1.4;
        }

        .alert-detail strong {
          color: #2c3e50;
          margin-right: 8px;
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

          .alert-header {
            flex-direction: column;
            gap: 8px;
          }

          .alert-obra-name {
            min-width: auto;
            font-size: 1rem;
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

          .alert-item {
            padding: 15px;
          }
        }
      `}</style>
    </>
  );
}
