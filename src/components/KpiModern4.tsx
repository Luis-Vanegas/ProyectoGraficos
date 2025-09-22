import { nf, cf } from '../utils/utils/metrics';

type Props = {
  label: string;
  value: number;
  format?: 'int' | 'money' | 'pct';
  compactMoney?: boolean;
  abbreviate?: boolean;
  digits?: number;
  loading?: boolean;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
};

const moneyCompact = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export default function KpiModern4({
  label,
  value,
  format = 'int',
  compactMoney = false,
  abbreviate = false,
  digits = 0,
  subtitle
}: Props) {

  const abbreviateNumber = (num: number, d = 1): string => {
    const abs = Math.abs(num);
    const units = [
      { v: 1e12, s: 'B' },
      { v: 1e9,  s: 'MM' },
      { v: 1e6,  s: 'M' },
      { v: 1e3,  s: 'K' },
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
      if (abbreviate && Math.abs(value) >= 1e6) {
        return abbreviateNumber(value, Math.max(digits, 1));
      }
      return compactMoney ? moneyCompact.format(value) : cf.format(value);
    }
    if (format === 'pct') return `${(value * 100).toFixed(digits)} %`;
    return nf.format(value);
  })();

  return (
    <div className="kpi-modern-4" role="figure" aria-label={`KPI ${label}: ${fmt}`}>
      <div className="kpi-neon-border"></div>
      <div className="kpi-content">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{fmt}</div>
        {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

// Estilos CSS neón
const kpiModern4Styles = `
  .kpi-modern-4 {
    position: relative;
    background: #0a0a0a;
    border-radius: 16px;
    padding: 24px;
    transition: all 0.4s ease;
    overflow: hidden;
    min-height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .kpi-modern-4:hover {
    transform: translateY(-6px);
  }

  .kpi-neon-border {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 16px;
    background: linear-gradient(45deg, 
      #79BC99, #4E8484, #3B8686, #79BC99);
    background-size: 400% 400%;
    animation: neonGlow 3s ease-in-out infinite;
    z-index: 1;
  }

  .kpi-neon-border::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    background: #0a0a0a;
    border-radius: 14px;
    z-index: 2;
  }

  .kpi-content {
    position: relative;
    z-index: 3;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .kpi-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #79BC99;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
    line-height: 1.3;
    text-shadow: 0 0 10px rgba(121, 188, 153, 0.5);
  }

  .kpi-value {
    font-size: 2.2rem;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 8px;
    line-height: 1.1;
    text-shadow: 
      0 0 5px rgba(121, 188, 153, 0.8),
      0 0 10px rgba(121, 188, 153, 0.6),
      0 0 15px rgba(121, 188, 153, 0.4);
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  }

  .kpi-subtitle {
    font-size: 0.85rem;
    color: #4E8484;
    font-weight: 500;
    margin-top: auto;
    line-height: 1.4;
    text-shadow: 0 0 5px rgba(78, 132, 132, 0.3);
  }

  @keyframes neonGlow {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .kpi-modern-4 {
      padding: 20px;
      min-height: 120px;
    }
    
    .kpi-value {
      font-size: 1.8rem;
    }
    
    .kpi-label {
      font-size: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .kpi-modern-4 {
      padding: 16px;
      min-height: 100px;
    }
    
    .kpi-value {
      font-size: 1.6rem;
    }
    
    .kpi-label {
      font-size: 0.75rem;
    }
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleId = 'kpi-modern-4-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = kpiModern4Styles;
    document.head.appendChild(style);
  }
}
