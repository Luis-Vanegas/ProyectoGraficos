/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map, GeoJSONSource } from 'maplibre-gl';
import type { LngLatLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import GanttChart from './GanttChart';

type LimiteFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, { CODIGO: string; NOMBRE: string }>;
type LimitesFC = GeoJSON.FeatureCollection<LimiteFeature['geometry'], LimiteFeature['properties']>;

type Obra = {
  id: string;
  [key: string]: any; // Permitir cualquier campo de la API
};

type Props = {
  height?: number | string;
  query?: string | URLSearchParams; // filtros externos (?estado=..., etc)
  onComunaChange?: (codigo: string | null) => void;
  onObraClick?: (obra: Obra) => void;
  filteredObras?: Obra[]; // Datos filtrados del Dashboard
};

const styleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export default function MapLibreVisor({ height = 600, query, onComunaChange, onObraClick, filteredObras }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const clickPopupRef = useRef<maplibregl.Popup | null>(null);

  const [limites, setLimites] = useState<LimitesFC | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [selectedCodigo, setSelectedCodigo] = useState<string | null>(null);
  const [selectedObraForGantt, setSelectedObraForGantt] = useState<Obra | null>(null);
  // Sin filtros internos: los filtros llegan por props.query o por URL externa
  
  // Usar datos filtrados si están disponibles, sino cargar desde API
  const obrasToUse = filteredObras || obras;
  
  // Debug: Log de datos para el mapa
  
  
  // Solo cargar desde API si no hay datos filtrados
  const shouldFetchFromAPI = !filteredObras;
  


  // Control: desactivar auto-selección por zoom para evitar "rebote" de cámara
  // Control: mostrar puntos individuales de obras (clusters) – desactivado para usar 1 punto por comuna
  const SHOW_OBRA_POINTS = true;
  
  // Control: mostrar puntos individuales al seleccionar una comuna – desactivado para evitar saturación
  const SHOW_SELECTED_POINTS = false;

  // (sin debounce local)

  // Detectar si hay filtro de proyecto para mostrar puntos individuales aun sin zoom
  const hasProyectoFilter = useMemo(() => {
    try {
      let params: URLSearchParams | undefined;
      if (typeof query === 'string') params = new URLSearchParams(query);
      else if (query instanceof URLSearchParams) params = query;
      return !!params?.get('proyectoEstrategico') || (params?.getAll('proyectoEstrategico')?.length || 0) > 0;
    } catch {
      return false;
    }
  }, [query]);

  const fetchLimites = useCallback(async () => {
    // Usar límites desde backend propio si existe; si no, fallback opcional a público
    const res = await fetch('/api/limites');
    if (res.ok) {
      const data = (await res.json()) as LimitesFC;
      setLimites(data);
      return;
    }
    throw new Error('No se pudo cargar /api/limites');
  }, []);

  const fetchObras = useCallback(async (params?: URLSearchParams) => {
    try {
      const query = params ? `?${params.toString()}` : '';
      const res = await fetch(`/api/obras${query}`);
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudo cargar /api/obras`);
      }
      
      const data = (await res.json()) as Obra[];
      
      setObras(data || []);
    } catch (error) {
      setObras([]); // Establecer array vacío en caso de error
      throw error;
    }
  }, []);

  // Colores por dependencia (HSL -> Hex)
  const hslToHex = (h: number, s: number, l: number): string => {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lNorm - c / 2;
    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Función para detectar el formato de campos (minúsculas vs mayúsculas)
  const getFieldNames = useMemo(() => {
    if (!obrasToUse || !Array.isArray(obrasToUse) || obrasToUse.length === 0) {
      return {
        nombre: 'nombre',
        lat: 'lat',
        lon: 'lon',
        estado: 'estado',
        dependencia: 'dependencia',
        direccion: 'direccion',
        presupuesto: 'presupuesto',
        fechaEntrega: 'fechaEntrega',
        porcentaje: 'indicadorAvanceTotal',
        comunaCodigo: 'comunaCodigo',
        comunaNombre: 'comunaNombre',
        imagen: 'imagen',
        imagenUrl: 'imagenUrl',
        alertaPresencia: 'alertaPresencia',
        alertaDescripcion: 'alertaDescripcion',
        alertaImpacto: 'alertaImpacto'
      };
    }

    const firstObra = obrasToUse[0] as any;
    const availableFields = firstObra ? Object.keys(firstObra) : [];
    
    // Detectar formato más robustamente
    const hasUppercaseFields = availableFields.some(field => 
      field === 'NOMBRE' || field === 'DEPENDENCIA' || field === 'LATITUD' || field === 'LONGITUD'
    );
    
    // Detectar campos basándose en los datos reales - más robusto
    const hasLatLng = firstObra && (firstObra.LATITUD || firstObra.LONGITUD);
    const hasNombre = firstObra && firstObra.NOMBRE;
    const hasDependencia = firstObra && firstObra.DEPENDENCIA;
    
    // Si tiene campos en mayúsculas, usarlos
    if (hasUppercaseFields || hasLatLng || hasNombre || hasDependencia) {
      return {
        nombre: 'NOMBRE',
        lat: 'LATITUD',
        lon: 'LONGITUD',
        estado: 'ESTADO DE LA OBRA',
        dependencia: 'DEPENDENCIA',
        direccion: 'DIRECCIÓN',
        presupuesto: 'PRESUPUESTO EJECUTADO',
        fechaEntrega: 'FECHA REAL DE ENTREGA',
        porcentaje: 'PORCENTAJE EJECUCIÓN OBRA',
        comunaCodigo: 'COMUNA O CORREGIMIENTO',
        comunaNombre: 'COMUNA O CORREGIMIENTO',
        alertaPresencia: 'PRESENCIA DE RIESGO',
        alertaDescripcion: 'DESCRIPCIÓN DEL RIESGO',
        alertaImpacto: 'IMPACTO DEL RIESGO'
      };
    } else {
      return {
        nombre: 'nombre',
        lat: 'lat',
        lon: 'lon',
        estado: 'estado',
        dependencia: 'dependencia',
        direccion: 'direccion',
        presupuesto: 'presupuesto',
        fechaEntrega: 'fechaEntrega',
        porcentaje: 'indicadorAvanceTotal',
        comunaCodigo: 'comunaCodigo',
        comunaNombre: 'comunaNombre',
        imagen: 'imagen',
        imagenUrl: 'imagenUrl',
        alertaPresencia: 'alertaPresencia',
        alertaDescripcion: 'alertaDescripcion',
        alertaImpacto: 'alertaImpacto'
      };
    }
  }, [obrasToUse]);

  const dependencyColorMap = useMemo(() => {
    if (!obras || !Array.isArray(obras)) {
      return {};
    }
    
    // ✅ ARREGLADO: Usar getFieldNames para acceder al campo correcto
    const deps = Array.from(new Set(
      obrasToUse.map(o => (o as any)[getFieldNames.dependencia]).filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, 'es'));
    
    
    const total = deps.length || 1;
    const map: Record<string, string> = {};
    deps.forEach((dep, idx) => {
      const hue = Math.round((idx / total) * 360);
      const saturation = 65;
      const lightness = 42;
      map[dep] = hslToHex(hue, saturation, lightness);
    });
    
    return map;
  }, [obrasToUse, getFieldNames]);

  // Inicialización del mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({ container: containerRef.current, style: styleUrl, center: [-75.57, 6.24] as LngLatLike, zoom: 11 });
    map.addControl(new maplibregl.NavigationControl({ showZoom: true }), 'top-right');
    map.on('load', () => setMapLoaded(true));
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Carga inicial (con filtros externos si vienen por props.query)
  useEffect(() => { fetchLimites().catch(() => {}); }, [fetchLimites]);
  useEffect(() => {
    // Solo cargar desde API si no hay datos filtrados
    if (shouldFetchFromAPI) {
      let params: URLSearchParams | undefined;
      if (typeof query === 'string') params = new URLSearchParams(query);
      else if (query instanceof URLSearchParams) params = query;
      fetchObras(params).catch(() => {});
    } else {
      // Si tenemos datos filtrados, no cargar desde API
    }
  }, [fetchObras, query, shouldFetchFromAPI]);
  // Leer comuna seleccionada desde URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const comuna = params.get('comuna');
    if (comuna) setSelectedCodigo(comuna);
  }, []);
  // Persistir seleccion en URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedCodigo) params.set('comuna', selectedCodigo); else params.delete('comuna');
    const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState({}, '', newUrl);
  }, [selectedCodigo]);


  // Enriquecer obras: asignar comunaCodigo por PIP si falta pero tiene coords
  const obrasEnriquecidas = useMemo(() => {
    if (!obrasToUse || !Array.isArray(obrasToUse)) {
      return [];
    }
    
    if (!limites) {
      return obrasToUse.map(o => ({ ...o, comunaCodigo: (o as any)[getFieldNames.comunaCodigo] || null }));
    }
    const fc = limites;
    const enriquecidas = obrasToUse.map(o => {
      const normalizedCodigo = (o as any)[getFieldNames.comunaCodigo] ? String((o as any)[getFieldNames.comunaCodigo]).trim() : null;
      if (!normalizedCodigo && (o as any)[getFieldNames.lat] != null && (o as any)[getFieldNames.lon] != null) {
        const pt = turf.point([(o as any)[getFieldNames.lon], (o as any)[getFieldNames.lat]]);
        if (fc.features) {
          for (const f of fc.features as LimiteFeature[]) {
            if (turf.booleanPointInPolygon(pt, f)) {
              return { ...o, comunaCodigo: f.properties.CODIGO };
            }
          }
        }
      }
      if (normalizedCodigo) return { ...o, comunaCodigo: normalizedCodigo };
      return o;
    });
    
    return enriquecidas;
  }, [obrasToUse, limites, getFieldNames]);

  // Build centroides y conteos por comuna (todas las obras con comuna conocida)
  const conteos = useMemo(() => {
    if (!limites || !limites.features) {
      const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection;
      return { centroids: emptyFC, counts: {} as Record<string, number> };
    }
    const counts: Record<string, number> = {};
    console.log('🔍 MapLibreVisor - obrasEnriquecidas en conteos:', obrasEnriquecidas?.length || 0);
    console.log('🔍 MapLibreVisor - limites features:', limites?.features?.length || 0);
    
    if (obrasEnriquecidas && Array.isArray(obrasEnriquecidas)) {
      let obrasConCoordenadas = 0;
      let obrasSinCoordenadas = 0;
      
      for (const o of obrasEnriquecidas) {
        // Verificar si la obra tiene coordenadas válidas
        const lat = (o as any)[getFieldNames.lat];
        const lon = (o as any)[getFieldNames.lon];
        const tieneCoordenadas = lat != null && lon != null && 
                                 !isNaN(parseFloat(String(lat))) && 
                                 !isNaN(parseFloat(String(lon))) &&
                                 parseFloat(String(lat)) !== 0 && 
                                 parseFloat(String(lon)) !== 0;
        
        // Buscar comunaCodigo en diferentes campos posibles
        const codigo = o.comunaCodigo || 
                      (o as any)[getFieldNames.comunaCodigo] || 
                      (o as any)['COMUNA O CORREGIMIENTO'] ||
                      (o as any)['comuna'] ||
                      null;
        
        if (codigo) {
          const codigoStr = String(codigo).trim();
          
          if (tieneCoordenadas) {
            obrasConCoordenadas++;
            // Contar obras con coordenadas válidas
            counts[codigoStr] = (counts[codigoStr] ?? 0) + 1;
            console.log('🔍 MapLibreVisor - obra con coordenadas:', o.id, 'codigo:', codigoStr, 'count:', counts[codigoStr]);
          } else {
            obrasSinCoordenadas++;
            // Para obras sin coordenadas, usar un código especial
            const codigoSinCoordenadas = codigoStr === '99 - Varias' ? '99 - Varias' : `${codigoStr} - Sin coordenadas`;
            counts[codigoSinCoordenadas] = (counts[codigoSinCoordenadas] ?? 0) + 1;
            console.log('🔍 MapLibreVisor - obra sin coordenadas:', o.id, 'codigo:', codigoStr, 'codigo especial:', codigoSinCoordenadas);
          }
        } else {
          if (tieneCoordenadas) {
            obrasConCoordenadas++;
            console.log('🔍 MapLibreVisor - obra con coordenadas pero sin codigo:', o.id);
          } else {
            obrasSinCoordenadas++;
            console.log('🔍 MapLibreVisor - obra sin coordenadas ni codigo:', o.id);
          }
        }
      }
      
      console.log(`🔍 MapLibreVisor - Resumen: ${obrasConCoordenadas} con coordenadas, ${obrasSinCoordenadas} sin coordenadas`);
    }
    
    console.log('🔍 MapLibreVisor - counts finales:', counts);
    
    // Log de los límites disponibles
    if (limites && limites.features) {
      console.log('🔍 MapLibreVisor - límites disponibles:');
      limites.features.forEach((f: any) => {
        console.log(`  - ${f.properties.CODIGO}: ${f.properties.NOMBRE}`);
      });
    }
    
    const centroids = {
      type: 'FeatureCollection',
      features: limites.features ? (limites.features as LimiteFeature[]).map((f) => {
        const codigo = f.properties.CODIGO;
        const nombre = f.properties.NOMBRE;
        
        // Calcular el centroide de manera más robusta
        let p;
        try {
          // Usar pointOnFeature en lugar de centroid para mejor posicionamiento
          p = turf.pointOnFeature(f as any);
          
          // Si pointOnFeature falla, usar centroid como respaldo
          if (!p || !p.geometry || !p.geometry.coordinates) {
            p = turf.centroid(f as any);
          }
          
          // Verificar que el centroide sea válido
          if (!p || !p.geometry || !p.geometry.coordinates) {
            console.log(`🔍 MapLibreVisor - Centroide inválido para ${codigo} (${nombre})`);
            return null;
          }
          
          // Verificar que las coordenadas sean válidas
          const [lon, lat] = p.geometry.coordinates;
          if (isNaN(lon) || isNaN(lat) || lon === 0 || lat === 0) {
            console.log(`🔍 MapLibreVisor - Coordenadas inválidas para ${codigo} (${nombre}):`, [lon, lat]);
            return null;
          }
          
          // Verificar que las coordenadas estén dentro de los límites de Medellín
          if (lat < 6.0 || lat > 6.4 || lon < -75.7 || lon > -75.4) {
            console.log(`🔍 MapLibreVisor - Coordenadas fuera de límites para ${codigo} (${nombre}):`, [lon, lat]);
            return null;
          }
          
          console.log(`🔍 MapLibreVisor - Centroide calculado para ${codigo} (${nombre}):`, [lon, lat]);
        } catch (error) {
          console.log(`🔍 MapLibreVisor - Error calculando centroide para ${codigo} (${nombre}):`, error);
          return null;
        }
        
        // Buscar el count en counts usando el código exacto
        let count = 0;
        const codigoStr = String(codigo);
        
        // Buscar directamente en counts
        if (counts[codigoStr] !== undefined) {
          count = counts[codigoStr];
        } else {
          // Si no se encuentra, buscar por coincidencia parcial
          for (const [key, value] of Object.entries(counts)) {
            if (key.includes(codigoStr) || codigoStr.includes(key)) {
              count = value;
              break;
            }
          }
        }
        
        console.log(`🔍 MapLibreVisor - Feature ${codigo} (${f.properties.NOMBRE}): count = ${count}`);
        
        return { type: 'Feature', geometry: p.geometry, properties: { CODIGO: f.properties.CODIGO, NOMBRE: f.properties.NOMBRE, count } } as GeoJSON.Feature;
      }).filter(f => f !== null) : []
    } as unknown as GeoJSON.FeatureCollection;
    return { centroids, counts };
  }, [limites, obrasEnriquecidas, getFieldNames]);

  // Mapa de código -> nombre de comuna
  const codigoToComuna = useMemo(() => {
    const mapCodigoNombre: Record<string, string> = {};
    if (!limites || !limites.features) return mapCodigoNombre;
    if (limites.features) {
      (limites.features as LimiteFeature[]).forEach((f) => {
        mapCodigoNombre[f.properties.CODIGO] = f.properties.NOMBRE;
      });
    }
    return mapCodigoNombre;
  }, [limites]);

  // Mapa de código -> nombre de comuna
  // (definición movida más arriba)

  // Pintar capas cuando haya datos
  useEffect(() => {
    const map = mapRef.current; if (!map || !limites || !mapLoaded) return;
    const limitesSrc = 'limites-src';
    const limitesFill = 'limites-fill';
    const limitesLine = 'limites-line';
    const limitesSel = 'limites-sel';
    const centroidsSrc = 'centroids-src';
    const centroidsLayer = 'centroids-layer';
    const centroidsText = 'centroids-text';

    if (!map.getSource(limitesSrc)) {
      map.addSource(limitesSrc, { type: 'geojson', data: limites });
      map.addLayer({ id: limitesFill, type: 'fill', source: limitesSrc, paint: { 'fill-color': '#76a2b6', 'fill-opacity': 0.15 } });
      map.addLayer({ id: limitesLine, type: 'line', source: limitesSrc, paint: { 'line-color': '#184a64', 'line-width': 1.5 } });
      map.addLayer({ id: limitesSel, type: 'line', source: limitesSrc, filter: ['==', ['get', 'CODIGO'], ''], paint: { 'line-color': '#F77F26', 'line-width': 3 } });
    } else {
      (map.getSource(limitesSrc) as GeoJSONSource).setData(limites);
    }

    if (!map.getSource(centroidsSrc)) {
      console.log('🔍 MapLibreVisor - Creando fuente de centroides...');
      console.log('🔍 MapLibreVisor - conteos.centroids:', conteos.centroids);
      console.log('🔍 MapLibreVisor - conteos.counts:', conteos.counts);
      console.log('🔍 MapLibreVisor - primera feature:', conteos.centroids.features[0]);
      map.addSource(centroidsSrc, { type: 'geojson', data: conteos.centroids });
      console.log('🔍 MapLibreVisor - Agregando capa de círculos...');
      map.addLayer({ id: centroidsLayer, type: 'circle', source: centroidsSrc, paint: { 'circle-radius': 18, 'circle-color': '#F77F26', 'circle-stroke-color': '#00000033', 'circle-stroke-width': 3 } });
      console.log('🔍 MapLibreVisor - Agregando capa de texto...');
      // ✅ ARREGLADO: Asegurar que el texto siempre se muestre, incluso si count es 0
      map.addLayer({ 
        id: centroidsText, 
        type: 'symbol', 
        source: centroidsSrc, 
        layout: { 
          'text-field': [
            'case',
            ['has', 'count'],
            ['to-string', ['get', 'count']],
            '0'
          ], 
          'text-size': 12, 
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] 
        }, 
        paint: { 'text-color': '#fff' } 
      });
      console.log('🔍 MapLibreVisor - Capas de centroides creadas exitosamente');
    } else {
      console.log('🔍 MapLibreVisor - Actualizando datos de centroides...');
      console.log('🔍 MapLibreVisor - conteos.counts al actualizar:', conteos.counts);
      console.log('🔍 MapLibreVisor - conteos.centroids al actualizar:', conteos.centroids);
      
      // Verificar que la fuente existe antes de actualizar
      const source = map.getSource(centroidsSrc) as GeoJSONSource;
      if (source) {
        console.log('🔍 MapLibreVisor - Fuente encontrada, actualizando...');
        source.setData(conteos.centroids);
        console.log('🔍 MapLibreVisor - Datos actualizados exitosamente');
        
        // Forzar la actualización de las capas después de un breve delay
        setTimeout(() => {
          console.log('🔍 MapLibreVisor - Forzando actualización de capas...');
          
          // Verificar el estado actual de las capas
          const currentVisibility = map.getLayoutProperty(centroidsLayer, 'visibility');
          console.log('🔍 MapLibreVisor - Visibilidad actual:', currentVisibility);
          
          // Forzar re-renderizado de las capas
          map.setLayoutProperty(centroidsLayer, 'visibility', 'none');
          map.setLayoutProperty(centroidsLayer, 'visibility', 'visible');
          map.setLayoutProperty(centroidsText, 'visibility', 'none');
          map.setLayoutProperty(centroidsText, 'visibility', 'visible');
          
          // Verificar que las capas están visibles
          const newVisibility = map.getLayoutProperty(centroidsLayer, 'visibility');
          console.log('🔍 MapLibreVisor - Nueva visibilidad:', newVisibility);
          
          // Verificar el estado de la fuente después de la actualización
          const sourceData = (map.getSource(centroidsSrc) as GeoJSONSource).getData();
          console.log('🔍 MapLibreVisor - Datos de la fuente después de actualizar:', sourceData);
          
          // Si es una promesa, esperar a que se resuelva
          if (sourceData && typeof sourceData.then === 'function') {
            console.log('🔍 MapLibreVisor - Esperando a que se resuelva la promesa...');
            sourceData.then((resolvedData: any) => {
              console.log('🔍 MapLibreVisor - Datos resueltos:', resolvedData);
              
              // Verificar que los features tienen count reales
              if (resolvedData && resolvedData.features) {
                console.log('🔍 MapLibreVisor - Verificando features resueltos...');
                resolvedData.features.forEach((feature: any, index: number) => {
                  if (index < 5) { // Solo mostrar los primeros 5
                    console.log(`🔍 MapLibreVisor - Feature ${index}:`, {
                      properties: feature.properties,
                      count: feature.properties?.count
                    });
                  }
                });
              }
            }).catch((error: any) => {
              console.log('🔍 MapLibreVisor - Error al resolver promesa:', error);
            });
          }
          
          console.log('🔍 MapLibreVisor - Capas actualizadas');
        }, 100);
      } else {
        console.log('🔍 MapLibreVisor - ERROR: Fuente no encontrada');
      }
    }

    // Click en centroides -> seleccionar comuna y mostrar popup
    (map as any).off('click', centroidsLayer);
    (map as any).on('click', centroidsLayer, (e: any) => {
      const f = e.features && e.features[0];
      const codigo = f?.properties && (f.properties as any).CODIGO as string;
      const nombre = f?.properties && (f.properties as any).NOMBRE as string;
      const count = f?.properties && (f.properties as any).count as number;
      
      console.log('🔍 MapLibreVisor - Click en cluster naranja:', {
        feature: f,
        codigo: codigo,
        nombre: nombre,
        count: count,
        properties: f?.properties
      });
      
      setSelectedCodigo(codigo || null);
      if (onComunaChange) onComunaChange(codigo || null);
      
      // NUEVO: Expandir cluster haciendo zoom y mostrando puntos individuales
      if (f && codigo && nombre && count !== undefined) {
        // Hacer zoom al cluster para mostrar puntos individuales
        const currentZoom = map.getZoom();
        const targetZoom = Math.min(currentZoom + 3, 16); // Zoom máximo de 16
        
        console.log('🔍 MapLibreVisor - Expandiendo cluster:', {
          currentZoom,
          targetZoom,
          codigo,
          nombre
        });
        
        // Hacer zoom al centro del cluster
        map.easeTo({
          center: e.lngLat,
          zoom: targetZoom,
          duration: 1000
        });
        
        // Mostrar popup con información del cluster
        const popup = new (window as any).maplibregl.Popup({
          closeButton: true,
          closeOnClick: false
        })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 10px; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${nombre}</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">
              <strong>Código:</strong> ${codigo}
            </p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">
              <strong>Total de obras:</strong> ${count}
            </p>
            <p style="margin: 5px 0; color: #666; font-size: 12px;">
              🔍 Cluster expandido - Verás los puntos individuales
            </p>
          </div>
        `)
        .addTo(map);
        
        // Cerrar popup anterior si existe
        if ((map as any)._clusterPopup) {
          (map as any)._clusterPopup.remove();
        }
        (map as any)._clusterPopup = popup;
        
        // Programar la eliminación del popup después de 3 segundos
        setTimeout(() => {
          if ((map as any)._clusterPopup) {
            (map as any)._clusterPopup.remove();
            (map as any)._clusterPopup = null;
          }
        }, 3000);
      }
    });

  }, [limites, conteos, mapLoaded, onComunaChange, codigoToComuna]);
  
  // Log para verificar si el useEffect de clusters se está ejecutando
  useEffect(() => {
    // useEffect de clusters
  }, [limites, conteos, mapLoaded, onComunaChange, codigoToComuna]);
  
  // NUEVO: Reaccionar a cambios en selectedCodigo para mostrar puntos
  useEffect(() => {
    if (mapLoaded && selectedCodigo) {
      console.log('🔍 MapLibreVisor - selectedCodigo cambió, actualizando visibilidad:', selectedCodigo);
      
      // Forzar actualización de visibilidad después de un breve delay
      setTimeout(() => {
        const map = mapRef.current;
        if (map && map.getLayer('obras-points')) {
          console.log('🔍 MapLibreVisor - Forzando visibilidad de puntos para comuna:', selectedCodigo);
          map.setLayoutProperty('obras-points', 'visibility', 'visible');
        }
      }, 200);
    }
  }, [selectedCodigo, mapLoaded]);

  // Puntos de obras (clusters vista general) – desactivados por defecto
  useEffect(() => {
    const map = mapRef.current; if (!map || !mapLoaded) return;
    const src = 'obras-src';
    const cl = 'obras-clusters';
    const clCnt = 'obras-clusters-count';
    const ptsLayer = 'obras-points';
    const selSrc = 'obras-sel-src';
    const selLayer = 'obras-sel';


    if (SHOW_OBRA_POINTS) {
    const features: GeoJSON.Feature[] = obrasEnriquecidas && Array.isArray(obrasEnriquecidas) 
      ? obrasEnriquecidas.map(o => {
          const lat = (o as any)[getFieldNames.lat];
          const lon = (o as any)[getFieldNames.lon];
          const hasCoords = lat != null && lon != null && 
                           !isNaN(parseFloat(String(lat))) && 
                           !isNaN(parseFloat(String(lon))) &&
                           parseFloat(String(lat)) !== 0 && 
                           parseFloat(String(lon)) !== 0;
          
          if (hasCoords) {
            const latNum = parseFloat(String(lat));
            const lonNum = parseFloat(String(lon));
            
            // Límites aproximados de Medellín: lat 6.0-6.4, lon -75.7 a -75.4
            const isValidLat = latNum >= 6.0 && latNum <= 6.4;
            const isValidLon = lonNum >= -75.7 && lonNum <= -75.4;
            
            if (!isValidLat || !isValidLon) {
              console.log('🔍 MapLibreVisor - Coordenadas fuera de límites:', { lat: latNum, lon: lonNum, id: o.id });
              return null; // Excluir puntos fuera de límites
            }
            
            return {
              type: 'Feature' as const,
              geometry: { type: 'Point' as const, coordinates: [lonNum, latNum] },
              properties: { 
                id: o.id, 
                nombre: (o as any)[getFieldNames.nombre] || 'Sin nombre', 
                estado: (o as any)[getFieldNames.estado] || 'Sin estado', 
                dependencia: (o as any)[getFieldNames.dependencia] || 'Sin dependencia', 
                comunaCodigo: o.comunaCodigo || '',
                direccion: (o as any)[getFieldNames.direccion] || '',
                presupuesto: (o as any)[getFieldNames.presupuesto] || 0,
                porcentaje: (o as any)[getFieldNames.porcentaje] || 0,
                sinCoordenadas: false
              }
            };
          } else {
            // Para obras sin coordenadas, usar coordenadas del centro de Medellín
            const centroMedellin = [-75.5636, 6.2442]; // Centro aproximado de Medellín
            
            return {
              type: 'Feature' as const,
              geometry: { type: 'Point' as const, coordinates: centroMedellin },
              properties: { 
                id: o.id, 
                nombre: (o as any)[getFieldNames.nombre] || 'Sin nombre', 
                estado: (o as any)[getFieldNames.estado] || 'Sin estado', 
                dependencia: (o as any)[getFieldNames.dependencia] || 'Sin dependencia', 
                comunaCodigo: o.comunaCodigo || '',
                direccion: (o as any)[getFieldNames.direccion] || '',
                presupuesto: (o as any)[getFieldNames.presupuesto] || 0,
                porcentaje: (o as any)[getFieldNames.porcentaje] || 0,
                sinCoordenadas: true
              }
            };
          }
        }).filter(f => f !== null)
      : [];
    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
    
      // Limpiar capas y fuente anteriores si existían (para asegurar cluster: false)
      if (map.getLayer(cl)) map.removeLayer(cl);
      if (map.getLayer(clCnt)) map.removeLayer(clCnt);
      if (map.getLayer(ptsLayer)) map.removeLayer(ptsLayer);
      if (map.getSource(src)) map.removeSource(src);

      // Crear fuente sin clustering y capa de puntos individuales
      map.addSource(src, { type: 'geojson', data: fc });
      
      // ✅ ARREGLADO: Crear expresión de color con validación robusta
      let circleColor: any;
      if (dependencyColorMap && Object.keys(dependencyColorMap).length > 0) {
        const matchColor: any[] = ['match', ['get', 'dependencia']];
        Object.entries(dependencyColorMap).forEach(([dep, color]) => { 
          if (dep && color) { // Validar que dep y color no sean null/undefined
            matchColor.push(dep, color); 
          }
        });
        matchColor.push('#3B8686'); // Color por defecto
        circleColor = matchColor;
      } else {
        // Si no hay dependencias, usar un color fijo
        circleColor = '#3B8686';
      }
      
      // Color especial para obras sin coordenadas
      const circleColorWithNoCoords: any = [
        'case',
        ['get', 'sinCoordenadas'],
        '#f59e0b', // Color naranja para obras sin coordenadas
        circleColor
      ];
      
      
      map.addLayer({ 
        id: ptsLayer, 
        type: 'circle', 
        source: src, 
        paint: { 
          'circle-color': circleColorWithNoCoords, 
          'circle-radius': 6, 
          'circle-stroke-color': '#ffffff', 
          'circle-stroke-width': 1 
        } 
      });

      // Si hay filtro de proyecto, ajustar vista a la extensión de las obras filtradas
      try {
        if (hasProyectoFilter && fc.features.length > 0) {
          const bbox = turf.bbox(fc as any);
        // Limitar el bbox a Antioquia/Medellín para evitar expansión excesiva
        const medellinBounds = [[-75.7, 6.0], [-75.4, 6.4]]; // Límites aproximados de Medellín
        const limitedBbox = [
          Math.max(bbox[0], medellinBounds[0][0]), // lng min
          Math.max(bbox[1], medellinBounds[0][1]), // lat min
          Math.min(bbox[2], medellinBounds[1][0]), // lng max
          Math.min(bbox[3], medellinBounds[1][1])  // lat max
        ];
        map.fitBounds([[limitedBbox[0], limitedBbox[1]], [limitedBbox[2], limitedBbox[3]]], { padding: 60, duration: 600 });
        }
              } catch (error) {
      console.log('🔍 MapLibreVisor - Error al ajustar vista:', error);
              }

      // Mostrar puntos con lógica mejorada
      const ZOOM_TO_SHOW_POINTS = 13;
      const applyVisibilityAndFilter = () => {
      // Mostrar puntos si:
      // 1. El zoom es suficiente
      // 2. Hay una comuna seleccionada
      // 3. Hay filtros de proyecto activos
      // 4. O si hay pocos puntos (menos de 200) para evitar saturación
      // 5. NUEVO: Si se hizo clic en un cluster (comuna seleccionada)
      const zoom = map.getZoom();
      const hasEnoughZoom = zoom >= ZOOM_TO_SHOW_POINTS;
      const hasSelectedComuna = !!selectedCodigo;
      const hasProjectFilter = hasProyectoFilter;
      const hasFewPoints = fc.features.length <= 200;
      
      // NUEVO: Si hay una comuna seleccionada (cluster clickeado), mostrar puntos inmediatamente
      const shouldShow = hasEnoughZoom || hasSelectedComuna || hasProjectFilter || hasFewPoints;
        if (map.getLayer(ptsLayer)) {
          map.setLayoutProperty(ptsLayer, 'visibility', shouldShow ? 'visible' : 'none');
        
        // Crear filtro para mostrar solo puntos de la comuna seleccionada
        let filter: any = ['boolean', true];
        if (selectedCodigo) {
          console.log('🔍 MapLibreVisor - Aplicando filtro para comuna:', selectedCodigo);
          // Filtrar por comunaCodigo usando diferentes formatos posibles
          const codigoStr = String(selectedCodigo);
          const nombreComuna = codigoToComuna[selectedCodigo] || '';
          
          // NUEVO: Crear filtro más robusto que maneje diferentes formatos
          filter = [
            'any',
            // Formato: "07"
            ['==', ['get', 'comunaCodigo'], codigoStr],
            // Formato: "07 - Comuna"
            ['==', ['get', 'comunaCodigo'], `${codigoStr} - ${nombreComuna}`],
            // Formato: "7 - Comuna" (sin cero inicial)
            ['==', ['get', 'comunaCodigo'], `${codigoStr.replace(/^0+/, '')} - ${nombreComuna}`],
            // Formato: "07 - Comuna" (con cero inicial)
            ['==', ['get', 'comunaCodigo'], `${codigoStr.padStart(2, '0')} - ${nombreComuna}`],
            // Formato: solo nombre de comuna
            ['==', ['get', 'comunaCodigo'], nombreComuna],
            // Formato: "Comuna" (sin código)
            ['==', ['get', 'comunaCodigo'], nombreComuna],
            // NUEVO: Buscar por substring que contenga el código
            ['in', codigoStr, ['get', 'comunaCodigo']],
            // NUEVO: Buscar por substring que contenga el nombre
            ['in', nombreComuna, ['get', 'comunaCodigo']]
          ];
          console.log('🔍 MapLibreVisor - Filtro aplicado para comuna:', selectedCodigo, 'nombre:', nombreComuna);
          console.log('🔍 MapLibreVisor - Filtro completo:', filter);
        }
        
        console.log('🔍 MapLibreVisor - Filtro aplicado:', filter);
        
        // Verificar que la capa existe y tiene datos
        const layer = map.getLayer(ptsLayer);
        if (layer) {
          console.log('🔍 MapLibreVisor - Capa de puntos encontrada');
          const source = map.getSource('obras-src');
          if (source) {
            console.log('🔍 MapLibreVisor - Fuente de puntos encontrada');
            const sourceData = (source as GeoJSONSource).getData();
            console.log('🔍 MapLibreVisor - Datos de fuente de puntos:', sourceData);
            
            // Si es una promesa, esperar a que se resuelva
            if (sourceData && typeof sourceData.then === 'function') {
              console.log('🔍 MapLibreVisor - Esperando a que se resuelva la promesa de puntos...');
              sourceData.then((resolvedData: any) => {
                console.log('🔍 MapLibreVisor - Datos de puntos resueltos:', resolvedData);
                
                // Verificar que los features tienen datos
                if (resolvedData && resolvedData.features) {
                  console.log('🔍 MapLibreVisor - Features de puntos:', resolvedData.features.length);
                  console.log('🔍 MapLibreVisor - Primer feature de puntos:', resolvedData.features[0]);
                  
                    // Verificar las propiedades del primer feature
                    const firstFeature = resolvedData.features[0];
                    if (firstFeature && firstFeature.properties) {
                      console.log('🔍 MapLibreVisor - Propiedades del primer feature:', firstFeature.properties);
                      
                      // Verificar si tiene comunaCodigo
                      const comunaCodigo = firstFeature.properties.comunaCodigo || 
                                         firstFeature.properties['COMUNA O CORREGIMIENTO'] || 
                                         firstFeature.properties.comuna || 
                                         firstFeature.properties.CODIGO;
                      console.log('🔍 MapLibreVisor - comunaCodigo del primer feature:', comunaCodigo);
                      
                      // NUEVO: Mostrar algunos features de ejemplo para debugging
                      console.log('🔍 MapLibreVisor - Primeros 5 features comunaCodigo:');
                      resolvedData.features.slice(0, 5).forEach((feature: any, index: number) => {
                        const codigo = feature.properties?.comunaCodigo || 'N/A';
                        console.log(`  Feature ${index}: ${codigo}`);
                      });
                      
                      // Verificar si el filtro está funcionando
                      console.log('🔍 MapLibreVisor - Verificando filtro...');
                      console.log('🔍 MapLibreVisor - selectedCodigo:', selectedCodigo);
                      console.log('🔍 MapLibreVisor - comunaCodigo matches selectedCodigo:', comunaCodigo === selectedCodigo);
                      
                      // NUEVO: Verificar si hay features que coincidan con el selectedCodigo
                      const matchingFeatures = resolvedData.features.filter((f: any) => {
                        const codigo = f.properties?.comunaCodigo || '';
                        const sel = selectedCodigo || '';
                        const alt = sel ? (codigoToComuna as Record<string, string>)[sel] || '' : '';
                        return (sel && codigo.includes(sel)) || (alt && codigo.includes(alt));
                      });
                      console.log('🔍 MapLibreVisor - Features que coinciden con selectedCodigo:', matchingFeatures.length);
                    
                    // Verificar la visibilidad de la capa
                    const layerVisibility = map.getLayoutProperty(ptsLayer, 'visibility');
                    console.log('🔍 MapLibreVisor - Visibilidad de la capa de puntos:', layerVisibility);
                  }
                }
              }).catch((error: any) => {
                console.log('🔍 MapLibreVisor - Error al resolver promesa de puntos:', error);
              });
            }
          } else {
            console.log('🔍 MapLibreVisor - ERROR: Fuente de puntos no encontrada');
          }
        } else {
          console.log('🔍 MapLibreVisor - ERROR: Capa de puntos no encontrada');
        }
        
          (map as any).setFilter(ptsLayer, filter);
      } else {
        }
      };
      applyVisibilityAndFilter();
      (map as any).off('zoomend', applyVisibilityAndFilter as any);
      (map as any).on('zoomend', applyVisibilityAndFilter as any);
      
      // NUEVO: Forzar actualización cuando se selecciona una comuna
      if (selectedCodigo) {
        console.log('🔍 MapLibreVisor - Comuna seleccionada, forzando visibilidad de puntos:', selectedCodigo);
        // Aplicar visibilidad inmediatamente
        setTimeout(() => {
          applyVisibilityAndFilter();
        }, 100);
      }

      // Interacciones sobre puntos individuales
      (map as any).off('mouseenter', ptsLayer);
      (map as any).off('mouseleave', ptsLayer);
      (map as any).off('click', ptsLayer);
      (map as any).on('mouseenter', ptsLayer, (e: any) => {
      map.getCanvas().style.cursor = 'pointer';
      const f = e.features && e.features[0];
      if (!f) return;
      const { nombre, estado } = (f.properties as any) || {};
      if (hoverPopupRef.current) hoverPopupRef.current.remove();
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
        .setLngLat((f.geometry as any).coordinates)
        .setHTML(`<div style="font-weight:700;color:#111827">${nombre || ''}</div><div style="opacity:.9;color:#374151">${estado || ''}</div>`)
        .addTo(map);
      hoverPopupRef.current = popup;
    });
      (map as any).on('mouseleave', ptsLayer, () => {
      map.getCanvas().style.cursor = '';
      if (hoverPopupRef.current) { hoverPopupRef.current.remove(); hoverPopupRef.current = null; }
    });
      (map as any).on('click', ptsLayer, (e: any) => {
      const f = e.features && e.features[0];
      if (!f) return;
      const coords = (f.geometry as any).coordinates as [number, number];
      const p = (f.properties as any) || {};
      const obra = obrasEnriquecidas && Array.isArray(obrasEnriquecidas) ? obrasEnriquecidas.find(o => o.id === p.id) || null : null;
      const { nombre } = p;
      
      console.log('🔍 MapLibreVisor - Click en punto individual:', {
        id: p.id,
        nombre: nombre,
        obra: obra,
        comunaCodigo: obra?.comunaCodigo,
        comunaNombre: (obra as any)?.comunaNombre,
        dependencia: (obra as any)?.[getFieldNames.dependencia],
        porcentaje: (obra as any)?.[getFieldNames.porcentaje],
        imagenUrl: (obra as any)?.imagenUrl,
        alertaPresencia: (obra as any)?.[getFieldNames.alertaPresencia],
        // Log de todos los campos disponibles para debugging
        allFields: obra ? Object.keys(obra) : 'No obra found'
      });
      map.easeTo({ center: coords, zoom: Math.max(map.getZoom(), 15), duration: 600 });
      if (clickPopupRef.current) clickPopupRef.current.remove();
      
      // Solo crear popup si obra existe
      if (!obra) return;
      
      // Verificar si la obra tiene coordenadas
      const lat = (obra as any)?.[getFieldNames.lat || ''] || '';
      const lon = (obra as any)?.[getFieldNames.lon || ''] || '';
      const tieneCoordenadas = lat && lon && 
                               !isNaN(parseFloat(String(lat))) && 
                               !isNaN(parseFloat(String(lon))) &&
                               parseFloat(String(lat)) !== 0 && 
                               parseFloat(String(lon)) !== 0;
      
      // Obtener información de la obra
      const imgUrl = (obra as any)?.[getFieldNames.imagenUrl || ''] || (obra as any)?.[getFieldNames.imagen || ''] || '';
        const comunaStr = (obra as any)?.comunaNombre || (obra?.comunaCodigo ? codigoToComuna[obra.comunaCodigo] : (selectedCodigo ? codigoToComuna[selectedCodigo] : '')) || '';
      const dependencia = (obra as any)?.[getFieldNames.dependencia || ''] || '';
      const direccion = (obra as any)?.[getFieldNames.direccion || ''] || '';
      const presupuesto = (obra as any)?.[getFieldNames.presupuesto || ''] || '';
      const porcentaje = (obra as any)?.[getFieldNames.porcentaje || ''] || 0;
      const alertaPresencia = (obra as any)?.[getFieldNames.alertaPresencia || ''] || '';
      const alertaDescripcion = (obra as any)?.[getFieldNames.alertaDescripcion || ''] || '';
      const alertaImpacto = (obra as any)?.[getFieldNames.alertaImpacto || ''] || '';
      
      // Formatear valores monetarios
      const formatMoney = (value: any) => {
        if (!value || value === 0) return 'No especificado';
        const numValue = parseFloat(String(value));
        if (isNaN(numValue)) return 'No especificado';
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numValue);
      };
      
      // Crear HTML del popup
      const imgHtml = imgUrl ? `<div style="margin-bottom:8px"><img src="${imgUrl}" alt="${nombre || ''}" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb"/></div>` : '';
      const comunaText = comunaStr ? `<div style="color:#374151;margin-bottom:6px"><strong>Comuna:</strong> ${comunaStr}</div>` : '';
      const depText = dependencia ? `<div style="color:#374151;margin-bottom:6px"><strong>Dependencia:</strong> ${dependencia}</div>` : '';
      const dirText = direccion ? `<div style="color:#374151;margin-bottom:6px"><strong>Dirección:</strong> ${direccion}</div>` : '';
      const presText = presupuesto ? `<div style="color:#374151;margin-bottom:6px"><strong>Presupuesto:</strong> ${formatMoney(presupuesto)}</div>` : '';
      const pct = (porcentaje === null || porcentaje === undefined) ? 's/d' : `${porcentaje}%`;
      
      // Verificar si hay alerta válida
      const hasValidAlert = alertaPresencia && 
        String(alertaPresencia).toLowerCase() !== 'sin información' && 
        String(alertaPresencia).toLowerCase() !== 'sin informacion' && 
        String(alertaPresencia).toLowerCase() !== 'no aplica' && 
        String(alertaPresencia).toLowerCase() !== 'ninguna' &&
        String(alertaPresencia).toLowerCase() !== 'null' &&
        String(alertaPresencia).toLowerCase() !== '';
      
      const alertaHtml = hasValidAlert ? `
        <div style="margin-top:12px;padding:12px;border:2px solid #dc2626;border-radius:10px;background:#fef2f2;box-shadow:0 2px 8px rgba(220,38,38,0.15)">
          <div style="font-weight:900;color:#dc2626;margin-bottom:8px;font-size:14px;text-transform:uppercase;letter-spacing:0.5px">⚠️ Alerta y Riesgo</div>
          <div style="color:#374151;margin-bottom:6px"><strong style="font-weight:700;color:#111827">Presencia de Riesgo:</strong> <span style="color:#dc2626;font-weight:600">${alertaPresencia}</span></div>
          ${alertaDescripcion ? `<div style="color:#374151;margin-bottom:6px"><strong style="font-weight:700;color:#111827">Descripción:</strong> <span style="color:#374151;line-height:1.4">${alertaDescripcion}</span></div>` : ''}
          ${alertaImpacto ? `<div style="color:#374151"><strong style="font-weight:700;color:#111827">Impacto:</strong> <span style="color:#374151">${alertaImpacto}</span></div>` : ''}
        </div>
      ` : '';
      
      // HTML especial para obras sin coordenadas
      const sinCoordenadasHtml = !tieneCoordenadas ? `
        <div style="margin-top:12px;padding:12px;border:2px solid #f59e0b;border-radius:10px;background:#fef3c7;box-shadow:0 2px 8px rgba(245,158,11,0.15)">
          <div style="font-weight:900;color:#92400e;margin-bottom:8px;font-size:14px;text-transform:uppercase;letter-spacing:0.5px">⚠️ Sin Coordenadas</div>
          <div style="color:#92400e;margin-bottom:6px"><strong style="font-weight:700;color:#92400e">Estado:</strong> <span style="color:#92400e">Esta obra no tiene coordenadas geográficas</span></div>
          <div style="color:#92400e;margin-bottom:6px"><strong style="font-weight:700;color:#92400e">Ubicación:</strong> <span style="color:#92400e">${comunaStr || 'No especificada'}</span></div>
          ${comunaStr === '99 - Varias' ? `<div style="color:#92400e"><strong style="font-weight:700;color:#92400e">Alcance:</strong> <span style="color:#92400e">Obra que abarca toda Antioquia</span></div>` : ''}
        </div>
      ` : '';
      
      const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true })
        .setLngLat(coords)
        .setHTML(`
          <div style="font-weight:900;margin-bottom:12px;color:#111827;font-size:16px;line-height:1.3">${nombre || ''}</div>
          ${imgHtml}
          <div style="background:#f8fafc;padding:12px;border-radius:8px;margin-bottom:12px;border-left:4px solid #3b82f6">
            <div style="font-weight:700;color:#1e40af;margin-bottom:8px;font-size:14px">📋 Información del Proyecto</div>
          ${depText}
          ${comunaText}
            ${dirText}
            ${presText}
            <div style="color:#111827;margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb">
              <strong>Avance del proyecto:</strong> <span style="font-weight:800;color:#059669">${pct}</span>
        </div>
          </div>
          ${alertaHtml}
          ${sinCoordenadasHtml}
        `)
        .addTo(map);
      clickPopupRef.current = popup;
      if (onObraClick && obra) onObraClick(obra);
    });
    } else {
      // Asegurar que, si existían capas antiguas, queden ocultas
      if (map.getLayer(cl)) {
        map.setLayoutProperty(cl, 'visibility', 'none');
      }
      if (map.getLayer(clCnt)) {
        map.setLayoutProperty(clCnt, 'visibility', 'none');
      }
      if (map.getLayer(ptsLayer)) {
        map.setLayoutProperty(ptsLayer, 'visibility', 'none');
      }
    }

    // Mostrar/ocultar centroids según selección y filtro de proyecto (si hay proyecto, ocultarlos)
    if (map.getLayer('centroids-layer')) {
      map.setLayoutProperty('centroids-layer', 'visibility', hasProyectoFilter ? 'none' : 'visible');
    }
    if (map.getLayer('centroids-text')) {
      map.setLayoutProperty('centroids-text', 'visibility', hasProyectoFilter ? 'none' : 'visible');
    }

    // Resaltado de límites
    if (map.getLayer('limites-sel')) {
      const selFilter: any = ['==', ['get', 'CODIGO'], selectedCodigo || ''];
      (map as any).setFilter('limites-sel', selFilter);
    }

    // Capa sin clustering para la comuna seleccionada (solo si está habilitado)
    if (SHOW_SELECTED_POINTS) {
    const featuresSel: GeoJSON.Feature[] = obrasEnriquecidas && Array.isArray(obrasEnriquecidas)
      ? obrasEnriquecidas
          .filter(o => (o as any)[getFieldNames.lat] != null && (o as any)[getFieldNames.lon] != null && (selectedCodigo ? o.comunaCodigo === selectedCodigo : false))
          .map(o => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [(o as any)[getFieldNames.lon] as number, (o as any)[getFieldNames.lat] as number] }, properties: { id: o.id, nombre: (o as any)[getFieldNames.nombre], estado: (o as any)[getFieldNames.estado], dependencia: (o as any)[getFieldNames.dependencia], comunaCodigo: o.comunaCodigo || '' } }))
      : [];
    const fcSel: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: featuresSel };
    // Crear expresión de color con validación para evitar error de MapLibre
    let circleColorSel: any;
    if (dependencyColorMap && Object.keys(dependencyColorMap).length > 0) {
      const matchColorSel: any[] = ['match', ['get', 'dependencia']];
      Object.entries(dependencyColorMap).forEach(([dep, color]) => { matchColorSel.push(dep, color); });
      matchColorSel.push('#3B8686'); // Color por defecto
      circleColorSel = matchColorSel;
    } else {
      // Si no hay dependencias, usar un color fijo
      circleColorSel = '#3B8686';
    }

    if (!map.getSource(selSrc)) {
      map.addSource(selSrc, { type: 'geojson', data: fcSel });
      map.addLayer({ id: selLayer, type: 'circle', source: selSrc, paint: { 'circle-color': circleColorSel, 'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 7, 13, 9, 16, 12] as any, 'circle-stroke-color': '#1f2937', 'circle-stroke-width': 1.5, 'circle-opacity': 1 } });
    } else {
      (map.getSource(selSrc) as GeoJSONSource).setData(fcSel);
        if (map.getLayer(selLayer)) {
      (map as any).setPaintProperty(selLayer, 'circle-color', circleColorSel);
      (map as any).setPaintProperty(selLayer, 'circle-radius', ['interpolate', ['linear'], ['zoom'], 10, 7, 13, 9, 16, 12] as any);
      map.setPaintProperty(selLayer, 'circle-opacity', 1);
    }
      }
      if (map.getLayer(selLayer)) {
        map.setLayoutProperty(selLayer, 'visibility', selectedCodigo ? 'visible' : 'none');
        try { 
          map.moveLayer(selLayer); 
        } catch { 
          // Ignorar errores de moveLayer si la capa no existe
        }
      }

      // Tooltips/clicks solo si la capa existe
    (map as any).off('mouseenter', selLayer);
    (map as any).off('mouseleave', selLayer);
      if (map.getLayer(selLayer)) {
    (map as any).on('mouseenter', selLayer, (e: any) => {
      map.getCanvas().style.cursor = 'pointer';
      const f = e.features && e.features[0];
      if (!f) return;
      const { nombre, estado } = (f.properties as any) || {};
      if (hoverPopupRef.current) hoverPopupRef.current.remove();
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
        .setLngLat((f.geometry as any).coordinates)
        .setHTML(`<div style="font-weight:700;color:#111827">${nombre || ''}</div><div style="opacity:.9;color:#374151">${estado || ''}</div>`)
        .addTo(map);
      hoverPopupRef.current = popup;
    });
    (map as any).on('mouseleave', selLayer, () => {
      map.getCanvas().style.cursor = '';
      if (hoverPopupRef.current) { hoverPopupRef.current.remove(); hoverPopupRef.current = null; }
    });
      }
    }
  }, [obrasEnriquecidas, selectedCodigo, mapLoaded, dependencyColorMap, SHOW_OBRA_POINTS, SHOW_SELECTED_POINTS, onObraClick, hasProyectoFilter, codigoToComuna, getFieldNames]);


  // ESC para limpiar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedCodigo(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Click en polígonos para seleccionar comuna
  useEffect(() => {
    const map = mapRef.current; if (!map || !mapLoaded) return;
    const limitesFill = 'limites-fill';
    (map as any).off('click', limitesFill);
    (map as any).on('click', limitesFill, (e: any) => {
      const f = e.features && e.features[0];
      const codigo = f?.properties && (f.properties as any).CODIGO as string;
      setSelectedCodigo(codigo || null);
      if (onComunaChange) onComunaChange(codigo || null);
    });
  }, [mapLoaded, onComunaChange]);

  // Al seleccionar comuna, ajustar vista a su polígono y limpiar popups hover
  useEffect(() => {
    const map = mapRef.current; if (!map || !limites) return;
    if (hoverPopupRef.current) { hoverPopupRef.current.remove(); hoverPopupRef.current = null; }
    if (!selectedCodigo) { if (clickPopupRef.current) { clickPopupRef.current.remove(); clickPopupRef.current = null; } return; }
    const feat = limites && limites.features ? (limites.features as LimiteFeature[]).find(f => f.properties.CODIGO === selectedCodigo) : null;
    if (!feat) return;
    const bbox = turf.bbox(feat);
    map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 60, duration: 600 });
  }, [selectedCodigo, limites]);

  // Panel lateral (overlay) – datos agregados por comuna
  const comunaNombre = useMemo(() => {
    if (!selectedCodigo || !limites || !limites.features) return '';
    const f = limites && limites.features ? (limites.features as LimiteFeature[]).find(ff => ff.properties.CODIGO === selectedCodigo) : null;
    return f?.properties.NOMBRE || '';
  }, [selectedCodigo, limites]);

  const obrasDeComuna = useMemo(() => {
    if (!selectedCodigo || !obrasEnriquecidas || !Array.isArray(obrasEnriquecidas)) {
      return [] as Obra[];
    }
    
    const sel = String(selectedCodigo).trim();
    
    const filtered = obrasEnriquecidas.filter(o => {
      const codigo = o.comunaCodigo || 
                    (o as any)[getFieldNames.comunaCodigo] || 
                    (o as any)['COMUNA O CORREGIMIENTO'] ||
                    (o as any)['comuna'] ||
                    null;
      const codigoStr = codigo ? String(codigo).trim() : '';
      const matches = codigoStr === sel;
      if (matches) {
      }
      return matches;
    });
    
    // Si no encontramos obras con el código exacto, intentemos con el formato del conteos
    if (filtered.length === 0) {
      
      // Buscar en las obras directamente por el código
      const filtered2 = obrasEnriquecidas.filter(o => {
        const codigo = o.comunaCodigo || 
                      (o as any)[getFieldNames.comunaCodigo] || 
                      (o as any)['COMUNA O CORREGIMIENTO'] ||
                      (o as any)['comuna'] ||
                      null;
        const codigoStr = codigo ? String(codigo).trim() : '';
        // Buscar si el código contiene el código seleccionado o viceversa
        return codigoStr.includes(sel) || sel.includes(codigoStr);
      });
      
      if (filtered2.length > 0) {
        return filtered2;
      }
    }
    
    return filtered;
  }, [obrasEnriquecidas, selectedCodigo, getFieldNames]);

  const totalConUbicacion = obrasDeComuna ? obrasDeComuna.filter(o => (o as any)[getFieldNames.lat] != null && (o as any)[getFieldNames.lon] != null).length : 0;
  const sinUbicacion = obrasDeComuna ? obrasDeComuna.length - totalConUbicacion : 0;
  const indicadorPromedio = useMemo(() => {
    if (!obrasDeComuna || obrasDeComuna.length === 0) return 0;
    const vals = (obrasDeComuna as any[]).map(o => Number((o as any)[getFieldNames.porcentaje]) || 0);
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round((sum / vals.length) * 100) / 100;
  }, [obrasDeComuna, getFieldNames]);

  // (El visor no usa filtros internos; se controla por props/URL)

  // Mostrar mensaje de carga solo si estamos en producción y no hay datos después de un tiempo
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);
  
  useEffect(() => {
    if (!obrasToUse || obrasToUse.length === 0) {
      const timer = setTimeout(() => {
        setShowLoadingMessage(true);
      }, 2000); // Esperar 2 segundos antes de mostrar mensaje de carga
      
      return () => clearTimeout(timer);
    } else {
      setShowLoadingMessage(false);
    }
  }, [obrasToUse]);
  
  // Solo mostrar mensaje de carga en producción y si no hay datos después del timeout
  if (import.meta.env.PROD && showLoadingMessage && (!obrasToUse || obrasToUse.length === 0)) {
    return (
      <div style={{ position: 'relative', height, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>🗺️</div>
          <div>Cargando datos del mapa...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height }}> 
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, background: 'transparent' }} />

      {/* Overlay lateral dentro del mapa */}
      {selectedCodigo && (
        <div className="ml-overlay-panel" style={{ position: 'absolute', top: 12, right: 12, width: 520, maxWidth: '95%', maxHeight: 'calc(100% - 24px)', background: '#ffffff', color: '#111827', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 14px 30px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)', borderBottom: '1px solid #E9ECEF', padding: '12px 14px' }}>
            <div style={{ fontWeight: 800, color: '#1F2937', fontSize: 15, letterSpacing: 0.2 }}>Obras en {comunaNombre}</div>
            <button onClick={() => { setSelectedCodigo(null); if (onComunaChange) onComunaChange(null); }} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 10px', fontSize: 13, cursor: 'pointer', color: '#1F2937' }}>Volver</button>
          </div>
          <div style={{ padding: 14, overflow: 'auto' }}>
            {/* Resumen de conteos */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
              <div style={{ fontWeight: 900, color: '#111827', marginBottom: 4 }}>Total: {obrasDeComuna.length} obras</div>
              <div style={{ color: '#374151' }}>{totalConUbicacion} con ubicación</div>
              <div style={{ color: '#DC2626', fontWeight: 700 }}>{sinUbicacion} sin ubicación</div>
            </div>
            {/* Métricas resumidas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6B7280' }}>Total</div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{obrasDeComuna.length}</div>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6B7280' }}>Con ubicación</div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{totalConUbicacion}</div>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6B7280' }}>Avance prom.</div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{indicadorPromedio}%</div>
              </div>
            </div>


            {obrasDeComuna.map((o) => {
              const estado = ((o as any)[getFieldNames.estado] || '').toLowerCase();
              const estadoColor = estado.includes('termin') ? '#16a34a' : estado.includes('ejec') ? '#2563eb' : estado.includes('suspend') ? '#f59e0b' : '#6b7280';
              const estadoBg = estado.includes('termin') ? 'rgba(22,163,74,0.12)' : estado.includes('ejec') ? 'rgba(37,99,235,0.12)' : estado.includes('suspend') ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.12)';
              const avance = (o as any)[getFieldNames.porcentaje] ?? 0;
              const depColor = dependencyColorMap[(o as any)[getFieldNames.dependencia]] || '#0B7285';
              return (
                <div key={o.id} style={{ padding: '12px 8px', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, color: '#111827', fontSize: 12 }}>{(o as any)[getFieldNames.nombre]}</div>
                    <span style={{ background: estadoBg, color: estadoColor, border: `1px solid ${estadoColor}22`, borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{(o as any)[getFieldNames.estado] || 'sin estado'}</span>
                  </div>

                  {/* Información básica con bordes */}
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '8px', marginBottom: '8px', backgroundColor: '#F9FAFB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#374151', marginBottom: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: depColor, display: 'inline-block' }}></span>
                      <span style={{ fontWeight: 600 }}>Dependencia:</span>
                      <span>{(o as any)[getFieldNames.dependencia]}</span>
                    </div>
                    {(o as any)[getFieldNames.direccion] && (
                      <div style={{ fontSize: 11, color: '#374151', marginBottom: 4 }}><span style={{ fontWeight: 600 }}>Dirección:</span> {(o as any)[getFieldNames.direccion]}</div>
                    )}
                    {(o as any)[getFieldNames.presupuesto] != null && (
                      <div style={{ fontSize: 11, color: '#374151', marginBottom: 4 }}><span style={{ fontWeight: 600 }}>Presupuesto:</span> {Number((o as any)[getFieldNames.presupuesto]).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</div>
                    )}
                    {(o as any)[getFieldNames.fechaEntrega] && (
                      <div style={{ fontSize: 11, color: '#374151' }}><span style={{ fontWeight: 600 }}>Fecha entrega:</span> {new Date((o as any)[getFieldNames.fechaEntrega]).toLocaleDateString('es-CO')}</div>
                    )}
                  </div>

                  {/* Avance con borde */}
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '8px', marginBottom: '8px', backgroundColor: '#F9FAFB' }}>
                    <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 4 }}>Avance: {avance}%</div>
                    <div style={{ height: 6, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(0, Math.min(100, avance))}%`, height: '100%', background: '#2563eb' }} />
                    </div>
                  </div>

                  {/* Ubicación con borde */}
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '8px', marginBottom: '8px', backgroundColor: '#F9FAFB' }}>
                    {((o as any)[getFieldNames.lat] != null && (o as any)[getFieldNames.lon] != null) && (
                      <a href="#" onClick={(ev) => { ev.preventDefault(); const map = mapRef.current; if (!map) return; map.easeTo({ center: [(o as any)[getFieldNames.lon] as number, (o as any)[getFieldNames.lat] as number], zoom: 16, duration: 600 }); if (onObraClick) onObraClick(o); }} style={{ fontSize: 10, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Con ubicación en mapa</a>
                    )}
                    {((o as any)[getFieldNames.lat] == null || (o as any)[getFieldNames.lon] == null) && (
                      <div style={{ fontSize: 10, color: '#DC2626', fontWeight: 600 }}>Sin coordenadas</div>
                    )}
                  </div>

                  {/* Botón de Gantt */}
                  <div style={{ marginTop: 8 }}>
                    <button 
                      onClick={() => setSelectedObraForGantt(o)}
                      style={{
                        background: 'linear-gradient(135deg, #79BC99 0%, #4E8484 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 6px rgba(121, 188, 153, 0.3)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(121, 188, 153, 0.5)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(121, 188, 153, 0.3)';
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="4" y1="6" x2="10" y2="6" />
                        <line x1="4" y1="12" x2="14" y2="12" />
                        <line x1="4" y1="18" x2="18" y2="18" />
                        <circle cx="10" cy="6" r="2" fill="currentColor" />
                        <circle cx="14" cy="12" r="2" fill="currentColor" />
                        <circle cx="18" cy="18" r="2" fill="currentColor" />
                      </svg>
                      Ver Etapa
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sin filtros internos: este visor se controla por props/URL */}

      {/* Modal de Gantt - FUERA del mapa */}
      {selectedObraForGantt && (
        <div 
          className="gantt-modal-overlay" 
          onClick={() => setSelectedObraForGantt(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div 
            className="gantt-modal-container"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '20px',
              maxWidth: '1400px',
              width: '98%',
              maxHeight: '95vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
              border: '3px solid #79BC99',
              overflow: 'hidden'
            }}
          >
            <div 
              className="gantt-modal-header"
              style={{
                padding: '25px 30px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                borderBottom: '3px solid #79BC99',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <h3 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#000000'
              }}>
                📊 Diagrama de Gantt - {selectedObraForGantt.nombre}
              </h3>
              <button 
                onClick={() => setSelectedObraForGantt(null)}
                style={{
                  background: 'rgba(0, 0, 0, 0.1)',
                  border: '2px solid #79BC99',
                  color: '#000000',
                  fontSize: '28px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                  e.currentTarget.style.borderColor = '#4E8484';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = '#79BC99';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                ×
              </button>
            </div>
            <div 
              className="gantt-modal-content"
              style={{
                padding: '20px',
                overflowY: 'auto',
                flex: 1,
                background: '#fafafa'
              }}
            >
              <GanttChart 
                rows={[selectedObraForGantt as any]} 
                limit={50} 
                mode="phase" 
              />
            </div>
          </div>
        </div>
      )}

      {/* Estilos responsive del panel overlay */}
      <style>{`
        .ml-overlay-panel { transition: transform .2s ease, width .2s ease; }
        @media (max-width: 1200px) {
          .ml-overlay-panel { width: 380px; }
          .ml-overlay-panel div { font-size: 0.96rem; }
        }
        @media (max-width: 992px) {
          .ml-overlay-panel { width: 340px; }
          .ml-overlay-panel .metrics { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .ml-overlay-panel { width: 300px; top: 8px; right: 8px; border-radius: 12px; }
          .ml-overlay-panel .metrics { grid-template-columns: repeat(3, 1fr); gap: 6px; }
          .ml-overlay-panel .metrics div { padding: 6px 8px; }
          .ml-overlay-panel h4, .ml-overlay-panel .title { font-size: 14px; }
        }
        @media (max-width: 480px) {
          .ml-overlay-panel { width: 92vw; left: 4vw; right: 4vw; top: 8px; }
          .ml-overlay-panel .metrics { grid-template-columns: repeat(3, 1fr); gap: 4px; }
          .ml-overlay-panel .item { padding: 8px 6px; }
        }

        /* Estilos responsive para el modal de Gantt */
        @media (max-width: 768px) {
          .gantt-modal-container {
            max-width: 98% !important;
            width: 98% !important;
            max-height: 95vh !important;
          }
          .gantt-modal-header {
            padding: 20px 25px !important;
          }
          .gantt-modal-header h3 {
            font-size: 1.2rem !important;
          }
          .gantt-modal-content {
            padding: 20px !important;
          }
        }

        @media (max-width: 480px) {
          .gantt-modal-container {
            max-width: 99% !important;
            width: 99% !important;
            max-height: 98vh !important;
          }
          .gantt-modal-header {
            padding: 15px 20px !important;
          }
          .gantt-modal-header h3 {
            font-size: 1rem !important;
          }
          .gantt-modal-content {
            padding: 15px !important;
          }
        }

      `}</style>
    </div>
  );
}


