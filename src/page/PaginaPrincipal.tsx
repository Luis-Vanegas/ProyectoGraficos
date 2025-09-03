import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FondoInicio from '../assets/FondoInicio.jpg';
import logoNegroInicio from '../assets/logo.png';

// Interfaz para definir la estructura de cada elemento del menú
interface MenuItem {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  color: string;
}

// Componente principal de la página de inicio
export default function PaginaPrincipal() {
  // Hook para navegación entre páginas
  const navigate = useNavigate();
  // Estado para controlar qué elemento del menú está siendo hover
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Array con los elementos principales destacados
  const menuItemsPrincipales: MenuItem[] = [
    {
      id: 'reporte-general',
      titulo: 'Reporte General',
      descripcion: 'Visor de proyectos estratégicos',
      icono: '📊',
      ruta: '/dashboard',
      color: '#00904c'
    },
    {
      id: 'consultar-obra',
      titulo: 'Consultar Obra',
      descripcion: 'Consulta por obra específica',
      icono: '🔍',
      ruta: '/consultar-obra',
      color: '#4682B4'
    }
  ];

  // Array con los elementos del menú secundario
  const menuItemsSecundarios: MenuItem[] = [
    {
      id: 'escenarios-deportivos',
      titulo: 'Escenarios Deportivos',
      descripcion: 'Proyectos deportivos y recreativos',
      icono: '⚽',
      ruta: '/proyectos/escenarios-deportivos',
      color: '#FF6B35'
    },
    {
      id: 'jardines-buen-comienzo',
      titulo: 'Jardines Buen Comienzo',
      descripcion: 'Educación y desarrollo infantil',
      icono: '🌱',
      ruta: '/proyectos/jardines-buen-comienzo',
      color: '#4CAF50'
    },
    {
      id: 'escuelas-inteligentes',
      titulo: 'Escuelas Inteligentes',
      descripcion: 'Tecnología educativa',
      icono: '🏫',
      ruta: '/proyectos/escuelas-inteligentes',
      color: '#9C27B0'
    },
    {
      id: 'recreos',
      titulo: 'Recreos',
      descripcion: 'Espacios de recreación',
      icono: '🎮',
      ruta: '/proyectos/recreos',
      color: '#FF9800'
    },
    {
      id: 'primavera-norte',
      titulo: 'Primavera Norte',
      descripcion: 'Desarrollo urbano sostenible',
      icono: '🌸',
      ruta: '/proyectos/primavera-norte',
      color: '#E91E63'
    },
    {
      id: 'c5i',
      titulo: 'C5i',
      descripcion: 'Centro de Comando, Control, Comunicaciones, Computadores, Coordinación e Inteligencia',
      icono: '👮',
      ruta: '/proyectos/c5i',
      color: '#3F51B5'
    },
    {
      id: 'tacita-de-plata',
      titulo: 'Tacita de Plata',
      descripcion: 'Proyectos ambientales',
      icono: '🌍',
      ruta: '/proyectos/tacita-de-plata',
      color: '#009688'
    },
    {
      id: 'metro-la-80',
      titulo: 'Metro de La 80',
      descripcion: 'Sistema de transporte masivo',
      icono: '🚇',
      ruta: '/proyectos/metro-la-80',
      color: '#795548'
    },
    {
      id: 'unidad-hospitalaria',
      titulo: 'Unidad Hospitalaria Santa Cruz',
      descripcion: 'Infraestructura de salud',
      icono: '🏥',
      ruta: '/proyectos/unidad-hospitalaria',
      color: '#F44336'
    }
  ];

  // Función para manejar el clic en los elementos del menú
  const handleItemClick = (ruta: string) => {
    navigate(ruta);
  };

  return (
    <div 
      className="pagina-principal"
      style={{
        minHeight: '100vh',
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${FondoInicio})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '15px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header con logo y branding - responsive */}
      <div 
        style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
          padding: '6px'
        }}
      >
        <img 
          src={logoNegroInicio} 
          alt="Logo Alcaldía de Medellín" 
          style={{ 
            height: 'clamp(35px, 6vw, 100px)',
            maxWidth: '100%'
          }}
        />
      </div>

      {/* Título principal centrado - responsive */}
      <div style={{ textAlign: 'center', marginBottom: '20px', zIndex: 10, padding: '0 14px', marginTop: '12px' }}>
        <h1 
          style={{
            color: 'white',
            fontSize: 'clamp(1.2rem, 4vw, 2.5rem)',
            fontWeight: 'bold',
            margin: 0,
            textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
            letterSpacing: '1.5px',
            lineHeight: '1.2'
          }}
        >
          Visor de Proyectos Estratégicos
        </h1>
      </div>

      {/* Panel principal destacado para Reporte General y Consultar Obra */}
      <div 
        className="panel-principal"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '18px',
          maxWidth: '830px',
          width: '100%',
          zIndex: 10,
          padding: '0 20px',
          marginBottom: '11px'
        }}
      >
        {menuItemsPrincipales.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item.ruta)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              background: 'linear-gradient(135deg, #ffffffdd, #ffffffaa)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '25px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: hoveredItem === item.id ? 'translateY(-8px) scale(1.03)' : 'translateY(0) scale(1)',
              boxShadow: hoveredItem === item.id 
                ? '0 15px 35px rgba(0,0,0,0.3)' 
                : '0 8px 25px rgba(0,0,0,0.2)',
              border: `3px solid ${item.color}`,
              position: 'relative',
              overflow: 'hidden',
              minHeight: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            {/* Efecto de brillo que se desliza al hacer hover */}
            {hoveredItem === item.id && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shine 0.6s ease-in-out',
                  zIndex: 1
                }}
              />
            )}

            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Icono principal de la tarjeta */}
              <div 
                className="icono"
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '10px',
                  textAlign: 'center',
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                }}
              >
                {item.icono}
              </div>

              {/* Título de la tarjeta */}
              <h3 
                style={{
                  color: item.color,
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0',
                  textAlign: 'center',
                  textShadow: 'none'
                }}
              >
                {item.titulo}
              </h3>

              {/* Descripción de la tarjeta */}
              <p 
                style={{
                  color: '#333',
                  fontSize: '0.95rem',
                  margin: 0,
                  textAlign: 'center',
                  opacity: 0.8,
                  textShadow: 'none',
                  lineHeight: '1.2'
                }}
              >
                {item.descripcion}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid secundario del menú - organizado en 5+4 */}
      <div 
        className="menu-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '15px',
          maxWidth: '1172px',
          width: '100%',
          zIndex: 10,
          padding: '0 20px'
        }}
      >
        {menuItemsSecundarios.slice(0, 5).map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item.ruta)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              background: `linear-gradient(135deg, ${item.color}dd, ${item.color}aa)`,
              backdropFilter: 'blur(10px)',
              borderRadius: '18px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: hoveredItem === item.id ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: hoveredItem === item.id 
                ? '0 12px 30px rgba(0,0,0,0.3)' 
                : '0 6px 20px rgba(0,0,0,0.2)',
              border: '2px solid transparent',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            {/* Efecto de brillo que se desliza al hacer hover */}
            {hoveredItem === item.id && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  animation: 'shine 0.6s ease-in-out',
                  zIndex: 1
                }}
              />
            )}

            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Icono principal de la tarjeta */}
              <div 
                className="icono"
                style={{
                  fontSize: '2rem',
                  marginBottom: '8px',
                  textAlign: 'center',
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                }}
              >
                {item.icono}
              </div>

              {/* Título de la tarjeta */}
              <h3 
                style={{
                  color: 'white',
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  margin: '0 0 6px 0',
                  textAlign: 'center',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {item.titulo}
              </h3>

              {/* Descripción de la tarjeta */}
              <p 
                style={{
                  color: 'white',
                  fontSize: '0.7rem',
                  margin: 0,
                  textAlign: 'center',
                  opacity: 0.9,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  lineHeight: '1.3'
                }}
              >
                {item.descripcion}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Segunda fila del grid - 4 tarjetas */}
      <div 
        className="menu-grid-segunda-fila"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '15px',
          maxWidth: '1005px',
          width: '100%',
          zIndex: 10,
          padding: '0 21px',
          marginTop: '10px'
        }}
      >
        {menuItemsSecundarios.slice(5, 9).map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item.ruta)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              background: `linear-gradient(135deg, ${item.color}dd, ${item.color}aa)`,
              backdropFilter: 'blur(10px)',
              borderRadius: '18px',
              padding: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: hoveredItem === item.id ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: hoveredItem === item.id 
                ? '0 12px 30px rgba(0,0,0,0.3)' 
                : '0 6px 20px rgba(0,0,0,0.2)',
              border: '2px solid transparent',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            {/* Efecto de brillo que se desliza al hacer hover */}
            {hoveredItem === item.id && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  animation: 'shine 0.6s ease-in-out',
                  zIndex: 1
                }}
              />
            )}

            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Icono principal de la tarjeta */}
              <div 
                className="icono"
                style={{
                  fontSize: '2rem',
                  marginBottom: '8px',
                  textAlign: 'center',
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                }}
              >
                {item.icono}
              </div>

              {/* Título de la tarjeta */}
              <h3 
                style={{
                  color: 'white',
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  margin: '0 0 6px 0',
                  textAlign: 'center',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {item.titulo}
              </h3>

              {/* Descripción de la tarjeta */}
              <p 
                style={{
                  color: 'white',
                  fontSize: '0.8rem',
                  margin: 0,
                  textAlign: 'center',
                  opacity: 0.9,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  lineHeight: '1.3'
                }}
              >
                {item.descripcion}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Estilos CSS para animaciones, tipografía y responsive */}
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .pagina-principal {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        /* ========================================================================
            DISEÑO RESPONSIVE OPTIMIZADO PARA PANTALLAS GRANDES - 5+4
        ======================================================================== */
        
        /* Pantallas muy grandes */
        @media (min-width: 1920px) {
          .menu-grid {
            grid-template-columns: repeat(5, 1fr) !important;
            max-width: 1800px !important;
            gap: 20px !important;
          }
          
          .menu-grid-segunda-fila {
            grid-template-columns: repeat(4, 1fr) !important;
            max-width: 1440px !important;
            gap: 20px !important;
          }
          
          .panel-principal {
            max-width: 1000px !important;
            gap: 25px !important;
          }
        }
        
        @media (min-width: 1600px) and (max-width: 1919px) {
          .menu-grid {
            grid-template-columns: repeat(5, 1fr) !important;
            max-width: 1600px !important;
            gap: 18px !important;
          }
          
          .menu-grid-segunda-fila {
            grid-template-columns: repeat(4, 1fr) !important;
            max-width: 1280px !important;
            gap: 18px !important;
          }
          
          .panel-principal {
            max-width: 900px !important;
            gap: 22px !important;
          }
        }
        
        @media (min-width: 1400px) and (max-width: 1599px) {
          .menu-grid {
            grid-template-columns: repeat(5, 1fr) !important;
            max-width: 1400px !important;
            gap: 16px !important;
          }
          
          .menu-grid-segunda-fila {
            grid-template-columns: repeat(4, 1fr) !important;
            max-width: 1120px !important;
            gap: 16px !important;
          }
          
          .panel-principal {
            max-width: 850px !important;
            gap: 20px !important;
          }
        }
        
        @media (max-width: 1399px) {
          .menu-grid {
            grid-template-columns: repeat(5, 1fr) !important;
            gap: 12px !important;
          }
          
          .menu-grid-segunda-fila {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 12px !important;
          }
          
          .panel-principal {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
            gap: 15px !important;
          }
        }
        
        @media (max-width: 1200px) {
          .pagina-principal {
            padding: 15px !important;
          }
          
          .menu-grid {
            grid-template-columns: repeat(5, 1fr) !important;
            gap: 10px !important;
          }
          
          .menu-grid-segunda-fila {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 10px !important;
          }
          
          .panel-principal {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
            gap: 12px !important;
          }
        }
        
        @media (max-width: 768px) {
          .pagina-principal {
            padding: 10px !important;
          }
          
          .menu-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
          
          .menu-grid-segunda-fila {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
          
          .panel-principal {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
        
        @media (max-width: 480px) {
          .pagina-principal {
            padding: 8px !important;
          }
          
          .menu-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 6px !important;
          }
          
          .menu-grid-segunda-fila {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 6px !important;
          }
          
          .panel-principal {
            gap: 8px !important;
          }
        }
        
        @media (max-width: 360px) {
          .pagina-principal {
            padding: 6px !important;
          }
          
          .menu-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 5px !important;
          }
          
          .menu-grid-segunda-fila {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 5px !important;
          }
        }
      `}</style>
    </div>
  );
}