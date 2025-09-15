import React from 'react';

// ============================================================================
// EJEMPLOS DE USO DEL CHATBOT
// ============================================================================

interface ChatbotExamplesProps {
  onExampleClick: (example: string) => void;
}

const ChatbotExamples: React.FC<ChatbotExamplesProps> = ({ onExampleClick }) => {
  const examples = [
    {
      category: "📊 Métricas Generales",
      examples: [
        "¿Cuántas obras hay en total?",
        "¿Cuál es la inversión total?",
        "¿Cuántas obras están entregadas?",
        "¿Cuántas alertas hay?",
        "¿Cuál es el porcentaje de ejecución presupuestal?"
      ]
    },
    {
      category: "🏘️ Análisis por Comuna",
      examples: [
        "¿Cuántas obras hay en la comuna El Poblado?",
        "¿Cuál es la inversión en la comuna Laureles?",
        "¿Qué obras están en la comuna Manrique?",
        "¿Cuántas obras entregadas hay en Belén?",
        "¿Cuál es el presupuesto ejecutado en Robledo?"
      ]
    },
    {
      category: "🏢 Análisis por Dependencia",
      examples: [
        "¿Cuántas obras tiene la Secretaría de Infraestructura?",
        "¿Cuál es el presupuesto de la Secretaría de Educación?",
        "¿Qué obras están a cargo de la Secretaría de Movilidad?",
        "¿Cuántas alertas tiene la Secretaría de Salud?",
        "¿Cuál es el avance de la Secretaría de Cultura?"
      ]
    },
    {
      category: "🎯 Análisis por Proyecto",
      examples: [
        "¿Cuántas obras tiene el proyecto Metro La 80?",
        "¿Cuál es el avance del proyecto Escuelas Inteligentes?",
        "¿Qué obras están en Tacita de Plata?",
        "¿Cuántas obras tiene Jardines de Buen Comienzo?",
        "¿Cuál es la inversión en Escenarios Deportivos?"
      ]
    },
    {
      category: "⚠️ Análisis de Riesgos",
      examples: [
        "¿Cuántas obras tienen alertas?",
        "¿Cuáles son los riesgos más comunes?",
        "¿Qué obras tienen impacto alto?",
        "¿Cuántas alertas hay por dependencia?",
        "¿Cuál es el estado de los riesgos identificados?"
      ]
    },
    {
      category: "🔍 Consultas Combinadas",
      examples: [
        "¿Cuántas obras de la Secretaría de Infraestructura hay en El Poblado?",
        "¿Cuál es la inversión del proyecto Metro La 80 en 2024?",
        "¿Qué obras con alertas están en la comuna Manrique?",
        "¿Cuántas obras entregadas tiene la Secretaría de Educación?",
        "¿Cuál es el presupuesto ejecutado por comuna en 2024?"
      ]
    }
  ];

  return (
    <div className="chatbot-examples">
      <div className="examples-header">
        <h3>💡 Ejemplos de Preguntas</h3>
        <p>Haz clic en cualquier ejemplo para probarlo</p>
      </div>

      <div className="examples-grid">
        {examples.map((category, categoryIndex) => (
          <div key={categoryIndex} className="example-category">
            <h4 className="category-title">{category.category}</h4>
            <div className="examples-list">
              {category.examples.map((example, exampleIndex) => (
                <button
                  key={exampleIndex}
                  className="example-button"
                  onClick={() => onExampleClick(example)}
                  title={`Hacer clic para probar: ${example}`}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="examples-footer">
        <p>💡 <strong>Tip:</strong> El chatbot aprende de cada conversación y mejora sus respuestas con el tiempo.</p>
        <p>🧠 Accede al <strong>Panel de Aprendizaje</strong> para ver estadísticas y patrones aprendidos.</p>
      </div>

      <style>{`
        .chatbot-examples {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 15px;
          padding: 20px;
          margin: 20px 0;
          border: 1px solid #79BC99;
        }

        .examples-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .examples-header h3 {
          margin: 0 0 8px 0;
          color: #2c3e50;
          font-size: 1.3rem;
        }

        .examples-header p {
          margin: 0;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .examples-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .example-category {
          background: white;
          border-radius: 12px;
          padding: 15px;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .category-title {
          margin: 0 0 15px 0;
          font-size: 1rem;
          font-weight: 600;
          color: #79BC99;
          padding-bottom: 8px;
          border-bottom: 2px solid #79BC99;
        }

        .examples-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .example-button {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.85rem;
          color: #495057;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          line-height: 1.3;
        }

        .example-button:hover {
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%);
          color: white;
          border-color: #79BC99;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(121, 188, 153, 0.3);
        }

        .example-button:active {
          transform: translateY(0);
        }

        .examples-footer {
          background: rgba(121, 188, 153, 0.1);
          border-radius: 10px;
          padding: 15px;
          border-left: 4px solid #79BC99;
        }

        .examples-footer p {
          margin: 0 0 8px 0;
          font-size: 0.9rem;
          color: #2c3e50;
          line-height: 1.4;
        }

        .examples-footer p:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 768px) {
          .examples-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .example-category {
            padding: 12px;
          }

          .example-button {
            padding: 8px 10px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatbotExamples;
