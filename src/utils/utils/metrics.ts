// src/utils/metrics.ts
import { F } from '../../dataConfig';

// ⇩ añade al inicio del archivo
function toNumber(v: unknown): number {
  if (v == null) return 0;
  // quita espacios, separadores de miles . o , y deja solo el decimal con punto
  const s = String(v).replace(/\s/g, '')
    .replace(/(?<=\d)[.,](?=\d{3}\b)/g, '') // separadores de miles
    .replace(/,(?=\d{1,2}\b)/g, '.');       // coma decimal -> punto
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// Fila genérica proveniente del backend
export type Row = Record<string, string | number | Date | null>;

// Formateadores
export const nf = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
export const cf = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

// Únicos (para opciones de filtros)
export function uniques(rows: Row[], field: string): string[] {
  if (!field) return [];
  const vals = rows
    .map(r => String(r[field] ?? ''))
    .filter((s): s is string => s.length > 0);
  return Array.from(new Set(vals)).sort();
}

// Modelo de filtros del UI
export type Filters = {
  proyecto?: string;
  comuna?: string;
  dependencia?: string;
  tipo?: string;
  desde?: string; // 'YYYY' o 'YYYY-MM'
  hasta?: string; // 'YYYY' o 'YYYY-MM'
};

// Nuevas funciones para filtros relacionados
export type FilterOptions = {
  proyectos: string[];
  comunas: string[];
  dependencias: string[];
  tipos: string[];
};

// Obtiene opciones de filtros basadas en datos filtrados
export function getFilterOptions(rows: Row[], currentFilters: Filters): FilterOptions {
  // Aplica filtros actuales excepto el que estamos calculando
  const filteredForOptions = applyFiltersForOptions(rows, currentFilters);
  
  return {
    proyectos: uniques(filteredForOptions, F.proyectoEstrategico),
    comunas: uniques(filteredForOptions, F.comunaOCorregimiento),
    dependencias: uniques(filteredForOptions, F.dependencia),
    tipos: uniques(filteredForOptions, F.tipoDeIntervecion),
  };
}

// Aplica filtros para calcular opciones (excluye el filtro que se está calculando)
export function applyFiltersForOptions(rows: Row[], f: Filters): Row[] {
  const inStr = (val: string | undefined) =>
    (x: unknown) => !val || String(x ?? '') === val;

  const inDateRange = (x: unknown) => {
    if (!F.fechaRealDeEntrega) return true;
    const raw = String(x ?? '');
    if (!raw) return true;

    const usesMonth = (f.desde?.length === 7) || (f.hasta?.length === 7);
    const key = usesMonth ? raw.slice(0, 7) : raw.slice(0, 4); // compara por año o año-mes

    if (f.desde && key < f.desde) return false;
    if (f.hasta && key > f.hasta) return false;
    return true;
  };

  return rows.filter(r =>
    inStr(f.proyecto)(F.proyectoEstrategico ? r[F.proyectoEstrategico] : undefined) &&
    inStr(f.comuna)(F.comunaOCorregimiento ? r[F.comunaOCorregimiento] : undefined) &&
    inStr(f.dependencia)(F.dependencia ? r[F.dependencia] : undefined) &&
    inStr(f.tipo)(F.tipoDeIntervecion ? r[F.tipoDeIntervecion] : undefined) &&
    inDateRange(F.fechaEstimadaDeEntrega ? r[F.fechaEstimadaDeEntrega] : undefined)
  );
}

// Función para limpiar filtros dependientes cuando cambia un filtro padre
export function cleanDependentFilters(
  currentFilters: Filters, 
  changedFilter: keyof Filters
): Filters {
  const newFilters = { ...currentFilters };
  
  // Si cambió el proyecto, limpia dependencias y comunas
  if (changedFilter === 'proyecto') {
    delete newFilters.dependencia;
    delete newFilters.comuna;
  }
  
  // Si cambió la dependencia, limpia comunas
  if (changedFilter === 'dependencia') {
    delete newFilters.comuna;
  }
  
  // Si cambió el tipo, no limpia nada específico
  
  return newFilters;
}

// Aplica filtros (sin any)
export function applyFilters(rows: Row[], f: Filters): Row[] {
  const inStr = (val: string | undefined) =>
    (x: unknown) => !val || String(x ?? '') === val;

  const inDateRange = (x: unknown) => {
    if (!F.fechaRealDeEntrega) return true;
    const raw = String(x ?? '');
    if (!raw) return true;

    const usesMonth = (f.desde?.length === 7) || (f.hasta?.length === 7);
    const key = usesMonth ? raw.slice(0, 7) : raw.slice(0, 4); // compara por año o año-mes

    if (f.desde && key < f.desde) return false;
    if (f.hasta && key > f.hasta) return false;
    return true;
  };

  return rows.filter(r =>
    inStr(f.proyecto)(F.proyectoEstrategico ? r[F.proyectoEstrategico] : undefined) &&
    inStr(f.comuna)(F.comunaOCorregimiento ? r[F.comunaOCorregimiento] : undefined) &&
    inStr(f.dependencia)(F.dependencia ? r[F.dependencia] : undefined) &&
    inStr(f.tipo)(F.tipoDeIntervecion ? r[F.tipoDeIntervecion] : undefined) &&
    inDateRange(F.fechaEstimadaDeEntrega ? r[F.fechaEstimadaDeEntrega] : undefined)
  );
}

// Suma por categoría (sin any)
export function groupSum(
  rows: Row[],
  keyField: string,
  valueField: string
): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[keyField] ?? '');
    if (!k) continue;
    const num = toNumber(r[valueField]);      // en vez de Number(...)
    if (!Number.isFinite(num)) continue;
    map.set(k, (map.get(k) ?? 0) + num);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export function sortDesc(a: { value: number }, b: { value: number }) {
  return b.value - a.value;
}

