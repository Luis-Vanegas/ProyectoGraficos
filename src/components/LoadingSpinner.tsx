
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'white';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

/**
 * Componente de Loading Spinner con el branding de la Alcaldía
 * Incluye diferentes tamaños, variantes y opciones de visualización
 */
export default function LoadingSpinner({
  size = 'medium',
  variant = 'primary',
  text,
  fullScreen = false,
  overlay = false,
  className = ''
}: LoadingSpinnerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'loading-spinner-small';
      case 'large':
        return 'loading-spinner-large';
      default:
        return 'loading-spinner-medium';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'loading-spinner-secondary';
      case 'white':
        return 'loading-spinner-white';
      default:
        return 'loading-spinner-primary';
    }
  };

  const containerClasses = [
    'loading-spinner-container',
    fullScreen ? 'loading-spinner-fullscreen' : '',
    overlay ? 'loading-spinner-overlay' : '',
    className
  ].filter(Boolean).join(' ');

  const spinnerClasses = [
    'loading-spinner',
    getSizeClasses(),
    getVariantClasses()
  ].join(' ');

  return (
    <div className={containerClasses}>
      <div className="loading-spinner-content">
        {/* Logo de la Alcaldía como spinner */}
        <div className={spinnerClasses}>
          <div className="loading-spinner-ring loading-spinner-ring-1"></div>
          <div className="loading-spinner-ring loading-spinner-ring-2"></div>
          <div className="loading-spinner-ring loading-spinner-ring-3"></div>
          <div className="loading-spinner-center">
            <div className="loading-spinner-logo">🏛️</div>
          </div>
        </div>

        {/* Texto de carga */}
        {text && (
          <div className="loading-spinner-text">
            {text}
          </div>
        )}

        {/* Puntos animados */}
        <div className="loading-spinner-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <style>{`
        /* Contenedor base */
        .loading-spinner-container {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .loading-spinner-fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 100%);
          z-index: 9999;
        }

        .loading-spinner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(2px);
          z-index: 1000;
        }

        .loading-spinner-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        /* Spinner principal */
        .loading-spinner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner-ring {
          position: absolute;
          border-radius: 50%;
          border-style: solid;
          border-color: transparent;
          animation: spin 2s linear infinite;
        }

        .loading-spinner-ring-1 {
          animation-duration: 2s;
          animation-delay: 0s;
        }

        .loading-spinner-ring-2 {
          animation-duration: 2.5s;
          animation-delay: -0.5s;
        }

        .loading-spinner-ring-3 {
          animation-duration: 3s;
          animation-delay: -1s;
        }

        .loading-spinner-center {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 15px rgba(121, 188, 153, 0.2);
        }

        .loading-spinner-logo {
          font-size: 1.5rem;
          animation: pulse 2s ease-in-out infinite;
        }

        /* Tamaños */
        .loading-spinner-small {
          width: 40px;
          height: 40px;
        }

        .loading-spinner-small .loading-spinner-ring {
          width: 100%;
          height: 100%;
          border-width: 2px;
        }

        .loading-spinner-small .loading-spinner-ring-2 {
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
        }

        .loading-spinner-small .loading-spinner-ring-3 {
          width: 60%;
          height: 60%;
          top: 20%;
          left: 20%;
        }

        .loading-spinner-small .loading-spinner-center {
          width: 24px;
          height: 24px;
        }

        .loading-spinner-small .loading-spinner-logo {
          font-size: 0.8rem;
        }

        .loading-spinner-medium {
          width: 60px;
          height: 60px;
        }

        .loading-spinner-medium .loading-spinner-ring {
          width: 100%;
          height: 100%;
          border-width: 3px;
        }

        .loading-spinner-medium .loading-spinner-ring-2 {
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
        }

        .loading-spinner-medium .loading-spinner-ring-3 {
          width: 60%;
          height: 60%;
          top: 20%;
          left: 20%;
        }

        .loading-spinner-medium .loading-spinner-center {
          width: 36px;
          height: 36px;
        }

        .loading-spinner-medium .loading-spinner-logo {
          font-size: 1.2rem;
        }

        .loading-spinner-large {
          width: 80px;
          height: 80px;
        }

        .loading-spinner-large .loading-spinner-ring {
          width: 100%;
          height: 100%;
          border-width: 4px;
        }

        .loading-spinner-large .loading-spinner-ring-2 {
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
        }

        .loading-spinner-large .loading-spinner-ring-3 {
          width: 60%;
          height: 60%;
          top: 20%;
          left: 20%;
        }

        .loading-spinner-large .loading-spinner-center {
          width: 48px;
          height: 48px;
        }

        .loading-spinner-large .loading-spinner-logo {
          font-size: 1.8rem;
        }

        /* Variantes de color */
        .loading-spinner-primary .loading-spinner-ring-1 {
          border-top-color: #79BC99;
          border-right-color: #79BC99;
        }

        .loading-spinner-primary .loading-spinner-ring-2 {
          border-bottom-color: #4E8484;
          border-left-color: #4E8484;
        }

        .loading-spinner-primary .loading-spinner-ring-3 {
          border-top-color: #3B8686;
          border-bottom-color: #3B8686;
        }

        .loading-spinner-secondary .loading-spinner-ring-1 {
          border-top-color: #6C757D;
          border-right-color: #6C757D;
        }

        .loading-spinner-secondary .loading-spinner-ring-2 {
          border-bottom-color: #495057;
          border-left-color: #495057;
        }

        .loading-spinner-secondary .loading-spinner-ring-3 {
          border-top-color: #343A40;
          border-bottom-color: #343A40;
        }

        .loading-spinner-white .loading-spinner-ring-1 {
          border-top-color: rgba(255, 255, 255, 0.8);
          border-right-color: rgba(255, 255, 255, 0.8);
        }

        .loading-spinner-white .loading-spinner-ring-2 {
          border-bottom-color: rgba(255, 255, 255, 0.6);
          border-left-color: rgba(255, 255, 255, 0.6);
        }

        .loading-spinner-white .loading-spinner-ring-3 {
          border-top-color: rgba(255, 255, 255, 0.4);
          border-bottom-color: rgba(255, 255, 255, 0.4);
        }

        .loading-spinner-white .loading-spinner-center {
          background: rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        /* Texto de carga */
        .loading-spinner-text {
          color: #2C3E50;
          font-size: 1rem;
          font-weight: 600;
          text-align: center;
          margin-top: 5px;
        }

        .loading-spinner-fullscreen .loading-spinner-text {
          font-size: 1.2rem;
        }

        /* Puntos animados */
        .loading-spinner-dots {
          display: flex;
          gap: 4px;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #79BC99;
          animation: bounce 1.4s ease-in-out infinite both;
        }

        .loading-spinner-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .loading-spinner-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        .loading-spinner-dots span:nth-child(3) {
          animation-delay: 0s;
        }

        /* Animaciones */
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .loading-spinner-fullscreen .loading-spinner-content {
            padding: 20px;
          }

          .loading-spinner-text {
            font-size: 0.9rem;
          }

          .loading-spinner-fullscreen .loading-spinner-text {
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .loading-spinner-fullscreen .loading-spinner-content {
            padding: 15px;
          }

          .loading-spinner-text {
            font-size: 0.85rem;
          }

          .loading-spinner-fullscreen .loading-spinner-text {
            font-size: 0.95rem;
          }

          .loading-spinner-dots span {
            width: 5px;
            height: 5px;
          }
        }

        /* Reducir animaciones si el usuario lo prefiere */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner-ring {
            animation-duration: 4s;
          }

          .loading-spinner-logo {
            animation: none;
          }

          .loading-spinner-dots span {
            animation: none;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Componentes de conveniencia para casos específicos
 */
export const FullScreenLoader = ({ text = 'Cargando datos del proyecto...' }: { text?: string }) => (
  <LoadingSpinner fullScreen size="large" text={text} />
);

export const OverlayLoader = ({ text }: { text?: string }) => (
  <LoadingSpinner overlay size="medium" text={text} />
);

export const InlineLoader = ({ size = 'small', text }: { size?: 'small' | 'medium'; text?: string }) => (
  <LoadingSpinner size={size} text={text} />
);
