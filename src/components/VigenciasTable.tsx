import { formatMoneyColombian } from '../utils/utils/metrics';
import type { VigenciaRow } from '../utils/utils/metrics';

type Props = {
  data: VigenciaRow[];
  title?: string;
};

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
              <th className="vig-year-header">
                <svg className="year-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 21L9 15L13 19L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 7H21V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </th>
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
                <td className="vig-num">{row.estimatedCount}</td>
                <td className="vig-money">{formatMoneyColombian(row.estimatedInvestment)}</td>
                <td className="vig-num">{row.realCount}</td>
                <td className="vig-money">{formatMoneyColombian(row.realInvestment)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        /* Paleta de colores consistente */
        :root {
          --primary-blue: #1E3A8A;
          --secondary-blue: #3B82F6;
          --light-gray: #F3F4F6;
          --neutral-bg: #F9FAFB;
          --dark-text: #111827;
          --medium-text: #374151;
          --border-color: #E5E7EB;
          --hover-bg: #EFF6FF;
        }
        
        .vig-table {
          background: #FFFFFF;
          border-radius: 16px;
          border: 2px solid var(--border-color);
          box-shadow: 0 -2px 8px -2px rgba(0, 0, 0, 0.08),
                      0 4px 6px -1px rgba(0, 0, 0, 0.15), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.08),
                      0 10px 15px -3px rgba(0, 0, 0, 0.14);
          overflow: hidden;
          transition: all 0.3s ease;
          margin-bottom: 32px;
        }
        
        .vig-table:hover {
          box-shadow: 0 -3px 10px -2px rgba(0, 0, 0, 0.1),
                      0 10px 15px -3px rgba(0, 0, 0, 0.2), 
                      0 4px 6px -2px rgba(0, 0, 0, 0.1),
                      0 20px 25px -5px rgba(0, 0, 0, 0.16);
          transform: translateY(-3px);
        }
        
        .vig-header { 
          padding: 18px 24px; 
          background: var(--primary-blue);
          border-bottom: 3px solid var(--secondary-blue);
        }
        
        .vig-header h3 { 
          margin: 0; 
          color: #FFFFFF; 
          font-size: 1.25rem; 
          font-weight: 700; 
          letter-spacing: 0.3px;
        }
        
        .vig-wrap { 
          overflow-x: auto; 
        }
        
        .vig { 
          width: 100%; 
          border-collapse: collapse; 
          min-width: 700px; 
        }
        
        /* Encabezados de columnas - Estilo profesional */
        .vig thead th {
          text-align: center; 
          padding: 14px 16px; 
          font-weight: 700; 
          color: var(--medium-text);
          background: var(--light-gray);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid var(--border-color);
        }
        
        /* Encabezado de años - Solo icono */
        .vig thead th.vig-year-header { 
          background: var(--light-gray);
          color: var(--medium-text);
          font-size: 0.9rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px 12px;
        }
        
        .year-icon {
          width: 22px;
          height: 22px;
          color: #3AC2EA;
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
        }
        
        /* Celdas de datos - Fondo claro y neutro */
        .vig tbody td { 
          padding: 13px 16px; 
          border-bottom: 1px solid var(--border-color); 
          color: var(--dark-text); 
          text-align: center;
          transition: background-color 0.2s ease;
          font-size: 0.95rem;
          background: #FFFFFF;
        }
        
        /* Filas alternas con color neutro */
        .vig tbody tr:nth-child(even) td { 
          background: var(--neutral-bg); 
        }
        
        /* Hover en filas - Efecto sutil */
        .vig tbody tr:hover td {
          background: var(--hover-bg) !important;
        }
        
        /* Columna de años en el cuerpo - Fondo cyan igual al icono */
        .vig tbody td.vig-year {
          background: #3AC2EA !important;
          color: #FFFFFF !important;
          font-weight: 800; 
          font-size: 1.1rem;
          white-space: nowrap; 
          border-right: 3px solid #2AB5D9;
        }
        
        .vig tbody tr:hover td.vig-year {
          background: #2AB5D9 !important;
        }
        
        /* Números - Estilo consistente */
        .vig-num { 
          text-align: center; 
          font-weight: 600; 
          color: var(--dark-text);
          font-size: 1rem;
        }
        
        /* Valores monetarios - Con acento verde corporativo */
        .vig-money { 
          text-align: center; 
          font-weight: 700; 
          color: #059669;
          white-space: nowrap;
          font-size: 1rem;
        }
        
        /* Última fila sin borde inferior */
        .vig tbody tr:last-child td {
          border-bottom: none;
        }
        
        @media (max-width: 768px) {
          .vig { min-width: 560px; }
          .vig-header { padding: 14px 18px; }
          .vig-header h3 { font-size: 1.1rem; }
          .vig thead th { padding: 11px 12px; font-size: 0.85rem; }
          .vig thead th.vig-year-header { padding: 11px 10px; }
          .year-icon { width: 20px; height: 20px; }
          .vig tbody td { padding: 10px 12px; font-size: 0.9rem; }
          .vig tbody td.vig-year { font-size: 1rem; }
        }
        
        @media (max-width: 480px) {
          .vig { min-width: 480px; }
          .vig-header { padding: 12px 16px; }
          .vig-header h3 { font-size: 1rem; }
          .vig thead th { padding: 10px 8px; font-size: 0.8rem; }
          .vig thead th.vig-year-header { padding: 10px 8px; }
          .year-icon { width: 18px; height: 18px; }
          .vig tbody td { padding: 9px 8px; font-size: 0.85rem; }
          .vig tbody td.vig-year { font-size: 0.95rem; }
        }
      `}</style>
    </div>
  );
}


