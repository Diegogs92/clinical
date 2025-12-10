# Guía de Migración - DENTIFY

## Migración de Clinical a DENTIFY

Esta guía te ayudará a migrar tus datos existentes de Clinical al nuevo sistema DENTIFY con roles y tipos de eventos.

---

## ⚡ Método Rápido (Recomendado)

Hemos creado scripts automatizados que facilitan todo el proceso:

```bash
# Opción 1: Setup interactivo (MÁS FÁCIL)
node scripts/setup.js

# Opción 2: Migración manual paso a paso
node scripts/migrate-users.js
node scripts/migrate-appointments.js
node scripts/verify-all.js
```

📖 **Ver documentación completa de scripts:** [scripts/README.md](scripts/README.md)

---

## 📝 Migración Manual (Alternativa)

Si prefieres migrar manualmente o entender el proceso en detalle, continúa leyendo.

---

## 1. Actualizar Perfiles de Usuario (UserProfiles)

Todos los perfiles de usuario necesitan tener un campo `role` asignado.

### Opción A: Migración Manual en Firebase Console

1. Ve a Firebase Console → Firestore
2. Abre la colección `userProfiles`
3. Para cada documento:
   - Agrega el campo: `role` (tipo: string)
   - Valores posibles:
     - `"administrador"` - Para Romina
     - `"profesional"` - Para las colegas
     - `"secretaria"` - Para la secretaria

### Opción B: Script de Migración (Recomendado)

Crea un archivo `scripts/migrate-users.js`:

```javascript
// scripts/migrate-users.js
const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json'))
});

const db = admin.firestore();

async function migrateUserProfiles() {
  const usersRef = db.collection('userProfiles');
  const snapshot = await usersRef.get();

  const batch = db.batch();

  snapshot.forEach((doc) => {
    const data = doc.data();

    // Si el usuario ya tiene rol, no hacer nada
    if (data.role) {
      console.log(`✓ Usuario ${data.email} ya tiene rol: ${data.role}`);
      return;
    }

    // Asignar rol por defecto: 'profesional'
    // IMPORTANTE: Debes cambiar esto manualmente para Romina y la secretaria
    const role = 'profesional';

    console.log(`Actualizando ${data.email} → ${role}`);
    batch.update(doc.ref, { role });
  });

  await batch.commit();
  console.log('✅ Migración completada');
}

migrateUserProfiles()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
```

**Pasos para ejecutar:**

```bash
# 1. Instalar Firebase Admin
npm install firebase-admin

# 2. Descargar Service Account Key desde Firebase Console
#    Settings → Service Accounts → Generate New Private Key
#    Guardar como scripts/serviceAccountKey.json

# 3. Ejecutar migración
node scripts/migrate-users.js
```

**IMPORTANTE:** Después de ejecutar el script, actualiza manualmente en Firebase Console:
- El usuario de Romina → `role: "administrador"`
- El usuario de la secretaria → `role: "secretaria"`

---

## 2. Actualizar Turnos Existentes (Appointments)

Todos los turnos existentes necesitan el campo `appointmentType`.

### Opción A: Migración Manual en Firebase Console

1. Ve a Firebase Console → Firestore
2. Abre la colección `appointments`
3. Para cada documento, agrega:
   - Campo: `appointmentType` (tipo: string)
   - Valor: `"patient"` (todos los turnos existentes son de pacientes)

### Opción B: Script de Migración (Recomendado)

```javascript
// scripts/migrate-appointments.js
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json'))
});

const db = admin.firestore();

async function migrateAppointments() {
  const appointmentsRef = db.collection('appointments');
  const snapshot = await appointmentsRef.get();

  const batch = db.batch();
  let count = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();

    // Si ya tiene appointmentType, saltar
    if (data.appointmentType) {
      console.log(`✓ Turno ${doc.id} ya tiene appointmentType`);
      return;
    }

    // Todos los turnos existentes son de tipo 'patient'
    console.log(`Actualizando turno ${doc.id} → appointmentType: patient`);
    batch.update(doc.ref, { appointmentType: 'patient' });
    count++;

    // Firestore batch tiene límite de 500 operaciones
    if (count % 500 === 0) {
      console.log(`Procesados ${count} turnos...`);
    }
  });

  await batch.commit();
  console.log(`✅ Migración completada: ${count} turnos actualizados`);
}

migrateAppointments()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
```

