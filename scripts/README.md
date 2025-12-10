# Scripts de Migración - DENTIFY

Este directorio contiene scripts para migrar datos de Clinical a DENTIFY.

## 📋 Requisitos Previos

### 1. Instalar Firebase Admin SDK

```bash
npm install firebase-admin
```

### 2. Obtener Service Account Key

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Project Settings** (ícono de engranaje)
4. Pestaña **Service Accounts**
5. Click en **Generate New Private Key**
6. Guarda el archivo JSON como `serviceAccountKey.json` en esta carpeta (`scripts/`)

⚠️ **IMPORTANTE:** El archivo `serviceAccountKey.json` NO debe subirse a git. Ya está incluido en `.gitignore`.

---

## 📜 Scripts Disponibles

### 1. `migrate-users.js` - Migración de Usuarios

Agrega el campo `role` a todos los usuarios en Firestore.

**Uso:**

```bash
# Ejecutar migración
node scripts/migrate-users.js

# Verificar resultado
node scripts/migrate-users.js --verify

# Mostrar ayuda
node scripts/migrate-users.js --help
```

**¿Qué hace?**

- Asigna rol `'profesional'` por defecto a todos los usuarios sin rol
- Muestra un resumen antes de ejecutar
- Pide confirmación antes de hacer cambios
- Permite verificar el resultado después

**Después de ejecutar:**

Debes actualizar manualmente en Firebase Console:
- Romina → `role: "administrador"`
- Secretaria → `role: "secretaria"`
- Colegas → `role: "profesional"` (ya está)

---

### 2. `migrate-appointments.js` - Migración de Turnos

Agrega el campo `appointmentType` a todos los turnos en Firestore.

**Uso:**

```bash
# Ejecutar migración
node scripts/migrate-appointments.js

# Verificar resultado
node scripts/migrate-appointments.js --verify

# Revertir migración (rollback)
node scripts/migrate-appointments.js --rollback

# Mostrar ayuda
node scripts/migrate-appointments.js --help
```

**¿Qué hace?**

- Asigna `appointmentType: 'patient'` a todos los turnos existentes
- Procesa en lotes de 500 para eficiencia
- Muestra progreso en tiempo real
- Permite rollback si es necesario

---

### 3. `verify-all.js` - Verificación Completa

Verifica el estado de toda la migración.

**Uso:**

```bash
node scripts/verify-all.js
```

**¿Qué verifica?**

- ✅ Todos los usuarios tienen rol asignado
- ✅ Hay exactamente 1 administrador
- ✅ Todos los turnos tienen appointmentType
- 📊 Estadísticas generales del sistema

---

## 🚀 Orden de Ejecución Recomendado

Sigue estos pasos en orden:

### Paso 1: Preparación

```bash
# Asegúrate de estar en la raíz del proyecto
cd c:\Users\diego\OneDrive\Documentos\clinical

# Instala Firebase Admin SDK
npm install firebase-admin

# Copia el serviceAccountKey.json a la carpeta scripts/
# (descargado desde Firebase Console)
```

### Paso 2: Migrar Usuarios

```bash
# Ejecutar migración de usuarios
node scripts/migrate-users.js

# Cuando termine, actualiza manualmente en Firebase Console:
# - Romina → role: "administrador"
# - Secretaria → role: "secretaria"
```

### Paso 3: Migrar Turnos

```bash
# Ejecutar migración de turnos
node scripts/migrate-appointments.js
```

### Paso 4: Verificar Todo

```bash
# Verificar que todo esté correcto
node scripts/verify-all.js
```

Si todo está ✅, ¡la migración está completa! 🎉

---

## ⚠️ Solución de Problemas

### Error: "Cannot find module 'firebase-admin'"

```bash
npm install firebase-admin
```

### Error: "Cannot find module './serviceAccountKey.json'"

Descarga el Service Account Key desde Firebase Console y guárdalo en `scripts/serviceAccountKey.json`

### Error: "Permission denied"

Verifica que el Service Account Key tenga los permisos correctos en Firebase Console.

### Quiero revertir la migración de turnos

```bash
node scripts/migrate-appointments.js --rollback
```

⚠️ Esto eliminará el campo `appointmentType` de todos los turnos.

---

## 📊 Ejemplo de Salida

### migrate-users.js

```
=================================================
   MIGRACIÓN DE USUARIOS A DENTIFY
=================================================

📊 Se encontraron 4 usuarios

📋 Resumen:
   - Usuarios con rol: 1
   - Usuarios sin rol: 3

✅ Usuarios que YA tienen rol asignado:
   - admin@ejemplo.com → administrador

⚠️  Usuarios que necesitan rol:
   - colega1@ejemplo.com → se asignará "profesional"
   - colega2@ejemplo.com → se asignará "profesional"
   - secretaria@ejemplo.com → se asignará "profesional"

¿Deseas continuar con la migración? (s/n): s

🔄 Iniciando migración...

   ✓ colega1@ejemplo.com → profesional
   ✓ colega2@ejemplo.com → profesional
   ✓ secretaria@ejemplo.com → profesional

✅ Migración completada exitosamente!
   3 usuarios actualizados con rol "profesional"

=================================================
⚠️  IMPORTANTE - PRÓXIMOS PASOS:
=================================================

Ahora debes actualizar manualmente en Firebase Console:
...
```

### verify-all.js

```
=================================================
   VERIFICACIÓN COMPLETA - DENTIFY
=================================================

👥 VERIFICANDO USUARIOS...

   Total: 4 usuarios
   👑 Administradores: 1
   👩‍⚕️ Profesionales: 2
   📋 Secretarias: 1

📅 VERIFICANDO TURNOS...

   Total: 156 turnos
   👤 Turnos de pacientes: 156
   🔒 Eventos personales: 0

   📈 Progreso: 100.0%

📊 VERIFICANDO OTRAS COLECCIONES...

   Pacientes: 45
   Consultorios: 2
   Pagos: 89
   Obras Sociales: 12
   Franjas Bloqueadas: 5

=================================================
   RESUMEN FINAL
=================================================

✅ ¡Migración completada exitosamente!

   Todos los usuarios tienen roles asignados
   Todos los turnos tienen appointmentType

   El sistema DENTIFY está listo para usar 🦷⏰

📈 ESTADÍSTICAS:
   Usuarios totales: 4
   Turnos totales: 156
   Pacientes: 45
   Consultorios: 2
   Pagos: 89

=================================================
```

---

## 🔒 Seguridad

- ⚠️ **NUNCA** subas `serviceAccountKey.json` a git
- ⚠️ **NUNCA** compartas este archivo públicamente
- ✅ El archivo ya está en `.gitignore`
- ✅ Guárdalo en un lugar seguro después de la migración

---

## 📞 Soporte

Si tienes problemas durante la migración:

1. Revisa la documentación de Firebase Admin SDK
2. Verifica los logs de Firebase Console
3. Ejecuta `node scripts/verify-all.js` para diagnosticar
4. Consulta el archivo principal [MIGRATION.md](../MIGRATION.md)

---

¡Buena suerte con la migración! 🦷⏰
