import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map, LngLatLike, MapMouseEvent, GeoJSONSource, Expression } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

type LimiteFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, { CODIGO: string; NOMBRE: string }>;
type LimitesFC = GeoJSON.FeatureCollection<LimiteFeature['geometry'], LimiteFeature['properties']>;

type Obra = {
  id: string;
  nombre: string;
  dependencia: string;
  direccion: string;
  estado: string;
  presupuesto: number;
  fechaEntrega: string;
  lat: number | null;
  lon: number | null;
  comunaCodigo: string | null;
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
  // Sin filtros internos: los filtros llegan por props.query o por URL externa

  // Debounce helpers
  const debounceRef = useRef<number | undefined>(undefined);
  const debounce = useCallback((fn: () => void, ms = 300) => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(fn, ms);
  }, []);

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
    if (!limites) return obras;
    const fc = limites;
    return obras.map(o => {
      if (!o.comunaCodigo && o.lat != null && o.lon != null) {
        const pt = turf.point([o.lon, o.lat]);
        for (const f of fc.features as LimiteFeature[]) {
          if (turf.booleanPointInPolygon(pt, f)) {
            return { ...o, comunaCodigo: f.properties.CODIGO };
          }
        }
      }
      return o;
    });
  }, [obras, limites]);

  // Build centroides y conteos por comuna (solo obras con coords)
  const conteos = useMemo(() => {
    if (!limites) return { centroids: [] as GeoJSON.FeatureCollection, counts: {} as Record<string, number> };
    const counts: Record<string, number> = {};
    for (const o of obrasEnriquecidas) {
      if (o.lat != null && o.lon != null && o.comunaCodigo) {
        counts[o.comunaCodigo] = (counts[o.comunaCodigo] ?? 0) + 1;
      }
    }
    const centroids = {
      type: 'FeatureCollection',
      features: (limites.features as LimiteFeature[]).map((f) => {
        const c = turf.centroid(f);
        return { type: 'Feature', geometry: c.geometry, properties: { CODIGO: f.properties.CODIGO, NOMBRE: f.properties.NOMBRE, count: counts[f.properties.CODIGO] ?? 0 } } as GeoJSON.Feature;
      })
    } as GeoJSON.FeatureCollection;
    return { centroids, counts };
  }, [limites, obrasEnriquecidas]);

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
    map.off('click', centroidsLayer);
    map.on('click', centroidsLayer, (e: MapMouseEvent) => {
      const f = e.features && e.features[0];
      const codigo = f?.properties && (f.properties as any).CODIGO as string;
      setSelectedCodigo(codigo || null);
      if (onComunaChange) onComunaChange(codigo || null);
    });

  }, [limites, conteos, mapLoaded]);

  // Puntos de obras (clusters vista general)
  useEffect(() => {
    const map = mapRef.current; if (!map || !mapLoaded) return;
    const src = 'obras-src';
    const cl = 'obras-clusters';
    const clCnt = 'obras-clusters-count';
    const uncluster = 'obras-uncluster';
    const selSrc = 'obras-sel-src';
    const selLayer = 'obras-sel';

    const features: GeoJSON.Feature[] = obrasEnriquecidas.filter(o => o.lat != null && o.lon != null).map(o => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [o.lon as number, o.lat as number] },
      properties: { id: o.id, nombre: o.nombre, estado: o.estado, dependencia: o.dependencia, comunaCodigo: o.comunaCodigo || '' }
    }));
    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };

    if (!map.getSource(src)) {
      map.addSource(src, { type: 'geojson', data: fc, cluster: true, clusterRadius: 60 });
      map.addLayer({ id: cl, type: 'circle', source: src, filter: ['has', 'point_count'], paint: { 'circle-color': '#F77F26', 'circle-radius': 16, 'circle-stroke-color': '#00000033', 'circle-stroke-width': 3 } });
      map.addLayer({ id: clCnt, type: 'symbol', source: src, filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count'], 'text-size': 12 }, paint: { 'text-color': '#fff' } });
      const matchColor: any[] = ['match', ['get', 'dependencia']];
      Object.entries(dependencyColorMap).forEach(([dep, color]) => { matchColor.push(dep, color); });
      matchColor.push('#3B8686');
      map.addLayer({ id: uncluster, type: 'circle', source: src, filter: ['!', ['has', 'point_count']], paint: { 'circle-color': matchColor as unknown as Expression, 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1 } });
    } else {
      (map.getSource(src) as GeoJSONSource).setData(fc);
      const matchColor: any[] = ['match', ['get', 'dependencia']];
      Object.entries(dependencyColorMap).forEach(([dep, color]) => { matchColor.push(dep, color); });
      matchColor.push('#3B8686');
      map.setPaintProperty(uncluster, 'circle-color', matchColor as unknown as Expression);
    }

    // Mostrar solo la comuna seleccionada en puntos si hay selección
    const filter: Expression = selectedCodigo ? ['==', ['get', 'comunaCodigo'], selectedCodigo] : ['boolean', true];
    map.setFilter(uncluster, ['all', ['!', ['has', 'point_count']], filter]);
    map.setLayoutProperty(cl, 'visibility', selectedCodigo ? 'none' : 'visible');
    map.setLayoutProperty(clCnt, 'visibility', selectedCodigo ? 'none' : 'visible');
    // Ocultar también la capa uncluster si hay selección (usaremos una capa dedicada)
    map.setLayoutProperty(uncluster, 'visibility', selectedCodigo ? 'none' : 'visible');
    if (map.getLayer('centroids-layer')) map.setLayoutProperty('centroids-layer', 'visibility', selectedCodigo ? 'none' : 'visible');
    if (map.getLayer('centroids-text')) map.setLayoutProperty('centroids-text', 'visibility', selectedCodigo ? 'none' : 'visible');

    // Resaltado
    const selFilter: Expression = ['==', ['get', 'CODIGO'], selectedCodigo || ''];
    if (map.getLayer('limites-sel')) map.setFilter('limites-sel', selFilter);

    // Capa sin clustering para la comuna seleccionada (visible a cualquier zoom)
    const featuresSel: GeoJSON.Feature[] = obrasEnriquecidas
      .filter(o => o.lat != null && o.lon != null && (!!selectedCodigo ? o.comunaCodigo === selectedCodigo : false))
      .map(o => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [o.lon as number, o.lat as number] }, properties: { id: o.id, nombre: o.nombre, estado: o.estado, dependencia: o.dependencia, comunaCodigo: o.comunaCodigo || '' } }));
    const fcSel: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: featuresSel };
    const matchColorSel: any[] = ['match', ['get', 'dependencia']];
    Object.entries(dependencyColorMap).forEach(([dep, color]) => { matchColorSel.push(dep, color); });
    matchColorSel.push('#3B8686');

    if (!map.getSource(selSrc)) {
      map.addSource(selSrc, { type: 'geojson', data: fcSel });
      map.addLayer({ id: selLayer, type: 'circle', source: selSrc, paint: { 'circle-color': matchColorSel as unknown as Expression, 'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 7, 13, 9, 16, 12] as unknown as Expression, 'circle-stroke-color': '#1f2937', 'circle-stroke-width': 1.5, 'circle-opacity': 1 } });
    } else {
      (map.getSource(selSrc) as GeoJSONSource).setData(fcSel);
      map.setPaintProperty(selLayer, 'circle-color', matchColorSel as unknown as Expression);
      map.setPaintProperty(selLayer, 'circle-radius', ['interpolate', ['linear'], ['zoom'], 10, 7, 13, 9, 16, 12] as unknown as Expression);
      map.setPaintProperty(selLayer, 'circle-opacity', 1);
    }
    map.setLayoutProperty(selLayer, 'visibility', selectedCodigo ? 'visible' : 'none');
    if (map.getLayer(selLayer)) { try { map.moveLayer(selLayer); } catch (e) {} }

    // Tooltips sobre puntos sin cluster
    map.off('mouseenter', uncluster);
    map.off('mouseleave', uncluster);
    map.on('mouseenter', uncluster, (e: MapMouseEvent) => {
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
    map.on('mouseleave', uncluster, () => {
      map.getCanvas().style.cursor = '';
      if (hoverPopupRef.current) { hoverPopupRef.current.remove(); hoverPopupRef.current = null; }
    });

    // Click en punto: centrar/zoom y popup persistente
    map.off('click', uncluster);
    map.on('click', uncluster, (e: MapMouseEvent) => {
      const f = e.features && e.features[0];
      if (!f) return;
      const coords = (f.geometry as any).coordinates as [number, number];
      const p = (f.properties as any) || {};
      const obra = obrasEnriquecidas.find(o => o.id === p.id) || null;
      const { nombre, estado } = p;
      map.easeTo({ center: coords, zoom: Math.max(map.getZoom(), 15), duration: 600 });
      if (clickPopupRef.current) clickPopupRef.current.remove();
      const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true })
        .setLngLat(coords)
        .setHTML(`<div style="font-weight:700;margin-bottom:4px;color:#111827">${nombre || ''}</div><div style="color:#374151">${estado || ''}</div>`)
        .addTo(map);
      clickPopupRef.current = popup;
      if (onObraClick && obra) onObraClick(obra);
    });

    // Tooltips y clicks para capa seleccionada
    map.off('mouseenter', selLayer);
    map.off('mouseleave', selLayer);
    map.on('mouseenter', selLayer, (e: MapMouseEvent) => {
      map.getCanvas().style.cursor = 'pointer';
      const f = e.features && e.features[0];
      if (!f) return;
      const { nombre, estado } = (f.properties as any) || {};
      if (hoverPopupRef.current) hoverPopupRef.current.remove();
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
        .setLngLat((f.geometry as any).coordinates)
        .setHTML(`<div style=\"font-weight:700;color:#111827\">${nombre || ''}</div><div style=\"opacity:.9;color:#374151\">${estado || ''}</div>`)
        .addTo(map);
      hoverPopupRef.current = popup;
    });
    map.on('mouseleave', selLayer, () => {
      map.getCanvas().style.cursor = '';
      if (hoverPopupRef.current) { hoverPopupRef.current.remove(); hoverPopupRef.current = null; }
    });
    map.off('click', selLayer);
    map.on('click', selLayer, (e: MapMouseEvent) => {
      const f = e.features && e.features[0];
      if (!f) return;
      const coords = (f.geometry as any).coordinates as [number, number];
      const p = (f.properties as any) || {};
      const obra = obrasEnriquecidas.find(o => o.id === p.id) || null;
      const { nombre, estado } = p;
      map.easeTo({ center: coords, zoom: Math.max(map.getZoom(), 15), duration: 600 });
      if (clickPopupRef.current) clickPopupRef.current.remove();
      const imgHtml = obra?.imagenUrl ? `<div style=\"margin-bottom:8px\"><img src=\"${obra.imagenUrl}\" alt=\"${nombre || ''}\" style=\"width:100%;max-height:160px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb\"/></div>` : '';
      const comunaStr = obra?.comunaNombre || (obra?.comunaCodigo ? codigoToComuna[obra.comunaCodigo] : (selectedCodigo ? codigoToComuna[selectedCodigo] : '')) || '';
      const comunaText = comunaStr ? `<div style=\"color:#374151;margin-bottom:6px\"><strong>Comuna:</strong> ${comunaStr}</div>` : '';
      const depText = obra?.dependencia ? `<div style=\"color:#374151;margin-bottom:6px\"><strong>Dependencia:</strong> ${obra.dependencia}</div>` : '';
      const pctVal = (obra as any)?.indicadorAvanceTotal;
      const pct = (pctVal === null || pctVal === undefined) ? 's/d' : `${pctVal}%`;
      const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true })
        .setLngLat(coords)
        .setHTML(`
          <div style=\"font-weight:900;margin-bottom:8px;color:#111827;font-size:15px\">${nombre || ''}</div>
          ${imgHtml}
          ${depText}
          ${comunaText}
          <div style=\"color:#111827;margin-top:4px\"><strong>Avance del proyecto:</strong> <span style=\"font-weight:800\">${pct}</span></div>
        `)
        .addTo(map);
      clickPopupRef.current = popup;
      if (onObraClick && obra) onObraClick(obra);
    });

  }, [obrasEnriquecidas, selectedCodigo, mapLoaded, dependencyColorMap]);

  // Auto-selección al hacer zoom >= 13
  useEffect(() => {
    const map = mapRef.current; if (!map || !limites) return;
    const handler = () => {
      if (!selectedCodigo && map.getZoom() >= 13) {
        const center = map.getCenter();
        const pt = turf.point([center.lng, center.lat]);
        for (const f of limites.features as LimiteFeature[]) {
          if (turf.booleanPointInPolygon(pt, f)) { setSelectedCodigo(f.properties.CODIGO); break; }
        }
      }
      if (map.getZoom() < 13 && selectedCodigo) setSelectedCodigo(null);
    };
    map.on('zoomend', handler);
    return () => { map.off('zoomend', handler); };
  }, [limites, selectedCodigo]);

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
    map.off('click', limitesFill);
    map.on('click', limitesFill, (e: MapMouseEvent) => {
      const f = e.features && e.features[0];
      const codigo = f?.properties && (f.properties as any).CODIGO as string;
      setSelectedCodigo(codigo || null);
      if (onComunaChange) onComunaChange(codigo || null);
    });
  }, [mapLoaded]);

  // Al seleccionar comuna, ajustar vista a su polígono y limpiar popups hover
  useEffect(() => {
    const map = mapRef.current; if (!map || !limites) return;
    if (hoverPopupRef.current) { hoverPopupRef.current.remove(); hoverPopupRef.current = null; }
    if (!selectedCodigo) { if (clickPopupRef.current) { clickPopupRef.current.remove(); clickPopupRef.current = null; } return; }
    const feat = (limites.features as LimiteFeature[]).find(f => f.properties.CODIGO === selectedCodigo);
    if (!feat) return;
    const bbox = turf.bbox(feat);
    map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 60, duration: 600 });
  }, [selectedCodigo, limites]);

  // Panel lateral (overlay) – datos agregados por comuna
  const comunaNombre = useMemo(() => {
    if (!selectedCodigo || !limites) return '';
    const f = (limites.features as LimiteFeature[]).find(ff => ff.properties.CODIGO === selectedCodigo);
    return f?.properties.NOMBRE || '';
  }, [selectedCodigo, limites]);
  const codigoToComuna = useMemo(() => {
    const m: Record<string, string> = {};
    if (!limites) return m;
    (limites.features as LimiteFeature[]).forEach(f => { m[f.properties.CODIGO] = f.properties.NOMBRE; });
    return m;
  }, [limites]);

  const obrasDeComuna = useMemo(() => {
    if (!selectedCodigo) return [] as Obra[];
    return obrasEnriquecidas.filter(o => o.comunaCodigo === selectedCodigo);
  }, [obrasEnriquecidas, selectedCodigo]);

  const totalConUbicacion = obrasDeComuna.filter(o => o.lat != null && o.lon != null).length;
  const indicadorPromedio = useMemo(() => {
    if (obrasDeComuna.length === 0) return 0;
    const vals = (obrasDeComuna as any[]).map(o => Number((o as any).indicadorAvanceTotal) || 0);
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round((sum / vals.length) * 100) / 100;
  }, [obrasDeComuna]);

  // Filtros (placeholder UI simple)
  const setFilterDebounced = (key: keyof typeof filters, value: string) => {
    const next = { ...filters, [key]: value || undefined };
    setFilters(next);
    debounce(() => {
      const params = new URLSearchParams();
      if (next.estado) params.set('estado', next.estado);
      if (next.dependencia) params.set('dependencia', next.dependencia);
      if (next.proyectoEstrategico) params.set('proyectoEstrategico', next.proyectoEstrategico);
      if (typeof next.terminada === 'boolean') params.set('terminada', String(next.terminada));
      fetchObras(params).catch(console.error);
    }, 300);
  };

  return (
    <div style={{ position: 'relative', height }}> 
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, background: 'transparent' }} />

      {/* Overlay lateral dentro del mapa */}
      {selectedCodigo && (
        <div className="ml-overlay-panel" style={{ position: 'absolute', top: 12, right: 12, width: 440, maxWidth: '92%', maxHeight: 'calc(100% - 24px)', background: '#ffffff', color: '#111827', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 14px 30px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #E8F4F8 0%, #D4E6F1 100%)', borderBottom: '1px solid #E9ECEF', padding: '12px 14px' }}>
            <div style={{ fontWeight: 800, color: '#1F2937', fontSize: 15, letterSpacing: 0.2 }}>Obras en {comunaNombre}</div>
            <button onClick={() => { setSelectedCodigo(null); if (onComunaChange) onComunaChange(null); }} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 10px', fontSize: 13, cursor: 'pointer', color: '#1F2937' }}>Volver</button>
          </div>
          <div style={{ padding: 14, overflow: 'auto' }}>
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
              const estado = (o.estado || '').toLowerCase();
              const estadoColor = estado.includes('termin') ? '#16a34a' : estado.includes('ejec') ? '#2563eb' : estado.includes('suspend') ? '#f59e0b' : '#6b7280';
              const estadoBg = estado.includes('termin') ? 'rgba(22,163,74,0.12)' : estado.includes('ejec') ? 'rgba(37,99,235,0.12)' : estado.includes('suspend') ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.12)';
              const avance = (o as any).indicadorAvanceTotal ?? 0;
              const depColor = dependencyColorMap[o.dependencia] || '#0B7285';
              return (
                <div key={o.id} style={{ padding: '12px 8px', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, color: '#111827', fontSize: 14 }}>{o.nombre}</div>
                    <span style={{ background: estadoBg, color: estadoColor, border: `1px solid ${estadoColor}22`, borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{o.estado || 'sin estado'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', marginBottom: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: depColor, display: 'inline-block' }}></span>
                    <span style={{ fontWeight: 600 }}>Dependencia:</span>
                    <span>{o.dependencia}</span>
                  </div>
                  {o.direccion && (
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}><span style={{ fontWeight: 600 }}>Dirección:</span> {o.direccion}</div>
                  )}
                  {o.presupuesto != null && (
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}><span style={{ fontWeight: 600 }}>Presupuesto:</span> {o.presupuesto.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</div>
                  )}
                  {o.fechaEntrega && (
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}><span style={{ fontWeight: 600 }}>Fecha entrega:</span> {new Date(o.fechaEntrega).toLocaleDateString('es-CO')}</div>
                  )}

                  {/* Avance */}
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Avance: {avance}%</div>
                  <div style={{ height: 6, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${Math.max(0, Math.min(100, avance))}%`, height: '100%', background: '#2563eb' }} />
                  </div>

                  {/* Enlace ubicación */}
                  {(o.lat != null && o.lon != null) && (
                    <div>
                      <a href="#" onClick={(ev) => { ev.preventDefault(); const map = mapRef.current; if (!map) return; map.easeTo({ center: [o.lon as number, o.lat as number], zoom: 16, duration: 600 }); if (onObraClick) onObraClick(o); }} style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Con ubicación en mapa</a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sin filtros internos: este visor se controla por props/URL */}

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
      `}</style>
    </div>
  );
}


