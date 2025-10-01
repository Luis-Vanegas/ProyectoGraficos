import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
// const DEFAULT_CHART_COLORS = {
//   series1: '#2E8B57', // Verde esmeralda
//   series2: '#FF6B35'  // Naranja coral
// };

export default function SimpleBarChart({
  title,
  data,
  seriesNames = ['Serie 1', 'Serie 2'],
  width = 800,
  height = 400
}: SimpleBarChartProps) {
  
  // Convertir datos al formato de Recharts
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      name: item.label,
      [seriesNames[0]]: item.value1,
      [seriesNames[1]]: item.value2
    }));
  }, [data, seriesNames]);

  // Si no hay datos, mostrar mensaje
  if (!chartData || chartData.length === 0) {
    return (
      <div className="recharts-container simple-chart-container">
        <div className="no-data-message">
          <h3>{title}</h3>
          <p>No hay datos disponibles para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recharts-container simple-chart-container" style={{ width, height }}>
      {/* Título del gráfico */}
      <div className="chart-title">
        <h3>{title}</h3>
      </div>

      {/* Gráfico profesional */}
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={450}>
          <BarChart 
            data={chartData}
            margin={{
              top: 20,
              right: 80,
              left: 80,
              bottom: 100,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(121, 188, 153, 0.3)" />
            <XAxis 
              dataKey="name"
              angle={-35}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 12, fill: '#2C3E50', fontWeight: '600' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#2C3E50' }}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString('es-CO')}`,
                name
              ]}
              labelFormatter={(label) => `Proyecto: ${label}`}
              labelStyle={{ 
                color: '#2C3E50', 
                fontWeight: 'bold',
                fontSize: '16px',
                marginBottom: '10px',
                borderBottom: '2px solid #79BC99',
                paddingBottom: '8px'
              }}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '3px solid #79BC99',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                padding: '15px',
                minWidth: '300px',
                fontSize: '14px',
                fontWeight: '600'
              }}
              itemStyle={{
                color: '#2C3E50',
                fontSize: '14px',
                fontWeight: '600',
                padding: '4px 0'
              }}
            />
            <Legend 
              verticalAlign="bottom"
              height={36}
              iconType="rect"
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '13px',
                fontWeight: '600'
              }}
            />
            <Bar 
              dataKey={seriesNames[0]}
              fill="#2E8B57"
              radius={[4, 4, 0, 0]}
              stroke="white"
              strokeWidth={1}
            />
            <Bar 
              dataKey={seriesNames[1]}
              fill="#FF6B35"
              radius={[4, 4, 0, 0]}
              stroke="white"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
        </div>

      <style>{`
        .simple-chart-container {
          position: relative;
          background: linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%);
          border-radius: 20px;
          border: 4px solid ${CORPORATE_COLORS.primary};
          box-shadow: 0 6px 20px rgba(121, 188, 153, 0.4);
          padding: 30px;
          box-sizing: border-box;
          overflow: visible;
          width: 100%;
          max-width: 1400px;
          height: 550px;
          min-height: 550px;
          margin: 0 auto;
        }


        .chart-title {
          text-align: center;
          margin-bottom: 15px;
          background: rgba(255, 255, 255, 0.95);
          padding: 8px 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(121, 188, 153, 0.3);
        }
        
        .chart-wrapper {
          width: 100%;
          height: 450px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          overflow-x: auto;
        }

        .chart-title h3 {
          margin: 0;
          color: ${CORPORATE_COLORS.accent};
          font-size: 1.1rem;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
          letter-spacing: 0.5px;
        }

        .custom-tooltip {
          background: rgba(255, 255, 255, 0.98);
          border: 2px solid ${CORPORATE_COLORS.primary};
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          transform: translateY(-5px);
          animation: tooltipFadeIn 0.3s ease-out;
        }

        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(-5px) scale(1);
          }
        }

        .tooltip-label {
          font-weight: 700;
          color: ${CORPORATE_COLORS.accent};
          margin: 0 0 8px 0;
          font-size: 14px;
        }

        .tooltip-entry {
          margin: 4px 0;
          font-weight: 600;
          font-size: 13px;
        }

        /* Estilos para la leyenda de Recharts */
        .recharts-legend-wrapper {
          padding-top: 20px !important;
        }

        .recharts-legend-item-text {
          color: ${CORPORATE_COLORS.dark} !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          transition: all 0.3s ease !important;
        }

        .recharts-legend-item {
          margin-right: 25px !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }

        .recharts-legend-item:hover {
          transform: translateY(-2px) !important;
        }

        .recharts-legend-item:hover .recharts-legend-item-text {
          color: ${CORPORATE_COLORS.accent} !important;
          font-weight: 700 !important;
        }

        /* Animaciones para las barras */
        .recharts-bar-rectangle {
          transition: all 0.3s ease;
        }

        .recharts-bar-rectangle:hover {
          filter: brightness(1.1) saturate(1.2);
          transform: scaleY(1.02);
        }

        /* Efectos de hover en el área del gráfico */
        .recharts-wrapper:hover {
          cursor: crosshair;
        }

        /* Responsive design */
        @media (max-width: 1400px) {
          .simple-chart-container {
            width: 95% !important;
            max-width: 1200px;
            padding: 25px;
          }
        }
        
        @media (max-width: 1024px) {
          .simple-chart-container {
            width: 100%;
            max-width: 1000px;
            padding: 20px;
            height: 500px;
            min-height: 500px;
          }
          
          .chart-wrapper {
            height: 400px;
          }
          
          .chart-title h3 {
            font-size: 1.1rem;
          }
        }

        @media (max-width: 768px) {
          .simple-chart-container {
            width: 100%;
            max-width: 100%;
            padding: 15px;
            height: 450px;
            min-height: 450px;
            margin: 0 10px;
          }
          
          .chart-wrapper {
            height: 350px;
          }
          
          .chart-title {
            padding: 6px 16px;
            margin-bottom: 10px;
          }
          
          .chart-title h3 {
            font-size: 0.95rem;
          }

          .recharts-legend-item-text {
            font-size: 11px !important;
          }

          .custom-tooltip {
            padding: 8px;
          }

          .tooltip-label {
            font-size: 11px;
          }

          .tooltip-entry {
            font-size: 10px;
          }
        }

        @media (max-width: 480px) {
          .simple-chart-container {
            width: 100%;
            max-width: 100%;
            padding: 10px;
            height: 400px;
            min-height: 400px;
            margin: 0 5px;
          }
          
          .chart-wrapper {
            height: 300px;
            padding: 10px;
          }
          
          .chart-title {
            padding: 4px 10px;
            margin-bottom: 8px;
          }
          
          .chart-title h3 {
            font-size: 0.85rem;
          }
          
          .recharts-legend-item-text {
            font-size: 10px !important;
          }
          
          .recharts-legend-item {
            margin-right: 12px !important;
          }
        }
        
        @media (max-width: 360px) {
          .simple-chart-container {
            width: 100%;
            padding: 10px;
            height: 350px;
            min-height: 350px;
            border-radius: 12px;
            border-width: 2px;
          }
          
          .chart-wrapper {
            height: 250px;
            padding: 8px;
          }
          
          .chart-title h3 {
            font-size: 0.8rem;
          }
          
          .recharts-legend-item-text {
            font-size: 9px !important;
          }
          
          .recharts-legend-item {
            margin-right: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
