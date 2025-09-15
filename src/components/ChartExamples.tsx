import SimpleBarChart from './SimpleBarChart';

// Ejemplos de datos para diferentes tipos de gráficos
const exampleData1 = [
  { label: 'Obras Públicas', value1: 1500000000, value2: 1200000000 },
  { label: 'Educación', value1: 800000000, value2: 750000000 },
  { label: 'Salud', value1: 600000000, value2: 580000000 },
  { label: 'Cultura', value1: 200000000, value2: 180000000 },
  { label: 'Deporte', value1: 300000000, value2: 250000000 }
];

const exampleData2 = [
  { label: 'Enero', value1: 45, value2: 38 },
  { label: 'Febrero', value1: 52, value2: 41 },
  { label: 'Marzo', value1: 48, value2: 44 },
  { label: 'Abril', value1: 61, value2: 55 },
  { label: 'Mayo', value1: 55, value2: 48 },
  { label: 'Junio', value1: 67, value2: 62 }
];

const exampleData3 = [
  { label: 'Comuna 1', value1: 25, value2: 18 },
  { label: 'Comuna 2', value1: 32, value2: 28 },
  { label: 'Comuna 3', value1: 28, value2: 22 },
  { label: 'Comuna 4', value1: 35, value2: 30 },
  { label: 'Comuna 5', value1: 22, value2: 19 }
];

export default function ChartExamples() {
  return (
    <div className="chart-examples-container">
      <h2>Ejemplos de Gráficos con SimpleBarChart</h2>
      
      <div className="examples-grid">
        {/* Ejemplo 1: Inversión por Dependencia */}
        <div className="example-card">
          <SimpleBarChart
            title="Inversión por Dependencia (2024)"
            data={exampleData1}
            seriesNames={['Presupuesto Asignado', 'Presupuesto Ejecutado']}
            width={600}
            height={350}
            formatValue={(value) => `$${(value / 1000000).toFixed(0)}M`}
          />
        </div>

        {/* Ejemplo 2: Progreso Mensual */}
        <div className="example-card">
          <SimpleBarChart
            title="Progreso de Obras por Mes"
            data={exampleData2}
            seriesNames={['Obras Iniciadas', 'Obras Completadas']}
            width={600}
            height={350}
            formatValue={(value) => `${value}%`}
          />
        </div>

        {/* Ejemplo 3: Distribución por Comuna */}
        <div className="example-card">
          <SimpleBarChart
            title="Distribución de Obras por Comuna"
            data={exampleData3}
            seriesNames={['Total Obras', 'Obras Activas']}
            width={600}
            height={350}
            formatValue={(value) => `${value}`}
          />
        </div>
      </div>

      <div className="usage-instructions">
        <h3>Instrucciones de Uso</h3>
        <div className="instructions-grid">
          <div className="instruction-card">
            <h4>1. Preparar los Datos</h4>
            <p>Los datos deben ser un array de objetos con la estructura:</p>
            <pre>{`{
  label: string,     // Etiqueta del eje X
  value1: number,    // Valor de la primera serie
  value2: number,    // Valor de la segunda serie
  color1?: string,   // Color opcional para serie 1
  color2?: string    // Color opcional para serie 2
}`}</pre>
          </div>

          <div className="instruction-card">
            <h4>2. Configurar el Gráfico</h4>
            <p>Puedes personalizar:</p>
            <ul>
              <li><strong>title:</strong> Título del gráfico</li>
              <li><strong>seriesNames:</strong> Nombres de las series</li>
              <li><strong>width/height:</strong> Dimensiones</li>
              <li><strong>formatValue:</strong> Formato de los valores</li>
              <li><strong>showLegend:</strong> Mostrar/ocultar leyenda</li>
            </ul>
          </div>

          <div className="instruction-card">
            <h4>3. Integrar en tu Componente</h4>
            <pre>{`import SimpleBarChart from './SimpleBarChart';

<SimpleBarChart
  title="Mi Gráfico"
  data={misDatos}
  seriesNames={['Serie A', 'Serie B']}
  formatValue={(value) => \`$\${value.toLocaleString()}\`}
/>`}</pre>
          </div>
        </div>
      </div>

      <style>{`
        .chart-examples-container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          background: linear-gradient(135deg, #D4E6F1 0%, #E8F4F8 100%);
          border-radius: 15px;
          border: 1px solid #79BC99;
        }

        .chart-examples-container h2 {
          text-align: center;
          color: #2C3E50;
          margin-bottom: 30px;
          font-size: 1.8rem;
        }

        .examples-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
        }

        .example-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(121, 188, 153, 0.1);
          border: 1px solid #79BC99;
        }

        .usage-instructions {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(121, 188, 153, 0.1);
          border: 1px solid #79BC99;
        }

        .usage-instructions h3 {
          color: #2C3E50;
          margin-bottom: 20px;
          font-size: 1.4rem;
        }

        .instructions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .instruction-card {
          background: #F8F9FA;
          border-radius: 8px;
          padding: 15px;
          border: 1px solid #E9ECEF;
        }

        .instruction-card h4 {
          color: #3B8686;
          margin-bottom: 10px;
          font-size: 1.1rem;
        }

        .instruction-card p {
          color: #6C757D;
          margin-bottom: 10px;
          line-height: 1.5;
        }

        .instruction-card ul {
          color: #6C757D;
          padding-left: 20px;
        }

        .instruction-card li {
          margin-bottom: 5px;
        }

        .instruction-card pre {
          background: #2C3E50;
          color: #E8F4F8;
          padding: 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          overflow-x: auto;
          margin: 10px 0;
        }

        @media (max-width: 768px) {
          .examples-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .instructions-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .chart-examples-container {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
}
