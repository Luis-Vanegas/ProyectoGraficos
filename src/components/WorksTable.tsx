import { F } from '../dataConfig';
import { type Row } from '../utils/utils/metrics';

type Props = {
  title: string;
  works: Row[];
  type: 'entregadas' | 'porEntregar';
  maxRows?: number;
};

export default function WorksTable({ title, works, type, maxRows = 10 }: Props) {
  const displayWorks = works.slice(0, maxRows);
  
  const getDateField = () => {
    return type === 'entregadas' ? F.fechaRealDeEntrega : F.fechaEstimadaDeEntrega;
  };

  const getCostField = () => {
    return F.costoTotalActualizado || F.costoEstimadoTotal;
  };

  const formatCurrency = (value: unknown) => {
    const num = Number(value ?? 0);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="works-table">
      <h3 className="works-table-title">{title}</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="table-header">Nombre</th>
              {getDateField() && <th className="table-header">Fecha</th>}
              {getCostField() && <th className="table-header">Costo</th>}
            </tr>
          </thead>
          <tbody>
            {displayWorks.map((work, index) => (
              <tr key={index} className="table-row">
                <td className="table-cell work-name">
                  {String(work[F.nombre] ?? '')}
                </td>
                {getDateField() && (
                  <td className="table-cell work-date">
                    {String(work[getDateField()!] ?? '')}
                  </td>
                )}
                {getCostField() && (
                  <td className="table-cell work-cost">
                    {formatCurrency(work[getCostField()!])}
                  </td>
                )}
              </tr>
            ))}
            {works.length === 0 && (
              <tr>
                <td colSpan={3} className="table-cell no-data">
                  No hay obras {type === 'entregadas' ? 'entregadas' : 'por entregar'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {works.length > maxRows && (
        <div className="works-table-footer">
          Mostrando {maxRows} de {works.length} obras
        </div>
      )}

      {/* Estilos CSS con responsive design */}
      <style>{`
        .works-table {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          border: 1px solid #e0e0e0;
        }

        .works-table-title {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 1.3rem;
          font-weight: 600;
        }

        .table-container {
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid #e0e0e0;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          min-width: 500px;
        }

        .table-header {
          background: linear-gradient(135deg, #00904c 0%, #007a3d 100%);
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
          background-color: #f8f9fa;
        }

        .table-row:nth-child(even) {
          background-color: #f8f9fa;
        }

        .table-row:nth-child(even):hover {
          background-color: #e9ecef;
        }

        .table-cell {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 0.9rem;
          color: #333;
        }

        .work-name {
          font-weight: 500;
          max-width: 300px;
          word-wrap: break-word;
        }

        .work-date {
          color: #666;
          white-space: nowrap;
        }

        .work-cost {
          font-weight: 600;
          color: #00904c;
          text-align: right;
          white-space: nowrap;
        }

        .no-data {
          text-align: center;
          color: #666;
          font-style: italic;
          padding: 30px;
        }

        .works-table-footer {
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
          .works-table {
            padding: 20px;
          }
          
          .works-table-title {
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
        }
        
        @media (max-width: 768px) {
          .works-table {
            padding: 18px;
            border-radius: 12px;
          }
          
          .works-table-title {
            font-size: 1.1rem;
            margin-bottom: 15px;
          }
          
          .table-container {
            border-radius: 8px;
          }
          
          .table {
            min-width: 400px;
          }
          
          .table-header {
            padding: 10px 8px;
            font-size: 0.85rem;
          }
          
          .table-cell {
            padding: 8px;
            font-size: 0.8rem;
          }
          
          .work-name {
            max-width: 200px;
          }
          
          .works-table-footer {
            margin-top: 12px;
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 480px) {
          .works-table {
            padding: 15px;
            border-radius: 10px;
          }
          
          .works-table-title {
            font-size: 1rem;
            margin-bottom: 12px;
          }
          
          .table-container {
            border-radius: 6px;
          }
          
          .table {
            min-width: 350px;
          }
          
          .table-header {
            padding: 8px 6px;
            font-size: 0.8rem;
          }
          
          .table-cell {
            padding: 6px;
            font-size: 0.75rem;
          }
          
          .work-name {
            max-width: 150px;
          }
          
          .works-table-footer {
            margin-top: 10px;
            font-size: 0.75rem;
          }
        }
        
        @media (max-width: 360px) {
          .works-table {
            padding: 12px;
            border-radius: 8px;
          }
          
          .works-table-title {
            font-size: 0.95rem;
            margin-bottom: 10px;
          }
          
          .table {
            min-width: 300px;
          }
          
          .table-header {
            padding: 6px 4px;
            font-size: 0.75rem;
          }
          
          .table-cell {
            padding: 4px;
            font-size: 0.7rem;
          }
          
          .work-name {
            max-width: 120px;
          }
          
          .works-table-footer {
            margin-top: 8px;
            font-size: 0.7rem;
          }
        }
        
        /* Manejo especial para pantallas muy pequeñas */
        @media (max-width: 320px) {
          .works-table {
            padding: 10px;
          }
          
          .table {
            min-width: 280px;
          }
          
          .table-header {
            font-size: 0.7rem;
          }
          
          .table-cell {
            font-size: 0.65rem;
          }
          
          .work-name {
            max-width: 100px;
          }
        }
      `}</style>
    </div>
  );
}
