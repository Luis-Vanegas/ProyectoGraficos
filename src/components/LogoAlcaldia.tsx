import React from 'react';
import LogoNuevo from '../assets/LogoNuevo.png';

interface LogoAlcaldiaProps {
  height?: string | number;
  width?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export default function LogoAlcaldia({ 
  height = '60px', 
  width = 'auto', 
  className = '',
  style = {}
}: LogoAlcaldiaProps) {
  return (
    <div 
      className={`logo-container ${className}`}
      style={{
        position: 'relative',
        width: width,
        height: height,
        ...style
      }}
    >
      {/* Logo original */}
      <img 
        src={LogoNuevo} 
        alt="Logo Alcaldía de Medellín" 
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'none'
        }}
      />
      
      {/* Overlay para ocultar la línea horizontal */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '10%',
          right: '10%',
          height: '2px',
          backgroundColor: 'white',
          transform: 'translateY(-50%)',
          zIndex: 1
        }}
      />
      
      <style>{`
        .logo-container {
          position: relative;
          display: inline-block;
        }
        
        .logo-container::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 10%;
          right: 10%;
          height: 2px;
          background-color: white;
          transform: translateY(-50%);
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
