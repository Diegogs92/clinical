# ⚠️ CAMBIOS MANUALES REQUERIDOS

Este documento lista todos los cambios que **DEBES HACER MANUALMENTE** después de que se implementaron las mejoras automáticas.

---

## 🔥 CRÍTICO - Hacer inmediatamente

### 1. Actualizar Reglas de Seguridad de Firestore

**Por qué:** Las reglas actuales permiten que cualquier usuario escriba fees de otros usuarios (vulnerabilidad de seguridad).

**Cómo:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Firestore Database > Rules
4. Reemplaza el contenido con las reglas actualizadas del archivo `README.md` (sección 2.2)
5. **Importante:** La regla de `insurance-fees` ahora incluye validación de `userId`:
   ```
   match /insurance-fees/{id} {
     allow read: if signedIn();
     allow write: if signedIn() && request.resource.data.userId == request.auth.uid;
   }
   ```
6. Haz clic en "Publish"

### 2. Crear Índices Compuestos en Firestore

**Por qué:** Sin estos índices, las consultas con `where` + `orderBy` fallarán.

**Cómo:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Firestore Database > Indexes
3. Crea los siguientes índices:

**Índice 1 - Appointments:**
- Colección: `appointments`
- Campo 1: `userId` (Ascending)
- Campo 2: `date` (Ascending)
- Query scope: Collection

**Índice 2 - Payments:**
- Colección: `payments`
- Campo 1: `userId` (Ascending)
- Campo 2: `date` (Descending)
- Query scope: Collection

**Índice 3 - MedicalHistory:**
- Colección: `medicalHistory`
- Campo 1: `patientId` (Ascending)
- Campo 2: `date` (Descending)
- Query scope: Collection

**Método alternativo (más fácil):**
- Ejecuta la app normalmente
- Cuando intentes ver appointments/payments, verás un error en consola
- El error incluirá un LINK directo para crear el índice
- Haz clic en el link y Firebase creará el índice automáticamente

### 3. Habilitar Firebase Storage (si quieres upload de archivos)

**Por qué:** El upload de archivos de pacientes requiere Firebase Storage.

**Cómo:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Storage > Get started
3. Acepta las reglas de seguridad predeterminadas
4. Selecciona la misma ubicación que tu Firestore
5. Haz clic en "Done"

**Reglas de Storage recomendadas:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /patient-files/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📋 IMPORTANTE - Hacer cuando puedas

### 4. Actualizar imports de date-fns para reducir bundle size

**Por qué:** Actualmente se importa toda la librería, pero solo usamos algunas funciones.

**Archivos a modificar:**

**`src/lib/dateUtils.ts`:**
```typescript
// Cambiar esto:
import { format, parse, parseISO, addMinutes, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// Por esto:
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import parseISO from 'date-fns/parseISO';
import addMinutes from 'date-fns/addMinutes';
import isValid from 'date-fns/isValid';
import es from 'date-fns/locale/es';
```

**`src/components/agenda/Calendar.tsx`:**
```typescript
// Cambiar:
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Por:
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
```

### 5. Agregar ErrorBoundary al layout principal

**Por qué:** Para capturar errores React y evitar que toda la app crashee.

**Archivo:** `src/app/layout.tsx`

**Agregar al inicio del archivo:**
```typescript
import ErrorBoundary from '@/components/ErrorBoundary';
```

**Envolver el contenido con ErrorBoundary:**
```typescript
return (
  <html lang="es">
    <body className={inter.className}>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <ConfirmProvider>
                {children}
              </ConfirmProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </body>
  </html>
);
```

### 6. Integrar el componente PatientFileUpload en PatientForm

**Archivo:** `src/components/patients/PatientForm.tsx`

**Agregar import:**
```typescript
import PatientFileUpload from './PatientFileUpload';
```

**Agregar en el formulario (antes de los botones):**
```tsx
{patient && (
  <PatientFileUpload
    patientId={patient.id}
    onUpload={(file) => {
      console.log('Archivo subido:', file);
      // Opcional: actualizar state o mostrar toast
    }}
  />
)}
```

### 7. Crear página para historial médico

