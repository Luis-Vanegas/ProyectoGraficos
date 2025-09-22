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

export default function KpiModern5({
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
    <div className="kpi-modern-5" role="figure" aria-label={`KPI ${label}: ${fmt}`}>
      <div className="kpi-icon">
        <div className="kpi-icon-bg"></div>
      </div>
      <div className="kpi-content">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{fmt}</div>
        {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

// Estilos CSS flat corporativo
const kpiModern5Styles = `
  .kpi-modern-5 {
    background: #ffffff;
    border-radius: 16px;
    padding: 24px;
    border: 3px solid #79BC99;
    transition: all 0.3s ease;
    position: relative;
    min-height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 4px 12px rgba(121, 188, 153, 0.2);
  }

  .kpi-modern-5:hover {
    border-color: #4E8484;
    box-shadow: 0 8px 24px rgba(121, 188, 153, 0.3);
    transform: translateY(-4px);
  }

  .kpi-icon {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    z-index: 1;
  }

  .kpi-icon-bg {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%);
    border-radius: 12px;
    opacity: 0.1;
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
    font-weight: 700;
    color: #79BC99;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
    line-height: 1.3;
  }

  .kpi-value {
    font-size: 2.4rem;
    font-weight: 800;
    color: #1f2937;
    margin-bottom: 8px;
    line-height: 1.1;
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  }

  .kpi-subtitle {
    font-size: 0.9rem;
    color: #6b7280;
    font-weight: 600;
    margin-top: auto;
    line-height: 1.4;
    padding: 8px 12px;
    background: #f3f4f6;
    border-radius: 8px;
    border-left: 4px solid #79BC99;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .kpi-modern-5 {
      padding: 20px;
      min-height: 120px;
    }
    
    .kpi-value {
      font-size: 2rem;
    }
    
    .kpi-label {
      font-size: 0.8rem;
    }
    
    .kpi-icon {
      width: 32px;
      height: 32px;
      top: 12px;
      right: 12px;
    }
  }

  @media (max-width: 480px) {
    .kpi-modern-5 {
      padding: 16px;
      min-height: 100px;
    }
    
    .kpi-value {
      font-size: 1.8rem;
    }
    
    .kpi-label {
      font-size: 0.75rem;
    }
    
    .kpi-icon {
      width: 28px;
      height: 28px;
      top: 10px;
      right: 10px;
    }
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleId = 'kpi-modern-5-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = kpiModern5Styles;
    document.head.appendChild(style);
  }
}
