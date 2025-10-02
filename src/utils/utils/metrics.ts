// src/utils/metrics.ts
import { F } from '../../dataConfig';

// ⇩ añade al inicio del archivo
export function toNumber(v: unknown): number {
  if (v == null) return 0;
  // quita espacios, separadores de miles . o , y deja solo el decimal con punto
  const s = String(v).replace(/\s/g, '')
    .replace(/(?<=\d)[.,](?=\d{3}\b)/g, '') // separadores de miles
    .replace(/,(?=\d{1,2}\b)/g, '.');       // coma decimal -> punto
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// Función específica para procesar valores de administraciones anteriores
export function toNumberAdminAnteriores(v: unknown): number {
  if (v == null || v === undefined || v === '') return 0;
  
  // Convertir a string y limpiar
  let s = String(v).trim();
  
  // Si está vacío después de trim, retornar 0
  if (!s || s === 'null' || s === 'undefined') return 0;
  
  // Log para debug de valores problemáticos
  const originalValue = s;
  
  // Remover espacios
  s = s.replace(/\s/g, '');
  
  // Si es solo texto sin números, retornar 0
  if (!/\d/.test(s)) return 0;
  
  // Manejar diferentes formatos de números
  // 1. Formato con puntos como separadores de miles: 1.234.567,89
  if (/^\d{1,3}(\.\d{3})*,\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  }
  // 2. Formato con comas como separadores de miles: 1,234,567.89
  else if (/^\d{1,3}(,\d{3})*\.\d{1,2}$/.test(s)) {
    s = s.replace(/,/g, '');
  }
  // 3. Formato solo con puntos (ambiguo): determinar por contexto
  else if (/^\d+\.\d+$/.test(s)) {
    // Si hay solo un punto y 1-2 dígitos después, es decimal
    if (/^\d+\.\d{1,2}$/.test(s)) {
      // Es decimal, mantener como está
    }
    // Si hay más de 2 dígitos después del punto, probablemente es separador de miles
    else if (/^\d+\.\d{3,}$/.test(s)) {
      s = s.replace('.', '');
    }
  }
  // 4. Múltiples puntos: separadores de miles
  else if (/^\d+(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  // 5. Múltiples comas: separadores de miles
  else if (/^\d+(,\d{3})+$/.test(s)) {
    s = s.replace(/,/g, '');
  }
  
  const n = Number(s);
  const result = Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; // Redondear a 2 decimales
  
  
  return result;
}

// Fila genérica proveniente del backend
export type Row = Record<string, string | number | Date | null>;

// Formateadores
export const nf = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
export const cf = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

// Formateador para valores monetarios con notación colombiana (bill, mil M, mill) y 2 decimales
export function formatMoneyColombian(value: number): string {
  const abs = Math.abs(value);
  
  if (abs >= 1e12) {
    // Billones (10^12) - Formato corto redondeado a 2 decimales
    const billones = value / 1e12;
    const redondeado = Math.round(billones * 100) / 100; // 3287.89 -> 3287.89
    // Si es mayor a 1000, mostrar solo 1 decimal: 3287.89 -> 3.29
    if (redondeado >= 1000) {
      const simplificado = redondeado / 1000; // 3287.89 / 1000 = 3.28789
      return `$${simplificado.toFixed(2).replace('.', ',')} bill`;
    }
    return `$${redondeado.toFixed(2).replace('.', ',')} bill`;
  } else if (abs >= 1e9) {
    // Mil millones (10^9)
    return `$${(value / 1e9).toFixed(2).replace('.', ',')} mil M`;
  } else if (abs >= 1e6) {
    // Millones (10^6)
    return `$${(value / 1e6).toFixed(2).replace('.', ',')} mill`;
  } else if (abs >= 1e3) {
    // Miles (10^3)
    return `$${(value / 1e3).toFixed(2).replace('.', ',')} mil`;
  } else {
    // Valores menores a 1000
    return `$${value.toFixed(2).replace('.', ',')}`;
  }
}

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
  proyecto?: string[];
  subproyecto?: string[];
  comuna?: string[];
  dependencia?: string[];
  tipo?: string[];
  estadoDeLaObra?: string[];
  contratista?: string[];
  nombre?: string[];
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
  subproyectos: string[];
  comunas: string[];
  dependencias: string[];
  tipos: string[];
  estadoDeLaObra: string[];
  contratistas: string[];
  nombres: string[];
};

// Obtiene opciones de filtros basadas en datos filtrados
export function getFilterOptions(rows: Row[], currentFilters: Filters): FilterOptions {
  // Calcular opciones dinámicamente, pero SIN autofiltrar por su propia dimensión.
  // Ejemplo: las opciones de "proyectos" deben considerar los demás filtros activos,
  // pero ignorar el filtro de "proyecto" para permitir seleccionar múltiples valores.

  const filteredExceptProyecto = applyFiltersForOptions(rows, { ...currentFilters, proyecto: undefined });
  const filteredExceptSubproyecto = applyFiltersForOptions(rows, { ...currentFilters, subproyecto: undefined });
  const filteredExceptComuna = applyFiltersForOptions(rows, { ...currentFilters, comuna: undefined });
  const filteredExceptDependencia = applyFiltersForOptions(rows, { ...currentFilters, dependencia: undefined });
  const filteredExceptTipo = applyFiltersForOptions(rows, { ...currentFilters, tipo: undefined });
  const filteredExceptEstado = applyFiltersForOptions(rows, { ...currentFilters, estadoDeLaObra: undefined });
  const filteredExceptContratista = applyFiltersForOptions(rows, { ...currentFilters, contratista: undefined });
  const filteredExceptNombre = applyFiltersForOptions(rows, { ...currentFilters, nombre: undefined });

  return {
    proyectos: uniques(filteredExceptProyecto, F.proyectoEstrategico),
    subproyectos: uniques(filteredExceptSubproyecto, F.subproyectoEstrategico),
    comunas: uniques(filteredExceptComuna, F.comunaOCorregimiento),
    dependencias: uniques(filteredExceptDependencia, F.dependencia),
    tipos: uniques(filteredExceptTipo, F.tipoDeIntervecion),
    estadoDeLaObra: uniques(filteredExceptEstado, F.estadoDeLaObra),
    contratistas: uniques(filteredExceptContratista, F.contratistaOperador),
    nombres: uniques(filteredExceptNombre, F.nombre),
  };
}

// Aplica filtros para calcular opciones (incluye todos los filtros activos)
export function applyFiltersForOptions(rows: Row[], f: Filters): Row[] {
  const inStr = (val: string[] | undefined) =>
    (x: unknown) => {
      if (!val) return true;
      // Si el array está vacío, no filtrar (mostrar todos)
      if (val.length === 0) return true;
      // Si el array tiene valores, verificar si el valor actual está incluido
      return val.includes(String(x ?? ''));
    };

  const inDateRange = (x: unknown) => {
    // Si no hay filtros de fecha, no filtrar
    if (!f.desde && !f.hasta) return true;
    
    // Si no hay campo de fecha, no filtrar
    if (!F.fechaEstimadaDeEntrega && !F.fechaRealDeEntrega) return true;
    
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
        dateValue = raw; // Mantener fecha completa para comparación exacta
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
      return true; // Si hay error, no filtrar
    }
  };

  // NUEVO: Aplicar TODOS los filtros activos para calcular opciones relacionadas
  return rows.filter(r =>
    inStr(f.proyecto)(F.proyectoEstrategico ? r[F.proyectoEstrategico] : undefined) &&
    inStr(f.subproyecto)(F.subproyectoEstrategico ? r[F.subproyectoEstrategico] : undefined) &&
    inStr(f.comuna)(F.comunaOCorregimiento ? r[F.comunaOCorregimiento] : undefined) &&
    inStr(f.dependencia)(F.dependencia ? r[F.dependencia] : undefined) &&
    inStr(f.tipo)(F.tipoDeIntervecion ? r[F.tipoDeIntervecion] : undefined) &&
    inStr(f.estadoDeLaObra)(F.estadoDeLaObra ? r[F.estadoDeLaObra] : undefined) &&
    inStr(f.contratista)(F.contratistaOperador ? r[F.contratistaOperador] : undefined) &&
    inStr(f.nombre)(F.nombre ? r[F.nombre] : undefined) &&
    inDateRange(F.fechaEstimadaDeEntrega ? r[F.fechaEstimadaDeEntrega] : F.fechaRealDeEntrega ? r[F.fechaRealDeEntrega] : undefined)
  );
}

// Función para limpiar filtros dependientes cuando cambia un filtro padre
// MODIFICADA: Para permitir selección múltiple, NO eliminamos filtros dependientes
export function cleanDependentFilters(
  currentFilters: Filters, 
  changedFilter: keyof Filters
): Filters {
  const newFilters = { ...currentFilters };
  
  // Para filtros múltiples, NO eliminamos filtros dependientes
  // Esto permite que el usuario mantenga sus selecciones múltiples
  // en todos los filtros, independientemente del orden de selección
  
  // Solo eliminamos filtros dependientes si el filtro padre se vacía completamente
  if (changedFilter === 'proyecto' && (!newFilters.proyecto || newFilters.proyecto.length === 0)) {
    // Si se deseleccionan todos los proyectos, limpiar filtros dependientes
    delete newFilters.dependencia;
    delete newFilters.comuna;
    delete newFilters.contratista;
    delete newFilters.estadoDeLaObra;
  }
  
  if (changedFilter === 'dependencia' && (!newFilters.dependencia || newFilters.dependencia.length === 0)) {
    // Si se deseleccionan todas las dependencias, limpiar filtros dependientes
    delete newFilters.comuna;
    delete newFilters.contratista;
    delete newFilters.estadoDeLaObra;
  }
  
  if (changedFilter === 'tipo' && (!newFilters.tipo || newFilters.tipo.length === 0)) {
    // Si se deseleccionan todos los tipos, limpiar filtros dependientes
    delete newFilters.contratista;
    delete newFilters.estadoDeLaObra;
  }
  
  if (changedFilter === 'comuna' && (!newFilters.comuna || newFilters.comuna.length === 0)) {
    // Si se deseleccionan todas las comunas, limpiar filtros dependientes
    delete newFilters.contratista;
    delete newFilters.estadoDeLaObra;
  }
  
  return newFilters;
}

// Aplica filtros (sin any)
export function applyFilters(rows: Row[], f: Filters): Row[] {
  
  const inStr = (val: string[] | undefined) =>
    (x: unknown) => {
      if (!val) return true;
      // Si el array está vacío, no filtrar (mostrar todos)
      if (val.length === 0) return true;
      // Si el array tiene valores, verificar si el valor actual está incluido
      return val.includes(String(x ?? ''));
    };

  const inDateRange = (x: unknown) => {
    // Si no hay filtros de fecha, no filtrar
    if (!f.desde && !f.hasta) return true;
    
    // Si no hay campo de fecha, no filtrar
    if (!F.fechaEstimadaDeEntrega && !F.fechaRealDeEntrega) return true;
    
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
        dateValue = raw; // Mantener fecha completa para comparación exacta
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
      const desdeCheck = f.desde ? dateValue >= f.desde : true;
      const hastaCheck = f.hasta ? dateValue <= f.hasta : true;
      
      // Debug para verificar el filtrado (solo para los primeros registros)
      if ((f.desde || f.hasta) && Math.random() < 0.1) {
        console.log('🔍 Filtro de fecha (muestra):', {
          fechaOriginal: raw,
          fechaNormalizada: dateValue,
          desde: f.desde,
          hasta: f.hasta,
          desdeCheck,
          hastaCheck,
          resultado: desdeCheck && hastaCheck
        });
      }
      
      return desdeCheck && hastaCheck;
    } catch (error) {
      console.error('❌ Error en filtro de fecha:', error);
      return true; // Si hay error, no filtrar
    }
  };

  return rows.filter(r =>
    inStr(f.proyecto)(F.proyectoEstrategico ? r[F.proyectoEstrategico] : undefined) &&
    inStr(f.subproyecto)(F.subproyectoEstrategico ? r[F.subproyectoEstrategico] : undefined) &&
    inStr(f.comuna)(F.comunaOCorregimiento ? r[F.comunaOCorregimiento] : undefined) &&
    inStr(f.dependencia)(F.dependencia ? r[F.dependencia] : undefined) &&
    inStr(f.tipo)(F.tipoDeIntervecion ? r[F.tipoDeIntervecion] : undefined) &&
    inStr(f.estadoDeLaObra)(F.estadoDeLaObra ? r[F.estadoDeLaObra] : undefined) &&
    inStr(f.contratista)(F.contratistaOperador ? r[F.contratistaOperador] : undefined) &&
    inStr(f.nombre)(F.nombre ? r[F.nombre] : undefined) &&
    inDateRange(F.fechaEstimadaDeEntrega ? r[F.fechaEstimadaDeEntrega] : F.fechaRealDeEntrega ? r[F.fechaRealDeEntrega] : undefined)
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

// Función para filtrar datos por período 2024-2027
export function filterByPeriod2024_2027(rows: Row[]): Row[] {
  return rows.filter(row => {
    // Buscar AÑO DE ENTREGA directamente
    const añoEntrega = row['AÑO DE ENTREGA'] ? extractYearFrom(row['AÑO DE ENTREGA']) : null;
    if (añoEntrega && añoEntrega >= 2024 && añoEntrega <= 2027) return true;
    
    // Fallback: calcular desde fecha estimada
    const fechaEstimada = F.fechaEstimadaDeEntrega ? String(row[F.fechaEstimadaDeEntrega] ?? '') : '';
    const yearMatch = fechaEstimada.match(/\b(\d{4})\b/);
    if (yearMatch) {
      const year = Number(yearMatch[1]);
      if (year >= 2024 && year <= 2027) return true;
    }
    
    // También incluir obras entregadas en el período 2024-2027
    const entregada = String((F.obraEntregada ? row[F.obraEntregada] : '') ?? '').toLowerCase().trim();
    if (entregada === 'si' || entregada === 'sí') {
      const añoReal = row['AÑO DE ENTREGA REAL'] ? extractYearFrom(row['AÑO DE ENTREGA REAL']) : null;
      if (añoReal && añoReal >= 2024 && añoReal <= 2027) return true;
      
      // Fallback: calcular desde fecha real
      const fechaReal = F.fechaRealDeEntrega ? String(row[F.fechaRealDeEntrega] ?? '') : '';
      const yearMatchReal = fechaReal.match(/\b(\d{4})\b/);
      if (yearMatchReal) {
        const yearReal = Number(yearMatchReal[1]);
        if (yearReal >= 2024 && yearReal <= 2027) return true;
      }
    }
    
    // Incluir obras que tengan presupuesto ejecutado en el período 2024-2027
    if (F.presupuestoEjecutadoAdm2024_2027) {
      const presupuesto2024_2027 = toNumber(row[F.presupuestoEjecutadoAdm2024_2027]);
      if (presupuesto2024_2027 > 0) return true;
    }
    
    // Incluir obras que tengan avance en cualquiera de los años 2024-2027
    const avance2024 = F.avance2024 ? toNumber(row[F.avance2024]) : 0;
    const avance2025 = F.avance2025 ? toNumber(row[F.avance2025]) : 0;
    const avance2026 = F.avance2026 ? toNumber(row[F.avance2026]) : 0;
    const avance2027 = F.avance2027 ? toNumber(row[F.avance2027]) : 0;
    
    if (avance2024 > 0 || avance2025 > 0 || avance2026 > 0 || avance2027 > 0) return true;
    
    // Incluir obras que tengan presupuesto ejecutado en cualquiera de los años 2024-2027
    const presupuesto2024 = F.presupuestoEjecutado2024 ? toNumber(row[F.presupuestoEjecutado2024]) : 0;
    const presupuesto2025 = F.presupuestoEjecutado2025 ? toNumber(row[F.presupuestoEjecutado2025]) : 0;
    const presupuesto2026 = F.presupuestoEjecutado2026 ? toNumber(row[F.presupuestoEjecutado2026]) : 0;
    const presupuesto2027 = F.presupuestoEjecutado2027 ? toNumber(row[F.presupuestoEjecutado2027]) : 0;
    
    if (presupuesto2024 > 0 || presupuesto2025 > 0 || presupuesto2026 > 0 || presupuesto2027 > 0) return true;
    
    return false;
  });
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

  // Heurística de "entregadas"
  let entregadas = 0;
  const yearNow = new Date().getFullYear();
  for (const r of rows) {
    const byEstado =
      F.estadoDeLaObra && String(r[F.estadoDeLaObra] ?? '').toLowerCase().includes('entreg');
    
    let byFecha = false;
    if (F.fechaRealDeEntrega) {
      const fechaReal = String(r[F.fechaRealDeEntrega] ?? '').trim();
      if (fechaReal && fechaReal !== 'Sin información' && fechaReal !== 'N/A' && fechaReal !== '') {
        const y = Number(fechaReal.slice(0, 4));
        if (y && y <= yearNow) byFecha = true;
      }
    }
    
    // Una obra está entregada si:
    // 1. Su estado contiene "entreg" O
    // 2. Tiene fecha real de entrega válida
    if (byEstado || byFecha) {
      entregadas++;
      
      // Debug para verificar la lógica (solo para algunos casos)
      if (Math.random() < 0.05) {
        console.log('✅ Obra clasificada como entregada:', {
          nombre: r['NOMBRE DEL PROYECTO'] || 'Sin nombre',
          porEstado: byEstado,
          porFecha: byFecha,
          estado: r[F.estadoDeLaObra],
          fechaReal: r[F.fechaRealDeEntrega]
        });
      }
    }
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
  const valorAdministracionesAnteriores = calcularValorAdministracionesAnteriores(rows);

  // Calcular obras con y sin coordenadas
  const conUbicacion = rows.filter(r => {
    const lat = F.latitud ? parseFloat(String(r[F.latitud] ?? '')) : null;
    const lng = F.longitud ? parseFloat(String(r[F.longitud] ?? '')) : null;
    return lat && lng && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  }).length;
  
  const sinUbicacion = totalObras - conUbicacion;

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
    valorCuatrienio2024_2027,
    valorAdministracionesAnteriores,
    conUbicacion,
    sinUbicacion
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
    if (F.fechaRealDeEntrega) {
      const fechaReal = String(r[F.fechaRealDeEntrega] ?? '').trim();
      if (fechaReal && fechaReal !== 'Sin información' && fechaReal !== 'N/A' && fechaReal !== '') {
        const y = Number(fechaReal.slice(0, 4));
        if (y && y <= yearNow) byFecha = true;
      }
    }
    
    // Una obra está entregada si:
    // 1. Su estado contiene "entreg" O
    // 2. Tiene fecha real de entrega válida
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

/**
 * Valor monetario del Presupuesto de Administraciones Anteriores
 * Suma directa del campo 'PRESUPUESTO EJECUTADO ADMINISTRACIONES ANTERIORES'
 */
export function calcularValorAdministracionesAnteriores(rows: Row[]): number {
  // Usar siempre el campo directo - suma de lo gastado en administraciones anteriores
  if (!F.presupuestoEjecutadoAdmAnteriores) {
    return 0;
  }
  
  const valorDirecto = rows.reduce((sum, r) => {
    const valor = toNumberAdminAnteriores(r[F.presupuestoEjecutadoAdmAnteriores]);
    return sum + valor;
  }, 0);
  
  return valorDirecto;
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

export function extractYearFrom(raw: unknown): number | null {
  if (raw == null) return null;
  const str = String(raw).trim();
  if (!str || str === 'Sin información' || str === 'undefined') return null;
  // formatos admitidos: YYYY, YYYY-MM, YYYY-MM-DD, texto que contenga año
  const m = str.match(/\b(\d{4})\b/);
  if (!m) return null;
  const y = Number(m[1]);
  return Number.isFinite(y) ? y : null;
}

// Función para calcular "Entrega Real corregida" (replica la lógica de Power BI)
function getEntregaRealCorregida(row: Row): Date | null {
  const fechaRealEntrega = F.fechaRealDeEntrega ? new Date(String(row[F.fechaRealDeEntrega] ?? '')) : null;
  const fechaFinRealEjecucion = F.fechaFinRealEjecucionObra ? new Date(String(row[F.fechaFinRealEjecucionObra] ?? '')) : null;
  
  // Fecha de referencia: 1 de enero de 2000
  const fechaReferencia = new Date(2000, 0, 1);
  
  // Si FECHA REAL DE ENTREGA es 2000-01-01 y fecha_fin_real_ejecucion_obra no es 2000-01-01,
  // entonces usar fecha_fin_real_ejecucion_obra, sino usar FECHA REAL DE ENTREGA
  if (fechaRealEntrega && 
      fechaRealEntrega.getTime() === fechaReferencia.getTime() && 
      fechaFinRealEjecucion && 
      fechaFinRealEjecucion.getTime() !== fechaReferencia.getTime()) {
    return fechaFinRealEjecucion;
  }
  
  return fechaRealEntrega;
}

// Función para extraer año de entrega real (AÑO DE ENTREGA REAL = YEAR(Entrega Real corregida))
function extractRealDeliveryYear(row: Row): number | null {
  const entregaCorregida = getEntregaRealCorregida(row);
  if (!entregaCorregida || isNaN(entregaCorregida.getTime())) return null;
  return entregaCorregida.getFullYear();
}

// Función para calcular "Entrega corregida" (para fechas estimadas)
function getEntregaCorregida(row: Row): Date | null {
  const fechaEstimadaEntrega = F.fechaEstimadaDeEntrega ? new Date(String(row[F.fechaEstimadaDeEntrega] ?? '')) : null;
  // Buscar campo equivalente a fecha_fin_real_ejecucion_obra pero para estimadas
  // Por ahora usar la fecha estimada directamente, pero necesitamos la fórmula exacta
  return fechaEstimadaEntrega;
}

// Función para extraer año de entrega estimada (AÑO DE ENTREGA = YEAR(Entrega corregida))
function extractEstimatedDeliveryYear(row: Row): number | null {
  const entregaCorregida = getEntregaCorregida(row);
  if (!entregaCorregida || isNaN(entregaCorregida.getTime())) return null;
  return entregaCorregida.getFullYear();
}

// Función eliminada porque no se utiliza actualmente
// function getObraCosto(r: Row): number {
//   // Usa costo total actualizado; si es 0 o null, usa costo estimado
//   if (!F.costoTotalActualizado && !F.costoEstimadoTotal) return 0;
//   const actualizado = F.costoTotalActualizado ? toNumber(r[F.costoTotalActualizado]) : 0;
//   const estimado = F.costoEstimadoTotal ? toNumber(r[F.costoEstimadoTotal]) : 0;
//   return actualizado === 0 ? estimado : actualizado;
// }

// Valor para "inversión estimada" en vigencias: debe provenir de Costo estimado total
// Función eliminada porque no se utiliza actualmente

// Valor para "inversión real" en vigencias: debe provenir de Presupuesto ejecutado
// Si no existe el campo en la configuración, se usa el costo de la obra como respaldo
function getRealInvestmentValue(r: Row): number {
  // Solo usar el campo general Presupuesto ejecutado con Number() directo como Power BI
  if (F.presupuestoEjecutado) return Number(r[F.presupuestoEjecutado] ?? 0);
  return 0;
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
    // Buscar campos específicos de año (si existen en los datos)
    const yEst = r['AÑO DE ENTREGA'] ? extractYearFrom(r['AÑO DE ENTREGA']) : extractEstimatedDeliveryYear(r);
    const yReal = r['AÑO DE ENTREGA REAL'] ? extractYearFrom(r['AÑO DE ENTREGA REAL']) : extractRealDeliveryYear(r);

    // Inversión estimada: AÑO DE ENTREGA + Costo total actualizado corregido
    if (yEst != null) {
      years.add(yEst);
      estCount.set(yEst, (estCount.get(yEst) ?? 0) + 1);
      // Usar "Costo total actualizado corregido" si existe, sino usar "Costo total actualizado"
      // Con Number() directo como Power BI
      const costoCorregido = r['Costo total actualizado corregido'] ? 
        Number(r['Costo total actualizado corregido'] ?? 0) : 
        (F.costoTotalActualizado ? Number(r[F.costoTotalActualizado] ?? 0) : 0);
      estInv.set(yEst, (estInv.get(yEst) ?? 0) + costoCorregido);
    }

    // Inversión real: AÑO DE ENTREGA REAL + ¿OBRA ENTREGADA? = "si" + PRESUPUESTO EJECUTADO
    if (yReal != null && isEntregada(r)) {
      years.add(yReal);
      realCount.set(yReal, (realCount.get(yReal) ?? 0) + 1);
      // Usar PRESUPUESTO EJECUTADO general (no por año)
      realInv.set(yReal, (realInv.get(yReal) ?? 0) + getRealInvestmentValue(r));
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