**Crear archivo:** `src/app/patients/[id]/history/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getMedicalHistoryByPatient } from '@/lib/medicalHistory';
import { MedicalHistory } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';

export default function PatientHistoryPage() {
  const params = useParams();
  const patientId = params.id as string;
  const [history, setHistory] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [patientId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getMedicalHistoryByPatient(patientId);
      setHistory(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Historial Médico</h1>

          {loading ? (
            <p>Cargando...</p>
          ) : history.length === 0 ? (
            <p>No hay registros en el historial médico.</p>
          ) : (
            <div className="space-y-4">
              {history.map(entry => (
                <div key={entry.id} className="card">
                  <p className="text-sm text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                  <h3 className="font-bold">{entry.diagnosis}</h3>
                  <p className="text-sm">{entry.treatment}</p>
                  {entry.notes && <p className="text-sm text-gray-600 mt-2">{entry.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
```

---

## 🎨 OPCIONAL - Mejoras de accesibilidad

### 8. Agregar aria-labels a botones sin texto

Busca botones con solo iconos y agrega `aria-label`:

**Ejemplos:**
```tsx
// Antes:
<button onClick={handleDelete}>
  <Trash className="w-4 h-4" />
</button>

// Después:
<button onClick={handleDelete} aria-label="Eliminar paciente">
  <Trash className="w-4 h-4" />
</button>
```

**Archivos a revisar:**
- `src/components/patients/PatientList.tsx`
- `src/components/DashboardLayout.tsx`
- `src/components/agenda/AppointmentForm.tsx`
- `src/components/insurances/InsuranceForm.tsx`

### 9. Mejorar contraste de colores

Verifica que todos los textos cumplan con WCAG AA:
- Texto normal: contraste mínimo 4.5:1
- Texto grande: contraste mínimo 3:1

Usa [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) para verificar.

---

## 🚀 PRODUCCIÓN - Antes de deployar

### 10. Configurar variables de entorno en tu servicio de hosting

Si usas Vercel, Netlify, etc., configura:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 11. Verificar que NODE_ENV esté en production

Asegúrate de que tu servicio de hosting configure automáticamente `NODE_ENV=production` al hacer build.

### 12. Habilitar Google Analytics (opcional)

Para rastrear uso de la app, agrega Google Analytics a Firebase.

### 13. Configurar dominio personalizado

En Firebase Hosting o tu servicio preferido.

---

## 📊 TESTING

### 14. Probar todas las funcionalidades

**Checklist:**
- [ ] Login con Google funciona
- [ ] Crear, editar y eliminar pacientes
- [ ] Crear turnos con y sin recurrencia
- [ ] Ver calendar con turnos correctos
- [ ] Subir archivos de pacientes (si habilitaste Storage)
- [ ] Crear autorizaciones de obras sociales
- [ ] Registrar pagos
- [ ] Crear entradas de historial médico
- [ ] Mock mode funciona sin Firebase
- [ ] Datos persisten en localStorage en mock mode
- [ ] Dark mode funciona correctamente
- [ ] Responsive en móvil

### 15. Verificar que no haya errores en consola

Abre DevTools (F12) y verifica que no haya:
- Errores rojos
- Warnings de Firestore sobre índices faltantes
- Warnings de React sobre keys o hooks

---

## 🔧 MANTENIMIENTO FUTURO

### 16. Actualizar dependencias regularmente

```bash
npm outdated
npm update
```

### 17. Revisar reglas de Firestore periódicamente

A medida que agregues colecciones, actualiza las reglas.

### 18. Backup de Firestore

Configura exports automáticos de Firestore en Firebase Console.

---

## ❓ TROUBLESHOOTING

### Si ves "Missing or insufficient permissions"
→ Verifica las reglas de Firestore

### Si ves "The query requires an index"
→ Haz clic en el link del error o crea el índice manualmente (ver punto 2)

### Si el upload de archivos falla
→ Verifica que Storage esté habilitado y las reglas estén correctas (ver punto 3)

### Si los datos no persisten en mock mode
→ Verifica que localStorage no esté bloqueado en tu navegador

---

## 📞 SOPORTE

Si encuentras problemas con las implementaciones, revisa:
1. Este documento
2. El README.md actualizado
3. Los comentarios en el código
4. La documentación de Firebase

**Recuerda:** Todos los cambios de código ya fueron implementados. Solo necesitas hacer los cambios de configuración listados arriba.
