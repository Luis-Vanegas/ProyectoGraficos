import { useMemo } from 'react';
import { F } from '../dataConfig';
import type { Row } from '../utils/utils/metrics';

type GanttChartProps = {
  rows: Row[];
  limit?: number;
  mode?: 'phase' | 'work';
};

type GanttItem = {
  id: string | number;
  name: string;
  startEst?: Date;
  endEst?: Date;
  startReal?: Date;
  endReal?: Date;
};

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (!raw || raw.startsWith('2000') || raw === 'undefined' || raw === 'null') return undefined;
  
  // Implementar la lógica similar a Power BI: FechaInicio_Date = IF(ISERROR(DATEVALUE(_valor)), BLANK(), DATEVALUE(_valor))
  try {
    // Intentar diferentes formatos de fecha
    let d: Date;
    
    // Si es un número (timestamp)
    if (!isNaN(Number(raw))) {
      d = new Date(Number(raw));
    }
    // Si contiene barras o guiones (formato de fecha)
    else if (raw.includes('/') || raw.includes('-')) {
      d = new Date(raw);
    }
    // Si es texto que puede contener fecha
    else {
      // Buscar patrones de fecha en el texto
      const dateMatch = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const fullYear = year.length === 2 ? (parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year)) : parseInt(year);
        d = new Date(fullYear, parseInt(month) - 1, parseInt(day));
      } else {
        d = new Date(raw);
      }
    }
    
  if (isNaN(d.getTime())) return undefined;
  
  // Solo mostrar fechas desde 2024 hacia adelante
  const year2024 = new Date('2024-01-01');
  if (d < year2024) return undefined;
  
  return d;
  } catch (error) {
    return undefined;
  }
}

function clampDate(d: Date, min: Date, max: Date): Date {
  if (d < min) return min;
  if (d > max) return max;
  return d;
}

