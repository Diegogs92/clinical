# 📅 Google Calendar - Sincronización y Permisos

## Resumen de Implementación

Se ha configurado la aplicación para que **todos los turnos de todos los usuarios** se sincronicen con un **calendario compartido de Google Calendar**, pero con permisos diferenciados para editar y eliminar.

---

## 🔧 Configuración del Calendario

### Calendario Compartido

**ID del calendario**: `ba845784eac911f9cfa93aefc233f402124d0309393a22d9e6408ae9e8c13145@group.calendar.google.com`

Este calendario está configurado en el archivo `.env.local`:

```env
GOOGLE_CALENDAR_ID=ba845784eac911f9cfa93aefc233f402124d0309393a22d9e6408ae9e8c13145@group.calendar.google.com
```

### ¿Cómo funciona?

- **Todos los usuarios** sincronizan sus turnos con este mismo calendario
- Cada turno se crea como un evento en el calendario compartido
- Los eventos incluyen metadata privada para identificar quién lo creó

---

## 🔐 Sistema de Permisos

### Reglas de Modificación

Un usuario puede **editar o eliminar** un turno si cumple **una** de estas condiciones:

1. **Es Administrador**: Los usuarios con rol `administrador` pueden editar/eliminar cualquier turno
2. **Es el Creador**: El usuario que creó el turno puede editarlo o eliminarlo

### Implementación Técnica

**Archivo**: `src/lib/appointmentPermissions.ts`

```typescript
export function canModifyAppointment(
  appointment: Appointment,
  currentUser: { uid: string } | null,
  userProfile: UserProfile | null
): boolean {
  // Administradores pueden modificar cualquier turno
  if (userProfile?.role === 'administrador') {
    return true;
  }

  // El creador puede modificar su propio turno
  if (appointment.userId === currentUser?.uid) {
    return true;
  }

  // En cualquier otro caso, no tiene permiso
  return false;
}
```

### Operaciones Protegidas

Las siguientes operaciones requieren permisos:

#### En la Agenda (`src/app/agenda/page.tsx`):
- ✏️ **Arrastrar y soltar** turno (`handleEventDrop`)
- 📏 **Redimensionar** turno (`handleEventResize`)
- ✅ **Marcar presente** (`handleAttendance`)
- ❌ **Cancelar** turno (`handleCancelAppointment`)
- 🗑️ **Eliminar** turno (`handleDelete`)

#### En el Dashboard (`src/app/dashboard/page.tsx`):
- ❌ **Cancelar** turno (`handleCancel`)
- 🗑️ **Eliminar** turno (`handleDelete`)

---

## 📊 Sincronización Bidireccional

### De DENTIFY → Google Calendar

Cuando creas/editas/eliminas un turno en DENTIFY:
- Se sincroniza automáticamente con Google Calendar
- Se crea/actualiza/elimina el evento correspondiente

### De Google Calendar → DENTIFY

- **Frecuencia**: Cada 5 minutos
- **Rango**: 1 mes atrás, 6 meses adelante
- **Proceso**:
  1. Se buscan eventos nuevos o modificados
  2. Se importan a DENTIFY
  3. Se identifican por metadata privada

---

## 🏷️ Metadata de Eventos

Cada evento en Google Calendar incluye propiedades privadas:

```javascript
{
  appointmentId: "id-del-turno-en-dentify",
  userId: "id-del-profesional-creador",
  appointmentType: "patient" | "personal",
  patientId: "id-del-paciente",
  patientName: "nombre-del-paciente"
}
```

Esto permite:
- ✅ Identificar quién creó el turno
- ✅ Evitar duplicados
- ✅ Aplicar permisos correctamente
- ✅ Actualizar el turno correcto cuando cambia en Google Calendar

---

## 🔔 Mensajes de Error

### Sin Permisos

Si un usuario intenta modificar un turno sin permisos, verá:

```
No tienes permisos para modificar este turno.
Solo el creador o un administrador pueden editarlo o eliminarlo.
```

---

## 👥 Roles de Usuario

### Administrador
- ✅ Puede ver todos los turnos
- ✅ Puede editar cualquier turno
- ✅ Puede eliminar cualquier turno
- ✅ Puede crear turnos

### Profesional (no administrador)
- ✅ Puede ver todos los turnos (calendario compartido)
- ✅ Puede editar **solo sus propios** turnos
- ✅ Puede eliminar **solo sus propios** turnos
- ✅ Puede crear turnos

---

## 📝 Formato de Eventos

### Turnos de Pacientes
```
👤 Turno: [Nombre del Paciente]

Tratamiento: Ortodoncia
Honorarios: $50,000
Seña: $10,000
Pagos: $20,000
Pendiente: $20,000
```

### Eventos Personales
```
🔒 [Título del Evento]

[Notas opcionales]
```

---

## 🌍 Zona Horaria

**Configurada**: `America/Argentina/Buenos_Aires`

Todos los eventos se crean en esta zona horaria para evitar problemas de conversión.

---

## 🔄 Frecuencia de Sincronización

- **Verificación de conexión**: Cada 5 minutos
- **Sincronización desde Google**: Cada 5 minutos
- **Sincronización hacia Google**: Inmediata (al crear/editar/eliminar)

---

## ✅ Estado de Implementación

- ✅ Calendario compartido configurado
- ✅ Sistema de permisos implementado
- ✅ Validaciones en Agenda
- ✅ Validaciones en Dashboard
- ✅ Mensajes de error claros
- ✅ Sincronización bidireccional funcionando
- ✅ Metadata para identificar creadores
- ✅ Desplegado en producción

---

## 🚀 Próximos Pasos Recomendados

1. **Configurar permisos de Google Calendar**:
   - Asegúrate de que todos los usuarios tengan permisos de escritura en el calendario compartido
   - Configura las notificaciones según sea necesario

2. **Probar con usuarios reales**:
   - Verifica que los permisos funcionen correctamente
   - Confirma que la sincronización es bidireccional

3. **Monitoreo**:
   - Revisar logs de sincronización
   - Verificar que no haya conflictos de eventos
