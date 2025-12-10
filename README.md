# DENTIFY 🦷⏰

Asistente profesional de gestión para consultorios odontológicos con sistema de roles, agenda inteligente, gestión de pacientes y sincronización con Google Calendar.

## Tecnologías

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Firebase (Authentication, Firestore)
- **Calendario:** react-big-calendar + Google Calendar API
- **Formularios:** react-hook-form + zod
- **Iconos:** lucide-react

## Características Principales

### Sistema de Roles
- ✅ **Administrador:** Control total del consultorio
- ✅ **Profesionales:** Gestión de sus propios turnos
- ✅ **Secretaria:** Visualización y registro de asistencias/pagos

### Gestión de Turnos
- ✅ Turnos de pacientes con todos los detalles
- ✅ Eventos personales para bloquear agenda (solo admin)
- ✅ Sincronización bidireccional con Google Calendar
- ✅ Estados: Agendado, Completado, Cancelado, No Show
- ✅ Turnos recurrentes (diario, semanal, mensual)

### Gestión de Pacientes
- ✅ Fichas completas con datos personales
- ✅ Historial de consultas
- ✅ Obras sociales y autorizaciones
- ✅ Archivos adjuntos

### Control de Honorarios
- ✅ Registro de pagos por turno
- ✅ Métodos múltiples (efectivo, transferencia, tarjetas)
- ✅ Estadísticas de ingresos
- ✅ Pagos parciales y seguimiento

### Consultorios
- ✅ Múltiples ubicaciones
- ✅ Colores personalizados en calendario
- ✅ Sincronización con Google Maps

### Otras Características
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Diseño responsive y modo oscuro
- ✅ PWA instalable
- ✅ Modo offline con datos en localStorage

---

## Sistema de Permisos

### 👑 Administrador (Romina)
- Ver **todos** los turnos de todas las profesionales
- Crear turnos para cualquier profesional
- Editar/eliminar turnos de cualquier profesional
- Crear **eventos personales** que bloquean su agenda
- Marcar asistencias y registrar pagos
- Gestionar consultorios y configuración
- Acceso completo a todas las funcionalidades

### 👩‍⚕️ Profesional (Colegas)
- Ver **solo sus propios** turnos
- Crear turnos solo para sí mismas
- Editar/eliminar solo sus propios turnos
- Marcar asistencias de sus pacientes
- Registrar pagos de sus turnos
- Ver solo sus propios pacientes

### 📋 Secretaria
- Ver **todos** los turnos de todas las profesionales
- Marcar asistencias de todos los turnos
- Registrar pagos de todos los turnos
- **NO puede** crear/editar/eliminar turnos
- Acceso de solo lectura a pacientes

---

## Configuración Inicial

### 1. Prerrequisitos

- Node.js 18+ y npm
- Proyecto Firebase creado
- Cuenta de Google Cloud (para Google Calendar API)

### 2. Configurar Firebase

#### 2.1 Habilitar servicios en Firebase Console

1. **Firestore Database:**
   - Ve a Firestore Database > Create database
   - Modo: Production
   - Ubicación: us-central1 (Iowa) o nam5
   - Aplica las reglas de seguridad (ver más abajo)

2. **Authentication:**
   - Ve a Authentication > Get started
   - Sign-in method > Google > Enable
   - Configura email de soporte
   - **IMPORTANTE:** En "Authorized domains", agrega tu dominio de producción

3. **Registrar App Web:**
   - En la página principal, clic en icono Web (</>)
   - Nickname: dentify-web
   - Copia las credenciales de configuración

#### 2.2 Reglas de Firestore

**IMPORTANTE:** Estas reglas tienen en cuenta el sistema de roles de DENTIFY.

