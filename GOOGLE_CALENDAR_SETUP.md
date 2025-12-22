# Configuración Google Calendar + Google Sign-In

## 1) Google Cloud Console

### Paso 1.1: Acceder al proyecto
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. En el selector de proyectos (arriba a la izquierda), busca el proyecto que usa Firebase
   - Si no tienes proyecto, créalo: Click en "Nuevo proyecto"
   - Nombre sugerido: "Dentify" o el nombre de tu app
   - Click en "Crear"

### Paso 1.2: Habilitar Google Calendar API
1. En el menú lateral, ve a **"APIs y servicios"** > **"Biblioteca"**
2. Busca "Google Calendar API"
3. Click en el resultado "Google Calendar API"
4. Click en el botón azul **"HABILITAR"**
5. Espera unos segundos hasta que se active

### Paso 1.3: Configurar pantalla de consentimiento OAuth
1. En el menú lateral, ve a **"APIs y servicios"** > **"Pantalla de consentimiento de OAuth"**
2. Selecciona el tipo de usuario:
   - **EXTERNO**: Permite cualquier cuenta de Google (recomendado para empezar)
   - **INTERNO**: Solo usuarios de tu organización Google Workspace
3. Click en **"CREAR"**

**Pestaña 1: Descripción general**
- Completa los campos básicos y click en **"GUARDAR Y CONTINUAR"**

**Pestaña 2: Información de la marca**
- **Nombre de la aplicación**: "Dentify" (o el nombre de tu app)
- **Correo electrónico de asistencia del usuario**: Tu email de Gmail
- **Logo de la aplicación**: (Opcional) Sube un logo
- **Dominios de la aplicación**: (Opcional por ahora)
- **Dominios autorizados**: (Opcional por ahora)
- **Correo electrónico de contacto del desarrollador**: Tu email de Gmail
- Click en **"GUARDAR Y CONTINUAR"**

**Pestaña 3: Público**
- Deja la configuración por defecto (sin usuarios específicos por ahora)
- Click en **"GUARDAR Y CONTINUAR"**

**Pestaña 4: Clientes**
- Deja vacío por ahora
- Click en **"GUARDAR Y CONTINUAR"**

**Pestaña 5: Acceso a los datos**
1. Click en **"AGREGAR O QUITAR PERMISOS"**
2. En el filtro de búsqueda, escribe "calendar"
3. Marca estas dos casillas:
   - ✅ `.../auth/calendar` - Ver, editar, compartir y eliminar permanentemente todos los calendarios...
   - ✅ `.../auth/calendar.events` - Ver y editar eventos de todos tus calendarios
4. Click en **"ACTUALIZAR"** (abajo)
5. Verifica que aparezcan los 2 permisos en la tabla
6. En **"Tus permisos sensibles"**, verás los permisos agregados
7. Click en **"GUARDAR Y CONTINUAR"**

**Pestaña 6: Centro de verificación**
- Por ahora no necesitas verificar la app (solo para pruebas)
- Click en **"GUARDAR Y CONTINUAR"**

**Pestaña 7: Configuración**
- Si quieres agregar usuarios de prueba (recomendado para apps en modo EXTERNO):
  - Baja hasta **"Usuarios de prueba"**
  - Click en **"+ AGREGAR USUARIOS"**
  - Agrega los emails de Gmail de las personas que probarán la app (incluido el tuyo)
  - Ejemplo: `tu-email@gmail.com`
  - Click en **"AGREGAR"**
- Click en **"GUARDAR Y CONTINUAR"**

**Resumen:**
- Revisa toda la configuración
- Click en **"VOLVER AL PANEL"**

### Paso 1.4: Crear credenciales OAuth
1. En el menú lateral, ve a **"APIs y servicios"** > **"Credenciales"**
2. Click en **"+ CREAR CREDENCIALES"** (arriba)
3. Selecciona **"ID de cliente de OAuth 2.0"**
4. Tipo de aplicación: **"Aplicación web"**
5. **Nombre**: "Dentify Web Client" (o el que prefieras)
6. **Orígenes de JavaScript autorizados**:
   - Click en **"+ AGREGAR URI"**
   - Agrega: `http://localhost:3000`
   - Click en **"+ AGREGAR URI"** nuevamente
   - Agrega tu dominio de producción cuando lo tengas (ej: `https://tuapp.com`)
