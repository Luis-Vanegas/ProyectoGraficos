import { useState, useCallback } from 'react';

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorMessage: string;
  errorCode?: string;
}

export interface ErrorHandlerReturn {
  error: ErrorState;
  clearError: () => void;
  handleError: (error: Error | string, code?: string) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

/**
 * Hook personalizado para manejo centralizado de errores
 * Proporciona estado de error, loading y funciones para manejar errores
 */
export function useErrorHandler(): ErrorHandlerReturn {
  const [error, setError] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorMessage: '',
    errorCode: undefined
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error: Error | string, code?: string) => {
    console.error('Error capturado:', error);
    
    let errorMessage = '';
    let errorObject: Error | null = null;

    if (typeof error === 'string') {
      errorMessage = error;
      errorObject = new Error(error);
    } else {
      errorMessage = error.message || 'Ha ocurrido un error inesperado';
      errorObject = error;
    }

    // Mapear errores comunes a mensajes amigables
    const friendlyMessage = getFriendlyErrorMessage(errorMessage, code);

    setError({
      hasError: true,
      error: errorObject,
      errorMessage: friendlyMessage,
      errorCode: code
    });

    setIsLoading(false);

    // En desarrollo, mostrar error en consola
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Details');
      console.error('Original error:', error);
      console.error('Error code:', code);
      console.error('Friendly message:', friendlyMessage);
      console.groupEnd();
    }

    // Aquí podrías enviar el error a un servicio de logging
    // logErrorToService(errorObject, code);
  }, []);

  const clearError = useCallback(() => {
    setError({
      hasError: false,
      error: null,
      errorMessage: '',
      errorCode: undefined
    });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    // Limpiar errores cuando empiece una nueva operación
    if (loading && error.hasError) {
      clearError();
    }
  }, [error.hasError, clearError]);

  return {
    error,
    clearError,
    handleError,
    isLoading,
    setLoading
  };
}

/**
 * Convierte errores técnicos en mensajes amigables para el usuario
 */
function getFriendlyErrorMessage(errorMessage: string, code?: string): string {
  const message = errorMessage.toLowerCase();

  // Errores de red
  if (message.includes('network') || message.includes('fetch')) {
    return 'Error de conexión. Por favor, verifica tu conexión a internet.';
  }

  if (message.includes('timeout')) {
    return 'La solicitud tardó demasiado tiempo. Inténtalo nuevamente.';
  }

  // Errores de API
  if (code === '401' || message.includes('unauthorized')) {
    return 'No tienes permisos para acceder a esta información.';
  }

  if (code === '403' || message.includes('forbidden')) {
    return 'Acceso denegado. Contacta al administrador.';
  }

  if (code === '404' || message.includes('not found')) {
    return 'La información solicitada no fue encontrada.';
  }

  if (code === '429' || message.includes('too many requests')) {
    return 'Demasiadas solicitudes. Espera un momento antes de intentar nuevamente.';
  }

  if (code === '500' || message.includes('internal server error')) {
    return 'Error del servidor. Inténtalo más tarde.';
  }

  // Errores específicos de la aplicación
  if (message.includes('no se pudieron cargar los datos')) {
    return 'No se pudieron cargar los datos. Verifica tu conexión e inténtalo nuevamente.';
  }

  if (message.includes('api key')) {
    return 'Error de configuración. Contacta al administrador del sistema.';
  }

  // Error genérico
  return errorMessage || 'Ha ocurrido un error inesperado. Inténtalo nuevamente.';
}

/**
 * Hook específico para operaciones asíncronas con manejo de errores
 */
export function useAsyncOperation<T>() {
  const { error, clearError, handleError, isLoading, setLoading } = useErrorHandler();

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      errorCode?: string;
    }
  ): Promise<T | null> => {
    try {
      setLoading(true);
      const result = await operation();
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      handleError(error, options?.errorCode);
      
      if (options?.onError) {
        options.onError(error);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, setLoading]);

  return {
    execute,
    error,
    clearError,
    isLoading
  };
}