En Firestore > Rules, pega:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return signedIn() && request.auth.uid == userId;
    }

    function getUserRole() {
      return get(/databases/$(database)/documents/userProfiles/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return signedIn() && getUserRole() == 'administrador';
    }

    function isSecretary() {
      return signedIn() && getUserRole() == 'secretaria';
    }

    function isProfessional() {
      return signedIn() && getUserRole() == 'profesional';
    }

    // User Profiles
    match /userProfiles/{userId} {
      allow read: if signedIn();
      allow create: if signedIn() && request.auth.uid == userId;
      allow update: if isAdmin() || (isOwner(userId) && request.resource.data.role == resource.data.role);
      allow delete: if isAdmin();
    }

    // Patients
    match /patients/{id} {
      allow create: if signedIn() && (isAdmin() || isProfessional()) && request.resource.data.userId == request.auth.uid;
      allow read: if isAdmin() || isSecretary() || isOwner(resource.data.userId);
      allow update, delete: if isAdmin() || isOwner(resource.data.userId);
    }

    // Appointments
    match /appointments/{id} {
      allow create: if signedIn() && (isAdmin() || (isProfessional() && request.resource.data.userId == request.auth.uid));
      allow read: if isAdmin() || isSecretary() || isOwner(resource.data.userId);
      allow update: if isAdmin() || (signedIn() && isOwner(resource.data.userId));
      allow delete: if isAdmin() || isOwner(resource.data.userId);
    }

    // Offices
    match /offices/{id} {
      allow create: if isAdmin() && request.resource.data.userId == request.auth.uid;
      allow read: if signedIn();
      allow update, delete: if isAdmin() && isOwner(resource.data.userId);
    }

    // Payments
    match /payments/{id} {
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow read: if isAdmin() || isSecretary() || isOwner(resource.data.userId);
      allow update, delete: if isAdmin() || isOwner(resource.data.userId);
    }

    // Insurances
    match /insurances/{id} {
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if isOwner(resource.data.userId);
    }

    // Authorizations
    match /authorizations/{id} {
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if isOwner(resource.data.userId);
    }

    // Insurance Fees
    match /insurance-fees/{id} {
      allow read: if signedIn();
      allow write: if signedIn() && request.resource.data.userId == request.auth.uid;
    }

    // Medical History
    match /medicalHistory/{id} {
      allow create: if signedIn();
      allow read, update, delete: if signedIn();
    }

    // Blocked Slots
    match /blockedSlots/{id} {
      allow create: if isAdmin() && request.resource.data.userId == request.auth.uid;
      allow read: if signedIn();
      allow update, delete: if isAdmin() && isOwner(resource.data.userId);
    }
  }
}
```

#### 2.3 Índices Compuestos de Firestore

**IMPORTANTE:** Debes crear los siguientes índices compuestos:

1. **Appointments:**
   - Colección: `appointments`
   - Campos: `userId` (Ascending), `date` (Ascending)

2. **Payments:**
   - Colección: `payments`
   - Campos: `userId` (Ascending), `date` (Descending)

3. **Blocked Slots:**
   - Colección: `blockedSlots`
   - Campos: `userId` (Ascending), `date` (Ascending)

**Cómo crear índices:**
- Firebase Console > Firestore Database > Indexes > Create Index
- O espera a que aparezca el error con el link directo para crear el índice

### 3. Configurar Google Calendar API

1. **Google Cloud Console:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com)
   - Crea un proyecto nuevo o selecciona uno existente
   - Habilita "Google Calendar API"

2. **Configurar OAuth:**
   - Ve a "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`, `https://tu-dominio.com`
   - Authorized redirect URIs: (los que Firebase Auth genera automáticamente)
   - Copia el Client ID y Client Secret

3. **OAuth Consent Screen:**
   - Configura la pantalla de consentimiento
   - Agrega los scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`

### 4. Variables de Entorno

Crea `.env.local` en la raíz:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Google Calendar API (para el servidor)
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
```

