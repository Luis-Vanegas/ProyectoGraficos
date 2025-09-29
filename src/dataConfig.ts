// src/dataConfig.ts
// Mapa completo de campos de la API -> claves camelCase para usar en el código
// Total: 114 campos sincronizados con la API
export const F = {
  // ===== INFORMACIÓN BÁSICA (5 campos) =====
  id: 'id',
  dependencia: 'DEPENDENCIA',
  urlImagen: 'URL IMAGEN',
  estadoDeLaObra: 'ESTADO DE LA OBRA',
  nombre: 'NOMBRE',
  descripcion: 'DESCRIPCIÓN',
  tipoDeIntervecion: 'TIPO DE INTERVECIÓN',

  // ===== UBICACIÓN (4 campos) =====
  comunaOCorregimiento: 'COMUNA O CORREGIMIENTO',
  direccion: 'DIRECCIÓN',
  longitud: 'LONGITUD',
  latitud: 'LATITUD',

  // ===== INFORMACIÓN FINANCIERA (21 campos) =====
  costoEstimadoTotal: 'COSTO ESTIMADO TOTAL',
  costoTotalActualizado: 'COSTO TOTAL ACTUALIZADO',
  presupuestoEjecutado: 'PRESUPUESTO EJECUTADO',
  presupuestoPorcentajeEjecutado: 'PRESUPUESTO PORCENTAJE EJECUTADO',
  presupuestoEjecutadoAdmAnteriores: 'PRESUPUESTO EJECUTADO ADMINISTRACIONES ANTERIORES',
  presupuestoEjecutadoAdm2024_2027: 'PRESUPUESTO EJECUTADO ADMINISTRACIÓN 2024 - 2027',
  fuentesFinanciacionAlternativa: 'FUENTES DE FINANCIACIÓN ALTERNATIVA',
  presupuestoEjecutado2024: 'PRESUPUESTO EJECUTADO 2024',
  presupuestoEjecutado2025: 'PRESUPUESTO EJECUTADO 2025',
  presupuestoEjecutado2026: 'PRESUPUESTO EJECUTADO 2026',
  presupuestoEjecutado2027: 'PRESUPUESTO EJECUTADO 2027',
  inversionPlaneacionMGA: 'INVERSIÓN PLANEACIÓN (MGA)',
  inversionEstudiosPreliminares: 'INVERSIÓN ESTUDIOS PRELIMINARES',
  inversionViabilizacionDAP: 'INVERSIÓN VIABILIZACIÓN (DAP)',
  inversionContratacion: 'INVERSIÓN CONTRATACIÓN',
  inversionInicio: 'INVERSIÓN INICIO',
  inversionGestionPredial: 'INVERSIÓN GESTIÓN PREDIAL',
  inversionDisenos: 'INVERSIÓN DISEÑOS',
  inversionEjecucionObra: 'INVERSIÓN EJECUCIÓN OBRA',
  inversionEntregaObra: 'INVERSIÓN ENTREGA OBRA',
  inversionLiquidacion: 'INVERSIÓN LIQUIDACIÓN',

  // ===== AVANCES POR AÑO (4 campos) =====
  avance2024: 'AVANCE 2024',
  avance2025: 'AVANCE 2025',
  avance2026: 'AVANCE 2026',
  avance2027: 'AVANCE 2027',

  // ===== CÓDIGOS Y PROYECTOS (10 campos) =====
  codigoProyecto1: 'CÓDIGO PROYECTO 1',
  codigoProyecto2: 'CÓDIGO PROYECTO 2',
  codigoProyecto3: 'CÓDIGO PROYECTO 3',
  proyectoEstrategico: 'PROYECTO ESTRATÉGICO',
  subproyectoEstrategico: 'SUBPROYECTO ESTRATÉGICO',
  relacionPOT: 'RELACIÓN POT',
  codigoProgramaPDD: 'CÓDIGO DEL PROGRAMA PDD',
  indicador1: 'INDICADOR 1',
  indicador2: 'INDICADOR 2',
  indicador3: 'INDICADOR 3',

  // ===== ADMINISTRATIVO (2 campos) =====
  periodoAdministrativo: 'PERIODO ADMINISTRATIVO',
  etapa: 'ETAPA',

  // ===== CONTRATOS Y CONVENIOS (6 campos) =====
  contratosAsociados: 'CONTRATOS ASOCIADOS',
  contratistaOperador: 'CONTRATISTA OPERADOR',
  convenio: 'CONVENIO',
  responsableSupervisor: 'RESPONSABLE SUPERVISOR',
  empleosGenerados: 'EMPLEOS GENERADOS',
  areaConstruida: 'ÁREA CONSTRUIDA',
  areaEspacioPublico: 'ÁREA DE ESPACIO PÚBLICO',

  // ===== FECHAS DE ENTREGA (3 campos) =====
  fechaEstimadaDeEntrega: 'FECHA ESTIMADA DE ENTREGA',
  obraEntregada: '¿OBRA ENTREGADA?',
  fechaRealDeEntrega: 'FECHA REAL DE ENTREGA',

  // ===== PLANEACIÓN (MGA) (5 campos) =====
  porcentajePlaneacionMGA: 'PORCENTAJE PLANEACIÓN (MGA)',
  fechaInicioEstimadaPlaneacionMGA: 'FECHA INICIO ESTIMADA PLANEACIÓN (MGA)',
  fechaInicioRealPlaneacionMGA: 'FECHA INICIO REAL PLANEACIÓN (MGA)',
  fechaFinEstimadaPlaneacionMGA: 'FECHA FIN ESTIMADA PLANEACIÓN (MGA)',
  fechaFinRealPlaneacionMGA: 'FECHA FIN REAL PLANEACIÓN (MGA)',

  // ===== ESTUDIOS PRELIMINARES (5 campos) =====
  porcentajeEstudiosPreliminares: 'PORCENTAJE ESTUDIOS PRELIMINARES',
  fechaInicioEstimadaEstudiosPreliminares: 'FECHA INICIO ESTIMADA ESTUDIOS PRELIMINARES',
  fechaInicioRealEstudiosPreliminares: 'FECHA INICIO REAL ESTUDIOS PRELIMINARES',
  fechaFinEstimadaEstudiosPreliminares: 'FECHA FIN ESTIMADA ESTUDIOS PRELIMINARES',
  fechaFinRealEstudiosPreliminares: 'FECHA FIN REAL ESTUDIOS PRELIMINARES',

  // ===== VIABILIZACIÓN (DAP) (5 campos) =====
  porcentajeViabilizacionDAP: 'PORCENTAJE VIABILIZACIÓN (DAP)',
  fechaInicioEstimadaViabilizacionDAP: 'FECHA INICIO ESTIMADA VIABILIZACIÓN (DAP)',
  fechaInicioRealViabilizacionDAP: 'FECHA INICIO REAL VIABILIZACIÓN (DAP)',
  fechaFinEstimadaViabilizacionDAP: 'FECHA FIN ESTIMADA VIABILIZACIÓN (DAP)',
  fechaFinRealViabilizacionDAP: 'FECHA FIN REAL VIABILIZACIÓN (DAP)',

  // ===== LICENCIAS (CURADURÍA) (6 campos) - NUEVOS =====
  porcentajeLicenciasCuraduria: 'PORCENTAJE LICENCIAS (CURADURÍA)',
  inversionLicenciasCuraduria: 'INVERSIÓN LICENCIAS (CURADURÍA)',
  fechaInicioEstimadaLicenciasCuraduria: 'FECHA INICIO ESTIMADA LICENCIAS (CURADURÍA)',
  fechaInicioRealLicenciasCuraduria: 'FECHA INICIO REAL LICENCIAS (CURADURÍA)',
  fechaFinEstimadaLicenciasCuraduria: 'FECHA FIN ESTIMADA LICENCIAS (CURADURÍA)',
  fechaFinRealLicenciasCuraduria: 'FECHA FIN REAL LICENCIAS (CURADURÍA)',

  // ===== CONTRATACIÓN (5 campos) =====
  porcentajeContratacion: 'PORCENTAJE CONTRATACIÓN',
  fechaInicioEstimadaContratacion: 'FECHA INICIO ESTIMADA CONTRATACIÓN',
  fechaInicioRealContratacion: 'FECHA INICIO REAL CONTRATACIÓN',
  fechaFinEstimadaContratacion: 'FECHA FIN ESTIMADA CONTRATACIÓN',
  fechaFinRealContratacion: 'FECHA FIN REAL CONTRATACIÓN',

  // ===== INICIO (5 campos) =====
  porcentajeInicio: 'PORCENTAJE INICIO',
  fechaInicioEstimadaInicio: 'FECHA INICIO ESTIMADA INICIO',
  fechaInicioRealInicio: 'FECHA INICIO REAL INICIO',
  fechaFinEstimadaInicio: 'FECHA FIN ESTIMADA INICIO',
  fechaFinRealInicio: 'FECHA FIN REAL INICIO',

  // ===== GESTIÓN PREDIAL (5 campos) =====
  porcentajeGestionPredial: 'PORCENTAJE GESTIÓN PREDIAL',
  fechaInicioEstimadaGestionPredial: 'FECHA INICIO ESTIMADA GESTIÓN PREDIAL',
  fechaInicioRealGestionPredial: 'FECHA INICIO REAL GESTIÓN PREDIAL',
  fechaFinEstimadaGestionPredial: 'FECHA FIN ESTIMADA GESTIÓN PREDIAL',
  fechaFinRealGestionPredial: 'FECHA FIN REAL GESTIÓN PREDIAL',

  // ===== DISEÑOS (5 campos) =====
  porcentajeDisenos: 'PORCENTAJE DISEÑOS',
  fechaInicioEstimadaDisenos: 'FECHA INICIO ESTIMADA DISEÑOS',
  fechaInicioRealDisenos: 'FECHA INICIO REAL DISEÑOS',
  fechaFinEstimadaDisenos: 'FECHA FIN ESTIMADA DISEÑOS',
  fechaFinRealDisenos: 'FECHA FIN REAL DISEÑOS',

  // ===== EJECUCIÓN OBRA (5 campos) =====
  porcentajeEjecucionObra: 'PORCENTAJE EJECUCIÓN OBRA',
  fechaInicioEstimadaEjecucionObra: 'FECHA INICIO ESTIMADA EJECUCIÓN OBRA',
  fechaInicioRealEjecucionObra: 'FECHA INICIO REAL EJECUCIÓN OBRA',
  fechaFinEstimadaEjecucionObra: 'FECHA FIN ESTIMADA EJECUCIÓN OBRA',
  fechaFinRealEjecucionObra: 'FECHA FIN REAL EJECUCIÓN OBRA',

  // ===== ENTREGA OBRA (5 campos) - NUEVOS CAMPOS =====
  porcentajeEntregaObra: 'PORCENTAJE ENTREGA OBRA',
  fechaInicioEstimadaEntregaObra: 'FECHA INICIO ESTIMADA ENTREGA OBRA',
  fechaInicioRealEntregaObra: 'FECHA INICIO REAL ENTREGA OBRA',
  fechaFinEstimadaEntregaObra: 'FECHA FIN ESTIMADA ENTREGA OBRA',
  fechaFinRealEntregaObra: 'FECHA FIN REAL ENTREGA OBRA',

  // ===== LIQUIDACIÓN (5 campos) =====
  porcentajeLiquidacion: 'PORCENTAJE LIQUIDACIÓN',
  fechaInicioEstimadaLiquidacion: 'FECHA INICIO ESTIMADA LIQUIDACIÓN',
  fechaInicioRealLiquidacion: 'FECHA INICIO REAL LIQUIDACIÓN',
  fechaFinEstimadaLiquidacion: 'FECHA FIN ESTIMADA LIQUIDACIÓN',
  fechaFinRealLiquidacion: 'FECHA FIN REAL LIQUIDACIÓN',

  // ===== RIESGOS Y ALERTAS (4 campos) =====
  descripcionDelRiesgo: 'DESCRIPCIÓN DEL RIESGO',
  presenciaDeRiesgo: 'PRESENCIA DE RIESGO',
  impactoDelRiesgo: 'IMPACTO DEL RIESGO',
  estadoDeRiesgo: 'ESTADO DE RIESGO',

} as const;

