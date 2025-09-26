import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Schedule,
  Construction,
  Assignment,
  Business,
  PlayArrow,
  DesignServices,
  Handshake,
  Receipt,
  Timeline
} from '@mui/icons-material';
import { F } from '../dataConfig';
import { type Row } from '../utils/utils/metrics';

interface ProjectProgressIndicatorProps {
  data: Row | null;
  allData: Row[];
  onToggleStages?: () => void;
}

const ProjectProgressIndicator = ({ data, allData, onToggleStages }: ProjectProgressIndicatorProps) => {

  // Función para parsear porcentajes (copiada del servidor)
  const parsePct = (val: any): number | null => {
    if (val === undefined || val === null) return null;
    if (typeof val === 'number') return Math.max(0, Math.min(100, val));
    let s = String(val).trim();
    const sLower = s.toLowerCase();
    if (sLower.includes('no aplica')) return null;
    if (sLower.includes('sin información') || sLower.includes('sin informacion')) return 0;
    s = s.replace('%', '').replace(/,/g, '.');
    if (s === '' || sLower === 'n/a') return null;
    let n = Number(s);
    if (!Number.isFinite(n)) return null;
    if (n > 0 && n <= 1) n *= 100;
    return Math.max(0, Math.min(100, n));
  };

  // Función para calcular el indicador (fórmula del servidor)
  const calculateIndicador = (row: Row): number | null => {
    const pPlaneacion = parsePct(row[F.porcentajePlaneacionMGA]);
    const pEstudios = parsePct(row[F.porcentajeEstudiosPreliminares]);
    const pViabili = parsePct(row[F.porcentajeViabilizacionDAP]);
    const pPredial = parsePct(row[F.porcentajeGestionPredial]);
    const pContra = parsePct(row[F.porcentajeContratacion]);
    const pInicio = parsePct(row[F.porcentajeInicio]);
    const pDisenos = parsePct(row[F.porcentajeDisenos]);
    let pEjec = parsePct(row[F.porcentajeEjecucionObra]);
    if (pEjec === null) pEjec = parsePct(row[F.presupuestoPorcentajeEjecutado]);
    const pEnt = parsePct(row[F.porcentajeEntregaObra]);
    const pLiq = parsePct(row[F.porcentajeLiquidacion]);

    const wPlaneacion = 2.0, wEstudios = 1.5, wViabili = 1.5, wPredial = 1.5, wContra = 1.5,
          wInicio = 2.0, wDisenos = 5.0, wEjecucion = 78.0, wEntrega = 5.0, wLiq = 2.0;

    const aPlaneacion = pPlaneacion !== null;
    const aEstudios = pEstudios !== null; const aViabili = pViabili !== null; const aPredial = pPredial !== null; const aContra = pContra !== null;
    const aInicio = pInicio !== null; const aDisenos = pDisenos !== null; const aEjec = pEjec !== null; const aEnt = pEnt !== null; const aLiq = pLiq !== null;

    const prepApplicable = aPlaneacion ? 1 : 0;
    const prepNAWeight = aPlaneacion ? 0 : wPlaneacion;
    const prepExtra = prepApplicable === 0 ? 0 : prepNAWeight / prepApplicable;

    const preconApplicable = (aEstudios ? 1 : 0) + (aViabili ? 1 : 0) + (aPredial ? 1 : 0) + (aContra ? 1 : 0);
    const preconNAWeight = (aEstudios ? 0 : wEstudios) + (aViabili ? 0 : wViabili) + (aPredial ? 0 : wPredial) + (aContra ? 0 : wContra);
    const preconExtra = preconApplicable === 0 ? 0 : preconNAWeight / preconApplicable;

    const conApplicable = (aInicio ? 1 : 0) + (aDisenos ? 1 : 0) + (aEjec ? 1 : 0);
    const conNAWeight = (aInicio ? 0 : wInicio) + (aDisenos ? 0 : wDisenos) + (aEjec ? 0 : wEjecucion);
    const conExtra = conApplicable === 0 ? 0 : conNAWeight / conApplicable;

    const postApplicable = (aEnt ? 1 : 0) + (aLiq ? 1 : 0);
    const postNAWeight = (aEnt ? 0 : wEntrega) + (aLiq ? 0 : wLiq);
    const postExtra = postApplicable === 0 ? 0 : postNAWeight / postApplicable;

    const prepPct = aPlaneacion ? pPlaneacion : (prepExtra + (preconExtra + conExtra + postExtra) / 3);
    const preconPct = preconApplicable > 0 ? 
      ((aEstudios ? pEstudios : 0) + (aViabili ? pViabili : 0) + (aPredial ? pPredial : 0) + (aContra ? pContra : 0)) / preconApplicable : 
      (prepExtra + conExtra + postExtra) / 3;
    const conPct = conApplicable > 0 ? 
      ((aInicio ? (pInicio || 0) : 0) + (aDisenos ? (pDisenos || 0) : 0) + (aEjec ? (pEjec || 0) : 0)) / conApplicable : 
      (prepExtra + preconExtra + postExtra) / 3;
    const postPct = postApplicable > 0 ? 
      ((aEnt ? pEnt : 0) + (aLiq ? pLiq : 0)) / postApplicable : 
      (prepExtra + preconExtra + conExtra) / 3;

    const indicador = (prepPct * wPlaneacion + preconPct * (wEstudios + wViabili + wPredial + wContra) + 
                      conPct * (wInicio + wDisenos + wEjecucion) + postPct * (wEntrega + wLiq)) / 
                     (wPlaneacion + wEstudios + wViabili + wPredial + wContra + wInicio + wDisenos + wEjecucion + wEntrega + wLiq);

    return indicador;
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 60) return '#8bc34a';
    if (percentage >= 40) return '#ffc107';
    if (percentage >= 20) return '#ff9800';
    return '#f44336';
  };

  const getProgressLabel = (percentage: number) => {
    if (percentage >= 90) return 'Excelente';
    if (percentage >= 70) return 'Bueno';
    if (percentage >= 50) return 'Regular';
    if (percentage >= 30) return 'Bajo';
    return 'Crítico';
  };

  return (
    <Card 
      sx={{ 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        border: '1px solid #dee2e6',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header con botón de expansión */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Construction sx={{ color: '#495057', fontSize: 20 }} />
            <Typography variant="h6" fontWeight="bold" color="#495057">
              Avance General del Proyecto
            </Typography>
          </Box>
          <IconButton
            onClick={onToggleStages}
            sx={{
              color: '#6c757d',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
            }}
          >
            <ExpandMore />
          </IconButton>
        </Box>

        {/* Indicador como barra horizontal compacta */}
        <Box 
          sx={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            borderRadius: 1,
            p: 1.2,
            border: '1px solid #e9ecef',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Lado izquierdo: círculo + porcentaje */}
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${getProgressColor(progressData.percentage)}20, ${getProgressColor(progressData.percentage)}10)`,
                border: `2px solid ${getProgressColor(progressData.percentage)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography 
                variant="body2" 
                fontWeight="bold" 
                color={getProgressColor(progressData.percentage)}
                sx={{ fontSize: '0.75rem' }}
              >
                {progressData.percentage.toFixed(0)}%
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold" color="#2d3748" sx={{ fontSize: '0.85rem' }}>
              {progressData.percentage.toFixed(1)}% completado
            </Typography>
          </Box>
          
          {/* Lado derecho: chip de estado */}
          <Chip 
            label={getProgressLabel(progressData.percentage)}
            color={progressData.percentage >= 70 ? 'success' : progressData.percentage >= 40 ? 'warning' : 'error'}
            size="small"
            sx={{ 
              fontWeight: 'bold', 
              fontSize: '0.7rem', 
              height: 22,
              minWidth: 'auto'
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProjectProgressIndicator;
