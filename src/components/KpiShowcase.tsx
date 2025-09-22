// import React from 'react';
import KpiModern1 from './KpiModern1';
import KpiModern2 from './KpiModern2';
import KpiModern3 from './KpiModern3';
import KpiModern4 from './KpiModern4';
import KpiModern5 from './KpiModern5';

const KpiShowcase = () => {
  const sampleData = [
    { label: "Total obras", value: 1352, format: 'int' as const },
    { label: "Inversión total", value: 10800000000, format: 'money' as const, abbreviate: true, subtitle: "22% ejecutado" },
    { label: "Presupuesto ejecutado", value: 2400000000, format: 'money' as const, abbreviate: true, subtitle: "22% de la inversión" },
    { label: "Obras entregadas", value: 304, format: 'int' as const, subtitle: "22% del total" },
    { label: "Alertas", value: 0, format: 'int' as const },
    { label: "Sin coordenadas", value: 12, format: 'int' as const, subtitle: "Obras sin ubicación" }
  ];

  return (
    <div className="kpi-showcase">
      <h2>Opciones Modernas para KPIs</h2>
      
      {/* Opción 1: Gradientes */}
      <div className="showcase-section">
        <h3>Opción 1: Tarjetas con Gradientes</h3>
        <div className="kpis-grid">
          {sampleData.map((kpi, index) => (
            <KpiModern1 key={index} {...kpi} />
          ))}
        </div>
      </div>

      {/* Opción 2: Minimalista */}
      <div className="showcase-section">
        <h3>Opción 2: Diseño Minimalista</h3>
        <div className="kpis-grid">
          {sampleData.map((kpi, index) => (
            <KpiModern2 key={index} {...kpi} />
          ))}
        </div>
      </div>

      {/* Opción 3: Glassmorphism */}
      <div className="showcase-section">
        <h3>Opción 3: Efecto Glassmorphism</h3>
        <div className="kpis-grid">
          {sampleData.map((kpi, index) => (
            <KpiModern3 key={index} {...kpi} />
          ))}
        </div>
      </div>

      {/* Opción 4: Neón */}
      <div className="showcase-section">
        <h3>Opción 4: Estilo Neón</h3>
        <div className="kpis-grid">
          {sampleData.map((kpi, index) => (
            <KpiModern4 key={index} {...kpi} />
          ))}
        </div>
      </div>

      {/* Opción 5: Flat Corporativo */}
      <div className="showcase-section">
        <h3>Opción 5: Diseño Flat Corporativo</h3>
        <div className="kpis-grid">
          {sampleData.map((kpi, index) => (
            <KpiModern5 key={index} {...kpi} />
          ))}
        </div>
      </div>

      <style>{`
        .kpi-showcase {
          padding: 40px 20px;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .kpi-showcase h2 {
          text-align: center;
          color: #1f2937;
          font-size: 2.5rem;
          margin-bottom: 40px;
          font-weight: 800;
        }

        .showcase-section {
          margin-bottom: 60px;
          background: white;
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .showcase-section h3 {
          color: #79BC99;
          font-size: 1.5rem;
          margin-bottom: 20px;
          font-weight: 700;
          text-align: center;
        }

        .kpis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          align-items: stretch;
        }

        @media (max-width: 768px) {
          .kpi-showcase {
            padding: 20px 10px;
          }
          
          .kpi-showcase h2 {
            font-size: 2rem;
            margin-bottom: 30px;
          }
          
          .showcase-section {
            padding: 20px;
            margin-bottom: 40px;
          }
          
          .kpis-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default KpiShowcase;