### 5. Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrir en http://localhost:3000
```

### 6. Migración de Datos (Si vienes de Clinical)

Si ya tienes datos en Clinical, sigue la [Guía de Migración](MIGRATION.md) para actualizar tus datos a DENTIFY.

---

## Estructura del Proyecto

```
dentify/
├── src/
│   ├── app/                    # Rutas Next.js (App Router)
│   │   ├── dashboard/          # Dashboard principal
│   │   ├── patients/           # Gestión de pacientes
│   │   ├── agenda/             # Agenda semanal
│   │   ├── offices/            # Consultorios
│   │   ├── fees/               # Honorarios
│   │   └── login/              # Autenticación
│   ├── components/             # Componentes React
│   │   ├── appointments/       # Formularios de turnos
│   │   ├── dashboard/          # Componentes del dashboard
│   │   ├── patients/           # Componentes de pacientes
│   │   └── ui/                 # Componentes reutilizables
│   ├── contexts/               # React Context
│   │   ├── AuthContext.tsx     # Autenticación y roles
│   │   ├── AppointmentsContext.tsx  # Turnos
│   │   ├── PatientsContext.tsx      # Pacientes
│   │   ├── PaymentsContext.tsx      # Pagos
│   │   └── CalendarSyncContext.tsx  # Google Calendar
│   ├── lib/                    # Servicios y utilidades
│   │   ├── firebase.ts         # Configuración Firebase
│   │   ├── permissions.ts      # Sistema de permisos
│   │   ├── appointments.ts     # CRUD turnos
│   │   ├── patients.ts         # CRUD pacientes
│   │   └── payments.ts         # CRUD pagos
│   ├── hooks/                  # Custom hooks
│   │   └── usePermissions.ts   # Hook de permisos
│   ├── pages/api/              # API Routes (Next.js)
│   │   └── calendar/sync.ts    # Sincronización Calendar
│   └── types/                  # Tipos TypeScript
│       └── index.ts            # Tipos compartidos
├── public/                     # Archivos estáticos
│   ├── logo.svg                # Logo DENTIFY
│   ├── favicon.svg             # Favicon
│   └── manifest.json           # PWA manifest
├── MIGRATION.md                # Guía de migración
└── README.md                   # Este archivo
```

---

## Uso del Sistema

### Primera vez

1. Accede a la aplicación
2. Inicia sesión con Google (asegúrate de autorizar Google Calendar)
3. El sistema te asignará el rol "profesional" por defecto
4. **IMPORTANTE:** Ve a Firebase Console y actualiza manualmente:
   - Tu usuario → `role: "administrador"`
   - Usuario de secretaria → `role: "secretaria"`
   - Usuarios de colegas → `role: "profesional"`

### Como Administrador

1. **Crear turnos:**
   - Dashboard > "Nuevo Turno"
   - Selecciona el profesional (puedes elegir cualquiera)
   - Completa los datos del paciente
   - El turno se sincroniza automáticamente con Google Calendar

2. **Crear eventos personales:**
   - Dashboard > "Nuevo Turno"
   - Selecciona "Evento Personal" en el tipo
   - Agrega título y notas
   - Este evento bloqueará tu agenda pero no la de tus colegas

3. **Ver todos los turnos:**
   - Desde el dashboard verás todos los turnos de todas las profesionales
   - Puedes filtrar por profesional, estado o paciente

### Como Profesional

1. Solo verás tus propios turnos
2. Puedes crear, editar y eliminar solo tus turnos
3. Puedes registrar pagos de tus pacientes

### Como Secretaria

1. Verás todos los turnos de todas las profesionales
2. Puedes marcar asistencias (checkmark icon)
3. Puedes registrar pagos (dollar icon)
4. NO puedes crear, editar ni eliminar turnos

---

## Características Avanzadas

### Sincronización con Google Calendar

- **Automática:** Los turnos se sincronizan al crear/editar/eliminar
- **Colores:** Cada consultorio tiene su color en el calendario
- **Eventos personales:** Se marcan con 🔒 en Google Calendar
- **Renovación de token:** El sistema renueva automáticamente el token antes de que expire

### PWA (Progressive Web App)

- Instalable en dispositivos móviles y desktop
- Funciona offline con datos en cache
- Actualizaciones automáticas

### Modo Mock (Desarrollo)

Si no configuras Firebase, el sistema funciona con datos simulados en localStorage.

---

## Solución de Problemas

### Token de Google Calendar expirado

Si ves el banner de token expirado:
1. Haz clic en "Renovar ahora"
2. Autoriza nuevamente Google Calendar
3. El sistema guardará el nuevo token

### No puedo ver todos los turnos (siendo admin)

1. Verifica tu rol en Firebase Console → `userProfiles/[tu-uid]`
2. Debe ser `role: "administrador"`
3. Cierra sesión y vuelve a entrar

### Errores de permisos en Firestore

1. Verifica que las reglas de Firestore estén correctamente configuradas
2. Asegúrate de que tu usuario tenga un rol asignado
3. Revisa los logs de Firebase Console

---

## Próximas Mejoras

- [ ] Notificaciones push para recordatorios
- [ ] Exportación de reportes (PDF, Excel)
- [ ] Integración con sistemas de facturación
- [ ] Chat interno entre profesionales
- [ ] Videollamadas integradas

---

## Soporte

Para reportar problemas o sugerencias:
- GitHub Issues: [dentify/issues](https://github.com/tu-usuario/dentify/issues)
- Email: soporte@dentify.com

---

**Desarrollado con ❤️ por DGS Solutions**

**Licencia:** Privado - Uso exclusivo del consultorio
