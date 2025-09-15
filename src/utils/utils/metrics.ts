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

// Formateador de fechas
export function formatDate(dateValue: string | null | undefined): string {
  if (!dateValue || dateValue === 'Sin información' || dateValue === 'undefined') {
    return 'Sin fecha';
  }
  
  try {
    // Si es solo año (YYYY)
    if (/^\d{4}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Si es año-mes (YYYY-MM)
    if (/^\d{4}-\d{2}$/.test(dateValue)) {
      const [year, month] = dateValue.split('-');
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    
    // Si es fecha completa (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      const date = new Date(dateValue);
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Si es otro formato, intentar extraer año
    const yearMatch = dateValue.match(/\d{4}/);
    if (yearMatch) {
      return yearMatch[0];
    }
    
    return dateValue;
  } catch (error) {
    return dateValue;
  }
}

// Únicos (para opciones de filtros)
export function uniques(rows: Row[], field: string): string[] {
  if (!field) return [];
  const vals = rows
    .map(r => String(r[field] ?? ''))
    .filter((s): s is string => s.length > 0 && s !== 'Sin información' && s !== 'undefined');
  return Array.from(new Set(vals)).sort();
}

// Función para obtener años únicos de un campo de fecha
export function getUniqueYears(rows: Row[], field: string): string[] {
  if (!field) return [];
  
  const years = new Set<string>();
  
  rows.forEach(row => {
    const dateValue = String(row[field] ?? '');
    if (dateValue && dateValue !== 'Sin información' && dateValue !== 'undefined') {
      // Extraer año de diferentes formatos
      const yearMatch = dateValue.match(/\d{4}/);
      if (yearMatch) {
        years.add(yearMatch[0]);
      }
    }
  });
  
  return Array.from(years).sort((a, b) => b.localeCompare(a)); // Orden descendente (más reciente primero)
}

// Función para obtener años-meses únicos de un campo de fecha
export function getUniqueYearMonths(rows: Row[], field: string): string[] {
  if (!field) return [];
  
  const yearMonths = new Set<string>();
  
  rows.forEach(row => {
    const dateValue = String(row[field] ?? '');
    if (dateValue && dateValue !== 'Sin información' && dateValue !== 'undefined') {
      // Extraer año-mes de diferentes formatos
      if (/^\d{4}-\d{2}$/.test(dateValue)) {
        yearMonths.add(dateValue);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        yearMonths.add(dateValue.slice(0, 7));
      } else {
        const yearMatch = dateValue.match(/\d{4}/);
        if (yearMatch) {
          yearMonths.add(yearMatch[0]);
        }
      }
    }
  });
  
  return Array.from(yearMonths).sort((a, b) => b.localeCompare(a)); // Orden descendente
}

// Función para obtener valores por defecto de fechas
export function getDefaultDateFilters(): { desde: string; hasta: string } {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  return {
    desde: `${currentYear}-${currentMonth}`, // Mes actual del año actual
    hasta: `${currentYear}` // Año actual
  };
}

// Modelo de filtros del UI
export type Filters = {
  proyecto?: string;
  comuna?: string;
  dependencia?: string;
  tipo?: string;
  estadoDeLaObra?: string;
  contratista?: string;
  desde?: string; // 'YYYY' o 'YYYY-MM'
  hasta?: string; // 'YYYY' o 'YYYY-MM'
  // Campos UI para construir fechas sin romper tipado
  desdeDia?: string;
  desdeMes?: string;
  desdeAnio?: string;
  hastaDia?: string;
  hastaMes?: string;
  hastaAnio?: string;
};

// Nuevas funciones para filtros relacionados
export type FilterOptions = {
  proyectos: string[];
  comunas: string[];
  dependencias: string[];
  tipos: string[];
  estadoDeLaObra: string[];
  contratistas: string[];
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
    estadoDeLaObra: uniques(filteredForOptions, F.estadoDeLaObra),
    contratistas: uniques(filteredForOptions, F.contratistaOperador),
  };
}

// Aplica filtros para calcular opciones (excluye el filtro que se está calculando)
export function applyFiltersForOptions(rows: Row[], f: Filters): Row[] {
  const inStr = (val: string | undefined) =>
    (x: unknown) => !val || String(x ?? '') === val;

  const inDateRange = (x: unknown) => {
    // Si no hay filtros de fecha, no filtrar
    if (!f.desde && !f.hasta) return true;
    
    // Si no hay campo de fecha, no filtrar
    if (!F.fechaEstimadaDeEntrega) return true;
    
    const raw = String(x ?? '');
    if (!raw || raw === 'Sin información' || raw === 'undefined') return true;

    try {
      // Normalizar la fecha (puede venir en diferentes formatos)
      let dateValue = raw;
      
      // Si es solo año (YYYY)
      if (/^\d{4}$/.test(raw)) {
        dateValue = raw;
      }
      // Si es año-mes (YYYY-MM)
      else if (/^\d{4}-\d{2}$/.test(raw)) {
        dateValue = raw;
      }
      // Si es fecha completa (YYYY-MM-DD)
      else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        dateValue = raw.slice(0, 7); // Solo año-mes para comparación
      }
      // Si es otro formato, intentar extraer año
      else {
        const yearMatch = raw.match(/\d{4}/);
        if (yearMatch) {
          dateValue = raw;
        } else {
          return true; // Si no se puede parsear, no filtrar
        }
      }

      // Comparar fechas
      if (f.desde && dateValue < f.desde) return false;
      if (f.hasta && dateValue > f.hasta) return false;
      
      return true;
    } catch (error) {
      console.warn('Error al procesar fecha:', raw, error);
      return true; // Si hay error, no filtrar
    }
  };

  return rows.filter(r =>
    inStr(f.proyecto)(F.proyectoEstrategico ? r[F.proyectoEstrategico] : undefined) &&
    inStr(f.comuna)(F.comunaOCorregimiento ? r[F.comunaOCorregimiento] : undefined) &&
    inStr(f.dependencia)(F.dependencia ? r[F.dependencia] : undefined) &&
    inStr(f.tipo)(F.tipoDeIntervecion ? r[F.tipoDeIntervecion] : undefined) &&
    inStr(f.estadoDeLaObra)(F.estadoDeLaObra ? r[F.estadoDeLaObra] : undefined) &&
    inStr(f.contratista)(F.contratistaOperador ? r[F.contratistaOperador] : undefined) &&
    inDateRange(F.fechaEstimadaDeEntrega ? r[F.fechaEstimadaDeEntrega] : undefined)
  );
}

