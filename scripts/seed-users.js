/**
 * Seed de usuarios base para DENTIFY
 *
 * Crea/actualiza cuentas Auth y documentos userProfiles con roles:
 * - Romina (administrador)
 * - Secretaria (secretaria)
 * - 3 colegas (profesional)
 *
 * Requiere:
 * - serviceAccountKey.json en scripts/
 * - firebase-admin instalado
 *
 * Uso:
 *   node scripts/seed-users.js
 */

const admin = require('firebase-admin');

try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✓ Firebase Admin inicializado');
} catch (err) {
  console.error('✗ No se pudo inicializar Firebase Admin. Asegúrate de tener scripts/serviceAccountKey.json');
  process.exit(1);
}

const db = admin.firestore();

const SEED_DOMAIN = 'dentify.local';

const SEED_USERS = [
  {
    username: 'romina',
    password: 'Dentify2025*',
    displayName: 'Romina Administradora',
    role: 'administrador',
  },
  {
    username: 'secretaria',
    password: 'Dentify2025*',
    displayName: 'Secretaria Consultorio',
    role: 'secretaria',
  },
  {
    username: 'colega1',
    password: 'Dentify2025*',
    displayName: 'Colega 1',
    role: 'profesional',
  },
  {
    username: 'colega2',
    password: 'Dentify2025*',
    displayName: 'Colega 2',
    role: 'profesional',
  },
  {
    username: 'colega3',
    password: 'Dentify2025*',
    displayName: 'Colega 3',
    role: 'profesional',
  },
];

async function upsertUser(userSeed) {
  const { username, password, displayName, role } = userSeed;
  const email = `${username}@${SEED_DOMAIN}`;

  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(userRecord.uid, {
      displayName,
      password,
    });
    console.log(`✓ Usuario actualizado: ${email}`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
      });
      console.log(`✓ Usuario creado: ${email}`);
    } else {
      throw err;
    }
  }

  const profileRef = db.collection('userProfiles').doc(userRecord.uid);
  await profileRef.set(
    {
      uid: userRecord.uid,
      email,
      username,
      displayName,
      role,
      defaultAppointmentDuration: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(`  → Perfil asignado: ${role}`);
}

async function main() {
  for (const user of SEED_USERS) {
    try {
      await upsertUser(user);
    } catch (err) {
      console.error(`✗ Error con ${user.email}:`, err.message);
    }
  }
  console.log('\nListo. Cambia las contraseñas luego de la primera sesión.');
  process.exit(0);
}

main().catch((err) => {
  console.error('✗ Error general:', err);
  process.exit(1);
});
