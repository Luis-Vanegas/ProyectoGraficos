import { useState, useEffect, useCallback } from 'react';
import type { Row, Filters } from '../utils/utils/metrics';

// ============================================================================
// TIPOS PARA EL SISTEMA DE APRENDIZAJE
// ============================================================================

interface LearningPattern {
  id: string;
  question: string;
  intent: string;
  entities: Record<string, string>;
  response: string;
  data: any;
  confidence: number;
  usageCount: number;
  lastUsed: Date;
  createdAt: Date;
}

interface LearningStats {
  totalInteractions: number;
  uniqueQuestions: number;
  averageConfidence: number;
  topIntents: Array<{ intent: string; count: number }>;
  learningAccuracy: number;
}

interface ChatbotLearningState {
  patterns: LearningPattern[];
  stats: LearningStats;
  isLearning: boolean;
  learningThreshold: number;
}

// ============================================================================
// SISTEMA DE APRENDIZAJE AVANZADO
// ============================================================================

export const useChatbotLearning = () => {
  const [state, setState] = useState<ChatbotLearningState>({
    patterns: [],
    stats: {
      totalInteractions: 0,
      uniqueQuestions: 0,
      averageConfidence: 0,
      topIntents: [],
      learningAccuracy: 0
    },
    isLearning: true,
    learningThreshold: 0.7
  });

  // Cargar datos de aprendizaje desde localStorage
  useEffect(() => {
    const savedPatterns = localStorage.getItem('chatbot-learning-patterns');
    const savedStats = localStorage.getItem('chatbot-learning-stats');
    
    if (savedPatterns) {
      try {
        const patterns = JSON.parse(savedPatterns).map((p: any) => ({
          ...p,
          lastUsed: new Date(p.lastUsed),
          createdAt: new Date(p.createdAt)
        }));
        setState(prev => ({ ...prev, patterns }));
      } catch (error) {
        console.error('Error cargando patrones de aprendizaje:', error);
      }
    }
    
    if (savedStats) {
      try {
        const stats = JSON.parse(savedStats);
        setState(prev => ({ ...prev, stats }));
      } catch (error) {
        console.error('Error cargando estadísticas de aprendizaje:', error);
      }
    }
  }, []);

  // Guardar datos de aprendizaje en localStorage
  const saveLearningData = useCallback(() => {
    localStorage.setItem('chatbot-learning-patterns', JSON.stringify(state.patterns));
    localStorage.setItem('chatbot-learning-stats', JSON.stringify(state.stats));
  }, [state.patterns, state.stats]);

  // Aprender de una nueva interacción
  const learnFromInteraction = useCallback((
    question: string,
    intent: string,
    entities: Record<string, string>,
    response: string,
    data: any,
    confidence: number
  ) => {
    if (!state.isLearning) return;

    const questionLower = question.toLowerCase().trim();
    
    // Buscar si ya existe un patrón similar
    const existingPattern = state.patterns.find(p => 
      p.question === questionLower || 
      this.calculateSimilarity(p.question, questionLower) > 0.8
    );

    if (existingPattern) {
      // Actualizar patrón existente
      setState(prev => ({
        ...prev,
        patterns: prev.patterns.map(p => 
          p.id === existingPattern.id 
            ? {
                ...p,
                usageCount: p.usageCount + 1,
                lastUsed: new Date(),
                confidence: (p.confidence + confidence) / 2, // Promedio de confianza
                response: p.response !== response ? response : p.response // Actualizar si es diferente
              }
            : p
        )
      }));
    } else {
      // Crear nuevo patrón
      const newPattern: LearningPattern = {
        id: Date.now().toString(),
        question: questionLower,
        intent,
        entities,
        response,
        data,
        confidence,
        usageCount: 1,
        lastUsed: new Date(),
        createdAt: new Date()
      };

      setState(prev => ({
        ...prev,
        patterns: [...prev.patterns, newPattern]
      }));
    }

    // Actualizar estadísticas
    updateStats();
  }, [state.isLearning, state.patterns]);

  // Calcular similitud entre dos preguntas
  const calculateSimilarity = useCallback((str1: string, str2: string): number => {
    const words1 = str1.split(' ').filter(w => w.length > 2);
    const words2 = str2.split(' ').filter(w => w.length > 2);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }, []);

  // Actualizar estadísticas de aprendizaje
  const updateStats = useCallback(() => {
    setState(prev => {
      const totalInteractions = prev.patterns.reduce((sum, p) => sum + p.usageCount, 0);
      const uniqueQuestions = prev.patterns.length;
      const averageConfidence = prev.patterns.length > 0 
        ? prev.patterns.reduce((sum, p) => sum + p.confidence, 0) / prev.patterns.length 
        : 0;

      // Contar intenciones más comunes
      const intentCounts = prev.patterns.reduce((acc, p) => {
        acc[p.intent] = (acc[p.intent] || 0) + p.usageCount;
        return acc;
      }, {} as Record<string, number>);

      const topIntents = Object.entries(intentCounts)
        .map(([intent, count]) => ({ intent, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calcular precisión de aprendizaje (basado en confianza promedio)
      const learningAccuracy = Math.min(averageConfidence * 100, 100);

      return {
        ...prev,
        stats: {
          totalInteractions,
          uniqueQuestions,
          averageConfidence,
          topIntents,
          learningAccuracy
        }
      };
    });
  }, []);

  // Buscar respuesta basada en patrones aprendidos
  const findLearnedResponse = useCallback((
    question: string,
    intent: string,
    entities: Record<string, string>
  ): { response: string; confidence: number } | null => {
    const questionLower = question.toLowerCase().trim();
    
    // Buscar coincidencia exacta
    let bestMatch = state.patterns.find(p => p.question === questionLower);
    
    if (!bestMatch) {
      // Buscar coincidencia por similitud
      bestMatch = state.patterns
        .filter(p => p.intent === intent)
        .reduce((best, current) => {
          const currentSimilarity = calculateSimilarity(current.question, questionLower);
          const bestSimilarity = best ? calculateSimilarity(best.question, questionLower) : 0;
          return currentSimilarity > bestSimilarity ? current : best;
        }, null as LearningPattern | null);
    }

    if (bestMatch && bestMatch.confidence >= state.learningThreshold) {
      return {
        response: bestMatch.response,
        confidence: bestMatch.confidence
      };
    }

    return null;
  }, [state.patterns, state.learningThreshold, calculateSimilarity]);

  // Generar sugerencias de preguntas basadas en patrones aprendidos
  const generateSuggestions = useCallback((): string[] => {
    const suggestions: string[] = [];
    
    // Obtener las preguntas más usadas
    const topQuestions = state.patterns
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(p => p.question);

    suggestions.push(...topQuestions);

    // Agregar preguntas por intención más común
    const topIntent = state.stats.topIntents[0];
    if (topIntent) {
      const intentQuestions = state.patterns
        .filter(p => p.intent === topIntent.intent)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 3)
        .map(p => p.question);
      
      suggestions.push(...intentQuestions);
    }

    // Eliminar duplicados y limitar a 8 sugerencias
    return [...new Set(suggestions)].slice(0, 8);
  }, [state.patterns, state.stats.topIntents]);

  // Analizar patrones de aprendizaje
  const analyzeLearningPatterns = useCallback(() => {
    const analysis = {
      totalPatterns: state.patterns.length,
      averageUsage: state.patterns.length > 0 
        ? state.patterns.reduce((sum, p) => sum + p.usageCount, 0) / state.patterns.length 
        : 0,
      mostUsedPattern: state.patterns.reduce((max, p) => 
        p.usageCount > max.usageCount ? p : max, 
        state.patterns[0] || { usageCount: 0, question: '' }
      ),
      intentDistribution: state.stats.topIntents,
      learningTrend: calculateLearningTrend(),
      recommendations: generateRecommendations()
    };

    return analysis;
  }, [state.patterns, state.stats.topIntents]);

  // Calcular tendencia de aprendizaje
  const calculateLearningTrend = useCallback((): 'improving' | 'stable' | 'declining' => {
    if (state.patterns.length < 5) return 'stable';
    
    const recentPatterns = state.patterns
      .filter(p => new Date().getTime() - p.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
      .length;
    
    const olderPatterns = state.patterns.length - recentPatterns;
    
    if (recentPatterns > olderPatterns * 0.3) return 'improving';
    if (recentPatterns < olderPatterns * 0.1) return 'declining';
    return 'stable';
  }, [state.patterns]);

  // Generar recomendaciones de mejora
  const generateRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];
    
    if (state.stats.averageConfidence < 0.7) {
      recommendations.push('Considera agregar más ejemplos de preguntas para mejorar la precisión');
    }
    
    if (state.stats.topIntents.length < 3) {
      recommendations.push('El chatbot podría beneficiarse de más diversidad en los tipos de preguntas');
    }
    
    if (state.patterns.length < 10) {
      recommendations.push('Más interacciones ayudarán a mejorar el aprendizaje del chatbot');
    }
    
    const lowConfidencePatterns = state.patterns.filter(p => p.confidence < 0.6);
    if (lowConfidencePatterns.length > state.patterns.length * 0.3) {
      recommendations.push('Revisa las respuestas de baja confianza para mejorar la calidad');
    }

    return recommendations;
  }, [state.stats, state.patterns]);

  // Limpiar datos de aprendizaje
  const clearLearningData = useCallback(() => {
    setState(prev => ({
      ...prev,
      patterns: [],
      stats: {
        totalInteractions: 0,
        uniqueQuestions: 0,
        averageConfidence: 0,
        topIntents: [],
        learningAccuracy: 0
      }
    }));
    localStorage.removeItem('chatbot-learning-patterns');
    localStorage.removeItem('chatbot-learning-stats');
  }, []);

  // Exportar datos de aprendizaje
  const exportLearningData = useCallback(() => {
    const exportData = {
      patterns: state.patterns,
      stats: state.stats,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatbot-learning-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.patterns, state.stats]);

  // Importar datos de aprendizaje
  const importLearningData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.patterns && data.stats) {
          setState(prev => ({
            ...prev,
            patterns: data.patterns.map((p: any) => ({
              ...p,
              lastUsed: new Date(p.lastUsed),
              createdAt: new Date(p.createdAt)
            })),
            stats: data.stats
          }));
        }
      } catch (error) {
        console.error('Error importando datos de aprendizaje:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  // Guardar automáticamente cuando cambien los datos
  useEffect(() => {
    saveLearningData();
  }, [saveLearningData]);

  return {
    // Estado
    patterns: state.patterns,
    stats: state.stats,
    isLearning: state.isLearning,
    learningThreshold: state.learningThreshold,
    
    // Acciones
    learnFromInteraction,
    findLearnedResponse,
    generateSuggestions,
    analyzeLearningPatterns,
    clearLearningData,
    exportLearningData,
    importLearningData,
    
    // Configuración
    setLearningMode: (enabled: boolean) => setState(prev => ({ ...prev, isLearning: enabled })),
    setLearningThreshold: (threshold: number) => setState(prev => ({ ...prev, learningThreshold: threshold }))
  };
};
