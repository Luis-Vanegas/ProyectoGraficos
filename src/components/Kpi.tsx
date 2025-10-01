import { nf, cf } from '../utils/utils/metrics';
import { motion, useReducedMotion } from 'framer-motion';
import CountUp from 'react-countup';

type Props = {
  label: string;
  value: number;
  format?: 'int' | 'money' | 'pct';
  compactMoney?: boolean;
  // Muestra valores abreviados: 1.2K, 3.4M, 11.1B
  abbreviate?: boolean;
  digits?: number;
  loading?: boolean;
  subtitle?: string; // Para mostrar información adicional como porcentajes
  trend?: 'up' | 'down' | 'neutral'; // Para indicadores de tendencia
  className?: string; // Para clases CSS adicionales
  style?: React.CSSProperties; // Para estilos inline
};

const moneyCompact = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export default function Kpi({
  label,
  value,
  format = 'int',
  compactMoney = false,
  abbreviate = false,
  digits = 0,
  subtitle,
  className = '',
  style = {},
  // trend = 'neutral'
}: Props) {
  const prefersReduced = useReducedMotion?.() ?? false;

  const abbreviateNumber = (num: number, d = 1): string => {
    const abs = Math.abs(num);
    const units = [
      { v: 1e12, s: 'B' },   // Billones (10^12)
      { v: 1e9,  s: 'MM' },  // Mil millones (10^9)
      { v: 1e6,  s: 'M' },   // Millones
      { v: 1e3,  s: 'K' },   // Miles
    ];
    for (const u of units) {
      if (abs >= u.v) {
        const val = (num / u.v).toFixed(d);
        return `${val.replace(/\.0+$/, '')}${u.s}`;
      }
    }
    return nf.format(num);
  };

  const fmt = (() => {
    if (format === 'money') {
      // Abreviar solo para montos grandes (>= 1 millón) y cuando se solicite
      if (abbreviate && Math.abs(value) >= 1e6) {
        return `$${abbreviateNumber(value, Math.max(digits, 1))}`;
      }
      return compactMoney ? moneyCompact.format(value) : `$${cf.format(value)}`;
    }
    if (format === 'pct') return `${(value * 100).toFixed(digits)} %`;
    // Para números no monetarios, mostrar normal por defecto
    return nf.format(value);
  })();


  return (
    <motion.div
      className={`kpi ${className}`.trim()}
      style={style}
      role="figure"
      aria-label={`KPI ${label}: ${fmt}`}
      initial={prefersReduced ? false : { opacity: 0, y: 16 }}
      animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 140, damping: 18, duration: 0.5 }}
      whileHover={prefersReduced ? undefined : { y: -6, scale: 1.02 }}
      whileTap={prefersReduced ? undefined : { scale: 0.99 }}
    >
      <div className="kpi-header">
        <div className="kpi-label">{label}</div>
      </div>
      
      <div className="kpi-value">
        {(() => {
          if (abbreviate) return fmt;
          if (format === 'pct') {
            return (
              <CountUp 
                end={value * 100} 
                decimals={digits} 
                duration={1.2} 
                suffix={' %'} 
                separator="."
              />
            );
          }
          if (format === 'money') {
            return (
              <CountUp
                end={value}
                duration={1.2}
                separator="."
                prefix="$"
                formattingFn={(n) => (compactMoney ? moneyCompact.format(n) : cf.format(n))}
              />
            );
          }
          return <CountUp end={value} duration={1.0} separator="." />;
        })()}
      </div>
      
      {subtitle && <div className="kpi-subtitle" title={subtitle}>{subtitle}</div>}
    </motion.div>
  );
}

