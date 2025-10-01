import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  Add,
  Remove,
  CheckCircle,
  Schedule,
  Construction,
  Assignment,
  Business,
  PlayArrow,
  DesignServices,
  Handshake,
  Receipt,
  Timeline,
  Speed
} from '@mui/icons-material';
import { F } from '../dataConfig';
import { type Row } from '../utils/utils/metrics';

interface ProjectProgressIndicatorProps {
  data: Row | null;
  allData: Row[];
  onToggleStages?: () => void;
  showStages?: boolean;
}

const ProjectProgressIndicator = ({ data, allData, onToggleStages, showStages = false }: ProjectProgressIndicatorProps) => {

  // Componente de barra de progreso moderna y compacta
  const ModernProgressBar = ({ percentage, title }: { percentage: number; title: string }) => {
    const getProgressColor = (pct: number) => {
      if (pct < 30) return '#ff4444';
      if (pct < 60) return '#ffaa00';
      if (pct < 80) return '#ffdd00';
      return '#00cc66';
    };

    const currentColor = getProgressColor(percentage);

    return (
      <div className="modern-progress-container">
        <div className="progress-header">
          <div className="progress-title">
            <Speed sx={{ fontSize: 16, marginRight: 0.5 }} />
            {title}
          </div>
          <div className="progress-percentage">
            {percentage.toFixed(1)}%
          </div>
        </div>
        
        <div className="progress-bar-container">
          <div className="progress-bar-background">
            <div 
              className="progress-bar-fill"
              style={{ 
                width: `${percentage}%`,
                background: `linear-gradient(90deg, ${currentColor} 0%, ${currentColor}dd 100%)`
              }}
            />
          </div>
          
          {/* Marcas de progreso */}
          <div className="progress-marks">
            {[0, 25, 50, 75, 100].map((value) => (
              <div 
                key={value}
                className={`progress-mark ${percentage >= value ? 'active' : ''}`}
                style={{ left: `${value}%` }}
              >
                <div className="mark-dot" />
                <span className="mark-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Indicador de estado */}
        <div className="progress-status">
          <div 
            className="status-dot" 
            style={{ backgroundColor: currentColor }}
          />
          <span className="status-text">
            {percentage < 30 ? 'Inicio' : 
             percentage < 60 ? 'En Progreso' : 
             percentage < 80 ? 'Avanzado' : 'Casi Terminado'}
          </span>
        </div>
      </div>
    );
  };

  /**
   * Función para parsear porcentajes y determinar redistribución
   * 
   * RETORNA NULL (se redistribuye el peso):
   *   - null, undefined
   *   - Texto: "No aplica", "N/A", "NA", "" (vacío), "Sin información"
   *   - Valores no numéricos
   * 
   * RETORNA NÚMERO (0-100):
   *   - Porcentajes válidos (0%, 50%, 100%, etc.)
   */
  const parsePct = (val: any): number | null => {
    // 1. Si es null o undefined → SE REDISTRIBUYE
    if (val === undefined || val === null) return null;
    
    // 2. Si es número directo → Retornar limitado entre 0-100
    if (typeof val === 'number') return Math.max(0, Math.min(100, val));
    
    // 3. Convertir a string y limpiar
    let s = String(val).trim();
    const sLower = s.toLowerCase();
    
    // 4. Casos de texto que SE REDISTRIBUYEN (retorna null)
    if (s === '') return null;  // Vacío
    if (sLower === 'n/a' || sLower === 'na') return null;  // N/A, NA
    if (sLower.includes('no aplica')) return null;  // "No aplica"
    if (sLower.includes('no aplicable')) return null;  // "No aplicable"
    if (sLower.includes('sin información') || sLower.includes('sin informacion')) return null;  // "Sin información"
    
    // 5. Intentar convertir a número
    s = s.replace('%', '').replace(/,/g, '.');
    let n = Number(s);
    
    // 6. Si no es un número válido → SE REDISTRIBUYE
    if (!Number.isFinite(n)) return null;
    
    // 7. Convertir decimales (0.5 → 50%)
    if (n > 0 && n <= 1) n *= 100;
    
    // 8. Retornar limitado entre 0-100
    return Math.max(0, Math.min(100, n));
  };

  // Función para calcular el indicador (fórmula del servidor con redistribución dinámica)
  const calculateIndicador = (row: Row): number | null => {
    const pPlaneacion = parsePct(row[F.porcentajePlaneacionMGA]);
    const pEstudios = parsePct(row[F.porcentajeEstudiosPreliminares]);
    const pViabili = parsePct(row[F.porcentajeViabilizacionDAP]);
    const pPredial = parsePct(row[F.porcentajeGestionPredial]);
    const pLicencias = parsePct(row[F.porcentajeLicenciasCuraduria]);
    const pContra = parsePct(row[F.porcentajeContratacion]);
    const pInicio = parsePct(row[F.porcentajeInicio]);
    const pDisenos = parsePct(row[F.porcentajeDisenos]);
    let pEjec = parsePct(row[F.porcentajeEjecucionObra]);
    if (pEjec === null) pEjec = parsePct(row[F.presupuestoPorcentajeEjecutado]);
    const pEnt = parsePct(row[F.porcentajeEntregaObra]);
    const pLiq = parsePct(row[F.porcentajeLiquidacion]);

    const wPlaneacion = 2.0, wEstudios = 1.2, wViabili = 1.2, wPredial = 1.2, wLicencias = 1.2, wContra = 1.2,
          wInicio = 2.0, wDisenos = 5.0, wEjecucion = 78.0, wEntrega = 5.0, wLiq = 2.0;

    const aPlaneacion = pPlaneacion !== null;
    const aEstudios = pEstudios !== null; 
    const aViabili = pViabili !== null; 
    const aPredial = pPredial !== null; 
    const aLicencias = pLicencias !== null;
    const aContra = pContra !== null;
    const aInicio = pInicio !== null; 
    const aDisenos = pDisenos !== null; 
    const aEjec = pEjec !== null; 
    const aEnt = pEnt !== null; 
    const aLiq = pLiq !== null;

    // Fase de preparación (Planeación)
    const prepApplicable = aPlaneacion ? 1 : 0;
    const prepNAWeight = aPlaneacion ? 0 : wPlaneacion;
    const prepExtra = prepApplicable === 0 ? 0 : prepNAWeight / prepApplicable;

    // Fase precontractual (Estudios, Viabilización, Predial, Licencias, Contratación)
    const preconApplicable = (aEstudios ? 1 : 0) + (aViabili ? 1 : 0) + (aPredial ? 1 : 0) + (aLicencias ? 1 : 0) + (aContra ? 1 : 0);
    const preconNAWeight = (aEstudios ? 0 : wEstudios) + (aViabili ? 0 : wViabili) + (aPredial ? 0 : wPredial) + (aLicencias ? 0 : wLicencias) + (aContra ? 0 : wContra);
    const preconExtra = preconApplicable === 0 ? 0 : preconNAWeight / preconApplicable;

    // Fase contractual (Inicio, Diseños, Ejecución, Entrega)
    const conApplicable = (aInicio ? 1 : 0) + (aDisenos ? 1 : 0) + (aEjec ? 1 : 0) + (aEnt ? 1 : 0);
    const conNAWeight = (aInicio ? 0 : wInicio) + (aDisenos ? 0 : wDisenos) + (aEjec ? 0 : wEjecucion) + (aEnt ? 0 : wEntrega);
    const conExtra = conApplicable === 0 ? 0 : conNAWeight / conApplicable;

    // Fase post-contractual (Liquidación)
    const postApplicable = aLiq ? 1 : 0;
    const postNAWeight = aLiq ? 0 : wLiq;
    const postExtra = postApplicable === 0 ? 0 : postNAWeight / postApplicable;

    // Redistribución global
    const totalApplicable = prepApplicable + preconApplicable + conApplicable + postApplicable;
    const totalNAWeight = prepNAWeight + preconNAWeight + conNAWeight + postNAWeight;
    const globalExtra = totalApplicable === 0 ? 0 : totalNAWeight / totalApplicable;

    // Contribuciones ponderadas (traducción fiel del DAX)
    const cPlaneacion = aPlaneacion ? ((pPlaneacion || 0) * (wPlaneacion + prepExtra + globalExtra)) / 100.0 : 0;
    const cEstudios   = aEstudios   ? ((pEstudios || 0)   * (wEstudios   + preconExtra + globalExtra)) / 100.0 : 0;
    const cViabili    = aViabili    ? ((pViabili || 0)    * (wViabili    + preconExtra + globalExtra)) / 100.0 : 0;
    const cPredial    = aPredial    ? ((pPredial || 0)    * (wPredial    + preconExtra + globalExtra)) / 100.0 : 0;
    const cLicencias  = aLicencias  ? ((pLicencias || 0)  * (wLicencias  + preconExtra + globalExtra)) / 100.0 : 0;
    const cContra     = aContra     ? ((pContra || 0)     * (wContra     + preconExtra + globalExtra)) / 100.0 : 0;
    const cInicio     = aInicio     ? ((pInicio || 0)     * (wInicio     + conExtra   + globalExtra)) / 100.0 : 0;
    const cDisen      = aDisenos    ? ((pDisenos || 0)    * (wDisenos    + conExtra   + globalExtra)) / 100.0 : 0;
    const cEjec       = aEjec       ? ((pEjec || 0)       * (wEjecucion  + conExtra   + globalExtra)) / 100.0 : 0;
    const cEnt        = aEnt        ? ((pEnt || 0)        * (wEntrega    + conExtra   + globalExtra)) / 100.0 : 0;
    const cLiq        = aLiq        ? ((pLiq || 0)        * (wLiq        + postExtra  + globalExtra)) / 100.0 : 0;

    const total = cPlaneacion + cEstudios + cViabili + cPredial + cLicencias + cContra + cInicio + cDisen + cEjec + cEnt + cLiq;
    const bounded = Math.max(0, Math.min(100, total));
    
    return Number.isFinite(bounded) ? Math.round(bounded * 100) / 100 : 0;
  };

  // Obtener datos de las etapas
  const getStagesData = (row: Row | null) => {
    if (!row) return [];
    
    return [
      {
        name: 'Planeación (MGA)',
        percentage: parsePct(row[F.porcentajePlaneacionMGA]) || 0,
        icon: <Assignment />,
        color: '#2196f3'
      },
      {
        name: 'Estudios Preliminares',
        percentage: parsePct(row[F.porcentajeEstudiosPreliminares]) || 0,
        icon: <Schedule />,
        color: '#ff9800'
      },
      {
        name: 'Viabilización (DAP)',
        percentage: parsePct(row[F.porcentajeViabilizacionDAP]) || 0,
        icon: <CheckCircle />,
        color: '#4caf50'
      },
      {
        name: 'Gestión Predial',
        percentage: parsePct(row[F.porcentajeGestionPredial]) || 0,
        icon: <Business />,
        color: '#9c27b0'
      },
      {
        name: 'Contratación',
        percentage: parsePct(row[F.porcentajeContratacion]) || 0,
        icon: <Handshake />,
        color: '#607d8b'
      },
      {
        name: 'Inicio',
        percentage: parsePct(row[F.porcentajeInicio]) || 0,
        icon: <PlayArrow />,
        color: '#795548'
      },
      {
        name: 'Diseños',
        percentage: parsePct(row[F.porcentajeDisenos]) || 0,
        icon: <DesignServices />,
        color: '#e91e63'
      },
      {
        name: 'Ejecución Obra',
        percentage: parsePct(row[F.porcentajeEjecucionObra]) || parsePct(row[F.presupuestoPorcentajeEjecutado]) || 0,
        icon: <Construction />,
        color: '#ff5722'
      },
      {
        name: 'Entrega Obra',
        percentage: parsePct(row[F.porcentajeEntregaObra]) || 0,
        icon: <Timeline />,
        color: '#3f51b5'
      },
      {
        name: 'Liquidación',
        percentage: parsePct(row[F.porcentajeLiquidacion]) || 0,
        icon: <Receipt />,
        color: '#009688'
      }
    ];
  };

  // Calcular indicador de avance general
  const progressData = useMemo(() => {
    if (!data) {
      // Si no hay obra seleccionada, calcular promedio de todas las obras
      if (allData.length === 0) return { percentage: 0, stages: [] };
      
      let totalPercentage = 0;
      let validObras = 0;
      
      allData.forEach(obra => {
        const indicador = calculateIndicador(obra);
        if (indicador !== null) {
          totalPercentage += indicador;
          validObras++;
        }
      });
      
      const avgPercentage = validObras > 0 ? totalPercentage / validObras : 0;
      return { percentage: avgPercentage, stages: getStagesData(data) };
    }
    
    const percentage = calculateIndicador(data);
    return { 
      percentage: percentage || 0, 
      stages: getStagesData(data) 
    };
  }, [data, allData]);

  // Nota: función de color ya no se usa aquí; el color dinámico está en ModernProgressBar


  return (
    <Card 
      sx={{ 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        border: '1px solid #dee2e6',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 1.2 }}>
        {/* Botón para mostrar/ocultar etapas */}
        <Box display="flex" justifyContent="flex-end" mb={1}>
          <IconButton
            title={showStages ? "Ocultar etapas" : "Ver etapas"}
            aria-label={showStages ? "Ocultar etapas" : "Ver etapas"}
            onClick={() => {
              if (onToggleStages) {
                onToggleStages();
                // Si se van a mostrar las etapas, hacer scroll hacia abajo
                if (!showStages) {
                  setTimeout(() => {
                    const stagesSection = document.getElementById('stages-section');
                    if (stagesSection) {
                      stagesSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                      });
                    }
                  }, 100);
                } else {
                  // Si se van a cerrar las etapas, hacer scroll hacia la vista de inicio
                  setTimeout(() => {
                    // Intentar múltiples métodos de scroll
                    try {
                      window.scrollTo({ 
                        top: 0, 
                        behavior: 'smooth' 
                      });
                    } catch (e) {
                      // Fallback si smooth no funciona
                      window.scrollTo(0, 0);
                    }
                    
                    // También intentar con document
                    try {
                      document.documentElement.scrollTop = 0;
                      document.body.scrollTop = 0;
                    } catch (e) {
                      console.log('Scroll fallback applied');
                    }
                  }, 150);
                }
              }
            }}
            sx={{
              color: showStages ? '#f44336' : '#4caf50',
              width: 30,
              height: 30,
              backgroundColor: showStages ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
              '&:hover': { 
                backgroundColor: showStages ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {showStages ? <Remove fontSize="small" /> : <Add fontSize="small" />}
          </IconButton>
        </Box>

        {/* Barra de progreso moderna */}
        <ModernProgressBar 
          percentage={progressData.percentage} 
          title="Avance General del Proyecto" 
        />
      </CardContent>
    </Card>
  );
};

export default ProjectProgressIndicator;

// Estilos CSS para la barra de progreso moderna
const modernProgressStyles = `
  .modern-progress-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .progress-title {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: #2d3748;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .progress-percentage {
    font-size: 0.9rem;
    font-weight: 800;
    color: #2d3748;
    background: rgba(121, 188, 153, 0.1);
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid rgba(121, 188, 153, 0.2);
  }

  .progress-bar-container {
    position: relative;
    height: 8px;
    background: #e9ecef;
    border-radius: 6px;
    overflow: visible; /* permitir ver marcas y valores */
    margin: 4px 0;
  }

  .progress-bar-background {
    width: 100%;
    height: 100%;
    background: #f1f3f4;
    border-radius: 6px;
    position: relative;
  }

  .progress-bar-fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.8s ease-in-out;
    position: relative;
    overflow: hidden;
  }

  .progress-bar-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .progress-marks {
    position: absolute;
    top: -4px; /* acercar a la barra */
    left: 0;
    right: 0;
    height: 20px;
    pointer-events: none;
  }

  .progress-mark {
    position: absolute;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .mark-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #cbd5e0;
    transition: all 0.3s ease;
  }

  .progress-mark.active .mark-dot {
    background: #79BC99;
    transform: scale(1.2);
    box-shadow: 0 0 0 2px rgba(121, 188, 153, 0.2);
  }

  .mark-value {
    font-size: 0.58rem;
    font-weight: 700;
    color: #718096;
    opacity: 0.9;
    background: rgba(255,255,255,0.85);
    border: 1px solid rgba(233, 236, 239, 0.9);
    border-radius: 6px;
    padding: 0 4px;
    line-height: 1.2;
    transition: all 0.3s ease;
  }

  .progress-mark.active .mark-value {
    color: #2d3748;
    opacity: 1;
    font-weight: 700;
  }

  .progress-status {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .status-text {
    font-size: 0.65rem;
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }

  .modern-progress-container:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #79BC99;
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = modernProgressStyles;
  document.head.appendChild(styleSheet);
}
