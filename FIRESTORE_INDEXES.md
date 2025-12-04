# Índices de Firestore Requeridos

Para que la aplicación funcione correctamente, necesitas crear los siguientes índices compuestos en Firestore.

## Cómo crear los índices:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Indexes** (Índices)
4. Crea los siguientes índices compuestos:

---

## Índice 1: blockedSlots - Obtener todas las franjas de un usuario

**Colección**: `blockedSlots`

**Campos indexados**:
1. `userId` - Ascending
2. `date` - Ascending
3. `startTime` - Ascending

**Configuración del índice**:
```
Collection ID: blockedSlots
Fields indexed:
  - userId (Ascending)
  - date (Ascending)
  - startTime (Ascending)
Query scope: Collection
```

---

## Índice 2: blockedSlots - Obtener franjas por fecha

**Colección**: `blockedSlots`

**Campos indexados**:
1. `userId` - Ascending
2. `date` - Ascending
3. `startTime` - Ascending

**Configuración del índice**:
```
Collection ID: blockedSlots
Fields indexed:
  - userId (Ascending)
  - date (Ascending)
  - startTime (Ascending)
Query scope: Collection
```

---

## Método alternativo: Usar el enlace de error

Cuando intentas hacer una query que requiere un índice, Firestore te da un enlace directo en el error de consola.

1. Busca en la consola del navegador un error que diga algo como:
   ```
   The query requires an index. You can create it here: https://console.firebase.google.com/...
   ```

2. Haz clic en ese enlace - te llevará directamente a crear el índice necesario

3. Haz clic en "Create Index" y espera unos minutos a que se complete

---

## Verificar que los índices están creados:

En Firebase Console → Firestore → Indexes, deberías ver:

- **blockedSlots**: userId ASC, date ASC, startTime ASC - Status: Enabled

---

## Notas importantes:

- Los índices pueden tardar unos minutos en crearse
- Una vez creados, no necesitas hacer nada más en el código
- Si ves un error "The query requires an index", simplemente sigue el enlace que proporciona el error

---

## Otros índices que ya deberías tener (del README principal):

Si aún no los has creado, también necesitas estos índices para otras colecciones:

### appointments
- `userId` ASC, `date` ASC

### patients
- `userId` ASC, `lastName` ASC

### offices
- `userId` ASC, `name` ASC

### payments
- `userId` ASC, `date` DESC
