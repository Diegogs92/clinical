/**
 * Script de Migración de Turnos - DENTIFY
 *
 * Este script agrega el campo 'appointmentType' a todos los turnos en Firestore.
 * Por defecto asigna 'patient' a todos los turnos existentes.
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Configuración
const DEFAULT_TYPE = 'patient';
const BATCH_SIZE = 500; // Límite de Firestore para operaciones batch

// Inicializar Firebase Admin SDK
try {
  const serviceAccount = require('./serviceAccountKey.json');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

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

// Función para formatear fecha
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR');
  } catch {
    return dateStr;
  }
}

// Función principal de migración
async function migrateAppointments() {
  console.log('=================================================');
  console.log('   MIGRACIÓN DE TURNOS A DENTIFY');
  console.log('=================================================\n');

  try {
    // Obtener todos los turnos
    const appointmentsRef = db.collection('appointments');
    const snapshot = await appointmentsRef.get();

    if (snapshot.empty) {
      console.log('⚠️  No se encontraron turnos en la colección appointments');
      console.log('   No hay nada que migrar.\n');
      return;
    }

    console.log(`📊 Se encontraron ${snapshot.size} turnos\n`);

    // Analizar estado actual
    const appointmentsWithType = [];
    const appointmentsWithoutType = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.appointmentType) {
        appointmentsWithType.push({ id: doc.id, ...data });
      } else {
        appointmentsWithoutType.push({ id: doc.id, ...data });
      }
    });

    // Mostrar resumen
    console.log('📋 Resumen:');
    console.log(`   - Turnos con appointmentType: ${appointmentsWithType.length}`);
    console.log(`   - Turnos sin appointmentType: ${appointmentsWithoutType.length}\n`);

    if (appointmentsWithType.length > 0) {
      console.log('✅ Ejemplos de turnos que YA tienen appointmentType:');
      appointmentsWithType.slice(0, 3).forEach(apt => {
        console.log(`   - ${apt.patientName || 'Sin nombre'} (${formatDate(apt.date)}) → ${apt.appointmentType}`);
      });
      if (appointmentsWithType.length > 3) {
        console.log(`   ... y ${appointmentsWithType.length - 3} más`);
      }
      console.log('');
    }

    if (appointmentsWithoutType.length === 0) {
      console.log('✅ Todos los turnos ya tienen appointmentType asignado. No hay nada que migrar.\n');
      return;
    }

    console.log('⚠️  Turnos que necesitan appointmentType:');
    console.log(`   Se asignará "${DEFAULT_TYPE}" a ${appointmentsWithoutType.length} turnos`);
    console.log('\n   Ejemplos:');
    appointmentsWithoutType.slice(0, 5).forEach(apt => {
      console.log(`   - ${apt.patientName || 'Sin nombre'} (${formatDate(apt.date)}) → se asignará "${DEFAULT_TYPE}"`);
    });
    if (appointmentsWithoutType.length > 5) {
      console.log(`   ... y ${appointmentsWithoutType.length - 5} más`);
    }
    console.log('');

    // Confirmar antes de ejecutar
    const shouldProceed = await confirm('¿Deseas continuar con la migración? (s/n): ');

    if (!shouldProceed) {
      console.log('\n❌ Migración cancelada por el usuario.\n');
      return;
    }

    console.log('\n🔄 Iniciando migración...\n');

    // Procesar en lotes (batches) para no exceder el límite de Firestore
    let totalUpdated = 0;
    let batchCount = 0;

    for (let i = 0; i < appointmentsWithoutType.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const currentBatch = appointmentsWithoutType.slice(i, i + BATCH_SIZE);

      currentBatch.forEach((apt) => {
        const aptRef = db.collection('appointments').doc(apt.id);
        batch.update(aptRef, {
          appointmentType: DEFAULT_TYPE,
          updatedAt: new Date().toISOString()
        });
        totalUpdated++;
      });

      await batch.commit();
      batchCount++;

      const progress = Math.min(i + BATCH_SIZE, appointmentsWithoutType.length);
      console.log(`   ✓ Batch ${batchCount} completado: ${progress}/${appointmentsWithoutType.length} turnos procesados`);
    }

    console.log(`\n✅ Migración completada exitosamente!`);
    console.log(`   ${totalUpdated} turnos actualizados con appointmentType "${DEFAULT_TYPE}"`);
    console.log(`   Procesados en ${batchCount} lote(s)\n`);

    // Información adicional
    console.log('=================================================');
    console.log('ℹ️  INFORMACIÓN:');
    console.log('=================================================\n');
    console.log('Todos los turnos existentes se han marcado como "patient" (turnos de pacientes).\n');
    console.log('A partir de ahora:');
    console.log('  • Los turnos de pacientes tendrán appointmentType: "patient"');
    console.log('  • Los eventos personales (solo para admin) tendrán appointmentType: "personal"\n');
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
    const snapshot = await db.collection('appointments').get();

    if (snapshot.empty) {
      console.log('⚠️  No hay turnos para verificar\n');
      return;
    }

    const typeCount = {
      patient: 0,
      personal: 0,
      undefined: 0
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      const type = data.appointmentType || 'undefined';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    console.log('📊 Estado actual de turnos:\n');
    console.log(`   Total de turnos: ${snapshot.size}`);
    console.log(`   👤 Turnos de pacientes: ${typeCount.patient}`);
    console.log(`   🔒 Eventos personales: ${typeCount.personal}`);
    if (typeCount.undefined > 0) {
      console.log(`   ❌ Sin tipo asignado: ${typeCount.undefined}`);
    }
    console.log('');

    // Validaciones
    if (typeCount.undefined > 0) {
      console.log('⚠️  ADVERTENCIA: Algunos turnos no tienen appointmentType');
      console.log('   Ejecuta el script de migración nuevamente\n');

      // Mostrar ejemplos de turnos sin tipo
      console.log('   Ejemplos de turnos sin appointmentType:');
      let count = 0;
      snapshot.forEach(doc => {
        if (!doc.data().appointmentType && count < 5) {
          const data = doc.data();
          console.log(`   - ${data.patientName || 'Sin nombre'} (${formatDate(data.date)})`);
          count++;
        }
      });
      console.log('');
    } else {
      console.log('✅ Todos los turnos tienen appointmentType asignado\n');
    }

    // Calcular porcentaje
    if (snapshot.size > 0) {
      const percentage = ((typeCount.patient + typeCount.personal) / snapshot.size * 100).toFixed(1);
      console.log(`📈 Progreso de migración: ${percentage}%\n`);
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  }
}

// Función para revertir migración (rollback)
async function rollbackMigration() {
  console.log('\n=================================================');
  console.log('   ROLLBACK DE MIGRACIÓN');
  console.log('=================================================\n');

  console.log('⚠️  ADVERTENCIA: Esta acción eliminará el campo appointmentType de TODOS los turnos\n');

  const shouldProceed = await confirm('¿Estás seguro de que deseas revertir la migración? (s/n): ');

  if (!shouldProceed) {
    console.log('\n❌ Rollback cancelado.\n');
    return;
  }

  try {
    const snapshot = await db.collection('appointments').get();

    if (snapshot.empty) {
      console.log('⚠️  No hay turnos para revertir\n');
      return;
    }

    console.log(`🔄 Revirtiendo ${snapshot.size} turnos...\n`);

    let totalReverted = 0;
    let batchCount = 0;

    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const currentBatch = docs.slice(i, i + BATCH_SIZE);

      currentBatch.forEach((doc) => {
        batch.update(doc.ref, {
          appointmentType: admin.firestore.FieldValue.delete()
        });
        totalReverted++;
      });

      await batch.commit();
      batchCount++;

      const progress = Math.min(i + BATCH_SIZE, docs.length);
      console.log(`   ✓ Batch ${batchCount} completado: ${progress}/${docs.length} turnos procesados`);
    }

    console.log(`\n✅ Rollback completado: ${totalReverted} turnos revertidos\n`);

  } catch (error) {
    console.error('❌ Error durante el rollback:', error.message);
    process.exit(1);
  }
}

// Menú principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--verify' || command === '-v') {
    await verifyMigration();
  } else if (command === '--rollback' || command === '-r') {
    await rollbackMigration();
  } else if (command === '--help' || command === '-h') {
    console.log('\nUso:');
    console.log('  node migrate-appointments.js              Ejecutar migración');
    console.log('  node migrate-appointments.js --verify     Verificar estado actual');
    console.log('  node migrate-appointments.js --rollback   Revertir migración');
    console.log('  node migrate-appointments.js --help       Mostrar esta ayuda\n');
  } else {
    await migrateAppointments();

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
