import { useNavigate } from 'react-router-dom';
import logoNegroInicio from '../assets/logoNegroInicio.png';

interface NavigationProps {
  showBackButton?: boolean;
  title?: string;
}

export default function Navigation({ showBackButton = false, title }: NavigationProps) {
  const navigate = useNavigate();

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        padding: '15px 30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {showBackButton && (
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 36, 36, 0.05)';
              e.currentTarget.style.transform = 'translateX(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            ← Volver al Inicio
          </button>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img 
            src={logoNegroInicio} 
            alt="Logo Alcaldía de Medellín" 
            style={{ height: '40px' }}
          />
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              Alcaldía de Medellín
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
              Distrito de Ciencia, Tecnología e Innovación
            </p>
          </div>
        </div>
      </div>

      {title && (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            {title}
          </h1>
        </div>
      )}

      <div style={{ width: '200px' }} /> {/* Espaciador para centrar el título */}
    </div>
  );
}
