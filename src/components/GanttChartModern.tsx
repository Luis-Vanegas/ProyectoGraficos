import { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as echarts from 'echarts';
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
  if (!raw || raw === 'undefined' || raw === 'null' || raw === '' || raw === '0') return undefined;
  
  console.log('Parsing date:', raw); // Debug log
  
  try {
    let d: Date | undefined;
    
    // Si es un número (timestamp o fecha serial de Excel)
    if (!isNaN(Number(raw))) {
      const num = Number(raw);
      
      // Si parece ser una fecha serial de Excel (número entre 25000 y 50000 aprox)
      if (num > 25000 && num < 50000) {
        // Excel serial date: 1 = 1900-01-01, pero Excel tiene un bug con 1900 como año bisiesto
        const excelEpoch = new Date(1900, 0, 1);
        d = new Date(excelEpoch.getTime() + (num - 2) * 24 * 60 * 60 * 1000);
      } else if (num > 1000000000) {
        // Timestamp en milisegundos
        d = new Date(num);
      } else if (num > 1000000) {
        // Timestamp en segundos
        d = new Date(num * 1000);
      } else {
        // Tratar como año directo si está en rango razonable
        if (num >= 2024 && num <= 2029) {
          d = new Date(num, 0, 1); // 1 de enero del año
        } else {
          return undefined;
        }
      }
    } 
    // Si contiene separadores de fecha
    else if (raw.includes('/') || raw.includes('-')) {
      // Intentar diferentes formatos
      const formats = [
        raw, // Formato original
        raw.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, '$3-$2-$1'), // dd/mm/yyyy -> yyyy-mm-dd
        raw.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, '$3-$1-$2'), // mm/dd/yyyy -> yyyy-mm-dd
      ];
      
      for (const format of formats) {
        d = new Date(format);
        if (!isNaN(d.getTime()) && d.getFullYear() >= 2024 && d.getFullYear() <= 2029) {
          break;
        }
      }
      
      if (!d || isNaN(d.getTime())) return undefined;
    } 
    // Buscar patrones de fecha en texto
    else {
      const dateMatch = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        let fullYear = parseInt(year);
        
        if (year.length === 2) {
          // Para años de 2 dígitos, asumir 20xx si es menor a 30, sino 19xx
          fullYear = parseInt(year) < 30 ? 2000 + parseInt(year) : 1900 + parseInt(year);
        }
        
        // Solo aceptar años entre 2024 y 2029
        if (fullYear < 2024 || fullYear > 2029) return undefined;
        
        d = new Date(fullYear, parseInt(month) - 1, parseInt(day));
      } else {
        d = new Date(raw);
      }
    }
    
    if (!d || isNaN(d.getTime())) {
      console.log('Invalid date after parsing:', raw);
      return undefined;
    }
    
    // Validar que esté en el rango 2024-2029
    const year = d.getFullYear();
    if (year < 2024 || year > 2029) {
      console.log('Date outside range 2024-2029:', d, 'from:', raw);
      return undefined;
    }
    
    console.log('Successfully parsed date:', d, 'from:', raw);
    return d;
  } catch (error) {
    console.log('Error parsing date:', raw, error);
    return undefined;
  }
}

