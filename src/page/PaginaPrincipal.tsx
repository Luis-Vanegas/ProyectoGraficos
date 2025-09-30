import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Fondo con logo
import FondoConLogo from '../assets/PNG/Fondo Azul con logo.jpg';
import LogoNuevo from '../assets/PNG/Logo en contenedor.png';


// Importar iconos principales
import lupa from '../assets/PNG/Buscador.png';
import estadis from '../assets/PNG/Reporte General.png';

// Importar fotos normales de proyectos estratégicos
import escenariosDeportivos from '../assets/Escuelas-inteligentes.jpg'; // Usar foto real
import jardinesBuenComienzo from '../assets/Buen-Comienzo.jpg';
import escuelasInteligentes from '../assets/Escuelas-inteligentes.jpg';
import recreos from '../assets/Recreo.jpg';
import primaveraNorte from '../assets/Primavera-norte.jpg';
import c5i from '../assets/C5I.jpg';
import tacitaDePlata from '../assets/Tacita-de-plata.jpg';
import metroLa80 from '../assets/Metro-de-la-80.jpg';
import unidadHospitalaria from '../assets/UHSanta-Cruz.jpg';

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
      icono: estadis, // Icono de estadísticas
      ruta: '/dashboard',
      color: '#00FF88'
    },
    {
      id: 'consultar-obra',
      titulo: 'Consultar Obra',
      descripcion: 'Consulta por obra específica',
      icono: lupa, // Icono de lupa
      ruta: '/consultar-obra',
      color: '#00B4FF'
    }
  ];

  // Array con los elementos del menú secundario - Actualizadas las rutas a los dashboards específicos
  const menuItemsSecundarios: MenuItem[] = [
    {
      id: 'escenarios-deportivos',
      titulo: 'Escenarios Deportivos',
      descripcion: 'Proyectos deportivos y recreativos',
      icono: escenariosDeportivos, // Imagen real
      ruta: '/dashboard/escenarios-deportivos',
      color: '#FF6B35'
    },
    {
      id: 'jardines-buen-comienzo',
      titulo: 'Jardines Buen Comienzo',
      descripcion: 'Educación y desarrollo infantil',
      icono: jardinesBuenComienzo, // Imagen real
      ruta: '/dashboard/jardines-buen-comienzo',
      color: '#00FF88'
    },
    {
      id: 'escuelas-inteligentes',
      titulo: 'Mega colegios',
      descripcion: 'Tecnología educativa',
      icono: escuelasInteligentes, // Imagen real
      ruta: '/dashboard/escuelas-inteligentes',
      color: '#00B4FF'
    },
    {
      id: 'recreos',
      titulo: 'Recreos',
      descripcion: 'Espacios de recreación',
      icono: recreos, // Imagen real
      ruta: '/dashboard/recreos',
      color: '#00B4FF'
    },
    {
      id: 'primavera-norte',
      titulo: 'Primavera Norte',
      descripcion: 'Desarrollo urbano sostenible',
      icono: primaveraNorte, // Imagen real
      ruta: '/dashboard/primavera-norte',
      color: '#00FF88'
    },
    {
      id: 'c5i',
      titulo: 'C5i',
      descripcion: 'Centro de Comando, Control, Comunicaciones, Computadores, Coordinación e Inteligencia',
      icono: c5i, // Imagen real
      ruta: '/dashboard/c5i',
      color: '#00FF88'
    },
    {
      id: 'tacita-de-plata',
      titulo: 'Tacita de Plata',
      descripcion: 'Proyectos ambientales',
      icono: tacitaDePlata, // Imagen real
      ruta: '/dashboard/tacita-de-plata',
      color: '#00FF88'
    },
    {
      id: 'metro-la-80',
      titulo: 'Metro de La 80',
      descripcion: 'Sistema de transporte masivo',
      icono: metroLa80, // Imagen real
      ruta: '/dashboard/metro-la-80',
      color: '#FF6B35'
    },
    {
      id: 'unidad-hospitalaria',
      titulo: 'Unidad Hospitalaria Santa Cruz',
      descripcion: 'Infraestructura de salud',
      icono: unidadHospitalaria, // Imagen real
      ruta: '/dashboard/unidad-hospitalaria',
      color: '#00B4FF'
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
        background: `url(${FondoConLogo}) center/cover no-repeat, #00233D`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '15px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Logo en contenedor en esquina superior derecha */}
      <div 
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10
        }}
      >
        <img 
          src={LogoNuevo} 
          alt="Logo Medellín" 
          style={{ 
            height: 'clamp(60px, 8vw, 120px)',
            maxWidth: '100%'
          }}
        />
      </div>


      {/* Título principal centrado - responsive */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px', 
        zIndex: 10, 
        padding: '0 20px', 
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {/* Banner con título */}
        <div style={{
          background: '#00B4FF',
          borderRadius: '15px',
          padding: '20px 40px',
          margin: '0 auto',
          maxWidth: '700px',
          boxShadow: '0 8px 25px rgba(42, 167, 225, 0.3)',
          textAlign: 'center'
        }}>
          <h1 
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 3rem)',
              fontWeight: 'bold',
              margin: 0,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              letterSpacing: '2px',
              lineHeight: '1.2',
              fontFamily: 'Metropolis'
            }}
          >
            <span style={{ color: 'white' }}>Proyectos </span>
            <span style={{ color: '#00233D' }}>Estratégicos</span>
          </h1>
        </div>
      </div>

      {/* Panel principal destacado para Reporte General y Consultar Obra */}
      <div 
        className="panel-principal"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '25px',
          maxWidth: '900px',
          width: '100%',
          zIndex: 10,
          padding: '0 30px',
          marginBottom: '40px',
          justifyContent: 'center'
        }}
      >
        {menuItemsPrincipales.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item.ruta)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              background: '#E0E0E0',
              borderRadius: '20px',
              padding: '25px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: hoveredItem === item.id ? 'translateY(-8px) scale(1.03)' : 'translateY(0) scale(1)',
              boxShadow: hoveredItem === item.id 
                ? '0 15px 35px rgba(0,0,0,0.3)' 
                : '0 8px 25px rgba(0,0,0,0.2)',
              border: 'none',
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
                  marginBottom: '10px',
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <div 
                  style={{
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <img 
                    src={item.icono} 
                    alt={item.titulo}
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              </div>

              {/* Título de la tarjeta */}
              <h3 
                style={{
                  color: '#333',
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
                  color: '#666',
                  fontSize: '0.95rem',
                  margin: 0,
                  textAlign: 'center',
                  opacity: 1,
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
          gap: '20px',
          maxWidth: '1200px',
          width: '100%',
          zIndex: 10,
          padding: '0 30px',
          marginBottom: '30px',
          justifyContent: 'center'
        }}
      >
        {menuItemsSecundarios.slice(0, 5).map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item.ruta)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              background: '#E0E0E0',
              borderRadius: '18px',
              padding: '0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: hoveredItem === item.id ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: hoveredItem === item.id 
                ? '0 12px 30px rgba(0,0,0,0.3)' 
                : '0 6px 20px rgba(0,0,0,0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '140px',
              display: 'flex',
              flexDirection: 'column'
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

            {/* Imagen de la tarjeta */}
            <img 
              src={item.icono} 
              alt={item.titulo}
              style={{
                width: '100%',
                height: '80px',
                objectFit: 'cover',
                borderRadius: '12px 12px 0 0'
              }}
            />
            
            {/* Contenido de texto */}
            <div style={{ 
              position: 'relative', 
              zIndex: 2, 
              padding: '12px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              {/* Título de la tarjeta */}
              <h3 
                style={{
                  color: '#333',
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  margin: '0 0 6px 0',
                  textAlign: 'center',
                  textShadow: 'none'
                }}
              >
                {item.titulo}
              </h3>

              {/* Descripción de la tarjeta */}
              <p 
                style={{
                  color: '#666',
                  fontSize: '0.7rem',
                  margin: 0,
                  textAlign: 'center',
                  opacity: 1,
                  textShadow: 'none',
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
              background: '#E0E0E0',
              borderRadius: '18px',
              padding: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: hoveredItem === item.id ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: hoveredItem === item.id 
                ? '0 12px 30px rgba(0,0,0,0.3)' 
                : '0 6px 20px rgba(0,0,0,0.2)',
              border: 'none',
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
                  marginBottom: '8px',
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <img 
                  src={item.icono} 
                  alt={item.titulo}
                  style={{
                    width: '100%',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '12px 12px 0 0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    marginBottom: '8px'
                  }}
                />
              </div>

              {/* Título de la tarjeta */}
              <h3 
                style={{
                  color: '#333',
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  margin: '0 0 6px 0',
                  textAlign: 'center',
                  textShadow: 'none'
                }}
              >
                {item.titulo}
              </h3>

              {/* Descripción de la tarjeta */}
              <p 
                style={{
                  color: '#666',
                  fontSize: '0.8rem',
                  margin: 0,
                  textAlign: 'center',
                  opacity: 1,
                  textShadow: 'none',
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
          font-family: 'Metropolis', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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