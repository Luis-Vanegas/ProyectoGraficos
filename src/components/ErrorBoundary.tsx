import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * ErrorBoundary - Componente para capturar errores de React
 * Muestra una interfaz amigable cuando ocurren errores inesperados
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualiza el state para mostrar la UI de error
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Puedes registrar el error en un servicio de logging
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Aquí podrías enviar el error a un servicio como Sentry
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Fallback personalizado si se proporciona
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error por defecto
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2 className="error-title">¡Oops! Algo salió mal</h2>
            <p className="error-description">
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </p>
            
            <div className="error-actions">
              <button 
                onClick={this.handleReload}
                className="error-button error-button-primary"
              >
                🔄 Recargar página
              </button>
              <button 
                onClick={this.handleGoHome}
                className="error-button error-button-secondary"
              >
                🏠 Ir al inicio
              </button>
            </div>

            {/* Mostrar detalles del error en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Detalles técnicos (solo en desarrollo)</summary>
                <div className="error-stack">
                  <h4>Error:</h4>
                  <pre>{this.state.error?.toString()}</pre>
                  
                  <h4>Stack Trace:</h4>
                  <pre>{this.state.error?.stack}</pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>

          <style>{`
            .error-boundary {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 20px;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            .error-content {
              background: white;
              border-radius: 20px;
              padding: 40px;
              max-width: 600px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              border: 2px solid #79BC99;
            }

            .error-icon {
              font-size: 4rem;
              margin-bottom: 20px;
            }

            .error-title {
              color: #2C3E50;
              font-size: 2rem;
              margin-bottom: 15px;
              font-weight: 700;
            }

            .error-description {
              color: #6C757D;
              font-size: 1.1rem;
              line-height: 1.6;
              margin-bottom: 30px;
            }

            .error-actions {
              display: flex;
              gap: 15px;
              justify-content: center;
              flex-wrap: wrap;
              margin-bottom: 30px;
            }

            .error-button {
              padding: 12px 24px;
              border-radius: 10px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              border: none;
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .error-button-primary {
              background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%);
              color: white;
            }

            .error-button-primary:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 20px rgba(121, 188, 153, 0.3);
            }

            .error-button-secondary {
              background: transparent;
              color: #79BC99;
              border: 2px solid #79BC99;
            }

            .error-button-secondary:hover {
              background: #79BC99;
              color: white;
              transform: translateY(-2px);
            }

            .error-details {
              text-align: left;
              margin-top: 20px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 10px;
              border: 1px solid #dee2e6;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 600;
              color: #495057;
              margin-bottom: 15px;
            }

            .error-stack {
              font-size: 0.9rem;
            }

            .error-stack h4 {
              color: #495057;
              margin: 15px 0 8px 0;
              font-size: 1rem;
            }

            .error-stack pre {
              background: #ffffff;
              border: 1px solid #dee2e6;
              border-radius: 5px;
              padding: 15px;
              overflow-x: auto;
              font-size: 0.8rem;
              line-height: 1.4;
              color: #dc3545;
            }

            /* Responsive */
            @media (max-width: 768px) {
              .error-content {
                padding: 30px 20px;
                margin: 10px;
              }

              .error-title {
                font-size: 1.5rem;
              }

              .error-description {
                font-size: 1rem;
              }

              .error-actions {
                flex-direction: column;
                align-items: center;
              }

              .error-button {
                width: 100%;
                max-width: 250px;
                justify-content: center;
              }
            }

            @media (max-width: 480px) {
              .error-content {
                padding: 25px 15px;
              }

              .error-icon {
                font-size: 3rem;
              }

              .error-title {
                font-size: 1.3rem;
              }

              .error-description {
                font-size: 0.95rem;
              }

              .error-button {
                padding: 10px 20px;
                font-size: 0.9rem;
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
