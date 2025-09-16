// Archivo temporal para debug de filtros
console.log('🔍 Debug de filtros en producción');

// Función para debuggear filtros
function debugFilters(rows, filters) {
  console.log('🔍 applyFilters - Filtros aplicados:', filters);
  console.log('🔍 applyFilters - Total obras antes del filtrado:', rows.length);
  
  // Verificar si hay filtros activos
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');
  console.log('🔍 applyFilters - ¿Hay filtros activos?', hasActiveFilters);
  
  if (hasActiveFilters) {
    console.log('🔍 applyFilters - Filtros activos:', Object.entries(filters).filter(([key, value]) => value !== undefined && value !== ''));
  }
  
  return rows;
}

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugFilters };
}