**Ejecutar:**
```bash
node scripts/migrate-appointments.js
```

---

## 3. Verificación Post-Migración

### Verificar Usuarios:

```javascript
// scripts/verify-users.js
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });

async function verifyUsers() {
  const snapshot = await admin.firestore().collection('userProfiles').get();

  console.log('\n=== USUARIOS ===\n');
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`${data.email}: ${data.role || '⚠️  SIN ROL'}`);
  });

  const withoutRole = snapshot.docs.filter(d => !d.data().role);
  if (withoutRole.length > 0) {
    console.log(`\n⚠️  ${withoutRole.length} usuarios sin rol`);
  } else {
    console.log('\n✅ Todos los usuarios tienen rol asignado');
  }
}

verifyUsers().then(() => process.exit(0));
```

### Verificar Turnos:

```javascript
// scripts/verify-appointments.js
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });

async function verifyAppointments() {
  const snapshot = await admin.firestore().collection('appointments').get();

  const withoutType = snapshot.docs.filter(d => !d.data().appointmentType);

  console.log('\n=== TURNOS ===\n');
  console.log(`Total: ${snapshot.size}`);
  console.log(`Con appointmentType: ${snapshot.size - withoutType.length}`);
  console.log(`Sin appointmentType: ${withoutType.length}`);

  if (withoutType.length > 0) {
    console.log('\n⚠️  Turnos sin appointmentType:');
    withoutType.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.patientName} (${data.date})`);
    });
  } else {
    console.log('\n✅ Todos los turnos tienen appointmentType');
  }
}

verifyAppointments().then(() => process.exit(0));
```

---

## 4. Configuración de Roles Inicial

Después de la migración, configura manualmente en Firebase Console:

### Usuario Administrador (Romina):
```json
{
  "role": "administrador",
  "displayName": "Romina",
  "email": "romina@ejemplo.com"
}
```

### Usuarios Profesionales (Colegas):
```json
{
  "role": "profesional",
  "displayName": "Nombre Colega",
  "email": "colega@ejemplo.com"
}
```

### Usuario Secretaria:
```json
{
  "role": "secretaria",
  "displayName": "Nombre Secretaria",
  "email": "secretaria@ejemplo.com"
}
```

---

## 5. Pruebas Post-Migración

1. **Login como cada rol:**
   - Administrador: Debe ver todos los turnos
   - Profesional: Solo sus propios turnos
   - Secretaria: Todos los turnos

2. **Permisos de creación:**
   - Administrador: Puede crear turnos para todos
   - Profesional: Solo para sí misma
   - Secretaria: No puede crear turnos

3. **Permisos de edición/eliminación:**
   - Administrador: Puede editar/eliminar todos
   - Profesional: Solo sus propios turnos
   - Secretaria: No puede editar/eliminar

4. **Eventos personales:**
   - Solo el administrador puede crear eventos personales
   - Se sincronizan correctamente con Google Calendar con icono 🔒

---

## 6. Rollback (En caso de problemas)

Si necesitas revertir los cambios:

```javascript
// scripts/rollback.js
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });

async function rollback() {
  const db = admin.firestore();

  // Eliminar campo 'role' de userProfiles
  const users = await db.collection('userProfiles').get();
  const userBatch = db.batch();
  users.forEach(doc => {
    userBatch.update(doc.ref, { role: admin.firestore.FieldValue.delete() });
  });
  await userBatch.commit();

  // Eliminar campo 'appointmentType' de appointments
  const appointments = await db.collection('appointments').get();
  const apptBatch = db.batch();
  appointments.forEach(doc => {
    apptBatch.update(doc.ref, { appointmentType: admin.firestore.FieldValue.delete() });
  });
  await apptBatch.commit();

  console.log('✅ Rollback completado');
}

rollback().then(() => process.exit(0));
```

---

## Contacto y Soporte

Si tienes problemas durante la migración, revisa:
- Los logs de Firebase Console
- Los errores en la consola del navegador
- Los mensajes de error específicos

¡Buena suerte con la migración a DENTIFY! 🦷⏰
