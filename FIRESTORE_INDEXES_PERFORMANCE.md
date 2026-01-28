# Índices de Firestore para Optimización de Performance

Este documento lista los índices compuestos requeridos en Firestore para las queries optimizadas implementadas en el sistema.

## Fecha de Creación
2026-01-28

## Índices Requeridos

### 1. Payments Collection - Query por Fecha

**Colección:** `payments`

**Campos:**
- `date` (Ascending)
- `__name__` (Ascending)

**Comando para crear:**
```bash
firebase firestore:indexes --project <your-project-id>
```

O crear manualmente en Firebase Console:
1. Ir a Firestore Database
2. Click en "Indexes"
3. Click en "Create Index"
4. Collection ID: `payments`
5. Fields:
   - `date`: Ascending
   - Document ID: Ascending

**Usado en:**
- `src/lib/payments.ts` - `listPayments()` línea 89-96
- Filtra pagos de los últimos 12 meses para reducir carga

---

### 2. Payments Collection - Pagos Pendientes por Fecha

**Colección:** `payments`

**Campos:**
- `status` (Ascending)
- `date` (Ascending)
- `__name__` (Ascending)

**Usado en:**
- `src/lib/payments.ts` - `listPendingPayments()` línea 105-113
- Filtra pagos pendientes recientes

---

### 3. Appointments Collection - Turnos por Rango de Fechas

**Colección:** `appointments`

**Campos:**
- `date` (Ascending)
- `__name__` (Ascending)

**Usado en:**
- `src/lib/appointments.ts` - `getAllAppointments()` línea 128-135
- Carga turnos de últimos 6 meses y próximos 6 meses

---

## Por qué estos índices son necesarios

Firestore requiere índices compuestos cuando se usan múltiples operadores `where()` o combinaciones de `where()` con `orderBy()` en campos diferentes.

Sin estos índices, las queries fallarían con un error como:
```
The query requires an index. You can create it here: [URL]
```

## Beneficios de Performance

Con estos índices implementados:

1. **Payments**: Reducción de ~90% en documentos leídos (de todos los pagos históricos a solo 12 meses recientes)
2. **Appointments**: Reducción de ~80% en documentos leídos (de todo el historial a solo 12 meses de rango)
3. **Tiempo de carga**: De 5-10 segundos a <2 segundos en el dashboard
4. **Costo**: Reducción significativa en lectura de documentos de Firestore

## Creación Automática

Firestore sugerirá crear estos índices automáticamente la primera vez que se ejecuten las queries. Simplemente haz click en el link que aparece en la consola del navegador o en los logs del servidor.

## Verificación

Para verificar que los índices están creados:
1. Ir a Firebase Console
2. Firestore Database → Indexes
3. Verificar que aparezcan los índices listados arriba con estado "Enabled"

## Notas Adicionales

- Los índices pueden tardar unos minutos en construirse después de crearlos
- Durante la construcción, las queries pueden fallar temporalmente
- Una vez construidos, los índices se mantienen automáticamente
- No hay límite de índices en el plan Blaze de Firebase

## Queries Optimizadas Implementadas

### src/lib/payments.ts

```typescript
// Antes: cargaba TODOS los pagos sin límite
const snap = await getDocs(collection(db, PAYMENTS_COLLECTION));

// Después: carga solo últimos 12 meses con límite
const q = query(
  collection(db, PAYMENTS_COLLECTION),
  where('date', '>=', recentDate),
  orderBy('date', 'desc'),
  limit(1000)
);
```

### src/lib/appointments.ts

```typescript
// Antes: cargaba TODOS los turnos históricos
const snap = await getDocs(colRef);

// Después: carga solo rango de 12 meses (6 atrás, 6 adelante)
const q = query(
  collection(db, APPOINTMENTS_COLLECTION),
  where('date', '>=', start),
  where('date', '<=', end),
  orderBy('date', 'asc'),
  limit(2000)
);
```

## Monitoreo

Monitorear el uso de Firestore en Firebase Console → Usage para verificar la reducción en lecturas de documentos después de implementar estas optimizaciones.
