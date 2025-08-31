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

  // Array con todos los elementos del menú principal
  const menuItems: MenuItem[] = [
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
    },
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
    },
    {
      id: 'otras-obras',
      titulo: 'Otras Obras',
      descripcion: 'Proyectos adicionales',
      icono: '💡',
      ruta: '/proyectos/otras-obras',
      color: '#607D8B'
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        position: 'relative'
      }}
    >
             {/* Header con logo y branding - responsive */}
       <div 
         style={{
           position: 'absolute',
           top: '20px',
           left: '20px',
           display: 'flex',
           alignItems: 'center',
           gap: '10px',
           zIndex: 10,
           padding: '10px'
         }}
       >
         <img 
           src={logoNegroInicio} 
           alt="Logo Alcaldía de Medellín" 
           style={{ 
             height: 'clamp(40px, 8vw, 60px)',
             maxWidth: '100%'
           }}
         />
       </div>
             {/* Título principal centrado - responsive */}
       <div style={{ textAlign: 'center', marginBottom: '40px', zIndex: 10, padding: '0 20px' }}>
         <h1 
           style={{
             color: 'white',
             fontSize: 'clamp(2rem, 5vw, 3.5rem)',
             fontWeight: 'bold',
             margin: 0,
             textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
             letterSpacing: '2px',
             lineHeight: '1.2'
           }}
         >
           Visor de Proyectos Estratégicos
         </h1>
       </div>

             {/* Grid principal del menú - completamente responsive */}
       <div 
         style={{
           display: 'grid',
           gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
           gap: '20px',
           maxWidth: '1400px',
           width: '100%',
           zIndex: 10,
           padding: '0 15px'
         }}
       >
        {menuItems.map((item) => (
          // Tarjeta individual del menú con efectos de hover
          <div
            key={item.id}
            onClick={() => handleItemClick(item.ruta)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
                         style={{
               background: item.id === 'reporte-general' 
                 ? 'linear-gradient(135deg, #ffffffdd, #ffffffaa)' 
                 : `linear-gradient(135deg, ${item.color}dd, ${item.color}aa)`,
               backdropFilter: 'blur(10px)',
               borderRadius: '20px',
               padding: '30px',
               cursor: 'pointer',
               transition: 'all 0.3s ease',
               transform: hoveredItem === item.id ? 'translateY(-10px) scale(1.05)' : 'translateY(0) scale(1)',
               boxShadow: hoveredItem === item.id 
                 ? '0 20px 40px rgba(0,0,0,0.3)' 
                 : '0 10px 30px rgba(0,0,0,0.2)',
               border: item.id === 'reporte-general' ? '2px solid #00904c' : '2px solid transparent',
               position: 'relative',
               overflow: 'hidden',
               minHeight: '180px',
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
                 style={{
                   fontSize: '3rem',
                   marginBottom: '15px',
                   textAlign: 'center',
                   filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                 }}
               >
                 {item.icono}
               </div>

               {/* Título de la tarjeta */}
               <h3 
                 style={{
                   color: item.id === 'reporte-general' ? '#00904c' : 'white',
                   fontSize: '1.4rem',
                   fontWeight: 'bold',
                   margin: '0 0 12px 0',
                   textAlign: 'center',
                   textShadow: item.id === 'reporte-general' ? 'none' : '1px 1px 2px rgba(0,0,0,0.5)'
                 }}
               >
                 {item.titulo}
               </h3>

               {/* Descripción de la tarjeta */}
               <p 
                 style={{
                   color: item.id === 'reporte-general' ? '#333' : 'white',
                   fontSize: '1rem',
                   margin: 0,
                   textAlign: 'center',
                   opacity: item.id === 'reporte-general' ? 0.8 : 0.9,
                   textShadow: item.id === 'reporte-general' ? 'none' : '1px 1px 2px rgba(0,0,0,0.5)',
                   lineHeight: '1.4'
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
         
         /* Media queries para responsive */
         @media (max-width: 768px) {
           .pagina-principal {
             padding: 10px !important;
           }
         }
         
         @media (max-width: 480px) {
           .pagina-principal {
             padding: 5px !important;
           }
         }
       `}</style>
    </div>
  );
}