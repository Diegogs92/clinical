# Sincronización con Google Calendar

## ¿Cómo funciona?

La sincronización con Google Calendar permite que los turnos creados en la aplicación aparezcan automáticamente en tu Google Calendar y viceversa.

### Flujo de autenticación

1. **Primer inicio de sesión**: Cuando te autenticas con Google por primera vez, se solicitan permisos para acceder a Google Calendar
2. **Token de acceso**: Google proporciona un token de acceso que se guarda localmente y expira en 1 hora
3. **Sesiones posteriores**: Cuando vuelves a la app, Firebase restaura tu sesión pero **no restaura el token de Calendar**

### Indicadores visuales

La aplicación muestra diferentes estados de conexión:

- **🟢 Verde con animación**: Conectado y sincronizando correctamente
- **🟡 Amarillo "Reconectar Calendar"**: El token expiró, haz clic para reconectar
- **Sin indicador**: No autenticado con Google

## Problemas comunes y soluciones

### 1. "No veo mis turnos en Google Calendar"

**Causas posibles:**
- El token de acceso expiró (dura 1 hora)
- No diste permisos de Calendar al iniciar sesión
- La variable `GOOGLE_CALENDAR_ID` no está configurada

**Solución:**
1. Busca el indicador de Google Calendar en la parte superior
2. Si dice "Reconectar Calendar", haz clic en él
3. Acepta los permisos de Google Calendar cuando se abra el popup

### 2. "El botón de reconexión no funciona"

**Causas posibles:**
- Bloqueador de popups activo
- Dominio no autorizado en Google Cloud Console

**Solución:**
1. Deshabilita el bloqueador de popups para este sitio
2. Verifica que el dominio esté en la lista blanca de Firebase:
   - Ve a Firebase Console > Authentication > Settings > Authorized domains

### 3. "Los turnos de Google Calendar no aparecen en la app"

**Causas posibles:**
- La sincronización bidireccional solo ocurre cada 5 minutos
- El token expiró antes de la sincronización

**Solución:**
1. Verifica que el indicador muestre conexión activa (verde)
2. Espera hasta 5 minutos para la próxima sincronización automática
3. Si el problema persiste, revisa los logs del navegador (F12 > Console)

### 4. "Creé un turno pero no se sincronizó"

**Causas posibles:**
- El token expiró durante la creación
- Error en la API de Google Calendar
- Falta de permisos

**Solución:**
1. Verifica los logs en Vercel: `vercel logs`
2. Busca errores 401 (token expirado) o 403 (falta de permisos)
3. Reconéctate usando el botón "Reconectar Calendar"

## Configuración técnica

### Variables de entorno necesarias

```env
# Cliente OAuth de Google
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret

# Calendar ID (normalmente "primary" para el calendario principal)
GOOGLE_CALENDAR_ID=primary
```

### Scopes requeridos

La aplicación solicita los siguientes scopes de Google:

```javascript
'https://www.googleapis.com/auth/calendar'
'https://www.googleapis.com/auth/calendar.events'
```

### Duración del token

- **Access Token**: Expira en 1 hora
- **Firebase Auth Session**: Persiste hasta que el usuario cierre sesión
- **Renovación**: Requiere que el usuario vuelva a dar consentimiento usando el botón "Reconectar Calendar"

## Para desarrolladores

### Cómo funciona la sincronización

1. **Creación de turno**:
   - Se crea en Firestore
   - Se envía a `/api/calendar/sync` con el access token
   - Google Calendar retorna un `eventId` que se guarda en el turno

2. **Actualización de turno**:
   - Se actualiza en Firestore
   - Se envía a `/api/calendar/sync` con action='update'
   - Google Calendar actualiza el evento existente

3. **Eliminación de turno**:
   - Se elimina de Firestore
   - Se envía a `/api/calendar/sync` con action='delete'
   - Google Calendar marca el evento como cancelado

4. **Pull desde Google Calendar**:
   - Cada 5 minutos, `/api/calendar/pull` obtiene eventos de Google Calendar
   - Se comparan con Firestore usando `googleCalendarEventId`
   - Se crean/actualizan/eliminan turnos según corresponda

### Logs importantes

Busca en la consola del navegador:

```
[CalendarSync] ✅ Sincronizado exitosamente
[CalendarSync] Token expirado detectado
[AuthContext] Access token obtenido
```

### Verificar variables en Vercel

```bash
vercel env ls
vercel env pull .env.local
```

## Mejoras futuras

- [ ] Implementar refresh token automático del lado del servidor
- [ ] Agregar retry automático cuando falla la sincronización
- [ ] Mostrar notificación cuando un turno no se pudo sincronizar
- [ ] Permitir seleccionar calendario específico (no solo "primary")
- [ ] Agregar opción para deshabilitar sincronización por usuario
