
interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'kpi' | 'table' | 'map' | 'chart' | 'button' | 'avatar' | 'custom';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Componente de Loading Skeleton para mostrar estados de carga elegantes
 * Soporta diferentes variantes para diferentes tipos de contenido
 */
export default function LoadingSkeleton({
  variant = 'text',
  width = '100%',
  height = '20px',
  lines = 1,
  className = '',
  animate = true
}: LoadingSkeletonProps) {
  const baseClasses = `loading-skeleton ${animate ? 'loading-skeleton-animate' : ''} ${className}`;

  // Renderizado específico por variante
  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return (
          <div className={baseClasses}>
            {Array.from({ length: lines }, (_, index) => (
              <div
                key={index}
                className="loading-skeleton-line"
                style={{
                  width: index === lines - 1 && lines > 1 ? '75%' : width,
                  height,
                  marginBottom: index < lines - 1 ? '8px' : '0'
                }}
              />
            ))}
          </div>
        );

      case 'card':
        return (
          <div className={`${baseClasses} loading-skeleton-card`}>
            <div className="loading-skeleton-card-header" />
            <div className="loading-skeleton-card-content">
              <div className="loading-skeleton-line" style={{ width: '100%', height: '16px', marginBottom: '8px' }} />
              <div className="loading-skeleton-line" style={{ width: '80%', height: '16px', marginBottom: '8px' }} />
              <div className="loading-skeleton-line" style={{ width: '60%', height: '16px' }} />
            </div>
          </div>
        );

      case 'kpi':
        return (
          <div className={`${baseClasses} loading-skeleton-kpi`}>
            <div className="loading-skeleton-kpi-label" />
            <div className="loading-skeleton-kpi-value" />
            <div className="loading-skeleton-kpi-subtitle" />
          </div>
        );

      case 'table':
        return (
          <div className={`${baseClasses} loading-skeleton-table`}>
            <div className="loading-skeleton-table-header">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="loading-skeleton-table-header-cell" />
              ))}
            </div>
            {Array.from({ length: 5 }, (_, rowIndex) => (
              <div key={rowIndex} className="loading-skeleton-table-row">
                {Array.from({ length: 4 }, (_, cellIndex) => (
                  <div key={cellIndex} className="loading-skeleton-table-cell" />
                ))}
              </div>
            ))}
          </div>
        );

      case 'map':
        return (
          <div className={`${baseClasses} loading-skeleton-map`} style={{ width, height }}>
            <div className="loading-skeleton-map-overlay">
              <div className="loading-skeleton-map-controls" />
              <div className="loading-skeleton-map-legend" />
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className={`${baseClasses} loading-skeleton-chart`} style={{ width, height }}>
            <div className="loading-skeleton-chart-title" />
            <div className="loading-skeleton-chart-content">
              {Array.from({ length: 6 }, (_, index) => (
                <div 
                  key={index} 
                  className="loading-skeleton-chart-bar"
                  style={{ height: `${Math.random() * 60 + 20}%` }}
                />
              ))}
            </div>
          </div>
        );

      case 'button':
        return (
          <div 
            className={`${baseClasses} loading-skeleton-button`}
            style={{ width, height }}
          />
        );

      case 'avatar':
        return (
          <div 
            className={`${baseClasses} loading-skeleton-avatar`}
            style={{ width, height }}
          />
        );

      case 'custom':
      default:
        return (
          <div 
            className={baseClasses}
            style={{ width, height }}
          />
        );
    }
  };

  return (
    <>
      {renderSkeleton()}
      <style>{`
        /* Estilos base */
        .loading-skeleton {
          display: block;
          position: relative;
          overflow: hidden;
        }

        .loading-skeleton-line,
        .loading-skeleton-card,
        .loading-skeleton-kpi,
        .loading-skeleton-table,
        .loading-skeleton-map,
        .loading-skeleton-chart,
        .loading-skeleton-button,
        .loading-skeleton-avatar {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 8px;
        }

        /* Animación de shimmer */
        .loading-skeleton-animate .loading-skeleton-line,
        .loading-skeleton-animate .loading-skeleton-card,
        .loading-skeleton-animate .loading-skeleton-kpi,
        .loading-skeleton-animate .loading-skeleton-table,
        .loading-skeleton-animate .loading-skeleton-map,
        .loading-skeleton-animate .loading-skeleton-chart,
        .loading-skeleton-animate .loading-skeleton-button,
        .loading-skeleton-animate .loading-skeleton-avatar,
        .loading-skeleton-animate .loading-skeleton-card-header,
        .loading-skeleton-animate .loading-skeleton-kpi-label,
        .loading-skeleton-animate .loading-skeleton-kpi-value,
        .loading-skeleton-animate .loading-skeleton-kpi-subtitle,
        .loading-skeleton-animate .loading-skeleton-table-header-cell,
        .loading-skeleton-animate .loading-skeleton-table-cell,
        .loading-skeleton-animate .loading-skeleton-chart-title,
        .loading-skeleton-animate .loading-skeleton-chart-bar {
          animation: shimmer 2s infinite linear;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* Variante Card */
        .loading-skeleton-card {
          padding: 20px;
          border-radius: 15px;
          background: #f8f9fa;
        }

        .loading-skeleton-card-header {
          width: 100%;
          height: 24px;
          margin-bottom: 15px;
          background: linear-gradient(90deg, #e9ecef 25%, #dee2e6 50%, #e9ecef 75%);
          background-size: 200% 100%;
          border-radius: 6px;
        }

        .loading-skeleton-card-content {
          display: flex;
          flex-direction: column;
        }

        /* Variante KPI */
        .loading-skeleton-kpi {
          padding: 25px;
          border-radius: 15px;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .loading-skeleton-kpi-label {
          width: 70%;
          height: 14px;
          background: linear-gradient(90deg, #e9ecef 25%, #dee2e6 50%, #e9ecef 75%);
          background-size: 200% 100%;
          border-radius: 4px;
        }

        .loading-skeleton-kpi-value {
          width: 60%;
          height: 32px;
          background: linear-gradient(90deg, #e9ecef 25%, #dee2e6 50%, #e9ecef 75%);
          background-size: 200% 100%;
          border-radius: 6px;
        }

        .loading-skeleton-kpi-subtitle {
          width: 50%;
          height: 12px;
          background: linear-gradient(90deg, #e9ecef 25%, #dee2e6 50%, #e9ecef 75%);
          background-size: 200% 100%;
          border-radius: 4px;
        }

        /* Variante Table */
        .loading-skeleton-table {
          border-radius: 12px;
          overflow: hidden;
          background: #f8f9fa;
        }

        .loading-skeleton-table-header {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          padding: 15px;
          background: #e9ecef;
        }

        .loading-skeleton-table-header-cell {
          height: 16px;
          background: linear-gradient(90deg, #dee2e6 25%, #ced4da 50%, #dee2e6 75%);
          background-size: 200% 100%;
          border-radius: 4px;
        }

        .loading-skeleton-table-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          padding: 12px 15px;
          border-bottom: 1px solid #e9ecef;
        }

        .loading-skeleton-table-row:last-child {
          border-bottom: none;
        }

        .loading-skeleton-table-cell {
          height: 14px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 4px;
        }

        /* Variante Map */
        .loading-skeleton-map {
          position: relative;
          border-radius: 15px;
          background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
          min-height: 400px;
        }

        .loading-skeleton-map-overlay {
          position: absolute;
          top: 15px;
          right: 15px;
          left: 15px;
          display: flex;
          justify-content: space-between;
        }

        .loading-skeleton-map-controls {
          width: 120px;
          height: 40px;
          background: linear-gradient(90deg, #dee2e6 25%, #ced4da 50%, #dee2e6 75%);
          background-size: 200% 100%;
          border-radius: 8px;
        }

        .loading-skeleton-map-legend {
          width: 200px;
          height: 100px;
          background: linear-gradient(90deg, #dee2e6 25%, #ced4da 50%, #dee2e6 75%);
          background-size: 200% 100%;
          border-radius: 8px;
        }

        /* Variante Chart */
        .loading-skeleton-chart {
          padding: 20px;
          border-radius: 15px;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
          min-height: 300px;
        }

        .loading-skeleton-chart-title {
          width: 40%;
          height: 20px;
          margin-bottom: 20px;
          background: linear-gradient(90deg, #e9ecef 25%, #dee2e6 50%, #e9ecef 75%);
          background-size: 200% 100%;
          border-radius: 6px;
        }

        .loading-skeleton-chart-content {
          flex: 1;
          display: flex;
          align-items: end;
          justify-content: space-around;
          gap: 10px;
          padding-top: 20px;
        }

        .loading-skeleton-chart-bar {
          flex: 1;
          min-height: 40px;
          background: linear-gradient(90deg, #e9ecef 25%, #dee2e6 50%, #e9ecef 75%);
          background-size: 200% 100%;
          border-radius: 4px 4px 0 0;
        }

        /* Variante Button */
        .loading-skeleton-button {
          min-width: 100px;
          height: 40px;
          border-radius: 8px;
        }

        /* Variante Avatar */
        .loading-skeleton-avatar {
          border-radius: 50%;
          width: 40px;
          height: 40px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .loading-skeleton-card,
          .loading-skeleton-kpi {
            padding: 15px;
          }

          .loading-skeleton-table-header,
          .loading-skeleton-table-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            padding: 10px;
          }

          .loading-skeleton-chart {
            padding: 15px;
          }

          .loading-skeleton-map {
            min-height: 300px;
          }

          .loading-skeleton-map-overlay {
            flex-direction: column;
            gap: 10px;
          }

          .loading-skeleton-map-controls,
          .loading-skeleton-map-legend {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .loading-skeleton-card,
          .loading-skeleton-kpi {
            padding: 12px;
          }

          .loading-skeleton-table-header,
          .loading-skeleton-table-row {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 8px;
          }

          .loading-skeleton-chart {
            padding: 12px;
          }

          .loading-skeleton-map {
            min-height: 250px;
          }
        }

        /* Tema oscuro (opcional) */
        @media (prefers-color-scheme: dark) {
          .loading-skeleton-line,
          .loading-skeleton-card,
          .loading-skeleton-kpi,
          .loading-skeleton-table,
          .loading-skeleton-map,
          .loading-skeleton-chart,
          .loading-skeleton-button,
          .loading-skeleton-avatar {
            background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
            background-size: 200% 100%;
          }

          .loading-skeleton-card,
          .loading-skeleton-kpi,
          .loading-skeleton-table,
          .loading-skeleton-chart {
            background: #1a1a1a;
          }

          .loading-skeleton-table-header {
            background: #2a2a2a;
          }

          .loading-skeleton-table-row {
            border-bottom-color: #3a3a3a;
          }
        }
      `}</style>
    </>
  );
}