export default function GanttChart({ rows, limit = 30, mode = 'phase' }: GanttChartProps) {
  const items = useMemo<GanttItem[]>(() => {
    if (mode === 'work') {
      return rows
        .map((r) => {
          const startEst = parseDate(r[F.fechaInicioEstimadaEjecucionObra]);
          const endEst = parseDate(r[F.fechaFinEstimadaEjecucionObra]);
          const startReal = parseDate(r[F.fechaInicioRealEjecucionObra]);
          const endReal = parseDate(r[F.fechaFinRealEjecucionObra]);
          const hasEst = !!(startEst && endEst && endEst >= startEst);
          const hasReal = !!(startReal && endReal && endReal >= startReal);
          if (!hasEst && !hasReal) return null;
          return {
            id: r[F.id] ?? Math.random(),
            name: String(r[F.nombre] ?? 'Sin nombre'),
            startEst: hasEst ? startEst : undefined,
            endEst: hasEst ? endEst : undefined,
            startReal: hasReal ? startReal : undefined,
            endReal: hasReal ? endReal : undefined,
          } as GanttItem;
        })
        .filter(Boolean)
        .slice(0, limit) as GanttItem[];
    }

    // Agrupado por FASE: se toma el rango global (min inicio, max fin) por fase
    const phases: Array<{
      id: string;
      label: string;
      estStartKey?: keyof Row;
      estEndKey?: keyof Row;
      realStartKey?: keyof Row;
      realEndKey?: keyof Row;
    }> = [
      {
        id: '01_planeacion',
        label: '01_Planeación',
        estStartKey: F.fechaInicioEstimadaPlaneacionMGA as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaPlaneacionMGA as unknown as keyof Row,
        realStartKey: F.fechaInicioRealPlaneacionMGA as unknown as keyof Row,
        realEndKey: F.fechaFinRealPlaneacionMGA as unknown as keyof Row,
      },
      {
        id: '02_estudios',
        label: '02_Estudios Preliminares',
        estStartKey: F.fechaInicioEstimadaEstudiosPreliminares as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaEstudiosPreliminares as unknown as keyof Row,
        realStartKey: F.fechaInicioRealEstudiosPreliminares as unknown as keyof Row,
        realEndKey: F.fechaFinRealEstudiosPreliminares as unknown as keyof Row,
      },
      {
        id: '03_viabilizacion',
        label: '03_Viabilización DAP',
        estStartKey: F.fechaInicioEstimadaViabilizacionDAP as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaViabilizacionDAP as unknown as keyof Row,
        realStartKey: F.fechaInicioRealViabilizacionDAP as unknown as keyof Row,
        realEndKey: F.fechaFinRealViabilizacionDAP as unknown as keyof Row,
      },
      {
        id: '04_gestion_predial',
        label: '04_Gestión Predial',
        estStartKey: F.fechaInicioEstimadaGestionPredial as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaGestionPredial as unknown as keyof Row,
        realStartKey: F.fechaInicioRealGestionPredial as unknown as keyof Row,
        realEndKey: F.fechaFinRealGestionPredial as unknown as keyof Row,
      },
      {
        id: '05_contratacion',
        label: '05_Contratación',
        estStartKey: F.fechaInicioEstimadaContratacion as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaContratacion as unknown as keyof Row,
        realStartKey: F.fechaInicioRealContratacion as unknown as keyof Row,
        realEndKey: F.fechaFinRealContratacion as unknown as keyof Row,
      },
      {
        id: '06_inicio',
        label: '06_Inicio',
        estStartKey: F.fechaInicioEstimadaInicio as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaInicio as unknown as keyof Row,
        realStartKey: F.fechaInicioRealInicio as unknown as keyof Row,
        realEndKey: F.fechaFinRealInicio as unknown as keyof Row,
      },
      {
        id: '07_ejecucion',
        label: '07_Ejecución',
        estStartKey: F.fechaInicioEstimadaEjecucionObra as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaEjecucionObra as unknown as keyof Row,
        realStartKey: F.fechaInicioRealEjecucionObra as unknown as keyof Row,
        realEndKey: F.fechaFinRealEjecucionObra as unknown as keyof Row,
      },
      {
        id: '08_dotacion',
        label: '08_Dotación y Puesta en Operación',
        estStartKey: F.fechaInicioEstimadaDotacionYPuestaEnOperacion as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaDotacionYPuestaEnOperacion as unknown as keyof Row,
        realStartKey: F.fechaInicioRealDotacionYPuestaEnOperacion as unknown as keyof Row,
        realEndKey: F.fechaFinRealDotacionYPuestaEnOperacion as unknown as keyof Row,
      },
      {
        id: '09_liquidacion',
        label: '09_Liquidación',
        estStartKey: F.fechaInicioEstimadaLiquidacion as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaLiquidacion as unknown as keyof Row,
        realStartKey: F.fechaInicioRealLiquidacion as unknown as keyof Row,
        realEndKey: F.fechaFinRealLiquidacion as unknown as keyof Row,
      },
      {
        id: '10_disenos',
        label: '10_Diseños',
        estStartKey: F.fechaInicioEstimadaDisenos as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaDisenos as unknown as keyof Row,
        realStartKey: F.fechaInicioRealDisenos as unknown as keyof Row,
        realEndKey: F.fechaFinRealDisenos as unknown as keyof Row,
      },
    ];

    const result: GanttItem[] = [];
    for (const ph of phases) {
      let minEst = Number.POSITIVE_INFINITY;
      let maxEst = Number.NEGATIVE_INFINITY;
      let minReal = Number.POSITIVE_INFINITY;
      let maxReal = Number.NEGATIVE_INFINITY;

      for (const r of rows) {
        const se = ph.estStartKey ? parseDate((r as Record<string, unknown>)[ph.estStartKey]) : undefined;
        const ee = ph.estEndKey ? parseDate((r as Record<string, unknown>)[ph.estEndKey]) : undefined;
        const sr = ph.realStartKey ? parseDate((r as Record<string, unknown>)[ph.realStartKey]) : undefined;
        const er = ph.realEndKey ? parseDate((r as Record<string, unknown>)[ph.realEndKey]) : undefined;

        if (se && ee && ee >= se) {
          const s = se.getTime();
          const e = ee.getTime();
          if (s < minEst) minEst = s;
          if (e > maxEst) maxEst = e;
        }
        if (sr && er && er >= sr) {
          const s = sr.getTime();
          const e = er.getTime();
          if (s < minReal) minReal = s;
          if (e > maxReal) maxReal = e;
        }
      }

      const hasEst = isFinite(minEst) && isFinite(maxEst) && maxEst >= minEst;
      const hasReal = isFinite(minReal) && isFinite(maxReal) && maxReal >= minReal;
      if (!hasEst && !hasReal) continue;

      result.push({
        id: ph.id,
        name: ph.label,
        startEst: hasEst ? new Date(minEst) : undefined,
        endEst: hasEst ? new Date(maxEst) : undefined,
        startReal: hasReal ? new Date(minReal) : undefined,
        endReal: hasReal ? new Date(maxReal) : undefined,
      });
      if (result.length >= limit) break;
    }

    return result;
  }, [rows, limit, mode]);

  const [minDate, maxDate] = useMemo<[Date, Date]>(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const it of items) {
      const c: Date[] = [];
      if (it.startEst) c.push(it.startEst);
      if (it.endEst) c.push(it.endEst);
      if (it.startReal) c.push(it.startReal);
      if (it.endReal) c.push(it.endReal);
      for (const d of c) {
        const t = d.getTime();
        if (t < min) min = t;
        if (t > max) max = t;
      }
    }
    if (!isFinite(min) || !isFinite(max) || min === max) {
      const now = new Date();
      const a = new Date(now.getFullYear(), 0, 1);
      const b = new Date(now.getFullYear() + 1, 11, 31);
      return [a, b];
    }
    
    // Asegurar que el mínimo sea desde 2024
    const year2024 = new Date('2024-01-01').getTime();
    const adjustedMin = Math.max(min, year2024);
    
    // Padding de 30 días a cada lado para mejor visualización
    const pad = 30 * 24 * 3600 * 1000;
    return [new Date(adjustedMin - pad), new Date(max + pad)];
  }, [items]);

  const totalMs = Math.max(1, maxDate.getTime() - minDate.getTime());

  const ticks = useMemo(() => {
    const out: { year: string; month: string; leftPct: number; isYearStart: boolean }[] = [];
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    const cur = new Date(start);
    
    while (cur <= end) {
      const leftPct = ((cur.getTime() - minDate.getTime()) / totalMs) * 100;
      const isYearStart = cur.getMonth() === 0; // Enero
      out.push({ 
        year: String(cur.getFullYear()),
        month: MONTHS_ES[cur.getMonth()],
        leftPct,
        isYearStart
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return out;
  }, [minDate, maxDate, totalMs]);

  if (items.length === 0) {
    return (
      <div className="gantt-empty">No hay datos suficientes para construir el diagrama de Gantt.</div>
    );
  }

  return (
    <div className="gantt-wrapper">
      <div className="gantt-scroll-container">
        <div className="gantt-header">
          <div className="gantt-header-years">
            {ticks.filter(t => t.isYearStart).map((t, idx) => (
              <div key={`year-${idx}`} className="gantt-year-tick" style={{ left: `${t.leftPct}%` }}>
                <span>{t.year}</span>
              </div>
            ))}
          </div>
          <div className="gantt-header-months">
            {ticks.map((t, idx) => (
              <div key={`month-${idx}`} className="gantt-month-tick" style={{ left: `${t.leftPct}%` }}>
                <span>{t.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="gantt-body">
        {items.map((it) => {
          const startEst = it.startEst ? clampDate(it.startEst, minDate, maxDate) : undefined;
          const endEst = it.endEst ? clampDate(it.endEst, minDate, maxDate) : undefined;
          const startReal = it.startReal ? clampDate(it.startReal, minDate, maxDate) : undefined;
          const endReal = it.endReal ? clampDate(it.endReal, minDate, maxDate) : undefined;

          const leftEst = startEst && endEst ? ((startEst.getTime() - minDate.getTime()) / totalMs) * 100 : undefined;
          const widthEst = startEst && endEst ? ((endEst.getTime() - startEst.getTime()) / totalMs) * 100 : undefined;
          const leftReal = startReal && endReal ? ((startReal.getTime() - minDate.getTime()) / totalMs) * 100 : undefined;
          const widthReal = startReal && endReal ? ((endReal.getTime() - startReal.getTime()) / totalMs) * 100 : undefined;

          return (
            <div key={it.id} className="gantt-row">
              <div className="gantt-label" title={it.name}>{it.name}</div>
              <div className="gantt-bars">
                {/* Barra estimada (fondo azul con transparencia) */}
                {leftEst !== undefined && widthEst !== undefined && widthEst > 0 && (
                  <div 
                    className="gantt-bar gantt-bar-est" 
                    style={{ 
                      left: `${leftEst}%`, 
                      width: `${widthEst}%`,
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.6) 0%, rgba(29, 78, 216, 0.6) 100%)',
                      border: '1px solid #1e40af',
                      zIndex: 1
                    }} 
                    title={`📋 ESTIMADO (Planificado)
🗓️ Inicio: ${startEst?.toLocaleDateString('es-CO')}
🏁 Fin: ${endEst?.toLocaleDateString('es-CO')}
⏱️ Duración: ${Math.ceil((endEst!.getTime() - startEst!.getTime()) / (1000 * 60 * 60 * 24))} días
📊 Estado: ${leftReal && widthReal && widthReal > 0 ? 'Con datos reales' : 'Solo planificado'}`}
                  />
                )}
                {/* Barra real (superpuesta verde con más transparencia) */}
                {leftReal !== undefined && widthReal !== undefined && widthReal > 0 && (
                  <div 
                    className="gantt-bar gantt-bar-real" 
                    style={{ 
                      left: `${leftReal}%`, 
                      width: `${widthReal}%`,
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.7) 0%, rgba(22, 163, 74, 0.7) 100%)',
                      border: '1px solid #16a34a',
                      zIndex: 2,
                      marginTop: '3px'
                    }} 
                    title={`📅 REAL (Ejecutado)
🗓️ Inicio: ${startReal?.toLocaleDateString('es-CO')}
🏁 Fin: ${endReal?.toLocaleDateString('es-CO')}
⏱️ Duración: ${Math.ceil((endReal!.getTime() - startReal!.getTime()) / (1000 * 60 * 60 * 24))} días`}
                  />
                )}
                {/* Solo estimada */}
                {leftEst !== undefined && widthEst !== undefined && widthEst > 0 && (!leftReal || !widthReal || widthReal <= 0) && (
                  <div 
                    className="gantt-bar gantt-bar-est-only" 
                    style={{ 
                      left: `${leftEst}%`, 
                      width: `${widthEst}%`,
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.7) 0%, rgba(29, 78, 216, 0.7) 100%)',
                      border: '1px solid #1e40af',
                      zIndex: 1
                    }} 
                    title={`📋 SOLO ESTIMADO (Planificado)
🗓️ Inicio: ${startEst?.toLocaleDateString('es-CO')}
🏁 Fin: ${endEst?.toLocaleDateString('es-CO')}
⏱️ Duración: ${Math.ceil((endEst!.getTime() - startEst!.getTime()) / (1000 * 60 * 60 * 24))} días
⚠️ Sin datos reales disponibles`}
                  />
                )}
                {/* Solo real */}
                {leftReal !== undefined && widthReal !== undefined && widthReal > 0 && (!leftEst || !widthEst || widthEst <= 0) && (
                  <div 
                    className="gantt-bar gantt-bar-real-only" 
                    style={{ 
                      left: `${leftReal}%`, 
                      width: `${widthReal}%`,
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.8) 0%, rgba(22, 163, 74, 0.8) 100%)',
                      border: '1px solid #16a34a',
                      zIndex: 1
                    }} 
                    title={`📅 SOLO REAL (Ejecutado)
🗓️ Inicio: ${startReal?.toLocaleDateString('es-CO')}
🏁 Fin: ${endReal?.toLocaleDateString('es-CO')}
⏱️ Duración: ${Math.ceil((endReal!.getTime() - startReal!.getTime()) / (1000 * 60 * 60 * 24))} días
ℹ️ Sin planificación previa`}
                  />
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
      <div className="gantt-legend">
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot est" /> 
            <span className="legend-text">Estimado</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot real" /> 
            <span className="legend-text">Real</span>
          </div>
        </div>
      </div>
      <style>{`
        .gantt-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .gantt-scroll-container {
          overflow-x: auto;
          overflow-y: hidden;
          border: 1px solid #E9ECEF;
          border-radius: 8px;
          background: white;
        }
        .gantt-scroll-container::-webkit-scrollbar {
          height: 12px;
        }
        .gantt-scroll-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 6px;
        }
        .gantt-scroll-container::-webkit-scrollbar-thumb {
          background: #79BC99;
          border-radius: 6px;
        }
        .gantt-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #4E8484;
        }
        .gantt-header {
          position: relative;
          height: 35px;
          border-bottom: 1px solid #E9ECEF;
          margin-left: 150px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          display: flex;
          flex-direction: column;
          min-width: 600px;
        }
        .gantt-header-years {
          position: relative;
          height: 18px;
          border-bottom: 1px solid #dee2e6;
        }
        .gantt-header-months {
          position: relative;
          height: 16px;
        }
        .gantt-year-tick {
          position: absolute;
          top: 2px;
          transform: translateX(-50%);
          font-size: 10px;
          color: white;
          white-space: nowrap;
          font-weight: 700;
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%);
          padding: 4px 12px;
          border-radius: 8px;
          border: 2px solid #3B8686;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
          min-width: 50px;
          text-align: center;
        }
        .gantt-month-tick {
          position: absolute;
          top: 2px;
          transform: translateX(-50%);
          font-size: 8px;
          color: #2C3E50;
          white-space: nowrap;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.98);
          padding: 2px 4px;
          border-radius: 3px;
          border: 1px solid #E9ECEF;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          min-width: 24px;
          text-align: center;
        }
        .gantt-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 40vh;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 6px;
          min-width: 600px;
        }
        .gantt-body::-webkit-scrollbar {
          width: 8px;
        }
        .gantt-body::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .gantt-body::-webkit-scrollbar-thumb {
          background: #79BC99;
          border-radius: 4px;
        }
        .gantt-body::-webkit-scrollbar-thumb:hover {
          background: #4E8484;
        }
        .gantt-row {
          display: grid;
          grid-template-columns: 150px 1fr;
          align-items: center;
          gap: 6px;
          min-height: 24px;
        }
        .gantt-label {
          font-size: 11px;
          color: #2C3E50;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 500;
          padding: 2px 6px;
          background: rgba(121, 188, 153, 0.1);
          border-radius: 4px;
          border: 1px solid rgba(121, 188, 153, 0.2);
        }
        .gantt-bars {
          position: relative;
          height: 20px;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border: 1px solid #79BC99;
          border-radius: 6px;
          overflow: hidden;
        }
        .gantt-bar {
          position: absolute;
          top: 2px;
          height: 16px;
          border-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }
        .gantt-bar:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .gantt-bar-est {
          background: rgba(25, 118, 210, 0.85); /* Azul estimado */
          border: 1px solid #1565c0;
        }
        .gantt-bar-real {
          background: rgba(39, 174, 96, 0.85); /* Verde real */
          border: 1px solid #27ae60;
        }
        .gantt-legend {
          display: flex;
          justify-content: center;
          font-size: 11px;
          color: #2C3E50;
          margin-top: 8px;
          padding: 8px 12px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 6px;
          border: 1px solid #E9ECEF;
        }
        .legend-items {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .legend-item { 
          display: flex; 
          align-items: center; 
          gap: 6px; 
        }
        .legend-text {
          font-weight: 500;
        }
        .legend-dot { 
          width: 12px; 
          height: 12px; 
          border-radius: 3px; 
          display: inline-block; 
          border: 1px solid;
        }
        .legend-dot.est { 
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.6) 0%, rgba(29, 78, 216, 0.6) 100%); 
          border-color: #1e40af; 
        }
        .legend-dot.real { 
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.7) 0%, rgba(22, 163, 74, 0.7) 100%); 
          border-color: #16a34a; 
        }
        .gantt-empty { padding: 20px; text-align: center; color: #6C757D; }

        /* Responsive design */
        @media (max-width: 1200px) {
          .gantt-header { 
            margin-left: 180px; 
            min-width: 700px;
          }
          .gantt-body { min-width: 700px; }
          .gantt-row { grid-template-columns: 180px 1fr; }
          .gantt-label { font-size: 12px; }
        }

        @media (max-width: 768px) {
          .gantt-header { 
            margin-left: 150px; 
            height: 45px;
            min-width: 600px;
          }
          .gantt-body { min-width: 600px; }
          .gantt-header-years { height: 20px; }
          .gantt-header-months { height: 20px; }
          .gantt-row { 
            grid-template-columns: 150px 1fr; 
            gap: 8px;
          }
          .gantt-label { 
            font-size: 11px; 
            padding: 3px 6px;
          }
          .gantt-year-tick { 
            font-size: 12px; 
            padding: 3px 8px;
            min-width: 40px;
          }
          .gantt-month-tick { 
            font-size: 9px; 
            padding: 1px 3px;
            min-width: 20px;
          }
          .gantt-bars { height: 24px; }
          .gantt-bar { height: 18px; }
        }

        @media (max-width: 480px) {
          .gantt-header { 
            margin-left: 120px; 
            height: 40px;
            min-width: 500px;
          }
          .gantt-body { min-width: 500px; }
          .gantt-header-years { height: 18px; }
          .gantt-header-months { height: 18px; }
          .gantt-row { 
            grid-template-columns: 120px 1fr; 
            gap: 6px;
            min-height: 28px;
          }
          .gantt-label { 
            font-size: 10px; 
            padding: 2px 4px;
          }
          .gantt-year-tick { 
            font-size: 11px; 
            padding: 2px 6px;
            min-width: 35px;
          }
          .gantt-month-tick { 
            font-size: 8px; 
            padding: 1px 2px;
            min-width: 18px;
          }
          .gantt-bars { height: 22px; }
          .gantt-bar { height: 16px; }
          .gantt-legend { 
            font-size: 11px; 
            gap: 12px;
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  );
}


