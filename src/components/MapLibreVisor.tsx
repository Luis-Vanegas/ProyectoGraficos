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
};

const styleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export default function MapLibreVisor({ height = 600, query, onComunaChange, onObraClick }: Props) {
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
      return !!params?.get('proyectoEstrategico');
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
    const query = params ? `?${params.toString()}` : '';
    const res = await fetch(`/api/obras${query}`);
    if (!res.ok) {
      throw new Error('No se pudo cargar /api/obras');
    }
    const data = (await res.json()) as Obra[];
    setObras(data);
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

  const dependencyColorMap = useMemo(() => {
    if (!obras || !Array.isArray(obras)) return {};
    const deps = Array.from(new Set(obras.map(o => o.dependencia).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));
    const total = deps.length || 1;
    const map: Record<string, string> = {};
    deps.forEach((dep, idx) => {
      const hue = Math.round((idx / total) * 360);
      const saturation = 65;
      const lightness = 42;
      map[dep] = hslToHex(hue, saturation, lightness);
    });
    return map;
  }, [obras]);

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
  useEffect(() => { fetchLimites().catch(console.error); }, [fetchLimites]);
  useEffect(() => {
    let params: URLSearchParams | undefined;
    if (typeof query === 'string') params = new URLSearchParams(query);
    else if (query instanceof URLSearchParams) params = query;
    fetchObras(params).catch(console.error);
  }, [fetchObras, query]);
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
    if (!obras || !Array.isArray(obras)) return [];
    
    console.log('🔍 Debug obrasEnriquecidas - Total obras originales:', obras.length);
    console.log('🔍 Debug obrasEnriquecidas - Campos disponibles:', obras.length > 0 ? Object.keys(obras[0]) : []);
    console.log('🔍 Debug obrasEnriquecidas - Primeras 10 obras completas:', obras.slice(0, 10));
    console.log('🔍 Debug obrasEnriquecidas - Primera obra completa:', obras.length > 0 ? obras[0] : null);
    console.log('🔍 Debug obrasEnriquecidas - Primeras 3 obras:', obras.slice(0, 3).map(o => ({
      id: o.id,
      nombre: (o as any)['NOMBRE'],
      comuna: (o as any)['COMUNA O CORREGIMIENTO'],
      lat: (o as any)['LATITUD'],
      lon: (o as any)['LONGITUD'],
      comunaCodigo: (o as any)['COMUNA O CORREGIMIENTO']
    })));
    
    if (!limites) {
      return obras.map(o => ({ ...o, comunaCodigo: (o as any)['COMUNA O CORREGIMIENTO'] || null }));
    }
    const fc = limites;
    const enriquecidas = obras.map(o => {
      const normalizedCodigo = (o as any)['COMUNA O CORREGIMIENTO'] ? String((o as any)['COMUNA O CORREGIMIENTO']).trim() : null;
      if (!normalizedCodigo && (o as any)['LATITUD'] != null && (o as any)['LONGITUD'] != null) {
        const pt = turf.point([(o as any)['LONGITUD'], (o as any)['LATITUD']]);
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
    
    console.log('🔍 Debug obrasEnriquecidas - Obras con comunaCodigo:', enriquecidas.filter(o => o.comunaCodigo).length);
    
    return enriquecidas;
  }, [obras, limites]);

  // Build centroides y conteos por comuna (todas las obras con comuna conocida)
  const conteos = useMemo(() => {
    if (!limites || !limites.features) {
      const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection;
      return { centroids: emptyFC, counts: {} as Record<string, number> };
    }
    const counts: Record<string, number> = {};
    if (obrasEnriquecidas && Array.isArray(obrasEnriquecidas)) {
      console.log('🔍 Debug conteos - Total obras:', obrasEnriquecidas.length);
      console.log('🔍 Debug conteos - Primeras 3 obras:', obrasEnriquecidas.slice(0, 3).map(o => ({
        id: o.id,
        nombre: (o as any)['NOMBRE'],
        comunaCodigo: o.comunaCodigo,
        comunaOriginal: (o as any)['COMUNA O CORREGIMIENTO'],
        campos: Object.keys(o)
      })));
      
      for (const o of obrasEnriquecidas) {
        const codigo = o.comunaCodigo ? String(o.comunaCodigo).trim() : null;
        if (codigo) counts[codigo] = (counts[codigo] ?? 0) + 1;
      }
      
      console.log('🔍 Debug conteos - Conteos por comuna:', counts);
    }
    const centroids = {
      type: 'FeatureCollection',
      features: limites.features ? (limites.features as LimiteFeature[]).map((f) => {
        const p = turf.pointOnFeature(f as any);
        const count = counts[f.properties.CODIGO] ?? 0;
        return { type: 'Feature', geometry: p.geometry, properties: { CODIGO: f.properties.CODIGO, NOMBRE: f.properties.NOMBRE, count } } as GeoJSON.Feature;
      }) : []
    } as unknown as GeoJSON.FeatureCollection;
    return { centroids, counts };
  }, [limites, obrasEnriquecidas]);

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
      map.addSource(centroidsSrc, { type: 'geojson', data: conteos.centroids });
      map.addLayer({ id: centroidsLayer, type: 'circle', source: centroidsSrc, paint: { 'circle-radius': 18, 'circle-color': '#F77F26', 'circle-stroke-color': '#00000033', 'circle-stroke-width': 3 } });
      map.addLayer({ id: centroidsText, type: 'symbol', source: centroidsSrc, layout: { 'text-field': ['to-string', ['get', 'count']], 'text-size': 12, 'text-font': ['Open Sans Bold'] }, paint: { 'text-color': '#fff' } });
    } else {
      (map.getSource(centroidsSrc) as GeoJSONSource).setData(conteos.centroids);
    }

    // Click en centroides -> seleccionar comuna
    (map as any).off('click', centroidsLayer);
    (map as any).on('click', centroidsLayer, (e: any) => {
      const f = e.features && e.features[0];
      const codigo = f?.properties && (f.properties as any).CODIGO as string;
      setSelectedCodigo(codigo || null);
      if (onComunaChange) onComunaChange(codigo || null);
    });

  }, [limites, conteos, mapLoaded, onComunaChange, codigoToComuna]);

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
      ? obrasEnriquecidas.filter(o => (o as any)['LATITUD'] != null && (o as any)['LONGITUD'] != null).map(o => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [(o as any)['LONGITUD'] as number, (o as any)['LATITUD'] as number] },
          properties: { id: o.id, nombre: (o as any)['NOMBRE'], estado: (o as any)['ESTADO DE LA OBRA'], dependencia: (o as any)['DEPENDENCIA'], comunaCodigo: o.comunaCodigo || '' }
        }))
      : [];
    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
      // Limpiar capas y fuente anteriores si existían (para asegurar cluster: false)
      if (map.getLayer(cl)) map.removeLayer(cl);
      if (map.getLayer(clCnt)) map.removeLayer(clCnt);
      if (map.getLayer(ptsLayer)) map.removeLayer(ptsLayer);
      if (map.getSource(src)) map.removeSource(src);

      // Crear fuente sin clustering y capa de puntos individuales
      map.addSource(src, { type: 'geojson', data: fc });
      
      // Crear expresión de color con validación para evitar error de MapLibre
      let circleColor: any;
      if (Object.keys(dependencyColorMap).length > 0) {
        const matchColor: any[] = ['match', ['get', 'dependencia']];
        Object.entries(dependencyColorMap).forEach(([dep, color]) => { matchColor.push(dep, color); });
        matchColor.push('#3B8686'); // Color por defecto
        circleColor = matchColor;
      } else {
        // Si no hay dependencias, usar un color fijo
        circleColor = '#3B8686';
      }
      
      map.addLayer({ 
        id: ptsLayer, 
        type: 'circle', 
        source: src, 
        paint: { 
          'circle-color': circleColor, 
          'circle-radius': 6, 
          'circle-stroke-color': '#ffffff', 
          'circle-stroke-width': 1 
        } 
      });

      // Si hay filtro de proyecto, ajustar vista a la extensión de las obras filtradas
      try {
        if (hasProyectoFilter && fc.features.length > 0) {
          const bbox = turf.bbox(fc as any);
          map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 60, duration: 600 });
        }
              } catch (error) {
                console.warn('Error al ajustar vista del mapa:', error);
              }

      // Mostrar puntos al acercar (o si hay una comuna seleccionada o un proyecto activo) y filtrar por comuna cuando haya selección
      const ZOOM_TO_SHOW_POINTS = 13;
      const applyVisibilityAndFilter = () => {
        const shouldShow = map.getZoom() >= ZOOM_TO_SHOW_POINTS || !!selectedCodigo || hasProyectoFilter;
        if (map.getLayer(ptsLayer)) {
          map.setLayoutProperty(ptsLayer, 'visibility', shouldShow ? 'visible' : 'none');
          const filter: any = selectedCodigo ? ['==', ['get', 'comunaCodigo'], selectedCodigo] : ['boolean', true];
          (map as any).setFilter(ptsLayer, filter);
        }
      };
      applyVisibilityAndFilter();
      (map as any).off('zoomend', applyVisibilityAndFilter as any);
      (map as any).on('zoomend', applyVisibilityAndFilter as any);

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
      map.easeTo({ center: coords, zoom: Math.max(map.getZoom(), 15), duration: 600 });
      if (clickPopupRef.current) clickPopupRef.current.remove();
      
      // Solo crear popup si obra existe
      if (!obra) return;
        const imgHtml = (obra as any)?.imagenUrl ? `<div style="margin-bottom:8px"><img src="${(obra as any).imagenUrl}" alt="${nombre || ''}" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb"/></div>` : '';
        const comunaStr = (obra as any)?.comunaNombre || (obra?.comunaCodigo ? codigoToComuna[obra.comunaCodigo] : (selectedCodigo ? codigoToComuna[selectedCodigo] : '')) || '';
      const comunaText = comunaStr ? `<div style="color:#374151;margin-bottom:6px"><strong>Comuna:</strong> ${comunaStr}</div>` : '';
      const depText = (obra as any)?.['DEPENDENCIA'] ? `<div style="color:#374151;margin-bottom:6px"><strong>Dependencia:</strong> ${(obra as any)['DEPENDENCIA']}</div>` : '';
      const pctVal = (obra as any)?.['PORCENTAJE EJECUCIÓN OBRA'];
      const pct = (pctVal === null || pctVal === undefined) ? 's/d' : `${pctVal}%`;
      const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true })
        .setLngLat(coords)
        .setHTML(`
          <div style="font-weight:900;margin-bottom:8px;color:#111827;font-size:15px">${nombre || ''}</div>
          ${imgHtml}
          ${depText}
          ${comunaText}
          <div style="color:#111827;margin-top:4px"><strong>Avance del proyecto:</strong> <span style="font-weight:800">${pct}</span></div>
      ${(obra as any)?.['PRESENCIA DE RIESGO'] && (String((obra as any)['PRESENCIA DE RIESGO']).toLowerCase() !== 'sin información' && String((obra as any)['PRESENCIA DE RIESGO']).toLowerCase() !== 'sin informacion' && String((obra as any)['PRESENCIA DE RIESGO']).toLowerCase() !== 'no aplica' && String((obra as any)['PRESENCIA DE RIESGO']).toLowerCase() !== 'ninguna') ? `
        <div style="margin-top:12px;padding:12px;border:2px solid #dc2626;border-radius:10px;background:#ffffff;box-shadow:0 2px 8px rgba(220,38,38,0.15)">
          <div style="font-weight:900;color:#000000;margin-bottom:8px;font-size:14px;text-transform:uppercase;letter-spacing:0.5px">⚠️ Alerta y Riesgo</div>
          <div style="color:#000000;margin-bottom:6px"><strong style="font-weight:700;color:#000000">Presencia de Riesgo:</strong> <span style="color:#374151">${(obra as any)['PRESENCIA DE RIESGO']}</span></div>
          ${(obra as any)?.['DESCRIPCIÓN DEL RIESGO'] ? `<div style="color:#000000;margin-bottom:6px"><strong style="font-weight:700;color:#000000">Descripción:</strong> <span style="color:#374151;line-height:1.4">${(obra as any)['DESCRIPCIÓN DEL RIESGO']}</span></div>` : ''}
          ${(obra as any)?.['IMPACTO DEL RIESGO'] ? `<div style="color:#000000"><strong style="font-weight:700;color:#000000">Impacto:</strong> <span style="color:#374151">${(obra as any)['IMPACTO DEL RIESGO']}</span></div>` : ''}
        </div>
      ` : ''}
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
          .filter(o => (o as any)['LATITUD'] != null && (o as any)['LONGITUD'] != null && (selectedCodigo ? o.comunaCodigo === selectedCodigo : false))
          .map(o => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [(o as any)['LONGITUD'] as number, (o as any)['LATITUD'] as number] }, properties: { id: o.id, nombre: (o as any)['NOMBRE'], estado: (o as any)['ESTADO DE LA OBRA'], dependencia: (o as any)['DEPENDENCIA'], comunaCodigo: o.comunaCodigo || '' } }))
      : [];
    const fcSel: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: featuresSel };
    // Crear expresión de color con validación para evitar error de MapLibre
    let circleColorSel: any;
    if (Object.keys(dependencyColorMap).length > 0) {
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
  }, [obrasEnriquecidas, selectedCodigo, mapLoaded, dependencyColorMap, SHOW_OBRA_POINTS, SHOW_SELECTED_POINTS, onObraClick, hasProyectoFilter, codigoToComuna]);


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
    if (!selectedCodigo || !obrasEnriquecidas || !Array.isArray(obrasEnriquecidas)) return [] as Obra[];
    const sel = String(selectedCodigo).trim();
    return obrasEnriquecidas.filter(o => String(o.comunaCodigo ?? '').trim() === sel);
  }, [obrasEnriquecidas, selectedCodigo]);

  const totalConUbicacion = obrasDeComuna ? obrasDeComuna.filter(o => (o as any)['LATITUD'] != null && (o as any)['LONGITUD'] != null).length : 0;
  const sinUbicacion = obrasDeComuna ? obrasDeComuna.length - totalConUbicacion : 0;
  const indicadorPromedio = useMemo(() => {
    if (!obrasDeComuna || obrasDeComuna.length === 0) return 0;
    const vals = (obrasDeComuna as any[]).map(o => Number((o as any)['PORCENTAJE EJECUCIÓN OBRA']) || 0);
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round((sum / vals.length) * 100) / 100;
  }, [obrasDeComuna]);

  // (El visor no usa filtros internos; se controla por props/URL)

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
              const estado = ((o as any)['ESTADO DE LA OBRA'] || '').toLowerCase();
              const estadoColor = estado.includes('termin') ? '#16a34a' : estado.includes('ejec') ? '#2563eb' : estado.includes('suspend') ? '#f59e0b' : '#6b7280';
              const estadoBg = estado.includes('termin') ? 'rgba(22,163,74,0.12)' : estado.includes('ejec') ? 'rgba(37,99,235,0.12)' : estado.includes('suspend') ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.12)';
              const avance = (o as any)['PORCENTAJE EJECUCIÓN OBRA'] ?? 0;
              const depColor = dependencyColorMap[(o as any)['DEPENDENCIA']] || '#0B7285';
              return (
                <div key={o.id} style={{ padding: '12px 8px', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, color: '#111827', fontSize: 12 }}>{(o as any)['NOMBRE']}</div>
                    <span style={{ background: estadoBg, color: estadoColor, border: `1px solid ${estadoColor}22`, borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{(o as any)['ESTADO DE LA OBRA'] || 'sin estado'}</span>
                  </div>

                  {/* Información básica con bordes */}
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '8px', marginBottom: '8px', backgroundColor: '#F9FAFB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#374151', marginBottom: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: depColor, display: 'inline-block' }}></span>
                      <span style={{ fontWeight: 600 }}>Dependencia:</span>
                      <span>{(o as any)['DEPENDENCIA']}</span>
                    </div>
                    {(o as any)['DIRECCIÓN'] && (
                      <div style={{ fontSize: 11, color: '#374151', marginBottom: 4 }}><span style={{ fontWeight: 600 }}>Dirección:</span> {(o as any)['DIRECCIÓN']}</div>
                    )}
                    {(o as any)['PRESUPUESTO EJECUTADO'] != null && (
                      <div style={{ fontSize: 11, color: '#374151', marginBottom: 4 }}><span style={{ fontWeight: 600 }}>Presupuesto:</span> {Number((o as any)['PRESUPUESTO EJECUTADO']).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</div>
                    )}
                    {(o as any)['FECHA REAL DE ENTREGA'] && (
                      <div style={{ fontSize: 11, color: '#374151' }}><span style={{ fontWeight: 600 }}>Fecha entrega:</span> {new Date((o as any)['FECHA REAL DE ENTREGA']).toLocaleDateString('es-CO')}</div>
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
                    {((o as any)['LATITUD'] != null && (o as any)['LONGITUD'] != null) && (
                      <a href="#" onClick={(ev) => { ev.preventDefault(); const map = mapRef.current; if (!map) return; map.easeTo({ center: [(o as any)['LONGITUD'] as number, (o as any)['LATITUD'] as number], zoom: 16, duration: 600 }); if (onObraClick) onObraClick(o); }} style={{ fontSize: 10, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Con ubicación en mapa</a>
                    )}
                    {((o as any)['LATITUD'] == null || (o as any)['LONGITUD'] == null) && (
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


