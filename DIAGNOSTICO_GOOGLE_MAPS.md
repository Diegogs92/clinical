# 🔍 Diagnóstico Google Maps Autocomplete

## Problema Actual
El autocompletado de Google Places no está funcionando después de configurar las restricciones en Google Cloud Console.

## ✅ Pasos de Verificación

### 1. Verificar que las 3 APIs están habilitadas

Ve a: https://console.cloud.google.com/apis/dashboard

Debes ver estas 3 APIs como **habilitadas** (con ícono verde):
- ✅ **Maps JavaScript API**
- ✅ **Geocoding API**
- ✅ **Places API** (la más importante para autocomplete)

**Si Places API no está habilitada:**
1. Ve a https://console.cloud.google.com/apis/library
2. Busca "Places API"
3. Haz clic en "HABILITAR"
4. Espera 1-2 minutos

### 2. Verificar Restricciones de la API Key

Ve a: https://console.cloud.google.com/apis/credentials

1. Haz clic en tu API key (la que termina en `...U5W_2Qk`)
2. Verifica en **"Restricciones de aplicación"**:
   - Debe estar seleccionado: **"Referentes HTTP (sitios web)"**
   - Deben aparecer estos 5 dominios:
     ```
     http://localhost:*/*
     https://localhost:*/*
     http://127.0.0.1:*/*
     https://127.0.0.1:*/*
     https://*.vercel.app/*
     ```

3. Verifica en **"Restricciones de API"**:
   - Debe estar seleccionado: **"Restringir clave"**
   - Solo deben aparecer estas 3 APIs:
     - Maps JavaScript API
     - Geocoding API
     - Places API

4. Haz clic en **"GUARDAR"** (botón azul abajo)
5. **Espera 2-3 minutos** para que los cambios se propaguen

### 3. Verificar Facturación

Ve a: https://console.cloud.google.com/billing

- Verifica que tu proyecto tenga una cuenta de facturación vinculada
- Aunque el uso esté dentro del nivel gratuito, Google requiere que tengas facturación configurada

### 4. Verificar en el Navegador

1. Abre http://localhost:3000
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **"Console"**
4. Ve a la página de Consultorios
5. Haz clic en "Agregar Consultorio"
6. Busca estos mensajes en la consola:
   - ✅ `Google Maps API Key configurada`
   - ✅ `Autocomplete cargado correctamente`

**Si ves errores en rojo:**
- Copia el mensaje de error completo
- Busca si dice algo sobre "API key" o "Places API"

### 5. Errores Comunes

#### Error: "Esta página no puede cargar Google Maps correctamente"
**Causa:** Restricciones de dominio mal configuradas o faltantes
**Solución:** Verifica paso 2 arriba, asegúrate de guardar los cambios

#### Error: "Places API is not enabled"
**Causa:** Places API no está habilitada en el proyecto
**Solución:** Ve al paso 1 y habilita Places API

#### Error: "This API project is not authorized to use this API"
**Causa:** La API key tiene restricciones muy estrictas
**Solución:** Verifica que Places API esté en la lista de APIs permitidas (paso 2.3)

#### Error: "REQUEST_DENIED"
**Causa:** Facturación no configurada o cuota excedida
**Solución:** Verifica paso 3

#### No aparecen sugerencias al escribir
**Causa:** Places API no habilitada o restricciones mal configuradas
**Solución:**
1. Verifica que Places API esté habilitada (paso 1)
2. Espera 3-5 minutos después de guardar cambios
3. Limpia caché del navegador (Ctrl + Shift + Delete)
4. Reinicia el servidor de desarrollo

### 6. Test Rápido

Para probar si tu API key funciona con Places:
1. Abre esta URL en tu navegador (reemplaza TU_API_KEY):
```
https://maps.googleapis.com/maps/api/place/autocomplete/json?input=av+corrientes&key=AIzaSyDnK8kTWoX5J4yq5PxslNvIGdE2U5W_2Qk
```

**Respuesta esperada:** Un JSON con predicciones
**Error:** Si ves `"status": "REQUEST_DENIED"`, hay un problema con tu API key

## 📝 Información para Reportar

Si sigues teniendo problemas, necesito esta información:

1. **Captura de pantalla** de la consola del navegador (F12) cuando abres el modal
2. **¿Qué APIs ves habilitadas?** en https://console.cloud.google.com/apis/dashboard
3. **¿Qué restricciones ves?** en la configuración de tu API key
4. **¿Tienes facturación configurada?** (sí/no)
5. **¿Cuánto tiempo esperaste** después de guardar los cambios? (debe ser al menos 2-3 minutos)

## 🚀 Cambios Recientes en el Código

**IMPORTANTE:** Migrado a API nativa de Google Maps Places Autocomplete debido a que `@react-google-maps/api` Autocomplete está deprecado para nuevos usuarios.

Ahora usamos `new google.maps.places.Autocomplete()` directamente en lugar del componente wrapper de React.

Logs de diagnóstico en el componente LocationPicker:
- `✅ Google Maps API Key configurada` - La API key está presente
- `✅ Autocomplete nativo inicializado correctamente` - El autocomplete se inicializó con la nueva API
- `❌ Error al cargar Google Maps:` - Hubo un error al cargar

Estos mensajes aparecerán en la consola del navegador (F12 > Console).
