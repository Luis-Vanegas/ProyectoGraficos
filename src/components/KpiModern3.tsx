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

export default function KpiModern3({
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
    <div className="kpi-modern-3" role="figure" aria-label={`KPI ${label}: ${fmt}`}>
      <div className="kpi-glass-bg"></div>
      <div className="kpi-content">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{fmt}</div>
        {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

// Estilos CSS glassmorphism
const kpiModern3Styles = `
  .kpi-modern-3 {
    position: relative;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.4s ease;
    overflow: hidden;
    min-height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .kpi-modern-3:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(121, 188, 153, 0.3);
    box-shadow: 
      0 16px 48px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transform: translateY(-4px);
  }

  .kpi-glass-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(121, 188, 153, 0.1) 0%, 
      rgba(78, 132, 132, 0.1) 50%, 
      rgba(59, 134, 134, 0.1) 100%);
    z-index: 1;
  }

  .kpi-content {
    position: relative;
    z-index: 2;
    color: #1f2937;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .kpi-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #4b5563;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 12px;
    line-height: 1.3;
  }

  .kpi-value {
    font-size: 2.2rem;
    font-weight: 800;
    color: #111827;
    margin-bottom: 8px;
    line-height: 1.1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  }

  .kpi-subtitle {
    font-size: 0.85rem;
    color: #6b7280;
    font-weight: 500;
    margin-top: auto;
    line-height: 1.4;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .kpi-modern-3 {
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
    .kpi-modern-3 {
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
  const styleId = 'kpi-modern-3-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = kpiModern3Styles;
    document.head.appendChild(style);
  }
}