// Función para limpiar filtros dependientes cuando cambia un filtro padre
export function cleanDependentFilters(
  currentFilters: Filters, 
  changedFilter: keyof Filters
): Filters {
  const newFilters = { ...currentFilters };
  
  // Si cambió el proyecto, limpia dependencias, comunas, contratista y estado de obra
  if (changedFilter === 'proyecto') {
    delete newFilters.dependencia;
    delete newFilters.comuna;
    delete newFilters.contratista;
    delete newFilters.estadoDeLaObra;
  }
  
  // Si cambió la dependencia, limpia comunas, contratista y estado de obra
  if (changedFilter === 'dependencia') {
    delete newFilters.comuna;
    delete newFilters.contratista;
    delete newFilters.estadoDeLaObra;
  }
  
  // Si cambió el tipo, limpia contratista y estado de obra
  if (changedFilter === 'tipo') {
    delete newFilters.contratista;
    delete newFilters.estadoDeLaObra;
  }
  
  return newFilters;
}

// Aplica filtros (sin any)
export function applyFilters(rows: Row[], f: Filters): Row[] {
  const inStr = (val: string | undefined) =>
    (x: unknown) => !val || String(x ?? '') === val;

  const inDateRange = (x: unknown) => {
    // Si no hay filtros de fecha, no filtrar
    if (!f.desde && !f.hasta) return true;
    
    // Si no hay campo de fecha, no filtrar
    if (!F.fechaEstimadaDeEntrega) return true;
    
    const raw = String(x ?? '');
    if (!raw || raw === 'Sin información' || raw === 'undefined') return true;

    try {
      // Normalizar la fecha (puede venir en diferentes formatos)
      let dateValue = raw;
      
      // Si es solo año (YYYY)
      if (/^\d{4}$/.test(raw)) {
        dateValue = raw;
      }
      // Si es año-mes (YYYY-MM)
      else if (/^\d{4}-\d{2}$/.test(raw)) {
        dateValue = raw;
      }
      // Si es fecha completa (YYYY-MM-DD)
      else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        dateValue = raw.slice(0, 7); // Solo año-mes para comparación
      }
      // Si es otro formato, intentar extraer año
      else {
        const yearMatch = raw.match(/\d{4}/);
        if (yearMatch) {
          dateValue = yearMatch[0];
        } else {
          return true; // Si no se puede parsear, no filtrar
        }
      }

      // Comparar fechas
      if (f.desde && dateValue < f.desde) return false;
      if (f.hasta && dateValue > f.hasta) return false;
      
      return true;
    } catch (error) {
      console.warn('Error al procesar fecha:', raw, error);
      return true; // Si hay error, no filtrar
    }
  };

  return rows.filter(r =>
    inStr(f.proyecto)(F.proyectoEstrategico ? r[F.proyectoEstrategico] : undefined) &&
    inStr(f.comuna)(F.comunaOCorregimiento ? r[F.comunaOCorregimiento] : undefined) &&
    inStr(f.dependencia)(F.dependencia ? r[F.dependencia] : undefined) &&
    inStr(f.tipo)(F.tipoDeIntervecion ? r[F.tipoDeIntervecion] : undefined) &&
    inStr(f.estadoDeLaObra)(F.estadoDeLaObra ? r[F.estadoDeLaObra] : undefined) &&
    inStr(f.contratista)(F.contratistaOperador ? r[F.contratistaOperador] : undefined) &&
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

  // Alertas con descripción (campo DESCRIPCIÓN DEL RIESGO no vacío)
  const alertas = F.descripcionDelRiesgo
    ? rows.filter(r => String(r[F.descripcionDelRiesgo] ?? '').trim().length > 0).length
    : 0;

  // Alertas encontradas según fórmula DAX (presencia de riesgo válida)
  const alertasEncontradas = calcularAlertasEncontradas(rows);

  // Nuevas métricas personalizadas
  const porcentajePresupuestoEjecutado = calcularPorcentajePresupuestoEjecutado(rows);
  const porcentajeEntregadas = calcularPorcentajeEntregadas(rows);
  const vigencias2024 = calcularVigencias2024(rows);
  const entregadasConfirmadas = calcularEntregadas(rows);
  const porcentajeCuatrienio2024_2027 = calcularPorcentajeCuatrienio2024_2027(rows);
  const valorCuatrienio2024_2027 = calcularValorCuatrienio2024_2027(rows);

  return { 
    totalObras, 
    invTotal, 
    ejec, 
    entregadas, 
    pctEntregadas, 
    pctEjec, 
    alertas, // con descripción
    alertasEncontradas,
    // Nuevas métricas
    porcentajePresupuestoEjecutado,
    porcentajeEntregadas,
    vigencias2024,
    entregadasConfirmadas,
    porcentajeCuatrienio2024_2027,
    valorCuatrienio2024_2027
  };
}