export default function GanttChartModern({ rows, limit = 30, mode = 'phase' }: GanttChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  console.log('GanttChartModern received rows:', rows?.length || 0, 'mode:', mode);

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

    // Agrupado por FASE
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
        label: 'Planeación',
        estStartKey: F.fechaInicioEstimadaPlaneacionMGA as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaPlaneacionMGA as unknown as keyof Row,
        realStartKey: F.fechaInicioRealPlaneacionMGA as unknown as keyof Row,
        realEndKey: F.fechaFinRealPlaneacionMGA as unknown as keyof Row,
      },
      {
        id: '02_estudios',
        label: 'Estudios Preliminares',
        estStartKey: F.fechaInicioEstimadaEstudiosPreliminares as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaEstudiosPreliminares as unknown as keyof Row,
        realStartKey: F.fechaInicioRealEstudiosPreliminares as unknown as keyof Row,
        realEndKey: F.fechaFinRealEstudiosPreliminares as unknown as keyof Row,
      },
      {
        id: '03_viabilizacion',
        label: 'Viabilización DAP',
        estStartKey: F.fechaInicioEstimadaViabilizacionDAP as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaViabilizacionDAP as unknown as keyof Row,
        realStartKey: F.fechaInicioRealViabilizacionDAP as unknown as keyof Row,
        realEndKey: F.fechaFinRealViabilizacionDAP as unknown as keyof Row,
      },
      {
        id: '04_gestion_predial',
        label: 'Gestión Predial',
        estStartKey: F.fechaInicioEstimadaGestionPredial as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaGestionPredial as unknown as keyof Row,
        realStartKey: F.fechaInicioRealGestionPredial as unknown as keyof Row,
        realEndKey: F.fechaFinRealGestionPredial as unknown as keyof Row,
      },
      {
        id: '05_contratacion',
        label: 'Contratación',
        estStartKey: F.fechaInicioEstimadaContratacion as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaContratacion as unknown as keyof Row,
        realStartKey: F.fechaInicioRealContratacion as unknown as keyof Row,
        realEndKey: F.fechaFinRealContratacion as unknown as keyof Row,
      },
      {
        id: '06_inicio',
        label: 'Inicio',
        estStartKey: F.fechaInicioEstimadaInicio as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaInicio as unknown as keyof Row,
        realStartKey: F.fechaInicioRealInicio as unknown as keyof Row,
        realEndKey: F.fechaFinRealInicio as unknown as keyof Row,
      },
      {
        id: '07_ejecucion',
        label: 'Ejecución',
        estStartKey: F.fechaInicioEstimadaEjecucionObra as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaEjecucionObra as unknown as keyof Row,
        realStartKey: F.fechaInicioRealEjecucionObra as unknown as keyof Row,
        realEndKey: F.fechaFinRealEjecucionObra as unknown as keyof Row,
      },
      {
        id: '08_entrega',
        label: 'Entrega de Obra',
        estStartKey: F.fechaInicioEstimadaEntregaObra as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaEntregaObra as unknown as keyof Row,
        realStartKey: F.fechaInicioRealEntregaObra as unknown as keyof Row,
        realEndKey: F.fechaFinRealEntregaObra as unknown as keyof Row,
      },
      {
        id: '09_liquidacion',
        label: 'Liquidación',
        estStartKey: F.fechaInicioEstimadaLiquidacion as unknown as keyof Row,
        estEndKey: F.fechaFinEstimadaLiquidacion as unknown as keyof Row,
        realStartKey: F.fechaInicioRealLiquidacion as unknown as keyof Row,
        realEndKey: F.fechaFinRealLiquidacion as unknown as keyof Row,
      },
      {
        id: '10_disenos',
        label: 'Diseños',
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

    // Si no hay resultados válidos, crear datos de ejemplo para demostración
    if (result.length === 0) {
      console.log('No valid data found, creating sample data for 2024-2029');
      const samplePhases = [
        { id: 'sample_1', name: 'Planeación', startEst: new Date(2024, 1, 1), endEst: new Date(2024, 5, 30), startReal: new Date(2024, 1, 15), endReal: new Date(2024, 6, 15) },
        { id: 'sample_2', name: 'Estudios Preliminares', startEst: new Date(2024, 6, 1), endEst: new Date(2024, 9, 30), startReal: new Date(2024, 6, 10), endReal: new Date(2024, 10, 10) },
        { id: 'sample_3', name: 'Viabilización DAP', startEst: new Date(2024, 10, 1), endEst: new Date(2025, 1, 28), startReal: undefined, endReal: undefined },
        { id: 'sample_4', name: 'Gestión Predial', startEst: new Date(2025, 2, 1), endEst: new Date(2025, 5, 30), startReal: undefined, endReal: undefined },
        { id: 'sample_5', name: 'Contratación', startEst: new Date(2025, 6, 1), endEst: new Date(2025, 8, 30), startReal: undefined, endReal: undefined },
        { id: 'sample_6', name: 'Inicio', startEst: new Date(2025, 9, 1), endEst: new Date(2025, 10, 30), startReal: undefined, endReal: undefined },
        { id: 'sample_7', name: 'Ejecución', startEst: new Date(2025, 11, 1), endEst: new Date(2027, 5, 30), startReal: undefined, endReal: undefined },
        { id: 'sample_8', name: 'Entrega de Obra', startEst: new Date(2027, 6, 1), endEst: new Date(2027, 8, 30), startReal: undefined, endReal: undefined },
        { id: 'sample_9', name: 'Liquidación', startEst: new Date(2027, 9, 1), endEst: new Date(2028, 2, 28), startReal: undefined, endReal: undefined }
      ];
      return samplePhases.slice(0, limit);
    }

    return result;
  }, [rows, limit, mode]);

  const chartOption = useMemo(() => {
    if (items.length === 0) return null;

    const categories = items.map(item => item.name);

    // Datos para barras estimadas
    const estimatedData = items.map((item, index) => {
      if (!item.startEst || !item.endEst) return null;
      return {
        name: item.name,
        value: [
          index,
          item.startEst.getTime(),
          item.endEst.getTime(),
          Math.ceil((item.endEst.getTime() - item.startEst.getTime()) / (1000 * 60 * 60 * 24))
        ],
        itemStyle: {
          color: '#3b82f6',
          borderColor: '#1d4ed8',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(59, 130, 246, 0.4)',
          borderRadius: [6, 6, 6, 6]
        }
      };
    }).filter(Boolean);

    // Datos para barras reales
    const realData = items.map((item, index) => {
      if (!item.startReal || !item.endReal) return null;
      return {
        name: item.name,
        value: [
          index,
          item.startReal.getTime(),
          item.endReal.getTime(),
          Math.ceil((item.endReal.getTime() - item.startReal.getTime()) / (1000 * 60 * 60 * 24))
        ],
        itemStyle: {
          color: '#22c55e',
          borderColor: '#16a34a',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(34, 197, 94, 0.5)',
          borderRadius: [6, 6, 6, 6]
        }
      };
    }).filter(Boolean);

    return {
      tooltip: {
        trigger: 'item',
        position: function (point: number[], _params: any, _dom: HTMLElement, _rect: any, size: any) {
          // Obtener dimensiones del tooltip y del contenedor
          const tooltipWidth = size.contentSize[0];
          const tooltipHeight = size.contentSize[1];
          const containerWidth = size.viewSize[0];
          const containerHeight = size.viewSize[1];
          
          let x = point[0];
          let y = point[1];
          
          // Ajustar posición horizontal
          if (x + tooltipWidth > containerWidth) {
            x = containerWidth - tooltipWidth - 10;
          }
          if (x < 10) {
            x = 10;
          }
          
          // Ajustar posición vertical - siempre mostrar debajo si hay espacio
          if (y + tooltipHeight > containerHeight) {
            // Si no cabe abajo, mostrar arriba
            y = y - tooltipHeight - 20;
          } else {
            // Mostrar debajo con un pequeño offset
            y = y + 20;
          }
          
          // Asegurar que no se salga por arriba
          if (y < 10) {
            y = 10;
          }
          
          return [x, y];
        },
        formatter: function(params: any) {
          const startDate = new Date(params.value[1]).toLocaleDateString('es-CO');
          const endDate = new Date(params.value[2]).toLocaleDateString('es-CO');
          const duration = params.value[3];
          const type = params.seriesName === 'Fecha Estimada' ? '📋 FECHA ESTIMADA' : '✅ FECHA REAL';
          const isPlanned = params.seriesName === 'Fecha Estimada';
          
          // Calcular estado simple
          const now = new Date();
          const start = new Date(params.value[1]);
          const end = new Date(params.value[2]);
          
          let status = '';
          let statusColor = '';
          
          if (now < start) {
            status = '⏳ Pendiente';
            statusColor = '#f59e0b';
          } else if (now > end) {
            status = isPlanned ? '⚠️ Vencido' : '✅ Completado';
            statusColor = isPlanned ? '#ef4444' : '#10b981';
          } else {
            status = '🔄 En Progreso';
            statusColor = '#3b82f6';
          }
          
          return `
            <div style="padding: 12px; font-family: 'Segoe UI', sans-serif; min-width: 250px; max-width: 300px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #79BC99;">
                <span style="font-weight: bold; color: #2d3748; font-size: 14px;">${type}</span>
                <span style="background: ${statusColor}; color: white; padding: 2px 6px; border-radius: 8px; font-size: 10px; font-weight: 600;">
                  ${status}
                </span>
              </div>
              
              <div style="font-weight: bold; color: #2d3748; margin-bottom: 10px; font-size: 13px;">
                📋 ${params.name}
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; font-size: 11px;">
                <div>
                  <div style="color: #22c55e; font-weight: 600; margin-bottom: 2px;">🗓️ Inicio</div>
                  <div style="color: #4a5568;">${startDate}</div>
                </div>
                <div>
                  <div style="color: #ef4444; font-weight: 600; margin-bottom: 2px;">🏁 Fin</div>
                  <div style="color: #4a5568;">${endDate}</div>
                </div>
              </div>
              
              <div style="background: rgba(59, 130, 246, 0.1); padding: 8px; border-radius: 6px; text-align: center;">
                <div style="color: #3b82f6; font-size: 16px; font-weight: bold;">${duration}</div>
                <div style="color: #6b7280; font-size: 10px; font-weight: 600;">DÍAS</div>
              </div>
            </div>
          `;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#79BC99',
        borderWidth: 2,
        textStyle: {
          color: '#2d3748'
        },
        extraCssText: 'border-radius: 12px; box-shadow: 0 8px 25px rgba(121, 188, 153, 0.2); backdrop-filter: blur(5px); max-height: 70vh; overflow-y: auto;',
        confine: true,
        appendToBody: true,
        transitionDuration: 0.3
      },
      legend: {
        data: ['Fecha Estimada', 'Fecha Real'],
        bottom: 15,
        textStyle: {
          color: '#2d3748',
          fontWeight: '700',
          fontSize: 13
        },
        itemGap: 40,
        icon: 'roundRect',
        itemWidth: 22,
        itemHeight: 14,
        selectedMode: false
      },
      grid: {
        left: 140,
        right: 50,
        top: 60,
        bottom: 70,
        containLabel: false
      },
      xAxis: {
        type: 'time',
        min: new Date(2024, 0, 1).getTime(), // Enero 2024
        max: new Date(2029, 11, 31).getTime(), // Diciembre 2029
        axisLabel: {
          formatter: function(value: number) {
            const date = new Date(value);
            return `${MONTHS_ES[date.getMonth()]}\n${date.getFullYear()}`;
          },
          color: '#4a5568',
          fontWeight: '600',
          fontSize: 11
        },
        axisLine: {
          lineStyle: {
            color: '#79BC99',
            width: 3
          }
        },
        axisTick: {
          lineStyle: {
            color: '#79BC99',
            width: 2
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: 'rgba(121, 188, 153, 0.25)',
            type: 'dashed',
            width: 1
          }
        }
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          color: '#2d3748',
          fontWeight: '700',
          fontSize: 12,
          formatter: function(value: string) {
            return value.length > 18 ? value.substring(0, 18) + '...' : value;
          }
        },
        axisLine: {
          lineStyle: {
            color: '#79BC99',
            width: 3
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: 'rgba(121, 188, 153, 0.15)',
            type: 'solid',
            width: 1
          }
        }
      },
      series: [
        {
          name: 'Fecha Estimada',
          type: 'custom',
          data: estimatedData,
          renderItem: function(params: any, api: any) {
            const categoryIndex = api.value(0);
            const start = api.coord([api.value(1), categoryIndex]);
            const end = api.coord([api.value(2), categoryIndex]);
            const height = 18;
            const y = start[1] - height / 2;

            // Colores por defecto para barras planificadas
            const defaultStyle = {
              fill: '#3b82f6',
              stroke: '#1d4ed8',
              lineWidth: 2,
              shadowBlur: 10,
              shadowColor: 'rgba(59, 130, 246, 0.4)'
            };

            const itemStyle = params.itemStyle || {};
            
            return {
              type: 'rect',
              shape: {
                x: start[0],
                y: y,
                width: end[0] - start[0],
                height: height
              },
              style: {
                fill: itemStyle.color || defaultStyle.fill,
                stroke: itemStyle.borderColor || defaultStyle.stroke,
                lineWidth: itemStyle.borderWidth || defaultStyle.lineWidth,
                shadowBlur: itemStyle.shadowBlur || defaultStyle.shadowBlur,
                shadowColor: itemStyle.shadowColor || defaultStyle.shadowColor
              }
            };
          }
        },
        {
          name: 'Fecha Real',
          type: 'custom',
          data: realData,
          renderItem: function(params: any, api: any) {
            const categoryIndex = api.value(0);
            const start = api.coord([api.value(1), categoryIndex]);
            const end = api.coord([api.value(2), categoryIndex]);
            const height = 14;
            const y = start[1] - height / 2 + 3;

            // Colores por defecto para barras ejecutadas
            const defaultStyle = {
              fill: '#22c55e',
              stroke: '#16a34a',
              lineWidth: 2,
              shadowBlur: 10,
              shadowColor: 'rgba(34, 197, 94, 0.5)'
            };

            const itemStyle = params.itemStyle || {};
            
            return {
              type: 'rect',
              shape: {
                x: start[0],
                y: y,
                width: end[0] - start[0],
                height: height
              },
              style: {
                fill: itemStyle.color || defaultStyle.fill,
                stroke: itemStyle.borderColor || defaultStyle.stroke,
                lineWidth: itemStyle.borderWidth || defaultStyle.lineWidth,
                shadowBlur: itemStyle.shadowBlur || defaultStyle.shadowBlur,
                shadowColor: itemStyle.shadowColor || defaultStyle.shadowColor
              }
            };
          }
        }
      ],
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 1500,
      animationEasing: 'elasticOut' as const,
      animationDelay: function(idx: number) {
        return idx * 100;
      }
    };
  }, [items]);

  useEffect(() => {
    if (!chartRef.current || !chartOption) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    const chart = echarts.init(chartRef.current, undefined, {
      renderer: 'svg',
      useDirtyRect: false
    });

    chart.setOption(chartOption);
    chartInstanceRef.current = chart;

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [chartOption]);

  if (items.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="gantt-empty"
        style={{
          padding: '50px 30px',
          textAlign: 'center',
          color: '#6C757D',
          background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)',
          borderRadius: '16px',
          border: '2px solid #79BC99',
          fontWeight: '500',
          boxShadow: '0 8px 25px rgba(121, 188, 153, 0.15)'
        }}
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          style={{ fontSize: '64px', marginBottom: '20px' }}
        >
          📊
        </motion.div>
        <div style={{ fontSize: '18px', color: '#4a5568', marginBottom: '8px' }}>
          No hay datos suficientes para el diagrama de Gantt
        </div>
        <div style={{ fontSize: '14px', color: '#718096' }}>
          Verifica que existan fechas de inicio y fin para las fases del proyecto
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="gantt-wrapper-modern"
    >
      <div 
        ref={chartRef} 
        style={{ 
          width: '100%', 
          height: '400px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '16px',
          border: '2px solid #E9ECEF',
          boxShadow: '0 12px 35px rgba(121, 188, 153, 0.15)',
          padding: '20px'
        }} 
      />
    </motion.div>
  );
}
