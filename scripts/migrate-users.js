/**
 * Script de Migración de Usuarios - DENTIFY
 *
 * Este script agrega el campo 'role' a todos los usuarios en Firestore.
 * Por defecto asigna 'profesional' a todos los usuarios.
 *
 * IMPORTANTE: Después de ejecutar este script, debes actualizar manualmente
 * en Firebase Console los roles de:
 * - Romina → 'administrador'
 * - Secretaria → 'secretaria'
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Configuración
const DEFAULT_ROLE = 'profesional';

// Inicializar Firebase Admin SDK
try {
  const serviceAccount = require('./serviceAccountKey.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('✅ Firebase Admin SDK inicializado correctamente\n');
} catch (error) {
  console.error('❌ Error al inicializar Firebase Admin SDK:');
  console.error('   Asegúrate de tener el archivo serviceAccountKey.json en la carpeta scripts/');
  console.error('   Puedes descargarlo desde Firebase Console > Project Settings > Service Accounts\n');
  process.exit(1);
}

const db = admin.firestore();

// Función para confirmar antes de ejecutar
async function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 's' || answer.toLowerCase() === 'si');
    });
  });
}

// Función principal de migración
async function migrateUserProfiles() {
  console.log('=================================================');
  console.log('   MIGRACIÓN DE USUARIOS A DENTIFY');
  console.log('=================================================\n');

  try {
    // Obtener todos los perfiles de usuario
    const usersRef = db.collection('userProfiles');
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log('⚠️  No se encontraron usuarios en la colección userProfiles');
      console.log('   El sistema creará perfiles automáticamente cuando los usuarios inicien sesión.\n');
      return;
    }

    console.log(`📊 Se encontraron ${snapshot.size} usuarios\n`);

    // Analizar estado actual
    const usersWithRole = [];
    const usersWithoutRole = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.role) {
        usersWithRole.push({ id: doc.id, ...data });
      } else {
        usersWithoutRole.push({ id: doc.id, ...data });
      }
    });

    // Mostrar resumen
    console.log('📋 Resumen:');
    console.log(`   - Usuarios con rol: ${usersWithRole.length}`);
    console.log(`   - Usuarios sin rol: ${usersWithoutRole.length}\n`);

    if (usersWithRole.length > 0) {
      console.log('✅ Usuarios que YA tienen rol asignado:');
      usersWithRole.forEach(user => {
        console.log(`   - ${user.displayName || user.email} → ${user.role}`);
      });
      console.log('');
    }

    if (usersWithoutRole.length === 0) {
      console.log('✅ Todos los usuarios ya tienen rol asignado. No hay nada que migrar.\n');
      return;
    }

    console.log('⚠️  Usuarios que necesitan rol:');
    usersWithoutRole.forEach(user => {
      console.log(`   - ${user.displayName || user.email} → se asignará "${DEFAULT_ROLE}"`);
    });
    console.log('');

    // Confirmar antes de ejecutar
    const shouldProceed = await confirm('¿Deseas continuar con la migración? (s/n): ');

    if (!shouldProceed) {
      console.log('\n❌ Migración cancelada por el usuario.\n');
      return;
    }

    console.log('\n🔄 Iniciando migración...\n');

    // Usar batch para actualizaciones eficientes
    const batch = db.batch();
    let updateCount = 0;

    usersWithoutRole.forEach((user) => {
      const userRef = db.collection('userProfiles').doc(user.id);
      batch.update(userRef, {
        role: DEFAULT_ROLE,
        updatedAt: new Date().toISOString()
      });
      updateCount++;
      console.log(`   ✓ ${user.displayName || user.email} → ${DEFAULT_ROLE}`);
    });

    // Commit de cambios
    await batch.commit();

    console.log(`\n✅ Migración completada exitosamente!`);
    console.log(`   ${updateCount} usuarios actualizados con rol "${DEFAULT_ROLE}"\n`);

    // Recordatorio importante
    console.log('=================================================');
    console.log('⚠️  IMPORTANTE - PRÓXIMOS PASOS:');
    console.log('=================================================\n');
    console.log('Ahora debes actualizar manualmente en Firebase Console:\n');
    console.log('1. Ve a Firebase Console > Firestore > userProfiles');
    console.log('2. Busca y actualiza los siguientes usuarios:\n');
    console.log('   📌 Romina (administradora):');
    console.log('      → Cambia role de "profesional" a "administrador"\n');
    console.log('   📌 Secretaria:');
    console.log('      → Cambia role de "profesional" a "secretaria"\n');
    console.log('   📌 Colegas:');
    console.log('      → Deja role como "profesional" (ya está correcto)\n');
    console.log('=================================================\n');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    console.error('   Detalles:', error);
    process.exit(1);
  }
}

// Función de verificación post-migración
async function verifyMigration() {
  console.log('\n=================================================');
  console.log('   VERIFICACIÓN DE MIGRACIÓN');
  console.log('=================================================\n');

  try {
    const snapshot = await db.collection('userProfiles').get();

    if (snapshot.empty) {
      console.log('⚠️  No hay usuarios para verificar\n');
      return;
    }

    console.log('📊 Estado actual de usuarios:\n');

    const roleCount = {
      administrador: 0,
      profesional: 0,
      secretaria: 0,
      undefined: 0
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      const role = data.role || 'undefined';
      roleCount[role] = (roleCount[role] || 0) + 1;

      const roleEmoji = {
        'administrador': '👑',
        'profesional': '👩‍⚕️',
        'secretaria': '📋',
        'undefined': '❓'
      };

      console.log(`   ${roleEmoji[role] || '?'} ${data.displayName || data.email}`);
      console.log(`      → Rol: ${role}`);
      console.log(`      → Email: ${data.email}`);
      console.log('');
    });

    console.log('📈 Resumen por rol:');
    console.log(`   👑 Administradores: ${roleCount.administrador}`);
    console.log(`   👩‍⚕️ Profesionales: ${roleCount.profesional}`);
    console.log(`   📋 Secretarias: ${roleCount.secretaria}`);
    if (roleCount.undefined > 0) {
      console.log(`   ❌ Sin rol asignado: ${roleCount.undefined}`);
    }
    console.log('');

    // Validaciones
    if (roleCount.undefined > 0) {
      console.log('⚠️  ADVERTENCIA: Algunos usuarios no tienen rol asignado');
      console.log('   Ejecuta el script de migración nuevamente\n');
    }

    if (roleCount.administrador === 0) {
      console.log('⚠️  ADVERTENCIA: No hay ningún administrador asignado');
      console.log('   Recuerda actualizar el rol de Romina a "administrador" en Firebase Console\n');
    } else if (roleCount.administrador > 1) {
      console.log('⚠️  ADVERTENCIA: Hay más de un administrador');
      console.log('   Verifica que sea correcto\n');
    } else {
      console.log('✅ Configuración de administrador correcta\n');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  }
}

// Menú principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--verify' || command === '-v') {
    await verifyMigration();
  } else if (command === '--help' || command === '-h') {
    console.log('\nUso:');
    console.log('  node migrate-users.js           Ejecutar migración');
    console.log('  node migrate-users.js --verify  Verificar estado actual');
    console.log('  node migrate-users.js --help    Mostrar esta ayuda\n');
  } else {
    await migrateUserProfiles();

    // Preguntar si quiere verificar
    const shouldVerify = await confirm('\n¿Deseas verificar el resultado de la migración? (s/n): ');
    if (shouldVerify) {
      await verifyMigration();
    }
  }

  process.exit(0);
}

// Ejecutar script
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
