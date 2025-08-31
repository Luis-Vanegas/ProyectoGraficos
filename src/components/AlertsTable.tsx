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
    </div>
  );
}
