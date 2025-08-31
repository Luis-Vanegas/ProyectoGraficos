// src/dataConfig.ts
// Mapa de TODOS los encabezados de tu Excel -> claves camelCase para usar en el código
export const F = {
  id: 'id',
  dependencia: 'DEPENDENCIA',
  urlImagen: 'URL IMAGEN',
  nombre: 'NOMBRE',
  descripcion: 'DESCRIPCIÓN',
  tipoDeIntervecion: 'TIPO DE INTERVECIÓN', // (así viene escrito en tu archivo)
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
  porcentajeEjecucionObra: 'porcentaje_ejecución_obra',
  inversionEjecucionObra: 'inversion_ejecución_obra',
  fechaInicioEstimadaEjecucionObra: 'fecha_inicio_estimada_ejecución_obra',
  fechaInicioRealEjecucionObra: 'fecha_inicio_real_ejecución_obra',
  fechaFinEstimadaEjecucionObra: 'fecha_fin_estimada_ejecución_obra',
  fechaFinRealEjecucionObra: 'fecha_fin_real_ejecución_obra',

  // Bloque DISEÑOS
  porcentajeDisenos: 'porcentaje_diseños',
  inversionDisenos: 'inversion_diseños',
  fechaInicioEstimadaDisenos: 'fecha_inicio_estimada_diseños',
  fechaInicioRealDisenos: 'fecha_inicio_real_diseños',
  fechaFinEstimadaDisenos: 'fecha_fin_estimada_diseños',
  fechaFinRealDisenos: 'fecha_fin_real_diseños',

  // Bloque VIABILIZACIÓN (DAP)
  porcentajeViabilizacionDAP: 'porcentaje_viabilización_(dap)',
  inversionViabilizacionDAP: 'inversion_viabilización_(dap)',
  fechaInicioEstimadaViabilizacionDAP: 'fecha_inicio_estimada_viabilización_(dap)',
  fechaInicioRealViabilizacionDAP: 'fecha_inicio_real_viabilización_(dap)',
  fechaFinEstimadaViabilizacionDAP: 'fecha_fin_estimada_viabilización_(dap)',
  fechaFinRealViabilizacionDAP: 'fecha_fin_real_viabilización_(dap)',

  // Bloque CONTRATACIÓN
  porcentajeContratacion: 'porcentaje_contratación',
  inversionContratacion: 'inversion_contratación',
  fechaInicioEstimadaContratacion: 'fecha_inicio_estimada_contratación',
  fechaInicioRealContratacion: 'fecha_inicio_real_contratación',
  fechaFinEstimadaContratacion: 'fecha_fin_estimada_contratación',
  fechaFinRealContratacion: 'fecha_fin_real_contratación',

  // Bloque LIQUIDACIÓN
  porcentajeLiquidacion: 'porcentaje_liquidación',
  inversionLiquidacion: 'inversion_liquidación',
  fechaInicioEstimadaLiquidacion: 'fecha_inicio_estimada_liquidación',
  fechaInicioRealLiquidacion: 'fecha_inicio_real_liquidación',
  fechaFinEstimadaLiquidacion: 'fecha_fin_estimada_liquidación',
  fechaFinRealLiquidacion: 'fecha_fin_real_liquidación',

  // Bloque PLANEACIÓN (MGA)
  porcentajePlaneacionMGA: 'porcentaje_planeación_(mga)',
  inversionPlaneacionMGA: 'inversion_planeación_(mga)',
  fechaInicioEstimadaPlaneacionMGA: 'fecha_inicio_estimada_planeación_(mga)',
  fechaInicioRealPlaneacionMGA: 'fecha_inicio_real_planeación_(mga)',
  fechaFinEstimadaPlaneacionMGA: 'fecha_fin_estimada_planeación_(mga)',
  fechaFinRealPlaneacionMGA: 'fecha_fin_real_planeación_(mga)',

  // Bloque ESTUDIOS PRELIMINARES
  porcentajeEstudiosPreliminares: 'porcentaje_estudios_preliminares',
  inversionEstudiosPreliminares: 'inversion_estudios_preliminares',
  fechaInicioEstimadaEstudiosPreliminares: 'fecha_inicio_estimada_estudios_preliminares',
  fechaInicioRealEstudiosPreliminares: 'fecha_inicio_real_estudios_preliminares',
  fechaFinEstimadaEstudiosPreliminares: 'fecha_fin_estimada_estudios_preliminares',
  fechaFinRealEstudiosPreliminares: 'fecha_fin_real_estudios_preliminares',

  // Bloque INICIO
  porcentajeInicio: 'porcentaje_inicio',
  inversionInicio: 'inversion_inicio',
  fechaInicioEstimadaInicio: 'fecha_inicio_estimada_inicio',
  fechaInicioRealInicio: 'fecha_inicio_real_inicio',
  fechaFinEstimadaInicio: 'fecha_fin_estimada_inicio',
  fechaFinRealInicio: 'fecha_fin_real_inicio',

  // Bloque GESTIÓN PREDIAL
  porcentajeGestionPredial: 'porcentaje_gestión_predial',
  inversionGestionPredial: 'inversion_gestión_predial',
  fechaInicioEstimadaGestionPredial: 'fecha_inicio_estimada_gestión_predial',
  fechaInicioRealGestionPredial: 'fecha_inicio_real_gestión_predial',
  fechaFinEstimadaGestionPredial: 'fecha_fin_estimada_gestión_predial',
  fechaFinRealGestionPredial: 'fecha_fin_real_gestión_predial',

  // Bloque DOTACIÓN Y PUESTA EN OPERACIÓN
  porcentajeDotacionYPuestaEnOperacion: 'porcentaje_dotación_y_puesta_en_operación',
  inversionDotacionYPuestaEnOperacion: 'inversion_dotación_y_puesta_en_operación',
  fechaInicioEstimadaDotacionYPuestaEnOperacion: 'fecha_inicio_estimada_dotación_y_puesta_en_operación',
  fechaInicioRealDotacionYPuestaEnOperacion: 'fecha_inicio_real_dotación_y_puesta_en_operación',
  fechaFinEstimadaDotacionYPuestaEnOperacion: 'fecha_fin_estimada_dotación_y_puesta_en_operación',
  fechaFinRealDotacionYPuestaEnOperacion: 'fecha_fin_real_dotación_y_puesta_en_operación',
} as const;

// Ayuda de tipos (opcional)
export type FieldKey = keyof typeof F;
