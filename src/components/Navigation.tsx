import { useNavigate } from 'react-router-dom';
import logoNegroInicio from '../assets/logo.png';

interface NavigationProps {
  showBackButton?: boolean;
  title?: string;
}

export default function Navigation({ showBackButton = false, title }: NavigationProps) {
  const navigate = useNavigate();

  return (
    <div className="navigation">
      {/* Botón de volver (izquierda) */}
      {showBackButton && (
        <button
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← Volver
        </button>
      )}

      {/* Título en el centro */}
      {title && (
        <div className="title-container">
          <h1 className="title">
            {title}
          </h1>
        </div>
      )}

      {/* Logo a la derecha */}
      <div className="logo-container">
        <img 
          src={logoNegroInicio} 
          alt="Logo Alcaldía de Medellín" 
          className="logo"
        />
      </div>

      {/* Estilos CSS con responsive design */}
      <style>{`
        .navigation {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, rgba(121, 188, 153, 0.95) 0%, rgba(78, 132, 132, 0.95) 100%);
          backdrop-filter: blur(10px);
          border-bottom: 2px solid #79BC99;
          padding: 15px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(121, 188, 153, 0.3);
        }

        .back-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          font-size: 1rem;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 6px;
          transition: all 0.3s ease;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          white-space: nowrap;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateX(-2px);
          box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2);
        }

        .title-container {
          text-align: center;
          flex: 1;
          margin: 0 15px;
        }

        .title {
          margin: 0;
          font-size: 22px;
          font-weight: bold;
          color: #FFFFFF;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo {
          height: 35px;
          width: auto;
        }

        /* ========================================================================
            DISEÑO RESPONSIVE COMPLETO
        ======================================================================== */
        
        @media (max-width: 1200px) {
          .navigation {
            padding: 15px 25px;
          }
          
          .title {
            font-size: 20px;
          }
        }
        
        @media (max-width: 768px) {
          .navigation {
            padding: 12px 20px;
          }
          
          .back-button {
            font-size: 0.9rem;
            padding: 5px 10px;
          }
          
          .title {
            font-size: 18px;
          }
          
          .logo {
            height: 30px;
          }
        }
        
        @media (max-width: 480px) {
          .navigation {
            padding: 10px 15px;
          }
          
          .back-button {
            font-size: 0.85rem;
            padding: 4px 8px;
            gap: 4px;
          }
          
          .title {
            font-size: 16px;
          }
          
          .logo {
            height: 28px;
          }
          
          .title-container {
            margin: 0 10px;
          }
        }
        
        @media (max-width: 360px) {
          .navigation {
            padding: 8px 12px;
          }
          
          .back-button {
            font-size: 0.8rem;
            padding: 3px 6px;
          }
          
          .title {
            font-size: 15px;
          }
          
          .logo {
            height: 25px;
          }
          
          .title-container {
            margin: 0 8px;
          }
        }
        
        /* Manejo especial para pantallas muy pequeñas */
        @media (max-width: 320px) {
          .navigation {
            padding: 8px 10px;
          }
          
          .back-button {
            font-size: 0.75rem;
            padding: 3px 5px;
          }
          
          .title {
            font-size: 14px;
          }
          
          .logo {
            height: 22px;
          }
        }
      `}</style>
    </div>
  );
}
