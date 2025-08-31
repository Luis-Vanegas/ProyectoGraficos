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
    </div>
  );
}
