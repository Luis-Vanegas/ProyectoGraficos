import { nf } from '../utils/utils/metrics';
import type { VigenciaRow } from '../utils/utils/metrics';

type Props = {
  data: VigenciaRow[];
  title?: string;
};

function formatMoneyAbbr(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '$0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  // Unidades coloquiales en español: mil millones ~ billón (1e12) para CO abreviamos como bill.
  if (abs >= 1_000_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000_000).toFixed(2)} bill.`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)} mil M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)} M`; // millones
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(2)} mil`;
  }
  return `${sign}$${nf.format(abs)}`;
}

export default function VigenciasTable({ data, title }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <div className="vig-table">
      {title && (
        <div className="vig-header">
          <h3>{title}</h3>
        </div>
      )}
      <div className="vig-wrap">
        <table className="vig">
          <thead>
            <tr>
              <th className="vig-year">Año</th>
              <th>Entrega estimada</th>
              <th>Inversión estimada</th>
              <th>Entrega real</th>
              <th>Inversión real</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.year}>
                <td className="vig-year">{row.year}</td>
                <td className="vig-num">{nf.format(row.estimatedCount)}</td>
                <td className="vig-money">{formatMoneyAbbr(row.estimatedInvestment)}</td>
                <td className="vig-num">{nf.format(row.realCount)}</td>
                <td className="vig-money">{formatMoneyAbbr(row.realInvestment)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .vig-table {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e6eef2;
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .vig-header { padding: 16px 20px; background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%); }
        .vig-header h3 { margin: 0; color: #fff; font-size: 1.1rem; font-weight: 700; }
        .vig-wrap { overflow-x: auto; }
        .vig { width: 100%; border-collapse: collapse; min-width: 700px; }
        .vig thead th {
          text-align: center; padding: 14px 12px; font-weight: 700; color: #2c3e50;
          background: #f3f8fb; border-bottom: 1px solid #e6eef2; font-size: 0.95rem;
        }
        .vig tbody td { padding: 12px; border-bottom: 1px solid #eef3f6; color: #2c3e50; text-align: center; }
        .vig tbody tr:nth-child(even) { background: #f9fcfd; }
        .vig-year { font-weight: 700; color: #3b8686; white-space: nowrap; text-align: center; }
        .vig-num { text-align: center; font-weight: 600; color: #2c3e50; }
        .vig-money { text-align: center; font-weight: 600; color: #00904c; white-space: nowrap; }
        @media (max-width: 768px) {
          .vig { min-width: 560px; }
          .vig-header h3 { font-size: 1rem; }
        }
      `}</style>
    </div>
  );
}