export function topNWithOthers(
  arr: Array<{ name: string; value: number }>,
  n = 15,
  label = 'Otros'
) {
  if (arr.length <= n) return arr;
  const top = arr.slice(0, n);
  const rest = arr.slice(n).reduce((s, x) => s + x.value, 0);
  return rest > 0 ? [...top, { name: label, value: rest }] : top;
}

// KPIs clave (sin any)
export function kpis(rows: Row[]) {
  const totalObras = rows.length;

  const invTotal = F.costoTotalActualizado
    ? rows.reduce((s, r) => {
        const costoActualizado = toNumber(r[F.costoTotalActualizado]);
        const costoEstimado = toNumber(r[F.costoEstimadoTotal]);
        // Si costo total actualizado es null o 0, usar costo estimado total
        const costoFinal = (costoActualizado === null || costoActualizado === 0) 
          ? costoEstimado 
          : costoActualizado;
        return s + costoFinal;
      }, 0)
    : 0;

  const ejec = F.presupuestoEjecutado
    ? rows.reduce((s, r) => s + Number(r[F.presupuestoEjecutado] ?? 0), 0)
    : 0;

  // Heurística de “entregadas”
  let entregadas = 0;
  const yearNow = new Date().getFullYear();
  for (const r of rows) {
    const byEstado =
      F.estadoDeLaObra && String(r[F.estadoDeLaObra] ?? '').toLowerCase().includes('entreg');
    let byFecha = false;
    if (F.fechaRealDeEntrega && !byEstado) {
      const y = Number(String(r[F.fechaRealDeEntrega] ?? '').slice(0, 4));
      if (y && y <= yearNow) byFecha = true;
    }
    if (byEstado || byFecha) entregadas++;
  }

  const pctEntregadas = totalObras ? entregadas / totalObras : 0;
  const pctEjec = invTotal ? ejec / invTotal : 0;

  const alertas = F.descripcionDelRiesgo
    ? rows.filter(r => String(r[F.descripcionDelRiesgo] ?? '').trim().length > 0).length
    : 0;

  return { totalObras, invTotal, ejec, entregadas, pctEntregadas, pctEjec, alertas };
}

// Dataset 2D con dos métricas (dim, v1, v2)
export type TableDataset = Array<Array<string | number>>;

export function buildTwoSeriesDataset(
  rows: Row[],
  dimField: string,
  val1Field: string,
  val2Field: string,
  topN = 15
): TableDataset {
  const a = groupSum(rows, dimField, val1Field);
  const b = groupSum(rows, dimField, val2Field);

  const acc = new Map<string, { v1: number; v2: number }>();
  for (const { name, value } of a) acc.set(name, { v1: value, v2: 0 });
  for (const { name, value } of b) {
    const prev = acc.get(name) ?? { v1: 0, v2: 0 };
    prev.v2 += value;
    acc.set(name, prev);
  }

  const merged = Array.from(acc.entries()).map(([name, { v1, v2 }]) => ({
    name,
    total: v1 + v2,
    v1,
    v2
  }));

  merged.sort((x, y) => y.total - x.total);
  const limitedNames = new Set(
    topNWithOthers(merged.map(m => ({ name: m.name, value: m.total })), topN).map(m => m.name)
  );

  const headers: [string, string, string] = [dimField, val1Field, val2Field];
  const data = merged.filter(m => limitedNames.has(m.name)).map(m => [m.name, m.v1, m.v2]);

  return [headers, ...data];
}