/**
 * Componentes de conveniencia para casos comunes
 */
export const TextSkeleton = (props: Omit<LoadingSkeletonProps, 'variant'>) => (
  <LoadingSkeleton {...props} variant="text" />
);

export const CardSkeleton = (props: Omit<LoadingSkeletonProps, 'variant'>) => (
  <LoadingSkeleton {...props} variant="card" />
);

export const KpiSkeleton = (props: Omit<LoadingSkeletonProps, 'variant'>) => (
  <LoadingSkeleton {...props} variant="kpi" />
);

export const TableSkeleton = (props: Omit<LoadingSkeletonProps, 'variant'>) => (
  <LoadingSkeleton {...props} variant="table" />
);

export const MapSkeleton = (props: Omit<LoadingSkeletonProps, 'variant'>) => (
  <LoadingSkeleton {...props} variant="map" />
);

export const ChartSkeleton = (props: Omit<LoadingSkeletonProps, 'variant'>) => (
  <LoadingSkeleton {...props} variant="chart" />
);

export const ButtonSkeleton = (props: Omit<LoadingSkeletonProps, 'variant'>) => (
  <LoadingSkeleton {...props} variant="button" />
);

export const AvatarSkeleton = (props: Omit<LoadingSkeletonProps, 'variant'>) => (
  <LoadingSkeleton {...props} variant="avatar" />
);
