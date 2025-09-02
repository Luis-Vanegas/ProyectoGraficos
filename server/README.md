# Servidor API para ProyectoGraficos

Este servidor ahora consume datos de una API externa en lugar de leer archivos Excel.

## 🚀 Instalación

1. **Instalar dependencias:**
```bash
cd server
npm install
```

2. **Configurar autenticación:**
```bash
# Copia el archivo de ejemplo
copy config.example.js config.js

# Edita config.js y agrega tu API key
# Descomenta la línea que corresponda a tu tipo de autenticación
```

3. **Iniciar el servidor:**
```bash
node index.js
```

## 🔐 Configuración de Autenticación

### Tipos de autenticación soportados:

- **Bearer Token:** `'Authorization': 'Bearer TU_API_KEY'`
- **API Key personalizada:** `'X-API-Key': 'TU_API_KEY'`
- **API Key estándar:** `'api-key': 'TU_API_KEY'`
- **Azure API Management:** `'Ocp-Apim-Subscription-Key': 'TU_KEY'`

### Pasos para configurar:

1. Copia `config.example.js` como `config.js`
2. Edita `config.js` y descomenta la línea que corresponda
3. Reemplaza `'TU_API_KEY'` con tu API key real
4. Guarda y reinicia el servidor

### Ejemplo de configuración:
```javascript
headers: {
  'Accept': 'application/json',
  'User-Agent': 'ProyectoGraficos/1.0',
  'Authorization': 'Bearer abc123def456ghi789'  // ← Tu API key aquí
}
```

## 📊 Endpoints disponibles

### GET `/api/data`
Obtiene todos los datos de obras desde la API externa.

**Respuesta:**
```json
{
  "rows": [
    {
      "id": "1",
      "nombre": "Obra ejemplo",
      "estadoDeLaObra": "En ejecución",
      // ... más campos
    }
  ]
}
```

### GET `/api/sheets`
Obtiene la lista de campos disponibles en los datos.

**Respuesta:**
```json
{
  "sheets": ["id", "nombre", "estadoDeLaObra", "dependencia", ...]
}
```

### GET `/api/status`
Verifica el estado de la conexión con la API externa.

**Respuesta:**
```json
{
  "status": "OK",
  "records": 150,
  "lastFetch": "2024-01-15T10:30:00.000Z",
  "cacheAge": "45s"
}
```

### POST `/api/refresh`
Fuerza la actualización del cache de datos.

**Respuesta:**
```json
{
  "message": "Cache actualizado exitosamente"
}
```

### GET `/api/test-connection`
Prueba la conexión a la API externa con tus credenciales.

**Respuesta exitosa:**
```json
{
  "status": "SUCCESS",
  "message": "Conexión exitosa a la API",
  "statusCode": 200,
  "dataLength": 150
}
```

**Respuesta con error:**
```json
{
  "status": "ERROR",
  "message": "Error al conectar con la API",
  "error": "Error details",
  "statusCode": 401
}
```

## ⚙️ Configuración

- **Puerto:** 3001 (configurable con variable de entorno `PORT`)
- **API externa:** `https://visorestrategicobackendprepdd-aaejehbqgednb5fr.eastus2-01.azurewebsites.net/api/powerbi/obras`
- **Cache:** 5 minutos
- **Timeout:** 10 segundos para llamadas a la API

## 🔧 Variables de entorno

```bash
PORT=3001  # Puerto del servidor (opcional, por defecto 3001)
```

## 📝 Logs

El servidor muestra logs informativos:
- ✅ Datos obtenidos exitosamente
- ❌ Errores de conexión
- 🔄 Actualizaciones de cache
- ⚠️ Uso de cache anterior por errores

## 🚨 Solución de problemas

### Error de conexión
Si la API externa no responde, el servidor usará cache anterior si está disponible.

### Timeout
La API externa tiene un timeout de 10 segundos. Si es muy lenta, considera aumentar este valor.

### Cache
Para forzar una actualización de datos, usa el endpoint `/api/refresh`.