// ============================================================================
// MÉTRICAS PERSONALIZADAS BASADAS EN FÓRMULAS DAX
// ============================================================================

/**
 * % Presupuesto ejecutado = [Presupuesto ejecutado] / [Costo total actualizado]
 * Si [Costo total actualizado] == 0, retorna 0
 */
export function calcularPorcentajePresupuestoEjecutado(rows: Row[]): number {
  if (!F.presupuestoEjecutado || !F.costoTotalActualizado) return 0;
  
  const presupuestoEjecutado = rows.reduce((sum, r) => {
    return sum + toNumber(r[F.presupuestoEjecutado]);
  }, 0);
  
  const costoTotalActualizado = rows.reduce((sum, r) => {
    const costoActualizado = toNumber(r[F.costoTotalActualizado]);
    const costoEstimado = toNumber(r[F.costoEstimadoTotal]);
    // Si costo total actualizado es null o 0, usar costo estimado total
    const costoFinal = (costoActualizado === null || costoActualizado === 0) 
      ? costoEstimado 
      : costoActualizado;
    return sum + costoFinal;
  }, 0);
  
  // Si costo total actualizado es 0, retornar 0
  if (costoTotalActualizado === 0) return 0;
  
  return presupuestoEjecutado / costoTotalActualizado;
}

