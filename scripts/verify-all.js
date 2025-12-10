/**
 * Script de Verificación General - DENTIFY
 *
 * Verifica el estado de la migración completa de Clinical a DENTIFY
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
try {
  const serviceAccount = require('./serviceAccountKey.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('✅ Firebase Admin SDK inicializado correctamente\n');
} catch (error) {
  console.error('❌ Error al inicializar Firebase Admin SDK:');
  console.error('   Asegúrate de tener el archivo serviceAccountKey.json en la carpeta scripts/\n');
  process.exit(1);
}

const db = admin.firestore();

// Función para formatear fecha
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR');
  } catch {
    return dateStr;
  }
}

// Verificar usuarios
async function verifyUsers() {
  console.log('👥 VERIFICANDO USUARIOS...\n');

  const snapshot = await db.collection('userProfiles').get();

  if (snapshot.empty) {
    console.log('   ⚠️  No hay usuarios registrados\n');
    return { hasIssues: true, stats: {} };
  }

  const roleCount = {
    administrador: 0,
    profesional: 0,
    secretaria: 0,
    undefined: 0
  };

  const usersWithoutRole = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const role = data.role || 'undefined';
    roleCount[role] = (roleCount[role] || 0) + 1;

    if (!data.role) {
      usersWithoutRole.push(data.email);
    }
  });

  console.log(`   Total: ${snapshot.size} usuarios`);
  console.log(`   👑 Administradores: ${roleCount.administrador}`);
  console.log(`   👩‍⚕️ Profesionales: ${roleCount.profesional}`);
  console.log(`   📋 Secretarias: ${roleCount.secretaria}`);

  let hasIssues = false;

  if (roleCount.undefined > 0) {
    console.log(`   ❌ Sin rol: ${roleCount.undefined}`);
    console.log(`\n   Usuarios sin rol:`);
    usersWithoutRole.forEach(email => console.log(`      - ${email}`));
    hasIssues = true;
  }

  if (roleCount.administrador === 0) {
    console.log(`\n   ⚠️  No hay administrador asignado`);
    console.log(`      Recuerda asignar rol "administrador" a Romina en Firebase Console`);
    hasIssues = true;
  } else if (roleCount.administrador > 1) {
    console.log(`\n   ⚠️  Hay ${roleCount.administrador} administradores (normalmente debería ser solo 1)`);
  }

  console.log('');

  return {
    hasIssues,
    stats: {
      total: snapshot.size,
      ...roleCount
    }
  };
}

// Verificar turnos
async function verifyAppointments() {
  console.log('📅 VERIFICANDO TURNOS...\n');

  const snapshot = await db.collection('appointments').get();

  if (snapshot.empty) {
    console.log('   ⚠️  No hay turnos registrados\n');
    return { hasIssues: false, stats: {} };
  }

  const typeCount = {
    patient: 0,
    personal: 0,
    undefined: 0
  };

  const appointmentsWithoutType = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const type = data.appointmentType || 'undefined';
    typeCount[type] = (typeCount[type] || 0) + 1;

    if (!data.appointmentType) {
      appointmentsWithoutType.push({
        patient: data.patientName,
        date: data.date
      });
    }
  });

  console.log(`   Total: ${snapshot.size} turnos`);
  console.log(`   👤 Turnos de pacientes: ${typeCount.patient}`);
  console.log(`   🔒 Eventos personales: ${typeCount.personal}`);

  let hasIssues = false;

  if (typeCount.undefined > 0) {
    console.log(`   ❌ Sin tipo: ${typeCount.undefined}`);
    console.log(`\n   Ejemplos de turnos sin appointmentType:`);
    appointmentsWithoutType.slice(0, 5).forEach(apt => {
      console.log(`      - ${apt.patient} (${formatDate(apt.date)})`);
    });
    if (appointmentsWithoutType.length > 5) {
      console.log(`      ... y ${appointmentsWithoutType.length - 5} más`);
    }
    hasIssues = true;
  }

  const migrationPercentage = ((typeCount.patient + typeCount.personal) / snapshot.size * 100).toFixed(1);
  console.log(`\n   📈 Progreso: ${migrationPercentage}%`);

  console.log('');

  return {
    hasIssues,
    stats: {
      total: snapshot.size,
      ...typeCount,
      percentage: migrationPercentage
    }
  };
}

// Verificar otras colecciones
async function verifyOtherCollections() {
  console.log('📊 VERIFICANDO OTRAS COLECCIONES...\n');

  const collections = [
    { name: 'patients', displayName: 'Pacientes' },
    { name: 'offices', displayName: 'Consultorios' },
    { name: 'payments', displayName: 'Pagos' },
    { name: 'insurances', displayName: 'Obras Sociales' },
    { name: 'blockedSlots', displayName: 'Franjas Bloqueadas' }
  ];

  const stats = {};

  for (const col of collections) {
    const snapshot = await db.collection(col.name).get();
    stats[col.name] = snapshot.size;
    console.log(`   ${col.displayName}: ${snapshot.size}`);
  }

  console.log('');

  return { stats };
}

// Verificación completa
async function verifyAll() {
  console.log('=================================================');
  console.log('   VERIFICACIÓN COMPLETA - DENTIFY');
  console.log('=================================================\n');

  try {
    const userResults = await verifyUsers();
    const appointmentResults = await verifyAppointments();
    const otherResults = await verifyOtherCollections();

    // Resumen final
    console.log('=================================================');
    console.log('   RESUMEN FINAL');
    console.log('=================================================\n');

    const allGood = !userResults.hasIssues && !appointmentResults.hasIssues;

    if (allGood) {
      console.log('✅ ¡Migración completada exitosamente!\n');
      console.log('   Todos los usuarios tienen roles asignados');
      console.log('   Todos los turnos tienen appointmentType\n');
      console.log('   El sistema DENTIFY está listo para usar 🦷⏰\n');
    } else {
      console.log('⚠️  Hay problemas que requieren atención:\n');

      if (userResults.hasIssues) {
        console.log('   ❌ Usuarios: Ejecuta "node migrate-users.js"');
      } else {
        console.log('   ✅ Usuarios: OK');
      }

      if (appointmentResults.hasIssues) {
        console.log('   ❌ Turnos: Ejecuta "node migrate-appointments.js"');
      } else {
        console.log('   ✅ Turnos: OK');
      }

      console.log('');
    }

    // Estadísticas
    console.log('📈 ESTADÍSTICAS:');
    console.log(`   Usuarios totales: ${userResults.stats.total || 0}`);
    console.log(`   Turnos totales: ${appointmentResults.stats.total || 0}`);
    console.log(`   Pacientes: ${otherResults.stats.patients || 0}`);
    console.log(`   Consultorios: ${otherResults.stats.offices || 0}`);
    console.log(`   Pagos: ${otherResults.stats.payments || 0}\n`);

    console.log('=================================================\n');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Ejecutar verificación
verifyAll().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
