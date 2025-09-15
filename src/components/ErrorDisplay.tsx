import type { ErrorState } from '../hooks/useErrorHandler';

interface ErrorDisplayProps {
  error: ErrorState;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'banner' | 'card' | 'inline';
  className?: string;
}

/**
 * Componente para mostrar errores de manera elegante y consistente
 * Soporta diferentes variantes de visualización
 */
export default function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  variant = 'card',
  className = '' 
}: ErrorDisplayProps) {
  if (!error.hasError) {
    return null;
  }

  const getErrorIcon = () => {
    if (error.errorCode === '404') return '🔍';
    if (error.errorCode === '401' || error.errorCode === '403') return '🔒';
    if (error.errorCode === '500') return '⚙️';
    if (error.errorMessage.toLowerCase().includes('conexión')) return '📡';
    if (error.errorMessage.toLowerCase().includes('timeout')) return '⏱️';
    return '⚠️';
  };

  const getErrorColor = () => {
    if (error.errorCode === '404') return '#6c757d';
    if (error.errorCode === '401' || error.errorCode === '403') return '#fd7e14';
    if (error.errorCode === '500') return '#dc3545';
    return '#ffc107';
  };

  const baseClasses = `error-display error-display-${variant} ${className}`;

  return (
    <div className={baseClasses}>
      <div className="error-display-content">
        <div className="error-display-icon" style={{ color: getErrorColor() }}>
          {getErrorIcon()}
        </div>
        
        <div className="error-display-text">
          <div className="error-display-message">
            {error.errorMessage}
          </div>
          
          {error.errorCode && (
            <div className="error-display-code">
              Código: {error.errorCode}
            </div>
          )}
        </div>

        <div className="error-display-actions">
          {onRetry && (
            <button 
              onClick={onRetry}
              className="error-display-button error-display-button-primary"
            >
              🔄 Reintentar
            </button>
          )}
          
          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="error-display-button error-display-button-secondary"
            >
              ✕ Cerrar
            </button>
          )}
        </div>
      </div>

      <style>{`
        /* Estilos base */
        .error-display {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .error-display-content {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 20px;
        }

        .error-display-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .error-display-text {
          flex: 1;
          min-width: 0;
        }

        .error-display-message {
          color: #2C3E50;
          font-size: 1rem;
          line-height: 1.5;
          margin-bottom: 5px;
          font-weight: 500;
        }

        .error-display-code {
          color: #6C757D;
          font-size: 0.85rem;
          font-family: 'Courier New', monospace;
          background: rgba(108, 117, 125, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
        }

        .error-display-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }

        .error-display-button {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          white-space: nowrap;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .error-display-button-primary {
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%);
          color: white;
        }

        .error-display-button-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(121, 188, 153, 0.3);
        }

        .error-display-button-secondary {
          background: transparent;
          color: #6C757D;
          border: 1px solid #dee2e6;
        }

        .error-display-button-secondary:hover {
          background: #f8f9fa;
          color: #495057;
        }

        /* Variante Banner */
        .error-display-banner {
          background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
          border: 1px solid #ffeaa7;
          margin-bottom: 20px;
        }

        .error-display-banner .error-display-content {
          padding: 15px 20px;
        }

        .error-display-banner .error-display-actions {
          flex-direction: row;
        }

        /* Variante Card */
        .error-display-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border: 2px solid #ffc107;
          box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2);
          margin: 20px 0;
        }

        .error-display-card:hover {
          box-shadow: 0 6px 20px rgba(255, 193, 7, 0.3);
        }

        /* Variante Inline */
        .error-display-inline {
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 8px;
        }

        .error-display-inline .error-display-content {
          padding: 12px 15px;
        }

        .error-display-inline .error-display-icon {
          font-size: 1.2rem;
        }

        .error-display-inline .error-display-message {
          font-size: 0.9rem;
        }

        .error-display-inline .error-display-actions {
          flex-direction: row;
        }

        .error-display-inline .error-display-button {
          padding: 6px 10px;
          font-size: 0.8rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .error-display-content {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .error-display-actions {
            flex-direction: row;
            justify-content: center;
            flex-wrap: wrap;
          }

          .error-display-button {
            flex: 1;
            min-width: 120px;
          }

          .error-display-banner .error-display-content,
          .error-display-inline .error-display-content {
            flex-direction: row;
            align-items: flex-start;
          }
        }

        @media (max-width: 480px) {
          .error-display-content {
            padding: 15px;
            gap: 10px;
          }

          .error-display-message {
            font-size: 0.9rem;
          }

          .error-display-button {
            padding: 8px 10px;
            font-size: 0.8rem;
            min-width: 100px;
          }
        }

        /* Estados específicos por código de error */
        .error-display[data-error-code="404"] {
          border-color: #6c757d;
        }

        .error-display[data-error-code="401"],
        .error-display[data-error-code="403"] {
          border-color: #fd7e14;
        }

        .error-display[data-error-code="500"] {
          border-color: #dc3545;
        }

        /* Animación de entrada */
        @keyframes errorSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-display {
          animation: errorSlideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
