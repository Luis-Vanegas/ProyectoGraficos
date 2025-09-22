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

export default function KpiModern2({
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
    <div className="kpi-modern-2" role="figure" aria-label={`KPI ${label}: ${fmt}`}>
      <div className="kpi-header">
        <div className="kpi-label">{label}</div>
        <div className="kpi-line"></div>
      </div>
      <div className="kpi-value">{fmt}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </div>
  );
}

// Estilos CSS minimalistas
const kpiModern2Styles = `
  .kpi-modern-2 {
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    border: 2px solid #e5e7eb;
    transition: all 0.3s ease;
    position: relative;
    min-height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .kpi-modern-2:hover {
    border-color: #79BC99;
    box-shadow: 0 8px 25px rgba(121, 188, 153, 0.15);
    transform: translateY(-2px);
  }

  .kpi-header {
    margin-bottom: 16px;
  }

  .kpi-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .kpi-line {
    width: 40px;
    height: 3px;
    background: linear-gradient(90deg, #79BC99 0%, #4E8484 100%);
    border-radius: 2px;
  }

  .kpi-value {
    font-size: 2.4rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 8px;
    line-height: 1.1;
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  }

  .kpi-subtitle {
    font-size: 0.9rem;
    color: #6b7280;
    font-weight: 500;
    margin-top: auto;
    line-height: 1.4;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .kpi-modern-2 {
      padding: 20px;
      min-height: 120px;
    }
    
    .kpi-value {
      font-size: 2rem;
    }
    
    .kpi-label {
      font-size: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .kpi-modern-2 {
      padding: 16px;
      min-height: 100px;
    }
    
    .kpi-value {
      font-size: 1.8rem;
    }
    
    .kpi-label {
      font-size: 0.75rem;
    }
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleId = 'kpi-modern-2-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = kpiModern2Styles;
    document.head.appendChild(style);
  }
}
