# Clinic Pro

Sistema de gestión para consultorios médicos con agenda de turnos, pacientes, obras sociales y honorarios.

## Tecnologías

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Firebase (Authentication, Firestore)
- **Calendario:** react-big-calendar
- **Formularios:** react-hook-form + zod
- **Iconos:** lucide-react

## Características

- ✅ Autenticación con Google
- ✅ Gestión de pacientes (CRUD completo)
- ✅ Agenda de turnos con estados y recurrencia
- ✅ Gestión de obras sociales y autorizaciones
- ✅ Control de honorarios y métodos de pago
- ✅ Dashboard con estadísticas
- ✅ Diseño responsive y profesional

## Configuración inicial

### 1. Prerrequisitos

- Node.js 18+ y npm
- Proyecto Firebase creado

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

3. **Registrar App Web:**
   - En la página principal, clic en icono Web (</>)
   - Nickname: clinic-pro-web
   - Copia las credenciales de configuración

#### 2.2 Reglas de Firestore

En Firestore > Rules, pega:

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function isOwner(userId) { return signedIn() && request.auth.uid == userId; }

    match /userProfiles/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /patients/{id} {
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if isOwner(resource.data.userId);
    }
    match /appointments/{id} {
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if isOwner(resource.data.userId);
    }
    match /insurances/{id} {
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if isOwner(resource.data.userId);
    }
    match /authorizations/{id} {
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if isOwner(resource.data.userId);
    }
    match /insurance-fees/{id} {
      allow read: if signedIn();
      allow write: if signedIn() && request.resource.data.userId == request.auth.uid;
    }
    match /payments/{id} {
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if isOwner(resource.data.userId);
    }
    match /medicalHistory/{id} {
      allow create: if signedIn();
      allow read, update, delete: if signedIn();
    }
  }
}
\`\`\`

#### 2.3 Índices Compuestos de Firestore

**IMPORTANTE:** Debes crear los siguientes índices compuestos en Firestore para que las consultas funcionen correctamente:

1. **Appointments (turnos):**
   - Colección: `appointments`
   - Campos: `userId` (Ascending), `date` (Ascending)
   - [Crear índice en Firebase Console](https://console.firebase.google.com/project/_/firestore/indexes)

2. **Payments (pagos):**
   - Colección: `payments`
   - Campos: `userId` (Ascending), `date` (Descending)

3. **MedicalHistory (historial médico):**
   - Colección: `medicalHistory`
   - Campos: `patientId` (Ascending), `date` (Descending)

**Cómo crear índices:**
- Ve a Firebase Console > Firestore Database > Indexes
- Clic en "Create Index"
- Selecciona la colección y agrega los campos en el orden indicado
- Haz clic en "Create"

Alternativamente, cuando ejecutes la app por primera vez y se produzca un error de consulta, Firebase te mostrará un link directo para crear el índice necesario.

### 3. Variables de entorno

Crea el archivo `.env.local` en la raíz del proyecto:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
\`\`\`

Reemplaza los valores con los de tu proyecto Firebase.

### 4. Instalación

\`\`\`powershell
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrir en el navegador
# http://localhost:3000
\`\`\`

### 5. Compilar para producción

\`\`\`powershell
npm run build
npm start
\`\`\`

## Estructura del proyecto

\`\`\`
clinic-pro/
├── src/
│   ├── app/              # Rutas Next.js (App Router)
│   │   ├── dashboard/    # Dashboard principal
│   │   ├── patients/     # Módulo de pacientes
│   │   ├── agenda/       # Módulo de agenda/turnos
│   │   ├── insurances/   # Módulo obras sociales
│   │   └── fees/         # Módulo honorarios
│   ├── components/       # Componentes React
│   │   ├── dashboard/
│   │   ├── patients/
│   │   ├── agenda/
│   │   └── insurances/
│   ├── contexts/         # Context API (Auth)
│   ├── lib/              # Servicios y utilidades
│   │   ├── firebase.ts   # Configuración Firebase
│   │   ├── patients.ts   # CRUD pacientes
│   │   ├── appointments.ts  # CRUD turnos
│   │   ├── insurances.ts    # CRUD obras sociales
│   │   └── payments.ts      # CRUD pagos
│   └── types/            # Tipos TypeScript
├── public/               # Archivos estáticos
└── .env.local           # Variables de entorno (no subir a git)
\`\`\`

## Módulos

### Pacientes
- Datos personales completos
- Historial de consultas
- Información de contacto
- Obra social asociada

### Agenda
- Calendario visual mensual
- Estados: Pendiente, Confirmado, Cancelado, Completado
- Turnos recurrentes (semanal, mensual)
- Duración configurable por turno

### Obras Sociales
- Registro de obras sociales y prepagas
- Autorizaciones por paciente
- Aranceles diferenciados por servicio
- Seguimiento de sesiones autorizadas

### Honorarios
- Registro de pagos por turno
- Métodos: Efectivo, Transferencia, Tarjeta débito/crédito
- Estadísticas de ingresos
- Reportes por período

## Modo de desarrollo (Mock)

Si las variables de Firebase no están configuradas, la app funciona en **modo mock** con datos simulados. Los datos se persist en en localStorage, lo que significa que se mantendrán entre recargas de página. Útil para desarrollo sin backend.

### Mejoras de seguridad y calidad implementadas

✅ **Validación de datos con Zod:** Todos los datos de Firestore se validan con schemas Zod antes de usarse
✅ **Logging condicional:** Los console.logs solo aparecen en desarrollo, no en producción
✅ **Manejo correcto de fechas:** Las fechas y horas se combinan correctamente en el calendario
✅ **Persistencia en mock mode:** Los datos mock se guardan en localStorage
✅ **Error Boundaries:** Manejo de errores React para evitar crashes de la UI
✅ **Status de autorizaciones:** Calcula correctamente 'expired' y 'exhausted'
✅ **Upload de archivos:** UI completa para subir archivos de pacientes
✅ **Historial médico:** CRUD completo para historiales clínicos por paciente

## Paleta de colores

- Primary: #0F5257
- Primary Dark: #0B3142
- Secondary: #9C92A3
- Accent: #C6B9CD
- Light: #D6D3F0

## Próximas mejoras

- [ ] Subida de archivos adjuntos (requiere Firebase Storage o alternativa)
- [ ] Historial clínico detallado por paciente
- [ ] Reportes avanzados y gráficos
- [ ] Notificaciones por email/SMS
- [ ] Exportación de datos (PDF, Excel)
- [ ] Multi-usuario y roles

## Soporte

Para reportar problemas o sugerencias, contacta al desarrollador.

---

**Licencia:** Privado - Uso exclusivo del consultorio
