import React, { useState } from 'react';
import { useChatbotLearning } from '../hooks/useChatbotLearning';

// ============================================================================
// PANEL DE APRENDIZAJE DEL CHATBOT
// ============================================================================

interface ChatbotLearningPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatbotLearningPanel: React.FC<ChatbotLearningPanelProps> = ({ isOpen, onClose }) => {
  const {
    patterns,
    stats,
    isLearning,
    learningThreshold,
    analyzeLearningPatterns,
    clearLearningData,
    exportLearningData,
    importLearningData,
    setLearningMode,
    setLearningThreshold
  } = useChatbotLearning();

  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'settings'>('overview');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const analysis = analyzeLearningPatterns();

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importLearningData(file);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#28a745';
    if (confidence >= 0.6) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="learning-panel-overlay">
      <div className="learning-panel">
        <div className="learning-panel-header">
          <h2>🧠 Panel de Aprendizaje del Chatbot</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="learning-panel-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Resumen
          </button>
          <button 
            className={`tab-btn ${activeTab === 'patterns' ? 'active' : ''}`}
            onClick={() => setActiveTab('patterns')}
          >
            🔍 Patrones
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Configuración
          </button>
        </div>

        <div className="learning-panel-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">💬</div>
                  <div className="stat-content">
                    <h3>{stats.totalInteractions}</h3>
                    <p>Interacciones Totales</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">❓</div>
                  <div className="stat-content">
                    <h3>{stats.uniqueQuestions}</h3>
                    <p>Preguntas Únicas</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-content">
                    <h3>{(stats.averageConfidence * 100).toFixed(1)}%</h3>
                    <p>Confianza Promedio</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <h3>{stats.learningAccuracy.toFixed(1)}%</h3>
                    <p>Precisión de Aprendizaje</p>
                  </div>
                </div>
              </div>

              <div className="analysis-section">
                <h3>📊 Análisis de Aprendizaje</h3>
                
                <div className="analysis-item">
                  <strong>Patrones Aprendidos:</strong> {analysis.totalPatterns}
                </div>
                
                <div className="analysis-item">
                  <strong>Uso Promedio por Patrón:</strong> {analysis.averageUsage.toFixed(1)}
                </div>
                
                <div className="analysis-item">
                  <strong>Patrón Más Usado:</strong> 
                  <div className="most-used-pattern">
                    "{analysis.mostUsedPattern.question}"
                    <span className="usage-count">({analysis.mostUsedPattern.usageCount} veces)</span>
                  </div>
                </div>

                <div className="analysis-item">
                  <strong>Tendencia de Aprendizaje:</strong>
                  <span className={`trend-indicator ${analysis.learningTrend}`}>
                    {analysis.learningTrend === 'improving' ? '📈 Mejorando' : 
                     analysis.learningTrend === 'stable' ? '➡️ Estable' : '📉 Declinando'}
                  </span>
                </div>
              </div>

              <div className="intent-distribution">
                <h3>🎯 Distribución de Intenciones</h3>
                <div className="intent-list">
                  {analysis.intentDistribution.map((intent, index) => (
                    <div key={intent.intent} className="intent-item">
                      <span className="intent-rank">#{index + 1}</span>
                      <span className="intent-name">{intent.intent}</span>
                      <span className="intent-count">{intent.count} usos</span>
                    </div>
                  ))}
                </div>
              </div>