7. **URIs de redirección autorizados**:
   - Click en **"+ AGREGAR URI"**
   - Agrega: `http://localhost:3000`
   - Si usas Firebase Auth, también agrega:
     - Click en **"+ AGREGAR URI"**
     - `https://TU-PROYECTO-ID.firebaseapp.com/__/auth/handler`
     - (Reemplaza TU-PROYECTO-ID con tu Firebase Project ID)
8. Click en **"CREAR"**
9. **¡IMPORTANTE!** Aparecerá un popup con:
   - **Tu ID de cliente**: Cópialo (ejemplo: `123456789-abc.apps.googleusercontent.com`)
   - **Tu secreto de cliente**: Cópialo (ejemplo: `GOCSPX-abc123`)
   - Guárdalos en un lugar seguro, los necesitarás para las variables de entorno
10. Click en **"ACEPTAR"**

## 2) Firebase Console

### Paso 2.1: Crear o acceder al proyecto de Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Si ya tienes un proyecto Firebase:
   - Click en el proyecto
   - **IMPORTANTE**: Debe ser el mismo proyecto que usaste en Google Cloud Console
3. Si NO tienes proyecto:
   - Click en **"Agregar proyecto"**
   - **Nombre del proyecto**: Selecciona el proyecto que creaste en Google Cloud (debe aparecer en la lista)
   - Acepta los términos
   - Click en **"Continuar"**
   - Habilita Google Analytics (opcional)
   - Click en **"Crear proyecto"**
   - Espera a que se cree (puede tomar 30 segundos)
   - Click en **"Continuar"**

### Paso 2.2: Obtener configuración de Firebase (para variables de entorno)
1. En el panel de Firebase, ve a la rueda de configuración ⚙️ (arriba a la izquierda)
2. Click en **"Configuración del proyecto"**
3. En la pestaña **"General"**, baja hasta **"Tus aplicaciones"**
4. Si NO tienes una app web, click en el ícono `</>` (Web)
   - **Alias de la app**: "Dentify Web" (o el que prefieras)
   - NO marques Firebase Hosting por ahora
   - Click en **"Registrar app"**
