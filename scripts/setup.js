/**
 * Script de Setup - DENTIFY
 *
 * Guía interactiva para configurar y migrar a DENTIFY
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function printHeader(text) {
  console.log('\n' + '='.repeat(50));
  console.log('   ' + text);
  console.log('='.repeat(50) + '\n');
}

function printSuccess(text) {
  console.log('✅ ' + text);
}

function printWarning(text) {
  console.log('⚠️  ' + text);
}

function printError(text) {
  console.log('❌ ' + text);
}

function printInfo(text) {
  console.log('ℹ️  ' + text);
}

async function checkServiceAccountKey() {
  const keyPath = path.join(__dirname, 'serviceAccountKey.json');

  if (fs.existsSync(keyPath)) {
    printSuccess('Service Account Key encontrado');
    return true;
  }

  printWarning('Service Account Key NO encontrado');
  console.log('\nPara continuar, necesitas descargar el Service Account Key:\n');
  console.log('1. Ve a Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click en "Generate New Private Key"');
  console.log('3. Guarda el archivo como: scripts/serviceAccountKey.json\n');

  return false;
}

async function checkFirebaseAdmin() {
  try {
    require.resolve('firebase-admin');
    printSuccess('Firebase Admin SDK instalado');
    return true;
  } catch {
    printWarning('Firebase Admin SDK NO instalado');
    console.log('\nInstalando Firebase Admin SDK...\n');

    try {
      execSync('npm install firebase-admin', { stdio: 'inherit' });
      printSuccess('Firebase Admin SDK instalado correctamente');
      return true;
    } catch (error) {
      printError('Error al instalar Firebase Admin SDK');
      console.log('Por favor, ejecuta manualmente: npm install firebase-admin\n');
      return false;
    }
  }
}

async function runMigrationUsers() {
  printHeader('MIGRACIÓN DE USUARIOS');

  const shouldRun = await question('¿Deseas migrar usuarios ahora? (s/n): ');

  if (shouldRun.toLowerCase() === 's' || shouldRun.toLowerCase() === 'si') {
    console.log('\nEjecutando migración de usuarios...\n');

    try {
      execSync('node scripts/migrate-users.js', { stdio: 'inherit' });
      printSuccess('Migración de usuarios completada');

      console.log('\n⚠️  RECORDATORIO IMPORTANTE:');
      console.log('Ve a Firebase Console y actualiza manualmente:');
      console.log('  - Romina → role: "administrador"');
      console.log('  - Secretaria → role: "secretaria"\n');

      const updated = await question('¿Ya actualizaste los roles en Firebase Console? (s/n): ');
      return updated.toLowerCase() === 's' || updated.toLowerCase() === 'si';
    } catch (error) {
      printError('Error durante la migración de usuarios');
      return false;
    }
  }

  return false;
}

async function runMigrationAppointments() {
  printHeader('MIGRACIÓN DE TURNOS');

  const shouldRun = await question('¿Deseas migrar turnos ahora? (s/n): ');

  if (shouldRun.toLowerCase() === 's' || shouldRun.toLowerCase() === 'si') {
    console.log('\nEjecutando migración de turnos...\n');

    try {
      execSync('node scripts/migrate-appointments.js', { stdio: 'inherit' });
      printSuccess('Migración de turnos completada');
      return true;
    } catch (error) {
      printError('Error durante la migración de turnos');
      return false;
    }
  }

  return false;
}

async function runVerification() {
  printHeader('VERIFICACIÓN FINAL');

  console.log('Ejecutando verificación completa...\n');

  try {
    execSync('node scripts/verify-all.js', { stdio: 'inherit' });
    return true;
  } catch (error) {
    printError('Error durante la verificación');
    return false;
  }
}

async function showNextSteps() {
  printHeader('PRÓXIMOS PASOS');

  console.log('✅ Migración completada. Ahora puedes:\n');
  console.log('1. Actualizar las reglas de Firestore:');
  console.log('   - Copia las reglas del README.md');
  console.log('   - Ve a Firebase Console > Firestore > Rules');
  console.log('   - Pega y publica las nuevas reglas\n');

  console.log('2. Crear índices compuestos en Firestore:');
  console.log('   - appointments: userId (Asc) + date (Asc)');
  console.log('   - payments: userId (Asc) + date (Desc)');
  console.log('   - blockedSlots: userId (Asc) + date (Asc)\n');

  console.log('3. Iniciar la aplicación:');
  console.log('   npm run dev\n');

  console.log('4. Probar el sistema:');
  console.log('   - Login como administrador → debería ver todos los turnos');
  console.log('   - Login como profesional → solo sus propios turnos');
  console.log('   - Login como secretaria → todos los turnos, sin editar\n');

  console.log('🦷⏰ ¡Bienvenido a DENTIFY!\n');
}

async function main() {
  console.clear();

  printHeader('SETUP DE DENTIFY');

  console.log('Este asistente te guiará para migrar de Clinical a DENTIFY.\n');

  // Paso 1: Verificar requisitos
  printInfo('Verificando requisitos...\n');

  const hasFirebaseAdmin = await checkFirebaseAdmin();
  const hasServiceKey = await checkServiceAccountKey();

  if (!hasFirebaseAdmin || !hasServiceKey) {
    console.log('\n❌ Faltan requisitos. Por favor, completa los pasos indicados arriba.\n');
    rl.close();
    process.exit(1);
  }

  console.log('');

  // Paso 2: Migración
  const answer = await question('¿Deseas continuar con la migración? (s/n): ');

  if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'si') {
    console.log('\nMigración cancelada. Puedes ejecutar este script nuevamente cuando estés listo.\n');
    rl.close();
    process.exit(0);
  }

  // Migrar usuarios
  const usersMigrated = await runMigrationUsers();

  if (!usersMigrated) {
    console.log('\n⚠️  La migración de usuarios no se completó correctamente.');
    const shouldContinue = await question('¿Deseas continuar de todos modos? (s/n): ');

    if (shouldContinue.toLowerCase() !== 's' && shouldContinue.toLowerCase() !== 'si') {
      console.log('\nMigración cancelada.\n');
      rl.close();
      process.exit(0);
    }
  }

  // Migrar turnos
  await runMigrationAppointments();

  // Verificación final
  await runVerification();

  // Próximos pasos
  await showNextSteps();

  rl.close();
  process.exit(0);
}

// Manejar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n❌ Migración cancelada por el usuario.\n');
  rl.close();
  process.exit(0);
});

main().catch(error => {
  console.error('\n❌ Error fatal:', error.message);
  rl.close();
  process.exit(1);
});
