import React, { useState, useEffect, useRef } from 'react';
import { F } from '../dataConfig';
import type { Row, Filters } from '../utils/utils/metrics';
import { applyFilters, kpis, uniques, groupSum } from '../utils/utils/metrics';
import ChatbotExamples from './ChatbotExamples';

// ============================================================================
// TIPOS Y INTERFACES DEL CHATBOT
// ============================================================================

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: any; // Datos adicionales para respuestas complejas
}

interface ChatbotState {
  messages: ChatMessage[];
  isTyping: boolean;
  isOpen: boolean;
  currentFilters: Filters;
  learningMode: boolean;
}

interface QueryAnalysis {
  intent: string;
  entities: Record<string, string>;
  confidence: number;
  requiresData: boolean;
  dataQuery?: string;
}

// ============================================================================
// SISTEMA DE ANÁLISIS DE INTENCIONES Y APRENDIZAJE
// ============================================================================

class ChatbotAI {
  private knowledgeBase: Map<string, any> = new Map();
  private questionPatterns: Map<string, string[]> = new Map();
  private learningData: any[] = [];

  constructor() {
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase() {
    // Patrones de preguntas comunes y sus intenciones
    this.questionPatterns.set('obras_totales', [
      'cuántas obras hay',
      'total de obras',
      'número de obras',
      'cantidad de obras'
    ]);

    this.questionPatterns.set('inversion_total', [
      'cuánto se ha invertido',
      'inversión total',
      'presupuesto total',
      'costo total'
    ]);

    this.questionPatterns.set('obras_entregadas', [
      'cuántas obras están entregadas',
      'obras terminadas',
      'obras completadas',
      'entregas realizadas'
    ]);

    this.questionPatterns.set('alertas_riesgo', [
      'cuántas alertas hay',
      'obras con riesgo',
      'problemas identificados',
      'riesgos encontrados'
    ]);

    this.questionPatterns.set('por_dependencia', [
      'por dependencia',
      'según dependencia',
      'por secretaría',
      'por entidad'
    ]);

    this.questionPatterns.set('por_comuna', [
      'por comuna',
      'por corregimiento',
      'por zona',
      'por barrio'
    ]);

    this.questionPatterns.set('por_proyecto', [
      'por proyecto estratégico',
      'por programa',
      'por iniciativa'
    ]);

    this.questionPatterns.set('filtros_especificos', [
      'en la comuna',
      'de la dependencia',
      'del proyecto',
      'del contratista'
    ]);
  }

  // Analiza la intención del usuario
  analyzeIntent(userMessage: string): QueryAnalysis {
    const message = userMessage.toLowerCase();
    let intent = 'general';
    let confidence = 0.5;
    let entities: Record<string, string> = {};
    let requiresData = false;
    let dataQuery = '';

    // Detectar intenciones específicas
    for (const [intentKey, patterns] of this.questionPatterns) {
      for (const pattern of patterns) {
        if (message.includes(pattern)) {
          intent = intentKey;
          confidence = 0.8;
          requiresData = true;
          break;
        }
      }
      if (confidence > 0.7) break;
    }

    // Extraer entidades (comunas, dependencias, etc.)
    entities = this.extractEntities(message);

    // Generar consulta de datos si es necesario
    if (requiresData) {
      dataQuery = this.generateDataQuery(intent, entities);
    }

    return {
      intent,
      entities,
      confidence,
      requiresData,
      dataQuery
    };
  }

  // Extrae entidades del mensaje
  private extractEntities(message: string): Record<string, string> {
    const entities: Record<string, string> = {};

    // Patrones para extraer entidades
    const comunaMatch = message.match(/(?:comuna|corregimiento)\s+([a-záéíóúñ\s]+)/i);
    if (comunaMatch) {
      entities.comuna = comunaMatch[1].trim();
    }

    const dependenciaMatch = message.match(/(?:dependencia|secretaría|entidad)\s+([a-záéíóúñ\s]+)/i);
    if (dependenciaMatch) {
      entities.dependencia = dependenciaMatch[1].trim();
    }

    const proyectoMatch = message.match(/(?:proyecto|programa)\s+([a-záéíóúñ\s]+)/i);
    if (proyectoMatch) {
      entities.proyecto = proyectoMatch[1].trim();
    }

    return entities;
  }

  // Genera consulta de datos basada en la intención
  private generateDataQuery(intent: string, entities: Record<string, string>): string {
    let query = '';

    switch (intent) {
      case 'obras_totales':
        query = 'SELECT COUNT(*) as total FROM obras';
        break;
      case 'inversion_total':
        query = 'SELECT SUM(costo_total_actualizado) as inversion FROM obras';
        break;
      case 'obras_entregadas':
        query = 'SELECT COUNT(*) as entregadas FROM obras WHERE estado LIKE "%entreg%"';
        break;
      case 'alertas_riesgo':
        query = 'SELECT COUNT(*) as alertas FROM obras WHERE descripcion_riesgo IS NOT NULL';
        break;
      case 'por_dependencia':
        query = 'SELECT dependencia, COUNT(*) as cantidad FROM obras GROUP BY dependencia';
        break;
      case 'por_comuna':
        query = 'SELECT comuna, COUNT(*) as cantidad FROM obras GROUP BY comuna';
        break;
    }

    // Aplicar filtros de entidades
    if (Object.keys(entities).length > 0) {
      const filters = Object.entries(entities)
        .map(([key, value]) => `${key} LIKE "%${value}%"`)
        .join(' AND ');
      if (filters) {
        query += ` WHERE ${filters}`;
      }
    }

    return query;
  }

  // Aprende de nuevas preguntas y respuestas
  learnFromInteraction(question: string, answer: string, data: any) {
    this.learningData.push({
      question: question.toLowerCase(),
      answer,
      data,
      timestamp: new Date(),
      intent: this.analyzeIntent(question).intent
    });

    // Actualizar patrones si es una pregunta nueva
    const analysis = this.analyzeIntent(question);
    if (analysis.confidence < 0.7) {
      // Es una pregunta nueva, agregar a patrones
      const words = question.toLowerCase().split(' ').filter(w => w.length > 3);
      if (words.length > 0) {
        const newPattern = words.join(' ');
        if (!this.questionPatterns.has(analysis.intent)) {
          this.questionPatterns.set(analysis.intent, []);
        }
        this.questionPatterns.get(analysis.intent)?.push(newPattern);
      }
    }
  }

  // Obtiene respuestas basadas en datos
  async generateResponse(analysis: QueryAnalysis, data: Row[], filters: Filters): Promise<string> {
    const { intent, entities } = analysis;
    let response = '';

    try {
      // Aplicar filtros basados en entidades
      let filteredData = data;
      if (Object.keys(entities).length > 0) {
        const entityFilters: Filters = {};
        
        if (entities.comuna) {
          entityFilters.comuna = entities.comuna;
        }
        if (entities.dependencia) {
          entityFilters.dependencia = entities.dependencia;
        }
        if (entities.proyecto) {
          entityFilters.proyecto = entities.proyecto;
        }

        filteredData = applyFilters(data, { ...filters, ...entityFilters });
      } else {
        filteredData = applyFilters(data, filters);
      }

      // Calcular métricas
      const metrics = kpis(filteredData);

      // Generar respuesta basada en la intención
      switch (intent) {
        case 'obras_totales':
          response = `📊 **Total de obras**: ${metrics.totalObras.toLocaleString('es-CO')} obras`;
          if (Object.keys(entities).length > 0) {
            response += `\n\n🔍 *Filtros aplicados:* ${Object.entries(entities).map(([k, v]) => `${k}: ${v}`).join(', ')}`;
          }
          break;

        case 'inversion_total':
          response = `💰 **Inversión total**: $${metrics.invTotal.toLocaleString('es-CO')} COP`;
          response += `\n\n📈 **Presupuesto ejecutado**: $${metrics.ejec.toLocaleString('es-CO')} COP`;
          response += `\n\n📊 **Porcentaje ejecutado**: ${(metrics.pctEjec * 100).toFixed(1)}%`;
          break;

        case 'obras_entregadas':
          response = `✅ **Obras entregadas**: ${metrics.entregadas.toLocaleString('es-CO')} obras`;
          response += `\n\n📊 **Porcentaje entregado**: ${(metrics.pctEntregadas * 100).toFixed(1)}% del total`;
          response += `\n\n⏳ **Obras pendientes**: ${(metrics.totalObras - metrics.entregadas).toLocaleString('es-CO')} obras`;
          break;

        case 'alertas_riesgo':
          response = `⚠️ **Alertas identificadas**: ${metrics.alertasEncontradas} obras con riesgos`;
          if (metrics.alertasEncontradas > 0) {
            response += `\n\n🔍 *Esto representa el ${((metrics.alertasEncontradas / metrics.totalObras) * 100).toFixed(1)}% del total de obras*`;
          }
          break;

        case 'por_dependencia':
          const dependencias = groupSum(filteredData, F.dependencia, F.costoTotalActualizado);
          response = `🏢 **Obras por dependencia**:\n\n`;
          dependencias.slice(0, 5).forEach((dep, index) => {
            response += `${index + 1}. **${dep.name}**: ${dep.value.toLocaleString('es-CO')} obras\n`;
          });
          break;

        case 'por_comuna':
          const comunas = groupSum(filteredData, F.comunaOCorregimiento, F.costoTotalActualizado);
          response = `🏘️ **Obras por comuna**:\n\n`;
          comunas.slice(0, 5).forEach((com, index) => {
            response += `${index + 1}. **${com.name}**: ${com.value.toLocaleString('es-CO')} obras\n`;
          });
          break;

        default:
          response = this.generateGeneralResponse(filteredData, metrics);
      }

      // Agregar insights adicionales
      response += this.generateInsights(filteredData, metrics);

    } catch (error) {
      console.error('Error generando respuesta:', error);
      response = '❌ Lo siento, hubo un error al procesar tu consulta. Por favor, intenta reformular tu pregunta.';
    }

    return response;
  }

  // Genera respuesta general con métricas principales
  private generateGeneralResponse(data: Row[], metrics: any): string {
    return `📊 **Resumen general de obras**:

🏗️ **Total de obras**: ${metrics.totalObras.toLocaleString('es-CO')}
💰 **Inversión total**: $${metrics.invTotal.toLocaleString('es-CO')} COP
✅ **Obras entregadas**: ${metrics.entregadas.toLocaleString('es-CO')} (${(metrics.pctEntregadas * 100).toFixed(1)}%)
⚠️ **Alertas**: ${metrics.alertasEncontradas} obras con riesgos

💡 *Puedes preguntarme sobre obras específicas por comuna, dependencia, proyecto estratégico, o cualquier métrica en particular.*`;
  }

  // Genera insights automáticos
  private generateInsights(data: Row[], metrics: any): string {
    const insights: string[] = [];

    // Insight sobre ejecución presupuestal
    if (metrics.pctEjec > 0.8) {
      insights.push('🎯 **Excelente ejecución presupuestal** - Más del 80% del presupuesto está ejecutado');
    } else if (metrics.pctEjec < 0.3) {
      insights.push('⚠️ **Baja ejecución presupuestal** - Menos del 30% del presupuesto está ejecutado');
    }

    // Insight sobre entregas
    if (metrics.pctEntregadas > 0.7) {
      insights.push('✅ **Alto porcentaje de entregas** - Más del 70% de las obras están entregadas');
    }

    // Insight sobre alertas
    if (metrics.alertasEncontradas > metrics.totalObras * 0.1) {
      insights.push('🚨 **Alto número de alertas** - Más del 10% de las obras tienen riesgos identificados');
    }

    if (insights.length > 0) {
      return `\n\n💡 **Insights automáticos**:\n${insights.map(insight => `• ${insight}`).join('\n')}`;
    }

    return '';
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL DEL CHATBOT
// ============================================================================

interface ChatbotProps {
  data: Row[];
  filters: Filters;
  onFiltersChange?: (filters: Filters) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ data, filters, onFiltersChange }) => {
  const [state, setState] = useState<ChatbotState>({
    messages: [
      {
        id: '1',
        type: 'bot',
        content: '👋 ¡Hola! Soy tu asistente inteligente para el análisis de obras públicas de Medellín. Puedo ayudarte a:\n\n• 📊 Consultar métricas generales\n• 🏘️ Analizar obras por comuna\n• 🏢 Revisar obras por dependencia\n• 💰 Consultar inversiones y presupuestos\n• ⚠️ Identificar alertas y riesgos\n• 🔍 Aplicar filtros específicos\n\n¿En qué puedo ayudarte?',
        timestamp: new Date()
      }
    ],
    isTyping: false,
    isOpen: false,
    currentFilters: filters,
    learningMode: true
  });

  const [showExamples, setShowExamples] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ai = useRef(new ChatbotAI());

  // Scroll automático a los nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Manejar envío de mensaje
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true
    }));

    setInputValue('');

    try {
      // Analizar la intención del usuario
      const analysis = ai.current.analyzeIntent(inputValue);
      
      // Generar respuesta
      const response = await ai.current.generateResponse(analysis, data, state.currentFilters);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response,
        timestamp: new Date(),
        data: analysis
      };

      // Aprender de la interacción
      if (state.learningMode) {
        ai.current.learnFromInteraction(inputValue, response, analysis);
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        isTyping: false
      }));

    } catch (error) {
      console.error('Error procesando mensaje:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '❌ Lo siento, hubo un error al procesar tu consulta. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isTyping: false
      }));
    }
  };

  // Manejar tecla Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle del chatbot
  const toggleChatbot = () => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  };

  // Limpiar conversación
  const clearChat = () => {
    setState(prev => ({
      ...prev,
      messages: [prev.messages[0]] // Mantener solo el mensaje de bienvenida
    }));
  };

  // Manejar ejemplo de pregunta
  const handleExampleClick = (example: string) => {
    setInputValue(example);
    setShowExamples(false);
  };

  return (
    <>
      {/* Botón flotante */}
      <div className="chatbot-toggle" onClick={toggleChatbot}>
        <div className="chatbot-icon">
          {state.isOpen ? '✕' : '🤖'}
        </div>
        <div className="chatbot-badge">
          {state.messages.length - 1}
        </div>
      </div>

      {/* Ventana del chatbot */}
      {state.isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <span className="chatbot-avatar">🤖</span>
              <div>
                <h3>Asistente IA</h3>
                <p>Análisis de Obras Públicas</p>
              </div>
            </div>
            <div className="chatbot-controls">
              <button 
                className="chatbot-btn-examples" 
                onClick={() => setShowExamples(!showExamples)}
                title="Ver ejemplos de preguntas"
              >
                💡
              </button>
              <button 
                className="chatbot-btn-clear" 
                onClick={clearChat}
                title="Limpiar conversación"
              >
                🗑️
              </button>
              <button 
                className="chatbot-btn-close" 
                onClick={toggleChatbot}
                title="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {state.messages.map((message) => (
              <div key={message.id} className={`chatbot-message ${message.type}`}>
                <div className="message-content">
                  {message.content.split('\n').map((line, index) => (
                    <div key={index}>
                      {line.includes('**') ? (
                        <div dangerouslySetInnerHTML={{ 
                          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                     .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        }} />
                      ) : (
                        line
                      )}
                    </div>
                  ))}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString('es-CO', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            
            {state.isTyping && (
              <div className="chatbot-message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Panel de ejemplos */}
          {showExamples && (
            <div className="chatbot-examples-panel">
              <ChatbotExamples onExampleClick={handleExampleClick} />
            </div>
          )}

          <div className="chatbot-input">
            <div className="input-container">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregunta sobre obras, inversiones, alertas..."
                className="chatbot-input-field"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || state.isTyping}
                className="chatbot-send-btn"
              >
                ➤
              </button>
            </div>
            <div className="chatbot-suggestions">
              <button 
                className="suggestion-btn"
                onClick={() => setInputValue('¿Cuántas obras hay en total?')}
              >
                Total de obras
              </button>
              <button 
                className="suggestion-btn"
                onClick={() => setInputValue('¿Cuál es la inversión total?')}
              >
                Inversión total
              </button>
              <button 
                className="suggestion-btn"
                onClick={() => setInputValue('¿Cuántas obras están entregadas?')}
              >
                Obras entregadas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS */}
      <style>{`
        /* ========================================================================
            ESTILOS DEL CHATBOT - DISEÑO MODERNO Y RESPONSIVE
        ======================================================================== */
        
        .chatbot-toggle {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(121, 188, 153, 0.4);
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .chatbot-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(121, 188, 153, 0.6);
        }

        .chatbot-icon {
          font-size: 24px;
          color: white;
        }

        .chatbot-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #F77F26;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }

        .chatbot-window {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 400px;
          height: 600px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          z-index: 1001;
          overflow: hidden;
        }

        .chatbot-header {
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%);
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chatbot-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chatbot-avatar {
          font-size: 24px;
        }

        .chatbot-title h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .chatbot-title p {
          margin: 0;
          font-size: 12px;
          opacity: 0.9;
        }

        .chatbot-controls {
          display: flex;
          gap: 8px;
        }

        .chatbot-btn-examples,
        .chatbot-btn-clear,
        .chatbot-btn-close {
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
          transition: all 0.2s ease;
        }

        .chatbot-btn-examples:hover,
        .chatbot-btn-clear:hover,
        .chatbot-btn-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .chatbot-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chatbot-message {
          display: flex;
          flex-direction: column;
          max-width: 80%;
        }

        .chatbot-message.user {
          align-self: flex-end;
        }

        .chatbot-message.bot {
          align-self: flex-start;
        }

        .message-content {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .chatbot-message.user .message-content {
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .chatbot-message.bot .message-content {
          background: #f8f9fa;
          color: #2c3e50;
          border: 1px solid #e9ecef;
          border-bottom-left-radius: 4px;
        }

        .message-time {
          font-size: 11px;
          color: #6c757d;
          margin-top: 4px;
          text-align: right;
        }

        .chatbot-message.bot .message-time {
          text-align: left;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #79BC99;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        .chatbot-input {
          padding: 20px;
          border-top: 1px solid #e9ecef;
          background: #f8f9fa;
        }

        .input-container {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .chatbot-input-field {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e9ecef;
          border-radius: 25px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }

        .chatbot-input-field:focus {
          border-color: #79BC99;
          box-shadow: 0 0 0 3px rgba(121, 188, 153, 0.1);
        }

        .chatbot-send-btn {
          background: linear-gradient(135deg, #79BC99 0%, #4E8484 100%);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .chatbot-send-btn:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 4px 15px rgba(121, 188, 153, 0.4);
        }

        .chatbot-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chatbot-suggestions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .suggestion-btn {
          background: white;
          border: 1px solid #e9ecef;
          color: #6c757d;
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .suggestion-btn:hover {
          background: #79BC99;
          color: white;
          border-color: #79BC99;
        }

        .chatbot-examples-panel {
          max-height: 300px;
          overflow-y: auto;
          border-top: 1px solid #e9ecef;
          background: #f8f9fa;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .chatbot-window {
            width: calc(100vw - 40px);
            height: calc(100vh - 120px);
            bottom: 80px;
            right: 20px;
            left: 20px;
          }

          .chatbot-toggle {
            bottom: 15px;
            right: 15px;
            width: 50px;
            height: 50px;
          }

          .chatbot-icon {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .chatbot-window {
            width: calc(100vw - 20px);
            right: 10px;
            left: 10px;
            bottom: 70px;
          }

          .chatbot-toggle {
            bottom: 10px;
            right: 10px;
          }
        }
      `}</style>
    </>
  );
};

export default Chatbot;
