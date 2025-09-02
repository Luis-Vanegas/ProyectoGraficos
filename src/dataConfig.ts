// src/dataConfig.ts
// Mapa de campos de la API -> claves camelCase para usar en el código
export const F = {
  id: 'id',
  dependencia: 'DEPENDENCIA',
  urlImagen: 'URL IMAGEN',
  nombre: 'NOMBRE',
  descripcion: 'DESCRIPCIÓN',
  tipoDeIntervecion: 'TIPO DE INTERVECIÓN',
  estadoDeLaObra: 'ESTADO DE LA OBRA',
  comunaOCorregimiento: 'COMUNA O CORREGIMIENTO',
  direccion: 'DIRECCIÓN',
  longitud: 'LONGITUD',
  latitud: 'LATITUD',

  costoEstimadoTotal: 'COSTO ESTIMADO TOTAL',
  costoTotalActualizado: 'COSTO TOTAL ACTUALIZADO',
  presupuestoEjecutado: 'PRESUPUESTO EJECUTADO',
  presupuestoPorcentajeEjecutado: 'PRESUPUESTO PORCENTAJE EJECUTADO',
  presupuestoEjecutadoAdmAnteriores: 'PRESUPUESTO EJECUTADO ADMINISTRACIONES ANTERIORES',
  presupuestoEjecutadoAdm2024_2027: 'PRESUPUESTO EJECUTADO ADMINISTRACIÓN 2024 - 2027',
  fuentesFinanciacionAlternativa: 'FUENTES DE FINANCIACIÓN ALTERNATIVA',

  avance2024: 'AVANCE 2024',
  presupuestoEjecutado2024: 'PRESUPUESTO EJECUTADO 2024',
  avance2025: 'AVANCE 2025',
  presupuestoEjecutado2025: 'PRESUPUESTO EJECUTADO 2025',
  avance2026: 'AVANCE 2026',
  presupuestoEjecutado2026: 'PRESUPUESTO EJECUTADO 2026',
  avance2027: 'AVANCE 2027',
  presupuestoEjecutado2027: 'PRESUPUESTO EJECUTADO 2027',

  codigoProyecto1: 'CÓDIGO PROYECTO 1',
  codigoProyecto2: 'CÓDIGO PROYECTO 2',
  codigoProyecto3: 'CÓDIGO PROYECTO 3',
  proyectoEstrategico: 'PROYECTO ESTRATÉGICO',
  relacionPOT: 'RELACIÓN POT',
  codigoProgramaPDD: 'CÓDIGO DEL PROGRAMA PDD',
  indicador1: 'INDICADOR 1',
  indicador2: 'INDICADOR 2',
  indicador3: 'INDICADOR 3',

  periodoAdministrativo: 'PERIODO ADMINISTRATIVO',
  etapa: 'ETAPA',
  presenciaDeRiesgo: 'PRESENCIA DE RIESGO',
  descripcionDelRiesgo: 'DESCRIPCIÓN DEL RIESGO',
  fechaIdentificacionDelRiesgo: 'FECHA DE IDENTIFICACIÓN DEL RIESGO',
  impactoDelRiesgo: 'IMPACTO DEL RIESGO',
  estadoDeRiesgo: 'ESTADO DE RIESGO',
  registro: 'REGISTRO',
  razones: 'RAZONES',
  autorizacion: 'AUTORIZACIÓN',

  contratosAsociados: 'CONTRATOS ASOCIADOS',
  contratistaOperador: 'CONTRATISTA OPERADOR',
  convenio: 'CONVENIO',
  responsableSupervisor: 'RESPONSABLE SUPERVISOR',
  empleosGenerados: 'EMPLEOS GENERADOS',
  areaConstruida: 'ÁREA CONSTRUIDA',
  areaEspacioPublico: 'ÁREA DE ESPACIO PÚBLICO',

  fechaEstimadaDeEntrega: 'FECHA ESTIMADA DE ENTREGA',
  obraEntregada: '¿OBRA ENTREGADA?',
  fechaRealDeEntrega: 'FECHA REAL DE ENTREGA',

  // Bloque EJECUCIÓN DE OBRA
  porcentajeEjecucionObra: 'PORCENTAJE EJECUCIÓN OBRA',
  inversionEjecucionObra: 'INVERSIÓN EJECUCIÓN OBRA',
  fechaInicioEstimadaEjecucionObra: 'FECHA INICIO ESTIMADA EJECUCIÓN OBRA',
  fechaInicioRealEjecucionObra: 'FECHA INICIO REAL EJECUCIÓN OBRA',
  fechaFinEstimadaEjecucionObra: 'FECHA FIN ESTIMADA EJECUCIÓN OBRA',
  fechaFinRealEjecucionObra: 'FECHA FIN REAL EJECUCIÓN OBRA',

  // Bloque DISEÑOS
  porcentajeDisenos: 'PORCENTAJE DISEÑOS',
  inversionDisenos: 'INVERSIÓN DISEÑOS',
  fechaInicioEstimadaDisenos: 'FECHA INICIO ESTIMADA DISEÑOS',
  fechaInicioRealDisenos: 'FECHA INICIO REAL DISEÑOS',
  fechaFinEstimadaDisenos: 'FECHA FIN ESTIMADA DISEÑOS',
  fechaFinRealDisenos: 'FECHA FIN REAL DISEÑOS',

  // Bloque VIABILIZACIÓN (DAP)
  porcentajeViabilizacionDAP: 'PORCENTAJE VIABILIZACIÓN (DAP)',
  inversionViabilizacionDAP: 'INVERSIÓN VIABILIZACIÓN (DAP)',
  fechaInicioEstimadaViabilizacionDAP: 'FECHA INICIO ESTIMADA VIABILIZACIÓN (DAP)',
  fechaInicioRealViabilizacionDAP: 'FECHA INICIO REAL VIABILIZACIÓN (DAP)',
  fechaFinEstimadaViabilizacionDAP: 'FECHA FIN ESTIMADA VIABILIZACIÓN (DAP)',
  fechaFinRealViabilizacionDAP: 'FECHA FIN REAL VIABILIZACIÓN (DAP)',

  // Bloque CONTRATACIÓN
  porcentajeContratacion: 'PORCENTAJE CONTRATACIÓN',
  inversionContratacion: 'INVERSIÓN CONTRATACIÓN',
  fechaInicioEstimadaContratacion: 'FECHA INICIO ESTIMADA CONTRATACIÓN',
  fechaInicioRealContratacion: 'FECHA INICIO REAL CONTRATACIÓN',
  fechaFinEstimadaContratacion: 'FECHA FIN ESTIMADA CONTRATACIÓN',
  fechaFinRealContratacion: 'FECHA FIN REAL CONTRATACIÓN',

  // Bloque LIQUIDACIÓN
  porcentajeLiquidacion: 'PORCENTAJE LIQUIDACIÓN',
  inversionLiquidacion: 'INVERSIÓN LIQUIDACIÓN',
  fechaInicioEstimadaLiquidacion: 'FECHA INICIO ESTIMADA LIQUIDACIÓN',
  fechaInicioRealLiquidacion: 'FECHA INICIO REAL LIQUIDACIÓN',
  fechaFinEstimadaLiquidacion: 'FECHA FIN ESTIMADA LIQUIDACIÓN',
  fechaFinRealLiquidacion: 'FECHA FIN REAL LIQUIDACIÓN',

  // Bloque PLANEACIÓN (MGA)
  porcentajePlaneacionMGA: 'PORCENTAJE PLANEACIÓN (MGA)',
  inversionPlaneacionMGA: 'INVERSIÓN PLANEACIÓN (MGA)',
  fechaInicioEstimadaPlaneacionMGA: 'FECHA INICIO ESTIMADA PLANEACIÓN (MGA)',
  fechaInicioRealPlaneacionMGA: 'FECHA INICIO REAL PLANEACIÓN (MGA)',
  fechaFinEstimadaPlaneacionMGA: 'FECHA FIN ESTIMADA PLANEACIÓN (MGA)',
  fechaFinRealPlaneacionMGA: 'FECHA FIN REAL PLANEACIÓN (MGA)',

  // Bloque ESTUDIOS PRELIMINARES
  porcentajeEstudiosPreliminares: 'PORCENTAJE ESTUDIOS PRELIMINARES',
  inversionEstudiosPreliminares: 'INVERSIÓN ESTUDIOS PRELIMINARES',
  fechaInicioEstimadaEstudiosPreliminares: 'FECHA INICIO ESTIMADA ESTUDIOS PRELIMINARES',
  fechaInicioRealEstudiosPreliminares: 'FECHA INICIO REAL ESTUDIOS PRELIMINARES',
  fechaFinEstimadaEstudiosPreliminares: 'FECHA FIN ESTIMADA ESTUDIOS PRELIMINARES',
  fechaFinRealEstudiosPreliminares: 'FECHA FIN REAL ESTUDIOS PRELIMINARES',

  // Bloque INICIO
  porcentajeInicio: 'PORCENTAJE INICIO',
  inversionInicio: 'INVERSIÓN INICIO',
  fechaInicioEstimadaInicio: 'FECHA INICIO ESTIMADA INICIO',
  fechaInicioRealInicio: 'FECHA INICIO REAL INICIO',
  fechaFinEstimadaInicio: 'FECHA FIN ESTIMADA INICIO',
  fechaFinRealInicio: 'FECHA FIN REAL INICIO',

  // Bloque GESTIÓN PREDIAL
  porcentajeGestionPredial: 'PORCENTAJE GESTIÓN PREDIAL',
  inversionGestionPredial: 'INVERSIÓN GESTIÓN PREDIAL',
  fechaInicioEstimadaGestionPredial: 'FECHA INICIO ESTIMADA GESTIÓN PREDIAL',
  fechaInicioRealGestionPredial: 'FECHA INICIO REAL GESTIÓN PREDIAL',
  fechaFinEstimadaGestionPredial: 'FECHA FIN ESTIMADA GESTIÓN PREDIAL',
  fechaFinRealGestionPredial: 'FECHA FIN REAL GESTIÓN PREDIAL',

  // Bloque DOTACIÓN Y PUESTA EN OPERACIÓN
  porcentajeDotacionYPuestaEnOperacion: 'PORCENTAJE DOTACIÓN Y PUESTA EN OPERACIÓN',
  inversionDotacionYPuestaEnOperacion: 'INVERSIÓN DOTACIÓN Y PUESTA EN OPERACIÓN',
  fechaInicioEstimadaDotacionYPuestaEnOperacion: 'FECHA INICIO ESTIMADA DOTACIÓN Y PUESTA EN OPERACIÓN',
  fechaInicioRealDotacionYPuestaEnOperacion: 'FECHA INICIO REAL DOTACIÓN Y PUESTA EN OPERACIÓN',
  fechaFinEstimadaDotacionYPuestaEnOperacion: 'FECHA FIN ESTIMADA DOTACIÓN Y PUESTA EN OPERACIÓN',
  fechaFinRealDotacionYPuestaEnOperacion: 'FECHA FIN REAL DOTACIÓN Y PUESTA EN OPERACIÓN',
} as const;

// Ayuda de tipos (opcional)
export type FieldKey = keyof typeof F;