// Estilos CSS limpios y organizados
const kpiStyles = `
  .kpi {
    background: #98C73B;
    border-radius: 16px;  
    padding: 20px;
    box-shadow: 0 6px 18px rgba(152, 199, 59, 0.22);
    border: none;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    height: 160px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: white;
  }

  .kpi:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(152, 199, 59, 0.3);
  }

  /* Permitir que las clases específicas sobrescriban los estilos por defecto */
  .kpi-green-1 .kpi,
  .kpi-green-2 .kpi,
  .kpi-blue-3 .kpi,
  .kpi-blue-4 .kpi,
  .kpi-blue-5 .kpi,
  .kpi-blue-6 .kpi,
  .kpi-blue-7 .kpi {
    background: inherit !important;
    box-shadow: inherit !important;
  }

  /* Estilos específicos para las clases del Dashboard - Máxima especificidad */
  .main-dashboard-section .kpis-main-row .kpi-green-1 .kpi {
    background: #002945 !important;
    box-shadow: 0 6px 18px rgba(0, 41, 69, 0.22) !important;
  }

  .main-dashboard-section .kpis-main-row .kpi-green-2 .kpi {
    background: #002945 !important;
    box-shadow: 0 6px 18px rgba(0, 41, 69, 0.22) !important;
  }

  .main-dashboard-section .kpis-main-row .kpi-blue-3 .kpi,
  .main-dashboard-section .kpis-main-row .kpi-blue-4 .kpi,
  .main-dashboard-section .kpis-main-row .kpi-blue-5 .kpi,
  .main-dashboard-section .kpis-main-row .kpi-blue-6 .kpi,
  .main-dashboard-section .kpis-main-row .kpi-blue-7 .kpi {
    background: #98C73B !important;
    box-shadow: 0 6px 18px rgba(152, 199, 59, 0.22) !important;
  }


  /* Permitir que los estilos del Dashboard sobrescriban los del componente */
  .kpis-main-row .kpi {
    background: inherit !important;
    box-shadow: inherit !important;
  }

  .kpis-main-row .kpi:hover {
    transform: inherit !important;
    box-shadow: inherit !important;
  }

  .kpi::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #79BC99 0%, #4E8484 100%);
    border-radius: 16px 16px 0 0;
  }

  /* Quitar la línea verde para todos los KPIs del Dashboard principal */
  .kpis-main-row .kpi::before {
    display: none !important;
  }

  .kpi-header {
    flex-shrink: 0;
    margin-bottom: 12px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .kpi-label {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    line-height: 1.2;
    margin: 0;
    padding: 0;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .kpi-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    text-align: center;
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    margin: 0;
    padding: 0;
    padding-top: 20px;
  }

  .kpi-subtitle {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.3;
    text-align: center;
    flex-shrink: 0;
    margin: 0;
    padding: 0;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ========================================================================
      DISEÑO RESPONSIVE LIMPIO
  ======================================================================== */
  
  @media (max-width: 1200px) {
    .kpi {
      padding: 18px;
      height: 150px;
    }
    
    .kpi-header {
      height: 30px;
      margin-bottom: 10px;
    }
    
    .kpi-label {
      font-size: 0.75rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .kpi-value {
      font-size: 1.6rem;
      padding-top: 18px;
    }
    
    .kpi-subtitle {
      height: 18px;
    }
  }
  
  @media (max-width: 768px) {
    .kpi {
      padding: 16px;
      border-radius: 14px;
      height: 140px;
    }
    
    .kpi-header {
      height: 28px;
      margin-bottom: 8px;
    }
    
    .kpi-label {
      font-size: 0.7rem;
      letter-spacing: 0.4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .kpi-value {
      font-size: 1.4rem;
      padding-top: 16px;
    }
    
    .kpi-subtitle {
      font-size: 0.7rem;
      height: 16px;
    }
  }
  
  @media (max-width: 480px) {
    .kpi {
      padding: 14px;
      border-radius: 12px;
      height: 130px;
    }
    
    .kpi-header {
      height: 26px;
      margin-bottom: 6px;
    }
    
    .kpi-label {
      font-size: 0.65rem;
      letter-spacing: 0.3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .kpi-value {
      font-size: 1.2rem;
      padding-top: 14px;
    }
    
    .kpi-subtitle {
      font-size: 0.65rem;
      height: 14px;
    }
  }
`;

// Inyectar estilos en el head del documento
if (typeof document !== 'undefined') {
  const styleId = 'kpi-responsive-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = kpiStyles;
    document.head.appendChild(style);
  }
}