              {analysis.recommendations.length > 0 && (
                <div className="recommendations">
                  <h3>💡 Recomendaciones</h3>
                  <ul>
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'patterns' && (
            <div className="patterns-tab">
              <div className="patterns-header">
                <h3>🔍 Patrones de Aprendizaje</h3>
                <div className="patterns-actions">
                  <button className="export-btn" onClick={exportLearningData}>
                    📤 Exportar
                  </button>
                  <label className="import-btn">
                    📥 Importar
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleFileImport}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <div className="patterns-list">
                {patterns.length === 0 ? (
                  <div className="no-patterns">
                    <p>No hay patrones de aprendizaje aún.</p>
                    <p>El chatbot aprenderá automáticamente de las conversaciones.</p>
                  </div>
                ) : (
                  patterns
                    .sort((a, b) => b.usageCount - a.usageCount)
                    .map((pattern) => (
                      <div key={pattern.id} className="pattern-item">
                        <div className="pattern-header">
                          <div className="pattern-question">
                            <strong>Pregunta:</strong> "{pattern.question}"
                          </div>
                          <div className="pattern-meta">
                            <span 
                              className="confidence-badge"
                              style={{ backgroundColor: getConfidenceColor(pattern.confidence) }}
                            >
                              {(pattern.confidence * 100).toFixed(0)}%
                            </span>
                            <span className="usage-badge">
                              {pattern.usageCount} usos
                            </span>
                          </div>
                        </div>
                        
                        <div className="pattern-details">
                          <div className="pattern-intent">
                            <strong>Intención:</strong> {pattern.intent}
                          </div>
                          
                          {Object.keys(pattern.entities).length > 0 && (
                            <div className="pattern-entities">
                              <strong>Entidades:</strong> {Object.entries(pattern.entities).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </div>
                          )}
                          
                          <div className="pattern-dates">
                            <span>Creado: {formatDate(pattern.createdAt)}</span>
                            <span>Último uso: {formatDate(pattern.lastUsed)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <h3>⚙️ Configuración de Aprendizaje</h3>
              
              <div className="setting-item">
                <label className="setting-label">
                  <input 
                    type="checkbox" 
                    checked={isLearning}
                    onChange={(e) => setLearningMode(e.target.checked)}
                  />
                  <span>Modo de Aprendizaje Activo</span>
                </label>
                <p className="setting-description">
                  Cuando está activo, el chatbot aprende de cada conversación para mejorar sus respuestas.
                </p>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  <span>Umbral de Confianza Mínima:</span>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.1" 
                    value={learningThreshold}
                    onChange={(e) => setLearningThreshold(parseFloat(e.target.value))}
                  />
                  <span className="threshold-value">{(learningThreshold * 100).toFixed(0)}%</span>
                </label>
                <p className="setting-description">
                  Solo se usarán respuestas aprendidas con confianza superior a este umbral.
                </p>
              </div>

              <div className="danger-zone">
                <h4>⚠️ Zona de Peligro</h4>
                <p>Estas acciones no se pueden deshacer:</p>
                
                <button 
                  className="danger-btn"
                  onClick={() => setShowClearConfirm(true)}
                >
                  🗑️ Limpiar Todos los Datos de Aprendizaje
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para limpiar datos */}
      {showClearConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>⚠️ Confirmar Eliminación</h3>
            <p>¿Estás seguro de que quieres eliminar todos los datos de aprendizaje?</p>
            <p><strong>Esta acción no se puede deshacer.</strong></p>
            
            <div className="confirm-actions">
              <button 
                className="confirm-btn danger"
                onClick={() => {
                  clearLearningData();
                  setShowClearConfirm(false);
                }}
              >
                Sí, Eliminar Todo
              </button>
              <button 
                className="confirm-btn"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS */}
      <style>{`
        .learning-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .learning-panel {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .learning-panel-header {
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%);
          color: white;
          padding: 20px;
          border-radius: 20px 20px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .learning-panel-header h2 {
          margin: 0;
          font-size: 20px;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .learning-panel-tabs {
          display: flex;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .tab-btn {
          flex: 1;
          padding: 15px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background: white;
          color: #79BC99;
          border-bottom: 2px solid #79BC99;
        }

        .learning-panel-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 15px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          border: 1px solid #dee2e6;
        }

        .stat-icon {
          font-size: 24px;
        }

        .stat-content h3 {
          margin: 0;
          font-size: 24px;
          color: #2c3e50;
        }

        .stat-content p {
          margin: 0;
          font-size: 12px;
          color: #6c757d;
        }

        .analysis-section {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .analysis-item {
          margin-bottom: 15px;
          padding: 10px;
          background: white;
          border-radius: 8px;
          border-left: 4px solid #79BC99;
        }

        .most-used-pattern {
          margin-top: 5px;
          font-style: italic;
          color: #6c757d;
        }

        .usage-count {
          color: #79BC99;
          font-weight: bold;
        }

        .trend-indicator {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .trend-indicator.improving {
          background: #d4edda;
          color: #155724;
        }

        .trend-indicator.stable {
          background: #fff3cd;
          color: #856404;
        }

        .trend-indicator.declining {
          background: #f8d7da;
          color: #721c24;
        }

        .intent-distribution {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 20px;
        }

        .intent-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .intent-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px;
          background: white;
          border-radius: 8px;
        }

        .intent-rank {
          background: #79BC99;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }

        .intent-name {
          flex: 1;
          font-weight: 500;
        }

        .intent-count {
          color: #6c757d;
          font-size: 12px;
        }

        .recommendations {
          background: #e3f2fd;
          border-radius: 15px;
          padding: 20px;
          border-left: 4px solid #2196f3;
        }

        .recommendations ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }

        .recommendations li {
          margin-bottom: 5px;
        }

        .patterns-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .patterns-actions {
          display: flex;
          gap: 10px;
        }

        .export-btn,
        .import-btn {
          background: #79BC99;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
        }

        .no-patterns {
          text-align: center;
          padding: 40px;
          color: #6c757d;
        }

        .pattern-item {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 15px;
          border: 1px solid #e9ecef;
        }

        .pattern-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .pattern-question {
          flex: 1;
          margin-right: 15px;
        }

        .pattern-meta {
          display: flex;
          gap: 8px;
        }

        .confidence-badge,
        .usage-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          color: white;
        }

        .usage-badge {
          background: #6c757d;
        }

        .pattern-details {
          font-size: 13px;
          color: #6c757d;
        }

        .pattern-details > div {
          margin-bottom: 5px;
        }

        .pattern-dates {
          display: flex;
          gap: 20px;
          margin-top: 10px;
          font-size: 11px;
        }

        .setting-item {
          margin-bottom: 25px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .setting-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
          margin-bottom: 10px;
        }

        .setting-description {
          font-size: 13px;
          color: #6c757d;
          margin: 0;
        }

        .threshold-value {
          background: #79BC99;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
        }

        .danger-zone {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
        }

        .danger-zone h4 {
          color: #721c24;
          margin: 0 0 10px 0;
        }

        .danger-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 10px;
        }

        .confirm-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
        }

        .confirm-modal {
          background: white;
          border-radius: 15px;
          padding: 30px;
          max-width: 400px;
          text-align: center;
        }

        .confirm-modal h3 {
          color: #dc3545;
          margin: 0 0 15px 0;
        }

        .confirm-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 20px;
        }

        .confirm-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .confirm-btn.danger {
          background: #dc3545;
          color: white;
        }

        .confirm-btn:not(.danger) {
          background: #6c757d;
          color: white;
        }

        @media (max-width: 768px) {
          .learning-panel {
            width: 95%;
            max-height: 95vh;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .pattern-header {
            flex-direction: column;
            gap: 10px;
          }

          .patterns-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatbotLearningPanel;
