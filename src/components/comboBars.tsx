import { EChart } from '@kbox-labs/react-echarts';
import type { EChartsOption } from 'echarts';
import { useEffect, useRef, useState } from 'react';

export default function ComboBars({
  title, dataset, dim, v1, v2
}:{
  title: string;
  dataset: Array<Array<string|number>>; // [ [dim,v1,v2], ... ] con headers en la primera fila
  dim: string; v1: string; v2: string;
}) {
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Verificar que el contenedor tenga dimensiones antes de renderizar ECharts
  useEffect(() => {
    const checkDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setIsReady(true);
        } else {
          // Si no tiene dimensiones, esperar un poco y volver a verificar
          setTimeout(checkDimensions, 100);
        }
      }
    };

    checkDimensions();
  }, [dataset]); // Re-verificar cuando cambien los datos
  const option: EChartsOption = {
    color: ['#2aa198', '#268bd2'],
    title: { 
      text: title,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
      },
      left: 'center',
      top: 10
    },
    legend: { 
      top: 40,
      textStyle: {
        fontSize: 12
      }
    },
    tooltip: { 
      trigger: 'axis',
      textStyle: {
        fontSize: 12
      }
    },
    dataset: { source: dataset },
    xAxis: { 
      type: 'category', 
      axisLabel: { 
        rotate: 25,
        fontSize: 11,
        interval: 0
      },
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: { 
      type: 'value',
      axisLabel: {
        fontSize: 11
      }
    },
    grid: {
      top: 80,
      left: 60,
      right: 40,
      bottom: 60
    },
    series: [
      { 
        type: 'bar', 
        name: v1, 
        encode: { x: dim, y: v1 },
        barWidth: '60%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        }
      },
      { 
        type: 'bar', 
        name: v2, 
        encode: { x: dim, y: v2 },
        barWidth: '60%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };

  // ⬅️ ocupa 100% del alto del contenedor .chart
  return (
    <div className="combo-chart-container">
      <div 
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      >
        {isReady && (
          <EChart 
            option={option} 
            style={{ width: '100%', height: '100%' }} 
            className="combo-chart"
          />
        )}
      </div>
      
      {/* Estilos CSS con responsive design */}
      <style>{`
        .combo-chart-container {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .combo-chart {
          width: 100% !important;
          height: 100% !important;
        }

        /* ========================================================================
            DISEÑO RESPONSIVE COMPLETO
        ======================================================================== */
        
        @media (max-width: 1200px) {
          .combo-chart-container {
            min-height: 350px;
          }
        }
        
        @media (max-width: 768px) {
          .combo-chart-container {
            min-height: 300px;
          }
        }
        
        @media (max-width: 480px) {
          .combo-chart-container {
            min-height: 250px;
          }
        }
        
        @media (max-width: 360px) {
          .combo-chart-container {
            min-height: 200px;
          }
        }
        
        /* Ajustes específicos para el gráfico en dispositivos móviles */
        @media (max-width: 768px) {
          .combo-chart-container .echarts-for-react {
            font-size: 10px !important;
          }
        }
        
        @media (max-width: 480px) {
          .combo-chart-container .echarts-for-react {
            font-size: 9px !important;
          }
        }
      `}</style>
    </div>
  );
}