// Ayuda de tipos (opcional)
export type FieldKey = keyof typeof F;

// Función de utilidad para obtener todos los campos
export const getAllFields = () => Object.values(F);

// Función de utilidad para obtener campos por categoría
export const getFieldsByCategory = {
  basicInfo: () => [
    F.id, F.dependencia, F.urlImagen, F.estadoDeLaObra, F.nombre, F.descripcion, F.tipoDeIntervecion
  ],
  location: () => [
    F.comunaOCorregimiento, F.direccion, F.longitud, F.latitud
  ],
  financial: () => [
    F.costoEstimadoTotal, F.costoTotalActualizado, F.presupuestoEjecutado, F.presupuestoPorcentajeEjecutado,
    F.presupuestoEjecutadoAdmAnteriores, F.presupuestoEjecutadoAdm2024_2027, F.fuentesFinanciacionAlternativa,
    F.presupuestoEjecutado2024, F.presupuestoEjecutado2025, F.presupuestoEjecutado2026, F.presupuestoEjecutado2027,
    F.inversionPlaneacionMGA, F.inversionEstudiosPreliminares, F.inversionViabilizacionDAP, F.inversionContratacion,
    F.inversionInicio, F.inversionGestionPredial, F.inversionDisenos, F.inversionEjecucionObra,
    F.inversionEntregaObra, F.inversionLiquidacion
  ],
  progress: () => [
    F.avance2024, F.avance2025, F.avance2026, F.avance2027
  ],
  codes: () => [
    F.codigoProyecto1, F.codigoProyecto2, F.codigoProyecto3, F.proyectoEstrategico, F.subproyectoEstrategico, F.relacionPOT,
    F.codigoProgramaPDD, F.indicador1, F.indicador2, F.indicador3
  ],
  administrative: () => [
    F.periodoAdministrativo, F.etapa
  ],
  contracts: () => [
    F.contratosAsociados, F.contratistaOperador, F.convenio, F.responsableSupervisor,
    F.empleosGenerados, F.areaConstruida, F.areaEspacioPublico
  ],
  delivery: () => [
    F.fechaEstimadaDeEntrega, F.obraEntregada, F.fechaRealDeEntrega
  ],
  licenses: () => [
    F.porcentajeLicenciasCuraduria, F.inversionLicenciasCuraduria, F.fechaInicioEstimadaLicenciasCuraduria,
    F.fechaInicioRealLicenciasCuraduria, F.fechaFinEstimadaLicenciasCuraduria, F.fechaFinRealLicenciasCuraduria
  ]
};