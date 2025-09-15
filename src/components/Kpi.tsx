import { nf, cf } from '../utils/utils/metrics';

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
  subtitle
  // trend
}: Props) {

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
        return abbreviateNumber(value, Math.max(digits, 1));
      }
      return compactMoney ? moneyCompact.format(value) : cf.format(value);
    }
    if (format === 'pct') return `${(value * 100).toFixed(digits)} %`;
    // Para números no monetarios, mostrar normal por defecto
    return nf.format(value);
  })();

  return (
    <div className="kpi" role="figure" aria-label={`KPI ${label}: ${fmt}`}>
      <div className="kpi-header">
        <div className="kpi-label">{label}</div>
      </div>
      <div className="kpi-value">{fmt}</div>
      {subtitle && <div className="kpi-subtitle" title={subtitle}>{subtitle}</div>}
    </div>
  );
}

// Estilos CSS con responsive design
const kpiStyles = `
  .kpi {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border-radius: 14px;
    padding: 18px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    border: 1px solid #e0e0e0;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .kpi:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.15);
  }

  .kpi::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #00904c 0%, #79BC99 100%);
  }

  .kpi-header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 10px;
  }

  .kpi-label {
    color: #555;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .kpi-value {
    font-size: 1.6rem;
    font-weight: bold;
    color: #333;
    margin-bottom: 6px;
    line-height: 1.2;
  }

  .kpi-subtitle {
    color: #666;
    font-size: 0.8rem;
    font-style: italic;
    opacity: 0.8;
  }

  /* ========================================================================
      DISEÑO RESPONSIVE COMPLETO
  ======================================================================== */
  
  @media (max-width: 1200px) {
    .kpi {
      padding: 16px;
    }
    
    .kpi-label {
      font-size: 0.8rem;
    }
    
    .kpi-value {
      font-size: 1.5rem;
    }
  }
  
  @media (max-width: 768px) {
    .kpi {
      padding: 14px;
      border-radius: 12px;
    }
    
    .kpi-header {
      margin-bottom: 8px;
    }
    
    .kpi-label {
      font-size: 0.78rem;
      letter-spacing: 0.3px;
    }
    
    .kpi-value {
      font-size: 1.35rem;
      margin-bottom: 4px;
    }
    
    .kpi-subtitle {
      font-size: 0.75rem;
    }
  }
  
  @media (max-width: 480px) {
    .kpi {
      padding: 12px;
      border-radius: 10px;
    }
    
    .kpi-header {
      margin-bottom: 6px;
    }
    
    .kpi-label {
      font-size: 0.72rem;
      letter-spacing: 0.2px;
    }
    
    .kpi-value {
      font-size: 1.2rem;
      margin-bottom: 3px;
    }
    
    .kpi-subtitle {
      font-size: 0.7rem;
    }
  }
  
  @media (max-width: 360px) {
    .kpi {
      padding: 10px;
      border-radius: 8px;
    }
    
    .kpi-header {
      margin-bottom: 4px;
    }
    
    .kpi-label {
      font-size: 0.68rem;
      letter-spacing: 0.1px;
    }
    
    .kpi-value {
      font-size: 1.1rem;
      margin-bottom: 2px;
    }
    
    .kpi-subtitle {
      font-size: 0.65rem;
    }
  }
  
  /* Manejo especial para pantallas muy pequeñas */
  @media (max-width: 320px) {
    .kpi {
      padding: 8px;
    }
    
    .kpi-label {
      font-size: 0.62rem;
    }
    
    .kpi-value {
      font-size: 1rem;
    }
    
    .kpi-subtitle {
      font-size: 0.6rem;
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