5. Aparecerá el código de configuración de Firebase. **Copia estos valores:**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",              // ← NEXT_PUBLIC_FIREBASE_API_KEY
     authDomain: "tu-proyecto.firebaseapp.com",  // ← NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
     projectId: "tu-proyecto-id",      // ← NEXT_PUBLIC_FIREBASE_PROJECT_ID
     storageBucket: "tu-proyecto.firebasestorage.app", // ← NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
     messagingSenderId: "123456789",   // ← NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
     appId: "1:123:web:abc123"         // ← NEXT_PUBLIC_FIREBASE_APP_ID
   };
   ```
6. **Guarda estos valores**, los usarás en el archivo `.env.local`
7. Click en **"Continuar a la consola"**

### Paso 2.3: Habilitar Firebase Authentication
1. En el menú lateral de Firebase, ve a **"Compilación"** > **"Authentication"**
2. Click en **"Comenzar"** (si es la primera vez)
3. Ve a la pestaña **"Sign-in method"**
4. En la lista de proveedores, busca **"Google"**
5. Click en **"Google"**
6. Activa el switch **"Habilitar"**
7. **Correo electrónico de asistencia del proyecto**: Selecciona tu email
8. **Configuración avanzada** (expandir):
   - **ID de cliente web de OAuth**: Pega el **Client ID** que copiaste de Google Cloud Console
   - **Clave secreta de cliente web de OAuth**: Pega el **Client Secret** que copiaste
9. Click en **"Guardar"**

### Paso 2.4: Configurar dominios autorizados
1. Todavía en **"Authentication"** > **"Settings"** (pestaña arriba)
2. Baja hasta **"Dominios autorizados"**
3. Verifica que estén:
   - ✅ `localhost` (debe estar por defecto)
   - ✅ `tu-proyecto.firebaseapp.com` (debe estar por defecto)
4. Si vas a desplegar en producción, agrega tu dominio:
   - Click en **"Agregar dominio"**
   - Ingresa tu dominio (ej: `tuapp.com`)
   - Click en **"Agregar"**

### Paso 2.5: Crear base de datos Firestore
1. En el menú lateral, ve a **"Compilación"** > **"Firestore Database"**
2. Click en **"Crear base de datos"**
3. **Modo**:
   - Selecciona **"Comenzar en modo de producción"** (configuraremos reglas después)
   - Click en **"Siguiente"**
4. **Ubicación de Cloud Firestore**:
   - Selecciona la región más cercana a tus usuarios
   - Recomendado para Argentina: `southamerica-east1` (São Paulo)
   - Click en **"Habilitar"**
5. Espera a que se cree la base de datos (puede tomar 1-2 minutos)

### Paso 2.6: Configurar reglas de Firestore
1. En Firestore Database, ve a la pestaña **"Reglas"**
2. Verás que por defecto todo está bloqueado
3. **IMPORTANTE**: Tu proyecto ya tiene reglas de seguridad en el archivo `firestore.rules`
4. Copia el contenido del archivo [firestore.rules](firestore.rules) de tu proyecto
5. Pégalo en el editor de reglas de Firebase Console
6. Click en **"Publicar"**

## 3) Crear Calendario Compartido en Google Calendar

### Paso 3.1: Crear el calendario
1. Ve a [Google Calendar](https://calendar.google.com)
2. En el panel izquierdo, al lado de **"Otros calendarios"**, click en el **+**
3. Selecciona **"Crear nuevo calendario"**
4. **Nombre**: "Agenda Dentify" (o el nombre que prefieras)
5. **Descripción**: "Calendario compartido para gestión de turnos odontológicos"
6. **Zona horaria**: Selecciona tu zona (ej: "Buenos Aires" para Argentina)
7. Click en **"Crear calendario"**

### Paso 3.2: Obtener el Calendar ID
1. En el panel izquierdo, busca el calendario que acabas de crear
2. Pasa el mouse sobre el nombre del calendario
3. Click en los **tres puntos** (⋮)
4. Selecciona **"Configuración y uso compartido"**
5. Baja hasta la sección **"Integrar calendario"**
6. Copia el **"ID del calendario"** (ejemplo: `abc123@group.calendar.google.com`)
7. **Guarda este ID**, lo usarás en las variables de entorno

### Paso 3.3: Compartir el calendario con los usuarios
1. En la misma página de configuración, baja hasta **"Compartir con determinadas personas"**
2. Click en **"+ Agregar personas"**
3. **Agrega el email de cada usuario** que usará la app:
   - Ingresa el email (ej: `usuario@gmail.com`)
   - En **"Permisos"**, selecciona: **"Realizar cambios en los eventos"**
   - Click en **"Enviar"**
4. Repite para cada usuario que necesite acceso
5. **IMPORTANTE**: Cada usuario debe aceptar la invitación que recibirá por email

### Paso 3.4: Configurar visibilidad (opcional)
1. En **"Permisos de acceso"**, puedes ajustar:
   - **"Poner a disposición del público"**: NO recomendado (mantén desmarcado)
   - **"Ver solo disponibilidad (ocultar detalles)"**: Desmarcado
2. Esto asegura que solo las personas autorizadas puedan ver y editar eventos

---

## 4) Configurar Variables de Entorno

### Paso 4.1: Crear el archivo .env.local
1. Abre tu proyecto en VSCode
2. En la raíz del proyecto, crea un nuevo archivo llamado `.env.local`
3. **IMPORTANTE**: Este archivo NO debe subirse a Git (ya está en `.gitignore`)

### Paso 4.2: Completar las variables de Firebase
Usa los valores que copiaste en el **Paso 2.2** de Firebase Console:

```env
############################
# Firebase Configuration   #
############################
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Dónde obtener cada valor:**
- Todos estos valores están en Firebase Console > ⚙️ Configuración del proyecto > General > Tus aplicaciones

### Paso 4.3: Completar las variables de Google OAuth
Usa los valores que copiaste en el **Paso 1.4** de Google Cloud Console:

```env
############################
# Google OAuth / NextAuth  #
############################
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_CALENDAR_ID=abc123@group.calendar.google.com
NEXTAUTH_SECRET=genera-una-clave-secreta-aleatoria-aqui
NEXTAUTH_URL=http://localhost:3000
```

