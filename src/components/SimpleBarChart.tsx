import React, { useMemo } from 'react';

// Tipos para el gráfico
type ChartData = {
  label: string;
  value1: number;
  value2: number;
  color1?: string;
  color2?: string;
};

type SimpleBarChartProps = {
  title: string;
  data: ChartData[];
  seriesNames?: [string, string];
  width?: number;
  height?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
};

// Colores corporativos de la Alcaldía de Medellín
const CORPORATE_COLORS = {
  primary: '#79BC99',
  secondary: '#4E8484',
  accent: '#3B8686',
  light: '#D4E6F1',
  dark: '#2C3E50'
};

// Colores por defecto para las series del gráfico
const DEFAULT_CHART_COLORS = {
  series1: '#2E8B57', // Verde esmeralda
  series2: '#FF6B35'  // Naranja coral
};

export default function SimpleBarChart({
  title,
  data,
  seriesNames = ['Serie 1', 'Serie 2'],
  width = 800,
  height = 400,
  showLegend = true,
  formatValue = (value) => value.toLocaleString('es-CO')
}: SimpleBarChartProps) {
  
  // Calcular dimensiones responsive
  const [containerWidth, setContainerWidth] = React.useState(width);
  const [containerHeight, setContainerHeight] = React.useState(height);
  
  React.useEffect(() => {
    const updateDimensions = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 768) {
        setContainerWidth(Math.min(width, screenWidth - 40));
        setContainerHeight(Math.max(300, height - 100));
      } else if (screenWidth < 1024) {
        setContainerWidth(Math.min(width, screenWidth - 60));
        setContainerHeight(Math.max(350, height - 50));
      } else {
        setContainerWidth(width);
        setContainerHeight(height);
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [width, height]);
  
  // Cálculos para el gráfico
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(
      ...data.flatMap(d => [d.value1, d.value2])
    );

    const padding = { 
      top: containerHeight < 400 ? 50 : 60, 
      right: containerWidth < 600 ? 30 : 40, 
      bottom: containerHeight < 400 ? 60 : 80, 
      left: containerWidth < 600 ? 60 : 80 
    };
    const chartWidth = containerWidth - padding.left - padding.right;
    const chartHeight = containerHeight - padding.top - padding.bottom;
    
    // Calcular si necesitamos scroll horizontal
    const needsHorizontalScroll = data.length > 4;
    const minBarGroupWidth = 120; // Ancho mínimo por grupo de barras
    const calculatedSvgWidth = data.length * minBarGroupWidth;
    const svgWidth = needsHorizontalScroll ? 
      Math.max(containerWidth, calculatedSvgWidth) : 
      containerWidth;

    // Calcular ancho de barras más inteligente
    const minBarWidth = 25;
    const maxBarWidth = 35;
    const totalBars = data.length * 2; // Dos barras por categoría
    const availableWidth = svgWidth - padding.left - padding.right;
    const calculatedBarWidth = Math.max(minBarWidth, Math.min(maxBarWidth, availableWidth / (totalBars + data.length * 0.8)));
    const barWidth = calculatedBarWidth;
    const barSpacing = barWidth * 0.5;

    return {
      maxValue,
      padding,
      chartWidth,
      chartHeight,
      barWidth,
      barSpacing,
      needsHorizontalScroll,
      svgWidth,
      data: data.map((item, index) => {
        const groupWidth = barWidth * 2 + barSpacing;
        const effectiveChartWidth = svgWidth - padding.left - padding.right;
        const groupSpacing = Math.max(15, (effectiveChartWidth - (data.length * groupWidth)) / Math.max(1, data.length - 1));
        const x = padding.left + (index * (groupWidth + groupSpacing)) + barWidth / 2;
        
        return {
          ...item,
          x,
          height1: (item.value1 / maxValue) * chartHeight,
          height2: (item.value2 / maxValue) * chartHeight,
          y1: padding.top + chartHeight - (item.value1 / maxValue) * chartHeight,
          y2: padding.top + chartHeight - (item.value2 / maxValue) * chartHeight,
          color1: item.color1 || DEFAULT_CHART_COLORS.series1,
          color2: item.color2 || DEFAULT_CHART_COLORS.series2
        };
      })
    };
  }, [data, containerWidth, containerHeight]);

  if (!chartData || data.length === 0) {
    return (
      <div className="simple-chart-container" style={{ width, height }}>
        <div className="no-data-message">
          <h3>{title}</h3>
          <p>No hay datos disponibles para mostrar</p>
        </div>
        <style>{`
          .simple-chart-container {
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
            border-radius: 15px;
            border: 1px solid ${CORPORATE_COLORS.primary};
            box-shadow: 0 4px 15px rgba(121, 188, 153, 0.1);
          }
          .no-data-message {
            text-align: center;
            color: ${CORPORATE_COLORS.dark};
          }
          .no-data-message h3 {
            margin: 0 0 10px 0;
            color: ${CORPORATE_COLORS.accent};
            font-size: 1.2rem;
          }
          .no-data-message p {
            margin: 0;
            color: ${CORPORATE_COLORS.dark};
            font-style: italic;
          }
        `}</style>
      </div>
    );
  }

  const { maxValue, padding, chartHeight, barWidth, barSpacing } = chartData;

  // Generar escalas del eje Y
  const yTicks = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const value = (maxValue / tickCount) * i;
    const y = padding.top + chartHeight - (i / tickCount) * chartHeight;
    yTicks.push({ value, y });
  }

  // Usar los valores calculados en chartData
  const needsHorizontalScroll = chartData?.needsHorizontalScroll || false;
  const svgWidth = chartData?.svgWidth || containerWidth;

  return (
    <div className="simple-chart-container" style={{ width: containerWidth, height: containerHeight }}>
      <div className="chart-scroll-container" style={{ width: '100%', height: '100%', overflowX: needsHorizontalScroll ? 'auto' : 'hidden' }}>
        <svg width={svgWidth} height={containerHeight} className="chart-svg" style={{ minWidth: svgWidth }}>
        {/* Fondo del gráfico */}
        <rect
          x={padding.left}
          y={padding.top}
          width={svgWidth - padding.left - padding.right}
          height={chartHeight}
          fill="rgba(255, 255, 255, 0.1)"
          stroke={CORPORATE_COLORS.primary}
          strokeWidth="1"
          rx="4"
        />

        {/* Líneas de cuadrícula horizontales */}
        {yTicks.map((tick, index) => (
          <g key={index}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={padding.left + (svgWidth - padding.left - padding.right)}
              y2={tick.y}
              stroke="rgba(121, 188, 153, 0.2)"
              strokeWidth="1"
            />
            <text
              x={padding.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="12"
              fill={CORPORATE_COLORS.dark}
            >
              {formatValue(tick.value)}
            </text>
          </g>
        ))}

        {/* Barras del gráfico */}
        {chartData.data.map((item, index) => (
          <g key={index}>
            {/* Barra 1 */}
            <rect
              x={item.x - barWidth / 2}
              y={item.y1}
              width={barWidth}
              height={item.height1}
              fill={item.color1}
              stroke="white"
              strokeWidth="1"
              rx="2"
            />
            
            {/* Barra 2 */}
            <rect
              x={item.x + barWidth / 2 + barSpacing}
              y={item.y2}
              width={barWidth}
              height={item.height2}
              fill={item.color2}
              stroke="white"
              strokeWidth="1"
              rx="2"
            />

            {/* Etiquetas de valores en las barras */}
            {item.value1 > 0 && (
              <text
                x={item.x}
                y={item.y1 - 5}
                textAnchor="middle"
                fontSize="10"
                fill={CORPORATE_COLORS.dark}
                fontWeight="600"
              >
                {formatValue(item.value1)}
              </text>
            )}
            
            {item.value2 > 0 && (
              <text
                x={item.x + barWidth + barSpacing}
                y={item.y2 - 5}
                textAnchor="middle"
                fontSize="10"
                fill={CORPORATE_COLORS.dark}
                fontWeight="600"
              >
                {formatValue(item.value2)}
              </text>
            )}

            {/* Etiquetas del eje X */}
            <text
              x={item.x + barWidth / 2}
              y={padding.top + chartHeight + 25}
              textAnchor="middle"
              fontSize={containerWidth < 600 ? "9" : "10"}
              fill={CORPORATE_COLORS.dark}
              transform={`rotate(-30, ${item.x + barWidth / 2}, ${padding.top + chartHeight + 25})`}
            >
              {item.label}
            </text>
          </g>
        ))}

        {/* Ejes */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + (svgWidth - padding.left - padding.right)}
          y2={padding.top + chartHeight}
          stroke={CORPORATE_COLORS.dark}
          strokeWidth="2"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke={CORPORATE_COLORS.dark}
          strokeWidth="2"
        />
      </svg>
      </div>

      {/* Título del gráfico */}
      <div className="chart-title">
        <h3>{title}</h3>
        {needsHorizontalScroll && (
          <div className="scroll-indicator">
            <span className="scroll-icon">↔️</span>
            <span className="scroll-text">Desliza para ver más datos ({data.length} proyectos)</span>
          </div>
        )}
      </div>

      {/* Leyenda */}
      {showLegend && (
        <div className="chart-legend">
          <div className="legend-item">
            <div 
              className="legend-color" 
              style={{ backgroundColor: DEFAULT_CHART_COLORS.series1 }}
            />
            <span>{seriesNames[0]}</span>
          </div>
          <div className="legend-item">
            <div 
              className="legend-color" 
              style={{ backgroundColor: DEFAULT_CHART_COLORS.series2 }}
            />
            <span>{seriesNames[1]}</span>
          </div>
        </div>
      )}

      <style>{`
        .simple-chart-container {
          position: relative;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 15px;
          border: 1px solid ${CORPORATE_COLORS.primary};
          box-shadow: 0 4px 15px rgba(121, 188, 153, 0.1);
          padding: 15px;
          box-sizing: border-box;
          overflow: hidden;
          width: 100%;
          max-width: 100%;
        }

        .chart-scroll-container {
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
          scrollbar-color: ${CORPORATE_COLORS.primary} ${CORPORATE_COLORS.light};
          scroll-behavior: smooth;
        }

        .chart-scroll-container::-webkit-scrollbar {
          height: 12px;
        }

        .chart-scroll-container::-webkit-scrollbar-track {
          background: ${CORPORATE_COLORS.light};
          border-radius: 6px;
          margin: 0 10px;
        }

        .chart-scroll-container::-webkit-scrollbar-thumb {
          background: ${CORPORATE_COLORS.primary};
          border-radius: 6px;
          border: 2px solid ${CORPORATE_COLORS.light};
        }

        .chart-scroll-container::-webkit-scrollbar-thumb:hover {
          background: ${CORPORATE_COLORS.secondary};
        }

        .chart-scroll-container::-webkit-scrollbar-thumb:active {
          background: ${CORPORATE_COLORS.accent};
        }

        .chart-svg {
          display: block;
          margin: 0;
          width: 100%;
          height: 100%;
          min-width: 100%;
        }

        .chart-title {
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          z-index: 10;
        }

        .chart-title h3 {
          margin: 0;
          color: ${CORPORATE_COLORS.accent};
          font-size: 1.1rem;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
        }

        .scroll-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding: 6px 12px;
          background: linear-gradient(135deg, rgba(121, 188, 153, 0.15) 0%, rgba(78, 132, 132, 0.15) 100%);
          border: 2px solid ${CORPORATE_COLORS.primary};
          border-radius: 15px;
          font-size: 0.8rem;
          color: ${CORPORATE_COLORS.accent};
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(121, 188, 153, 0.2);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .scroll-icon {
          font-size: 0.9rem;
        }

        .scroll-text {
          white-space: nowrap;
        }

        .chart-legend {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 12px;
          z-index: 10;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: ${CORPORATE_COLORS.dark};
          background: rgba(255, 255, 255, 0.9);
          padding: 4px 8px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          border: 1px solid white;
        }

        /* Responsive design */
        @media (max-width: 1024px) {
          .simple-chart-container {
            padding: 12px;
          }
          
          .chart-title h3 {
            font-size: 1rem;
          }
          
          .chart-legend {
            gap: 10px;
          }
          
          .legend-item {
            font-size: 11px;
            padding: 3px 6px;
          }
        }

        @media (max-width: 768px) {
          .simple-chart-container {
            padding: 10px;
          }
          
          .chart-title h3 {
            font-size: 0.95rem;
          }
          
          .chart-legend {
            position: static;
            justify-content: center;
            margin-top: 8px;
            flex-wrap: wrap;
          }
          
          .legend-item {
            font-size: 10px;
            padding: 2px 5px;
          }
        }

        @media (max-width: 480px) {
          .simple-chart-container {
            padding: 8px;
          }
          
          .chart-title h3 {
            font-size: 0.9rem;
          }
          
          .legend-item {
            font-size: 9px;
            padding: 2px 4px;
          }
          
          .legend-color {
            width: 10px;
            height: 10px;
          }
        }
      `}</style>
    </div>
  );
}