/**
 * % Entregadas = [Entregadas] / [Obras totales]
 */
export function calcularPorcentajeEntregadas(rows: Row[]): number {
  const totalObras = rows.length;
  if (totalObras === 0) return 0;
  
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
  
  return entregadas / totalObras;
}

/**
 * Alertas encontradas = Contar obras con PRESENCIA DE RIESGO diferente de:
 * "Sin información", "No Aplica", "Ninguna"
 */
export function calcularAlertasEncontradas(rows: Row[]): number {
  if (!F.presenciaDeRiesgo) return 0;

  // Implementación fiel a la fórmula DAX proporcionada
  // Alertas encontradas = COUNTROWS(Obras filtradas por presencia de riesgo válida)
  const alertas = rows.filter(r => {
    const raw = String(r[F.presenciaDeRiesgo] ?? '').trim();
    const presencia = raw.toLowerCase();
    return raw.length > 0 &&
      presencia !== 'sin información' &&
      presencia !== 'sin informacion' &&
      presencia !== 'no aplica' &&
      presencia !== 'ninguna';
  }).length;

  return alertas < 1 ? 0 : alertas;
}

/**
 * Vigencias 2024 = Contar obras entregadas en 2024
 */
export function calcularVigencias2024(rows: Row[]): number {
  let entregadas2024 = 0;
  
  for (const r of rows) {
    // Verificar por fecha real de entrega
    if (F.fechaRealDeEntrega) {
      const fechaEntrega = String(r[F.fechaRealDeEntrega] ?? '');
      if (fechaEntrega.startsWith('2024')) {
        entregadas2024++;
        continue;
      }
    }
    
    // Verificar por año de entrega si existe
    if (F.fechaRealDeEntrega) {
      const añoEntrega = String(r[F.fechaRealDeEntrega] ?? '').slice(0, 4);
      if (añoEntrega === '2024') {
        entregadas2024++;
        continue;
      }
    }
    
    // Verificar por estado de la obra si contiene "entreg" y fecha estimada 2024
    if (F.estadoDeLaObra && F.fechaEstimadaDeEntrega) {
      const estado = String(r[F.estadoDeLaObra] ?? '').toLowerCase();
      const fechaEstimada = String(r[F.fechaEstimadaDeEntrega] ?? '');
      
      if (estado.includes('entreg') && fechaEstimada.startsWith('2024')) {
        entregadas2024++;
      }
    }
  }
  
  return entregadas2024 < 1 ? 0 : entregadas2024;
}

/**
 * Entregadas = Contar obras con ¿OBRA ENTREGADA? = "si"
 */
export function calcularEntregadas(rows: Row[]): number {
  if (!F.obraEntregada) return 0;
  
  const entregadas = rows.filter(r => {
    const obraEntregada = String(r[F.obraEntregada] ?? '').toLowerCase().trim();
    return obraEntregada === 'si' || obraEntregada === 'sí';
  }).length;
  
  return entregadas < 1 ? 0 : entregadas;
}

/**
 * % Presupuesto Cuatrienio 2024-2027 = [Presupuesto ejecutado administración 2024-2027] / [Inversión total]
 * Calcula el porcentaje del presupuesto ejecutado sobre la inversión total
 */
export function calcularPorcentajeCuatrienio2024_2027(rows: Row[]): number {
  if (!F.presupuestoEjecutadoAdm2024_2027 || !F.costoTotalActualizado) return 0;
  
  const presupuestoEjecutadoCuatrienio = rows.reduce((sum, r) => {
    return sum + toNumber(r[F.presupuestoEjecutadoAdm2024_2027]);
  }, 0);
  
  // Calcular la inversión total (costo total actualizado)
  const inversionTotal = rows.reduce((sum, r) => {
    const costoActualizado = toNumber(r[F.costoTotalActualizado]);
    const costoEstimado = toNumber(r[F.costoEstimadoTotal]);
    // Si costo total actualizado es null o 0, usar costo estimado total
    const costoFinal = (costoActualizado === null || costoActualizado === 0) 
      ? costoEstimado 
      : costoActualizado;
    return sum + costoFinal;
  }, 0);
  
  return inversionTotal ? presupuestoEjecutadoCuatrienio / inversionTotal : 0;
}