**Dónde obtener cada valor:**
- `GOOGLE_CLIENT_ID`: Google Cloud Console > APIs y servicios > Credenciales (Paso 1.4)
- `GOOGLE_CLIENT_SECRET`: Google Cloud Console > APIs y servicios > Credenciales (Paso 1.4)
- `GOOGLE_CALENDAR_ID`: Google Calendar > Configuración del calendario (Paso 3.2)
- `NEXTAUTH_SECRET`: Genera uno nuevo (ver abajo)
- `NEXTAUTH_URL`:
  - Desarrollo: `http://localhost:3000`
  - Producción: `https://tu-dominio.com`

### Paso 4.4: Generar NEXTAUTH_SECRET
Puedes generar un secreto aleatorio usando uno de estos métodos:

**Opción 1: Usar OpenSSL (en terminal):**

```bash
openssl rand -base64 32
```

**Opción 2: Usar Node.js (en terminal):**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Opción 3: Generar online:**
- Ve a <https://generate-secret.vercel.app/32>
- Copia el resultado

Copia el resultado y pégalo como valor de `NEXTAUTH_SECRET`

### Paso 4.5: Verificar el archivo completo
Tu archivo `.env.local` debería verse así:

```env
############################
# Firebase Configuration   #
############################
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dentify-123abc.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dentify-123abc
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dentify-123abc.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

############################
# Google OAuth / NextAuth  #
############################
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx
GOOGLE_CALENDAR_ID=abc123def456@group.calendar.google.com
NEXTAUTH_SECRET=tu-secreto-generado-aleatorio-de-32-caracteres
NEXTAUTH_URL=http://localhost:3000
```

### Paso 4.6: Guardar y reiniciar
1. **Guarda el archivo** `.env.local`
2. Si el servidor de desarrollo está corriendo, **deténlo** (Ctrl+C)
3. Vuelve a iniciar el servidor:

```bash
npm run dev
```

---

## 5) Probar el Login y los Permisos

### Paso 5.1: Iniciar sesión por primera vez
1. Abre tu navegador y ve a `http://localhost:3000/login`
2. Click en **"Continuar con Google"**
3. Selecciona tu cuenta de Google
4. **IMPORTANTE**: Google te pedirá permisos. Verás dos pantallas:
   - **Pantalla 1**: Permisos básicos (email, perfil)
   - **Pantalla 2**: Permisos de Google Calendar (ver y editar calendarios)
5. Click en **"Permitir"** o **"Allow"** en ambas pantallas
6. Deberías ser redirigido al dashboard de la app

### Paso 5.2: Verificar que el token se guardó
1. Abre las **DevTools** del navegador (F12)
2. Ve a la pestaña **"Application"** (o "Aplicación")
3. En el panel izquierdo, busca **"Local Storage"** > `http://localhost:3000`
4. Verifica que existan estas claves:
   - `googleAccessToken`: El token de acceso
   - `tokenExpiration`: Timestamp de cuándo expira

### Paso 5.3: Si el login falla
Si ves errores como "access_denied" o "redirect_uri_mismatch":

1. **Verifica los URIs de redirección** en Google Cloud Console:
   - Ve a APIs y servicios > Credenciales
   - Click en tu Cliente OAuth 2.0
   - Verifica que `http://localhost:3000` esté en **"Orígenes de JavaScript autorizados"**
   - Verifica que `https://TU-PROYECTO-ID.firebaseapp.com/__/auth/handler` esté en **"URIs de redirección autorizados"**

2. **Revoca permisos y vuelve a intentar**:
   - Ve a <https://myaccount.google.com/permissions>
   - Busca tu app "Dentify"
   - Click en **"Quitar acceso"**
   - Vuelve a iniciar sesión en la app

3. **Verifica dominios autorizados en Firebase**:
   - Firebase Console > Authentication > Settings > Authorized domains
   - Debe estar `localhost`

---

## 6) Verificar la Sincronización con Calendar

### Paso 6.1: Crear un turno en la app
1. Ve a la página de **Agenda** (`/agenda`)
2. Click en un slot vacío del calendario
3. Completa el formulario:
   - Selecciona un paciente (o crea uno nuevo)
   - Selecciona fecha y hora
   - Agrega notas si quieres
