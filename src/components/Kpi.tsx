import { nf, cf } from '../utils/utils/metrics';

type Props = {
  label: string;
  value: number;
  format?: 'int' | 'money' | 'pct';
  compactMoney?: boolean;
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
  digits = 0,
  subtitle,
  trend
}: Props) {

  const fmt =
    format === 'money'
      ? (compactMoney ? moneyCompact.format(value) : cf.format(value))
      : format === 'pct'
      ? `${(value * 100).toFixed(digits)} %`
      : nf.format(value);

  return (
    <div className="kpi">
      <div className="kpi-header">
        <div className="kpi-label">{label}</div>
        {trend && (
          <div className={`kpi-trend kpi-trend-${trend}`}>
            {trend === 'up' && '↗'}
            {trend === 'down' && '↘'}
            {trend === 'neutral' && '→'}
          </div>
        )}
      </div>
      <div className="kpi-value">{fmt}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </div>
  );
}
