/**
 * Script de diagnóstico para verificar la configuración OAuth de Google
 * Verifica las credenciales en las variables de entorno y Firebase
 */

const https = require('https');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

async function checkOAuthClient(clientId) {
  return new Promise((resolve) => {
    const url = `https://www.googleapis.com/oauth2/v3/tokeninfo?client_id=${clientId}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ valid: true, data: JSON.parse(data) });
        } else {
          resolve({ valid: false, statusCode: res.statusCode, error: data });
        }
      });
    }).on('error', (err) => {
      resolve({ valid: false, error: err.message });
    });
  });
}

async function checkFirebaseAuthConfig() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  return new Promise((resolve) => {
    const url = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/config?key=${apiKey}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const config = JSON.parse(data);
          resolve({ valid: true, config });
        } else {
          resolve({ valid: false, statusCode: res.statusCode, error: data });
        }
      });
    }).on('error', (err) => {
      resolve({ valid: false, error: err.message });
    });
  });
}

async function main() {
  logSection('🔍 DIAGNÓSTICO DE CONFIGURACIÓN OAUTH');

  // 1. Verificar variables de entorno
  logSection('1. Variables de Entorno (.env.local)');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  if (clientId) {
    log(`✓ GOOGLE_CLIENT_ID: ${clientId}`, 'green');
  } else {
    log('✗ GOOGLE_CLIENT_ID: NO CONFIGURADO', 'red');
  }

  if (clientSecret) {
    log(`✓ GOOGLE_CLIENT_SECRET: ${clientSecret.substring(0, 15)}...`, 'green');
  } else {
    log('✗ GOOGLE_CLIENT_SECRET: NO CONFIGURADO', 'red');
  }

  if (calendarId) {
    log(`✓ GOOGLE_CALENDAR_ID: ${calendarId}`, 'green');
  } else {
    log('✗ GOOGLE_CALENDAR_ID: NO CONFIGURADO', 'red');
  }

  if (nextAuthUrl) {
    log(`✓ NEXTAUTH_URL: ${nextAuthUrl}`, 'green');
  } else {
    log('✗ NEXTAUTH_URL: NO CONFIGURADO', 'red');
  }

  // 2. Verificar validez del cliente OAuth
  if (clientId) {
    logSection('2. Verificación del Cliente OAuth en Google');
    log('Verificando cliente OAuth...', 'blue');

    const result = await checkOAuthClient(clientId);

    if (result.valid) {
      log('✓ Cliente OAuth es VÁLIDO', 'green');
      console.log('\nDetalles del cliente:');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      log('✗ Cliente OAuth es INVÁLIDO o fue eliminado', 'red');
      log(`Status: ${result.statusCode}`, 'red');
      if (result.error) {
        console.log('Error:', result.error);
      }
    }
  }

  // 3. Verificar configuración de Firebase Auth
  logSection('3. Configuración de Firebase Authentication');
  log('Obteniendo configuración de Firebase Auth...', 'blue');

  const firebaseConfig = await checkFirebaseAuthConfig();

  if (firebaseConfig.valid) {
    log('✓ Configuración de Firebase obtenida correctamente', 'green');

    const signInOptions = firebaseConfig.config?.signIn?.allowedIdpProviders || [];
    const googleProvider = signInOptions.find(p => p.providerId === 'google.com');

    if (googleProvider) {
      log('\n✓ Proveedor de Google habilitado en Firebase', 'green');

      // Intentar extraer el client ID de Firebase (si está disponible en la respuesta)
      if (firebaseConfig.config?.signIn?.oauth) {
        console.log('\nConfiguración OAuth de Firebase:');
        console.log(JSON.stringify(firebaseConfig.config.signIn.oauth, null, 2));
      }
    } else {
      log('⚠ Proveedor de Google NO encontrado en Firebase Auth', 'yellow');
    }
  } else {
    log('✗ Error al obtener configuración de Firebase', 'red');
    console.log('Error:', firebaseConfig.error);
  }

  // 4. Resumen y recomendaciones
  logSection('4. Resumen y Recomendaciones');

  console.log('\nPasos a seguir:');
  log('\n1. Verifica en Firebase Console que el proveedor Google esté habilitado:', 'blue');
  log('   https://console.firebase.google.com/project/clinical-11d05/authentication/providers', 'blue');

  log('\n2. En Firebase Auth > Google > Configuración de SDK web, verifica:', 'blue');
  log(`   - ID de cliente: ${clientId}`, 'blue');
  log(`   - Clave secreta: ${clientSecret ? clientSecret.substring(0, 15) + '...' : 'NO CONFIGURADO'}`, 'blue');

  log('\n3. En Google Cloud Console, verifica los URIs de redirección:', 'blue');
  log('   https://console.cloud.google.com/apis/credentials?project=clinical-11d05', 'blue');
  log('   Debe incluir:', 'blue');
  log('   - http://localhost:3000', 'blue');
  log('   - https://clinical-11d05.firebaseapp.com/__/auth/handler', 'blue');
  log('   - https://dentify-ar.vercel.app (producción)', 'blue');

  console.log('\n' + '='.repeat(60));
  log('Diagnóstico completado', 'bold');
  console.log('='.repeat(60) + '\n');
}

main().catch((error) => {
  log('\n✗ Error ejecutando diagnóstico:', 'red');
  console.error(error);
  process.exit(1);
});