4. Click en **"Crear turno"**
5. El turno debería aparecer en la agenda

### Paso 6.2: Verificar en Google Calendar
1. Abre [Google Calendar](https://calendar.google.com) en otra pestaña
2. En el panel izquierdo, busca el calendario **"Agenda Dentify"**
3. Asegúrate de que esté **marcado** (checkbox activo)
4. **Deberías ver el turno que creaste** en el mismo horario
5. El evento tendrá el formato: `👤 Turno: Nombre del Paciente`

### Paso 6.3: Crear evento desde Google Calendar
1. En Google Calendar, click en un horario vacío
2. Crea un evento:
   - **Título**: "Reunión de equipo"
   - **Calendario**: Selecciona "Agenda Dentify"
   - **Hora**: Elige un horario
3. Click en **"Guardar"**
4. **Espera 5 minutos** (la sincronización automática se ejecuta cada 5 min)
5. Refresca la página de Agenda en la app
6. **Deberías ver el evento** con el ícono 🔒 (evento personal)

### Paso 6.4: Solución de problemas
Si la sincronización no funciona:

1. **Verifica el token en LocalStorage** (DevTools > Application > Local Storage)
   - Si `tokenExpiration` está vencido, cierra sesión y vuelve a iniciar sesión

2. **Verifica los logs en la consola** del navegador (F12 > Console)
   - Busca errores relacionados con "calendar" o "sync"

3. **Verifica que el Calendar ID sea correcto**:
   - En `.env.local`, asegúrate de que `GOOGLE_CALENDAR_ID` coincida exactamente con el ID del calendario

4. **Verifica permisos del calendario**:
   - En Google Calendar > Configuración del calendario
   - Tu usuario debe tener permiso de **"Realizar cambios en los eventos"**

---

## ✅ Checklist Final

Antes de usar la app en producción, verifica que hayas completado:

- [ ] Google Cloud Console:
  - [ ] Proyecto creado
  - [ ] Google Calendar API habilitada
  - [ ] Pantalla de consentimiento OAuth configurada
  - [ ] Scopes de Calendar agregados
  - [ ] Credenciales OAuth creadas (Client ID y Secret)
  - [ ] URIs de redirección configurados

- [ ] Firebase Console:
  - [ ] Proyecto vinculado a Google Cloud
  - [ ] Configuración de Firebase copiada
  - [ ] Authentication habilitado con Google
  - [ ] Client ID y Secret de OAuth configurados
  - [ ] Dominios autorizados agregados
  - [ ] Firestore Database creado
  - [ ] Reglas de Firestore publicadas

- [ ] Google Calendar:
  - [ ] Calendario compartido creado
  - [ ] Calendar ID copiado
  - [ ] Usuarios agregados con permisos de edición

- [ ] Variables de Entorno:
  - [ ] Archivo `.env.local` creado
  - [ ] Todas las variables de Firebase completadas
  - [ ] GOOGLE_CLIENT_ID y SECRET completados
  - [ ] GOOGLE_CALENDAR_ID completado
  - [ ] NEXTAUTH_SECRET generado

- [ ] Pruebas:
  - [ ] Login con Google funciona
  - [ ] Token de Calendar se guarda en LocalStorage
  - [ ] Crear turno en app lo muestra en Google Calendar
  - [ ] Crear evento en Google Calendar lo sincroniza a la app (en 5 min)

---

## 🆘 Ayuda Adicional

Si tienes problemas:

1. **Revisa la consola del navegador** (F12 > Console) para ver errores
2. **Usa la ruta de debug**: `http://localhost:3000/api/auth/debug` (solo en desarrollo)
3. **Verifica que todas las variables de entorno estén sin espacios ni comillas**
4. **Asegúrate de haber reiniciado el servidor** después de modificar `.env.local`

**Errores comunes:**

- **"redirect_uri_mismatch"**: Los URIs de redirección en Google Cloud no coinciden
- **"access_denied"**: No agregaste los scopes de Calendar o el usuario no dio permiso
- **"Token expired"**: El token venció después de 1 hora, vuelve a iniciar sesión
- **"Calendar not found"**: El GOOGLE_CALENDAR_ID es incorrecto o el usuario no tiene acceso
