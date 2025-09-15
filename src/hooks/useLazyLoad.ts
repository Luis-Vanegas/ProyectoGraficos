import { useState, useEffect, useRef, useCallback } from 'react';

interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook para lazy loading de componentes basado en Intersection Observer
 * Útil para cargar contenido solo cuando es visible en pantalla
 */
export function useLazyLoad(options: LazyLoadOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Si ya fue visible y triggerOnce está activado, no observar más
    if (hasBeenVisible && triggerOnce) return;

    // Crear observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setIsVisible(isIntersecting);
        
        if (isIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true);
        }

        // Si triggerOnce está activado y ya fue visible, desconectar observer
        if (isIntersecting && triggerOnce) {
          observerRef.current?.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasBeenVisible]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    ref: setRef,
    isVisible,
    hasBeenVisible,
    shouldLoad: triggerOnce ? hasBeenVisible : isVisible
  };
}

/**
 * Hook para lazy loading de imágenes con placeholder
 */
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { ref, shouldLoad } = useLazyLoad();

  useEffect(() => {
    if (!shouldLoad || !src) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      setIsError(true);
    };
    img.src = src;
  }, [shouldLoad, src]);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    isError,
    shouldLoad
  };
}

/**
 * Hook para lazy loading de datos
 */
export function useLazyData<T>(
  fetchFunction: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { ref, shouldLoad } = useLazyLoad();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!shouldLoad || hasLoadedRef.current) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchFunction();
        setData(result);
        hasLoadedRef.current = true;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [shouldLoad, ...dependencies]);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction]);

  return {
    ref,
    data,
    isLoading,
    error,
    reload,
    shouldLoad
  };
}

/**
 * Hook para debounce de valores (útil para búsquedas y filtros)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para throttle de funciones (útil para eventos de scroll/resize)
 */
export function useThrottle<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const throttledCallback = useRef<T | undefined>(undefined);
  const lastRan = useRef<number | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    throttledCallback.current = callback;
  });

  const throttled = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (lastRan.current === undefined) {
        throttledCallback.current?.(...args);
        lastRan.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        const timeSinceLastRun = now - lastRan.current;
        const remainingDelay = Math.max(0, delay - timeSinceLastRun);
        
        timeoutRef.current = setTimeout(() => {
          throttledCallback.current?.(...args);
          lastRan.current = Date.now();
        }, remainingDelay);
      }
    },
    [delay]
  ) as T;

  return throttled;
}

/**
 * Hook para memoización de valores costosos
 */
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  shouldRecalculate?: (prevDeps: React.DependencyList, nextDeps: React.DependencyList) => boolean
): T {
  const memoizedValue = useRef<T | undefined>(undefined);
  const prevDeps = useRef<React.DependencyList | undefined>(undefined);

  const hasChanged = shouldRecalculate
    ? prevDeps.current ? shouldRecalculate(prevDeps.current, deps) : true
    : !prevDeps.current || deps.some((dep, index) => dep !== prevDeps.current?.[index]);

  if (hasChanged || memoizedValue.current === undefined) {
    memoizedValue.current = factory();
    prevDeps.current = deps;
  }

  return memoizedValue.current;
}

/**
 * Hook para cancelar operaciones asíncronas al desmontar componente
 */
export function useAbortController() {
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const getSignal = useCallback(() => {
    return abortControllerRef.current?.signal;
  }, []);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
  }, []);

  return { getSignal, abort };
}
