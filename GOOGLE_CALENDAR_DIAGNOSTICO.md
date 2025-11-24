# 🔍 Diagnóstico: Google Calendar No Sincroniza

## Problema

Los turnos se crean correctamente en la aplicación, pero **no aparecen en Google Calendar**.

## ✅ Pasos de Diagnóstico

### 1. Verificar Logs en la Consola

1. Abre la aplicación en tu navegador
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **"Console"**
4. Crea un nuevo turno
5. **Busca mensajes** que empiecen con `[CalendarSync]`

#### Posibles Mensajes y Qué Significan:

**✅ Caso Exitoso:**
```
[CalendarSync] Iniciando sincronización: { action: 'create', officeColorId: '1' }
[CalendarSync] ✅ Sincronizado exitosamente. Event ID: abc123xyz
```
→ **Todo funciona correctamente**. El turno se sincronizó.

**⚠️ Sin Access Token:**
```
[CalendarSync] No hay access token de Google. Inicia sesión con Google para sincronizar.
```
→ **Problema**: No has iniciado sesión con Google o el token no se guardó.
→ **Solución**: Cierra sesión y vuelve a iniciar sesión con Google.

**⚠️ No Conectado:**
```
[CalendarSync] No conectado a Google Calendar
```
→ **Problema**: El usuario no está autenticado correctamente.
→ **Solución**: Cierra sesión y vuelve a iniciar sesión.

**❌ Error del Servidor:**
```
[CalendarSync] Error del servidor: { error: "Token de acceso expirado..." }
```
→ **Problema**: El token de Google expiró (duran aprox. 1 hora).
→ **Solución**: Cierra sesión y vuelve a iniciar sesión con Google.

**❌ Error 403:**
```
[CalendarSync] Error del servidor: { error: "No tienes permisos para acceder a Google Calendar..." }
```
→ **Problema**: Faltan permisos de Google Calendar.
→ **Solución**: Ve a la sección "Configurar Scopes de Google Calendar" más abajo.

### 2. Verificar OAuth Scopes (Permisos)

Los scopes son los permisos que la app solicita a Google. Necesitas que la app pida permiso para acceder a Google Calendar.

#### 2.1 Verificar en el Código

Abre el archivo `src/contexts/AuthContext.tsx` y busca:

```typescript
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');
```

Si **NO están** estas líneas, agrégalas en la función `signInWithGoogle`, antes de:
```typescript
const result = await signInWithPopup(auth, provider);
```

#### 2.2 Verificar Scopes en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto
3. **APIs y servicios** > **Pantalla de consentimiento de OAuth**
4. Desplázate hasta **"Scopes"**
5. Verifica que estén estos scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`

Si **NO están**, agrégalos:
1. Haz clic en **"Editar aplicación"**
2. Avanza hasta la sección **"Scopes"**
3. Haz clic en **"Add or Remove Scopes"**
4. Busca "Google Calendar API" en el filtro
5. Selecciona:
   - `https://www.googleapis.com/auth/calendar` (Ver y editar eventos)
   - `https://www.googleapis.com/auth/calendar.events` (Ver y editar eventos)
6. Haz clic en **"Update"** y luego **"Save and Continue"**

### 3. Verificar que Google Calendar API esté Habilitada

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. **APIs y servicios** > **Panel**
3. Busca **"Google Calendar API"**
4. Debe tener un ícono **verde** que diga **"API habilitada"**

Si **NO está habilitada**:
1. Ve a **APIs y servicios** > **Biblioteca**
2. Busca "Google Calendar API"
3. Haz clic en **"HABILITAR"**

### 4. Renovar el Token (Cerrar y Volver a Iniciar Sesión)

Los tokens de Google Calendar expiran después de **1 hora**. Si llevas más de 1 hora sin cerrar sesión:

1. Haz clic en tu perfil (arriba derecha)
2. **Cerrar sesión**
3. **Iniciar sesión** nuevamente con Google
4. Acepta todos los permisos que solicite

Esto generará un nuevo access token válido.

### 5. Verificar en localStorage

