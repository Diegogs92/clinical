# Configuración de Google Maps API

Para usar el selector de ubicación en el mapa necesitas una API key de Google Maps.

## Pasos para obtener tu API key:

### 1. Ir a Google Cloud Console
Visita: https://console.cloud.google.com/

### 2. Crear o seleccionar un proyecto
- Si ya tienes un proyecto (el mismo de Firebase y OAuth), selecciónalo
- Si no, crea uno nuevo

### 3. Habilitar las APIs necesarias
Ve a "APIs y servicios" > "Biblioteca" y habilita:
- **Maps JavaScript API**
- **Geocoding API** (opcional, para búsquedas por dirección)

### 4. Crear credenciales
1. Ve a "APIs y servicios" > "Credenciales"
2. Haz clic en "Crear credenciales" > "Clave de API"
3. Se generará tu API key

### 5. Configurar restricciones (Recomendado)
Para mayor seguridad:
1. Haz clic en tu API key recién creada
2. En "Restricciones de aplicación", selecciona "Referentes HTTP (sitios web)"
3. Agrega tus dominios:
   - `localhost:*` (para desarrollo)
   - `tu-dominio.vercel.app/*` (para producción)
4. En "Restricciones de API", selecciona "Restringir clave" y elige:
   - Maps JavaScript API
   - Geocoding API (si la habilitaste)

### 6. Agregar la API key a tu proyecto

En tu archivo `.env.local`, agrega:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### 7. Reiniciar el servidor de desarrollo

```bash
npm run dev
```

## Notas importantes:

- La API key debe ser pública (`NEXT_PUBLIC_`) porque se usa en el navegador
- Protege tu API key con restricciones de dominio
- Google Maps tiene un uso gratuito mensual generoso ($200 USD de crédito)
- Para producción, asegúrate de agregar la variable de entorno en Vercel

## Agregar la variable en Vercel:

1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega:
   - Name: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Value: tu API key
   - Environment: Production, Preview, Development
4. Redeploy tu proyecto
