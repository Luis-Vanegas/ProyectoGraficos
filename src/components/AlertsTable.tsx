import { F } from '../dataConfig';
import { type Row } from '../utils/utils/metrics';

type Props = {
  alerts: Row[];
  maxRows?: number;
};

export default function AlertsTable({ alerts, maxRows = 10 }: Props) {
  const displayAlerts = alerts.slice(0, maxRows);

  return (
    <div className="alerts-table">
      <h3 className="alerts-title">
        Alertas <span className="alerts-count">({alerts.length})</span>
      </h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="table-header">Nombre</th>
              <th className="table-header">Descripción del Riesgo</th>
            </tr>
          </thead>
          <tbody>
            {displayAlerts.map((alert, index) => (
              <tr key={index} className="table-row alert-row">
                <td className="table-cell alert-name">
                  {String(alert[F.nombre] ?? '')}
                </td>
                <td className="table-cell alert-description">
                  {String(alert[F.descripcionDelRiesgo] ?? '')}
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr>
                <td colSpan={2} className="table-cell no-data">
                  No hay alertas activas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {alerts.length > maxRows && (
        <div className="alerts-footer">
          Mostrando {maxRows} de {alerts.length} alertas
        </div>
      )}

      {/* Estilos CSS con responsive design */}
      <style>{`
        .alerts-table {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          border: 1px solid #e0e0e0;
        }

        .alerts-title {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 1.3rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .alerts-count {
          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .table-container {
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid #e0e0e0;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          min-width: 400px;
        }

        .table-header {
          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
          color: white;
          padding: 15px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 0.95rem;
          border: none;
        }

        .table-header:first-child {
          border-top-left-radius: 10px;
        }

        .table-header:last-child {
          border-top-right-radius: 10px;
        }

        .table-row {
          transition: background-color 0.2s ease;
        }

        .table-row:hover {
          background-color: #fff5f0;
        }

        .table-row:nth-child(even) {
          background-color: #f8f9fa;
        }

        .table-row:nth-child(even):hover {
          background-color: #fff5f0;
        }

        .alert-row {
          border-left: 4px solid #ff6b35;
        }

        .table-cell {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 0.9rem;
          color: #333;
        }

        .alert-name {
          font-weight: 500;
          max-width: 200px;
          word-wrap: break-word;
        }

        .alert-description {
          color: #666;
          max-width: 400px;
          word-wrap: break-word;
          line-height: 1.4;
        }

        .no-data {
          text-align: center;
          color: #666;
          font-style: italic;
          padding: 30px;
        }

        .alerts-footer {
          margin-top: 15px;
          text-align: center;
          color: #666;
          font-size: 0.85rem;
          font-style: italic;
        }

        /* ========================================================================
            DISEÑO RESPONSIVE COMPLETO
        ======================================================================== */
        
        @media (max-width: 1200px) {
          .alerts-table {
            padding: 20px;
          }
          
          .alerts-title {
            font-size: 1.2rem;
            margin-bottom: 18px;
          }
          
          .table-header {
            padding: 12px 10px;
            font-size: 0.9rem;
          }
          
          .table-cell {
            padding: 10px;
            font-size: 0.85rem;
          }
          
          .alert-name {
            max-width: 180px;
          }
          
          .alert-description {
            max-width: 350px;
          }
        }
        
        @media (max-width: 768px) {
          .alerts-table {
            padding: 18px;
            border-radius: 12px;
          }
          
          .alerts-title {
            font-size: 1.1rem;
            margin-bottom: 15px;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .table-container {
            border-radius: 8px;
          }
          
          .table {
            min-width: 350px;
          }
          
          .table-header {
            padding: 10px 8px;
            font-size: 0.85rem;
          }
          
          .table-cell {
            padding: 8px;
            font-size: 0.8rem;
          }
          
          .alert-name {
            max-width: 150px;
          }
          
          .alert-description {
            max-width: 250px;
          }
          
          .alerts-footer {
            margin-top: 12px;
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 480px) {
          .alerts-table {
            padding: 15px;
            border-radius: 10px;
          }
          
          .alerts-title {
            font-size: 1rem;
            margin-bottom: 12px;
          }
          
          .alerts-count {
            padding: 3px 10px;
            font-size: 0.8rem;
          }
          
          .table-container {
            border-radius: 6px;
          }
          
          .table {
            min-width: 300px;
          }
          
          .table-header {
            padding: 8px 6px;
            font-size: 0.8rem;
          }
          
          .table-cell {
            padding: 6px;
            font-size: 0.75rem;
          }
          
          .alert-name {
            max-width: 120px;
          }
          
          .alert-description {
            max-width: 200px;
          }
          
          .alerts-footer {
            margin-top: 10px;
            font-size: 0.75rem;
          }
        }
        
        @media (max-width: 360px) {
          .alerts-table {
            padding: 12px;
            border-radius: 8px;
          }
          
          .alerts-title {
            font-size: 0.95rem;
            margin-bottom: 10px;
          }
          
          .table {
            min-width: 250px;
          }
          
          .table-header {
            padding: 6px 4px;
            font-size: 0.75rem;
          }
          
          .table-cell {
            padding: 4px;
            font-size: 0.7rem;
          }
          
          .alert-name {
            max-width: 100px;
          }
          
          .alert-description {
            max-width: 150px;
          }
          
          .alerts-footer {
            margin-top: 8px;
            font-size: 0.7rem;
          }
        }
        
        /* Manejo especial para pantallas muy pequeñas */
        @media (max-width: 320px) {
          .alerts-table {
            padding: 10px;
          }
          
          .table {
            min-width: 220px;
          }
          
          .table-header {
            font-size: 0.7rem;
          }
          
          .table-cell {
            font-size: 0.65rem;
          }
          
          .alert-name {
            max-width: 80px;
          }
          
          .alert-description {
            max-width: 120px;
          }
        }
      `}</style>
    </div>
  );
}
