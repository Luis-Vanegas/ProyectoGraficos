import { useEffect, useState } from 'react';

interface DiagnosticInfo {
  isProduction: boolean;
  apiUrl: string;
  buildTime: string;
  version: string;
  userAgent: string;
  windowSize: { width: number; height: number };
  errors: string[];
}

export const ProductionDiagnostic = () => {
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  useEffect(() => {
    const info: DiagnosticInfo = {
      isProduction: import.meta.env.PROD,
      apiUrl: import.meta.env.VITE_API_BASE_URL || 'No configurado',
      buildTime: import.meta.env.BUILD_TIME || 'No disponible',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      userAgent: navigator.userAgent,
      windowSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      errors: []
    };

    // Verificar errores comunes
    if (!import.meta.env.VITE_API_BASE_URL) {
      info.errors.push('VITE_API_BASE_URL no está configurado');
    }

    setDiagnostic(info);
  }, []);

  // Solo mostrar en desarrollo o si hay errores
  if (!diagnostic || (!diagnostic.isProduction && !showDiagnostic)) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f8f9fa',
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: 9999,
      overflow: 'auto'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>🔍 Diagnóstico de Producción</h2>
        <button 
          onClick={() => setShowDiagnostic(!showDiagnostic)}
          style={{ marginBottom: '10px' }}
        >
          {showDiagnostic ? 'Ocultar' : 'Mostrar'} Diagnóstico
        </button>
      </div>

      {showDiagnostic && (
        <div>
          <h3>Información del Entorno:</h3>
          <pre>{JSON.stringify(diagnostic, null, 2)}</pre>
          
          <h3>Variables de Entorno:</h3>
          <pre>{JSON.stringify(import.meta.env, null, 2)}</pre>
          
          <h3>Errores Detectados:</h3>
          {diagnostic.errors.length > 0 ? (
            <ul>
              {diagnostic.errors.map((error, index) => (
                <li key={index} style={{ color: 'red' }}>{error}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'green' }}>✅ No se detectaron errores</p>
          )}
        </div>
      )}
    </div>
  );
};
