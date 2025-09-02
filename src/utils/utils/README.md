# Métricas Personalizadas - Dashboard de Obras

## Descripción General

Este archivo contiene las métricas personalizadas implementadas en JavaScript basadas en fórmulas DAX originales. Estas métricas proporcionan análisis avanzado del estado de las obras de la Alcaldía de Medellín.

## Métricas Implementadas

### 1. Porcentaje Presupuesto Ejecutado

**Fórmula DAX Original:**

```dax
% Presupuesto ejecutado =
var porcentaje = [Presupuesto ejecutado]/[Costo total actualizado]
Return
IF([Costo total actualizado]==0,0,porcentaje)
```

**Implementación JavaScript:**

```typescript
export function calcularPorcentajePresupuestoEjecutado(rows: Row[]): number;
```

**Descripción:** Calcula el porcentaje del presupuesto ejecutado en relación al costo total actualizado. Si el costo total es 0, retorna 0.

**Uso:**

```typescript
const porcentaje = calcularPorcentajePresupuestoEjecutado(rows);
// Retorna un valor entre 0 y 1 (ej: 0.75 = 75%)
```

### 2. Porcentaje Entregadas

**Fórmula DAX Original:**

```dax
%Entregadas = [Entregadas]/[Obras]
```

**Implementación JavaScript:**

```typescript
export function calcularPorcentajeEntregadas(rows: Row[]): number;
```

**Descripción:** Calcula el porcentaje de obras entregadas del total de obras.

**Uso:**

```typescript
const porcentaje = calcularPorcentajeEntregadas(rows);
// Retorna un valor entre 0 y 1 (ej: 0.33 = 33%)
```

### 3. Alertas Encontradas

**Fórmula DAX Original:**

```dax
Alertas encontradas =
var alertas= CALCULATE(
    COUNTROWS(Obras),
    FILTER(
        Obras,
        Obras[PRESENCIA DE RIESGO] <> "Sin información"
            && Obras[PRESENCIA DE RIESGO] <> "No Aplica"
            && Obras[PRESENCIA DE RIESGO] <> "Ninguna"
    )
)
RETURN
if(alertas<1,0,alertas)
```

**Implementación JavaScript:**

```typescript
export function calcularAlertasEncontradas(rows: Row[]): number;
```

**Descripción:** Cuenta las obras que tienen presencia de riesgo, excluyendo "Sin información", "No Aplica" y "Ninguna".

**Uso:**

```typescript
const alertas = calcularAlertasEncontradas(rows);
// Retorna el número de obras con alertas
```

### 4. Vigencias 2024

**Fórmula DAX Original:**

```dax
Vigencias 2024 =
VAR entregadas =
    CALCULATE(
        COUNTROWS(Obras),
        FILTER(
            Obras,
            Obras[AÑO DE ENTREGA] == 2024
        )
    )
RETURN
    IF(entregadas < 1, 0, entregadas)
```

**Implementación JavaScript:**

```typescript
export function calcularVigencias2024(rows: Row[]): number;
```

**Descripción:** Cuenta las obras entregadas en el año 2024.

**Uso:**

```typescript
const vigencias2024 = calcularVigencias2024(rows);
// Retorna el número de obras entregadas en 2024
```

### 5. Entregadas Confirmadas

**Fórmula DAX Original:**

```dax
Entregadas =
var entregadas =CALCULATE(COUNTROWS(Obras),FILTER(Obras,Obras[¿OBRA ENTREGADA?]="si" ))
return
if(entregadas<1,0,entregadas)
```

**Implementación JavaScript:**

```typescript
export function calcularEntregadas(rows: Row[]): number;
```

**Descripción:** Cuenta las obras marcadas explícitamente como entregadas ("si").

**Uso:**

```typescript
const entregadas = calcularEntregadas(rows);
// Retorna el número de obras confirmadas como entregadas
```

## Uso en el Dashboard

Todas estas métricas están disponibles en el objeto retornado por la función `kpis()`:

```typescript
const k = kpis(filtered);

// Acceder a las métricas:
console.log(k.porcentajePresupuestoEjecutado); // 0.75 (75%)
console.log(k.porcentajeEntregadas); // 0.33 (33%)
console.log(k.alertasEncontradas); // 15
console.log(k.vigencias2024); // 8
console.log(k.entregadasConfirmadas); // 25
```

## Campos Requeridos

Para que las métricas funcionen correctamente, se requieren los siguientes campos en el archivo de configuración (`dataConfig.ts`):

- `presupuestoEjecutado`
- `costoTotalActualizado`
- `costoEstimadoTotal`
- `estadoDeLaObra`
- `fechaRealDeEntrega`
- `fechaEstimadaDeEntrega`
- `presenciaDeRiesgo`
- `obraEntregada`

## Notas de Implementación

1. **Manejo de Nulos:** Todas las funciones manejan valores nulos o indefinidos de forma segura.
2. **Conversión de Tipos:** Se utiliza la función `toNumber()` para convertir valores a números de forma consistente.
3. **Validaciones:** Se incluyen validaciones para evitar divisiones por cero y otros errores comunes.
4. **Performance:** Las funciones están optimizadas para trabajar con grandes volúmenes de datos.

## Extensibilidad

Para agregar nuevas métricas:

1. Crear la función en este archivo
2. Agregar la llamada en la función `kpis()`
3. Incluir el valor en el objeto retornado
4. Actualizar el Dashboard para mostrar la nueva métrica

## Ejemplo de Nueva Métrica

```typescript
export function calcularNuevaMetrica(rows: Row[]): number {
  // Implementación de la métrica
  return resultado;
}

// En la función kpis():
const nuevaMetrica = calcularNuevaMetrica(rows);

return {
  // ... otras métricas
  nuevaMetrica,
};
```