1. Con DevTools abierto (F12), ve a la pestaña **"Application"** (o "Aplicación")
2. En el menú lateral, expande **"Local Storage"**
3. Haz clic en tu dominio (http://localhost:3000 o https://clinical-ar.vercel.app)
4. Busca la clave `google_access_token`
5. Debe tener un **valor largo** (token)

Si **NO existe** o está **vacío**:
→ El token no se guardó. Cierra sesión y vuelve a iniciar sesión con Google.

### 6. Test Rápido: Verificar Scopes del Token

Abre la consola del navegador (F12) y ejecuta:

```javascript
const token = localStorage.getItem('google_access_token');
if (token) {
  fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`)
    .then(r => r.json())
    .then(data => {
      console.log('Scopes:', data.scope);
      if (data.scope.includes('calendar')) {
        console.log('✅ Tiene permisos de Calendar');
      } else {
        console.log('❌ NO tiene permisos de Calendar');
      }
    });
} else {
  console.log('❌ No hay token guardado');
}
```

**Resultado esperado:**
```
Scopes: openid https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events ...
✅ Tiene permisos de Calendar
```

Si dice `❌ NO tiene permisos de Calendar`:
→ Necesitas agregar los scopes en el código (paso 2.1).

### 7. Verificar Configuración de Firebase Auth

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. **Authentication** > **Sign-in method**
4. Verifica que **Google** esté **habilitado**
5. Haz clic en **Google** y verifica que:
   - **Project ID de Google Cloud** esté configurado
   - **OAuth 2.0 Client ID** esté configurado

## 🔧 Soluciones Comunes

### Solución 1: Código Falta Scopes

Si en `AuthContext.tsx` **NO están** los scopes, agrégalos:

```typescript
// src/contexts/AuthContext.tsx
const signInWithGoogle = async () => {
  if (mockMode || !auth) return;
  setError(null);
  try {
    const provider = new GoogleAuthProvider();

    // AGREGAR ESTAS LÍNEAS:
    provider.addScope('https://www.googleapis.com/auth/calendar');
    provider.addScope('https://www.googleapis.com/auth/calendar.events');

    logger.log('[AuthContext] Iniciando signInWithPopup con scopes de Calendar');
    const result = await signInWithPopup(auth, provider);
    // ... resto del código
  }
}
```

Después de agregar, **guarda**, **recarga la app**, **cierra sesión** y **vuelve a iniciar sesión**.

### Solución 2: Token Expirado

**Síntoma:** Funcionaba antes pero ahora no.
**Causa:** Los tokens expiran cada 1 hora.
**Solución:** Cierra sesión y vuelve a iniciar sesión.

En el futuro, puedes implementar **refresh tokens** para renovar automáticamente.

### Solución 3: Permisos Denegados

**Síntoma:** Al iniciar sesión, no se solicitan permisos de Calendar.
**Causa:** Los scopes no están configurados correctamente.
**Solución:**
1. Agrega scopes en el código (Solución 1)
2. Revoca el acceso de la app en Google:
   - Ve a https://myaccount.google.com/permissions
   - Busca tu app
   - Haz clic en **"Remove Access"**
3. Vuelve a iniciar sesión (ahora pedirá permisos de Calendar)

## 📝 Resumen de Verificación

| # | Verificación | ✅/❌ |
|---|--------------|------|
| 1 | Hay logs `[CalendarSync]` en la consola | |
| 2 | Scopes en código (`provider.addScope`) | |
| 3 | Scopes en Google Cloud Console | |
| 4 | Google Calendar API habilitada | |
| 5 | Token en localStorage | |
| 6 | Token tiene scopes de calendar (test) | |
| 7 | Firebase Auth con Google habilitado | |

## 🎯 Siguiente Paso

**Crea un nuevo turno** y abre la consola (F12). Los logs te dirán exactamente qué está pasando:

- Si ves `✅ Sincronizado exitosamente` → Todo funciona
- Si ves `No hay access token` → Inicia sesión de nuevo
- Si ves `Error del servidor: 403` → Faltan scopes (ver Solución 1 y 3)
- Si ves `Error del servidor: 401` → Token expirado (ver Solución 2)

**Luego, dime qué mensaje ves** y te ayudaré con la solución específica.