/**
 * Valor monetario del Presupuesto Cuatrienio 2024-2027
 */
export function calcularValorCuatrienio2024_2027(rows: Row[]): number {
  if (!F.presupuestoEjecutadoAdm2024_2027) return 0;
  
  return rows.reduce((sum, r) => {
    return sum + toNumber(r[F.presupuestoEjecutadoAdm2024_2027]);
  }, 0);
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

  // Encabezados: usar nombres amigables para ECharts dataset
  const headers: [string, string, string] = [
    dimField,
    'Inversión total',
    'Presupuesto ejecutado'
  ];
  const data = merged
    .filter(m => limitedNames.has(m.name))
    .map(m => [m.name, m.v1, m.v2]);

  return [headers, ...data];
}

// ============================================================================
// VIGENCIAS (AGREGADOS POR AÑO)
// ============================================================================

export type VigenciaRow = {
  year: number;
  estimatedCount: number;
  estimatedInvestment: number;
  realCount: number;
  realInvestment: number;
};

function extractYearFrom(raw: unknown): number | null {
  if (raw == null) return null;
  const str = String(raw).trim();
  if (!str || str === 'Sin información' || str === 'undefined') return null;
  // formatos admitidos: YYYY, YYYY-MM, YYYY-MM-DD, texto que contenga año
  const m = str.match(/\b(\d{4})\b/);
  if (!m) return null;
  const y = Number(m[1]);
  return Number.isFinite(y) ? y : null;
}

function getObraCosto(r: Row): number {
  // Usa costo total actualizado; si es 0 o null, usa costo estimado
  if (!F.costoTotalActualizado && !F.costoEstimadoTotal) return 0;
  const actualizado = F.costoTotalActualizado ? toNumber(r[F.costoTotalActualizado]) : 0;
  const estimado = F.costoEstimadoTotal ? toNumber(r[F.costoEstimadoTotal]) : 0;
  return actualizado === 0 ? estimado : actualizado;
}

function isEntregada(r: Row): boolean {
  if (!F.obraEntregada) return false;
  const v = String(r[F.obraEntregada] ?? '').toLowerCase().trim();
  return v === 'si' || v === 'sí';
}

/**
 * Calcula los agregados por vigencia (año):
 * - Entrega estimada (conteo)
 * - Inversión estimada (suma)
 * - Entrega real (conteo de entregadas con año real)
 * - Inversión real (suma en entregadas con año real)
 */
export function computeVigencias(rows: Row[]): VigenciaRow[] {
  const years = new Set<number>();

  const estCount = new Map<number, number>();
  const estInv = new Map<number, number>();
  const realCount = new Map<number, number>();
  const realInv = new Map<number, number>();

  for (const r of rows) {
    const yEst = F.fechaEstimadaDeEntrega ? extractYearFrom(r[F.fechaEstimadaDeEntrega]) : null;
    const yReal = F.fechaRealDeEntrega ? extractYearFrom(r[F.fechaRealDeEntrega]) : null;

    if (yEst != null) {
      years.add(yEst);
      estCount.set(yEst, (estCount.get(yEst) ?? 0) + 1);
      estInv.set(yEst, (estInv.get(yEst) ?? 0) + getObraCosto(r));
    }

    if (yReal != null && isEntregada(r)) {
      years.add(yReal);
      realCount.set(yReal, (realCount.get(yReal) ?? 0) + 1);
      realInv.set(yReal, (realInv.get(yReal) ?? 0) + getObraCosto(r));
    }
  }

  const ordered = Array.from(years.values()).sort((a, b) => b - a);
  return ordered.map((y) => ({
    year: y,
    estimatedCount: (estCount.get(y) ?? 0) < 1 ? 0 : (estCount.get(y) ?? 0),
    estimatedInvestment: (estInv.get(y) ?? 0) < 1 ? 0 : (estInv.get(y) ?? 0),
    realCount: (realCount.get(y) ?? 0) < 1 ? 0 : (realCount.get(y) ?? 0),
    realInvestment: (realInv.get(y) ?? 0) < 1 ? 0 : (realInv.get(y) ?? 0),
  }));
}