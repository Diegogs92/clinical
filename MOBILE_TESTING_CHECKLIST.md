# ✅ Checklist de Testing PWA Móvil - Clinical

## 🎯 Guía de Pruebas para el Rediseño Móvil

### 🖥️ Preparación del Entorno de Pruebas

1. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```
   - ✅ Servidor corriendo en http://localhost:3000
   - ✅ Sin errores en consola

2. **Abrir Chrome DevTools**
   - Presionar `F12` o `Ctrl+Shift+I`
   - Click en toggle device toolbar (`Ctrl+Shift+M`)
   - Seleccionar dispositivo móvil (iPhone 12 Pro, Galaxy S20, etc.)

---

## 📱 Sección 1: Navegación Móvil

### MobileNavBar (Barra Inferior)

- [ ] **Visibilidad**
  - La navbar aparece en la parte inferior en móvil
  - No aparece en desktop (>768px)

- [ ] **Auto-Hide Behavior**
  - Al hacer scroll hacia ABAJO, la navbar se oculta suavemente
  - Al hacer scroll hacia ARRIBA, la navbar reaparece
  - En la parte superior (scroll < 50px), siempre está visible

- [ ] **Botón FAB Central**
  - Tamaño: 64x64px (más grande que antes)
  - Sombra azul visible
  - Se activa correctamente (crea nuevo turno)
  - Feedback táctil al presionar

- [ ] **Items de Navegación**
  - 5 items visibles: Inicio, Pacientes, Consultorios, Obras Sociales, Honorarios
  - Item activo tiene:
    - Fondo con gradiente azul
    - Glow effect (resplandor)
    - Indicador inferior (línea)
    - Escala ligeramente mayor
  - Items inactivos tienen color gris
  - Transiciones suaves al cambiar

- [ ] **Bordes y Estilo**
  - Bordes muy redondeados (28px)
  - Fondo blanco/negro translúcido
  - Backdrop blur visible

---

## 🎨 Sección 2: Layout Principal

### Header (DashboardLayout)

- [ ] **Tamaño y Espaciado**
  - Altura: 56px en móvil (más compacto)
  - Logo y título visibles
  - Email del usuario oculto en móviles pequeños

- [ ] **Menu Desplegable**
  - Botón hamburguesa visible
  - Al abrir: animación suave desde arriba
  - Avatar del usuario con gradiente azul
  - Botones "Ir al inicio" y "Cerrar sesión" funcionan
  - Al cerrar: se oculta suavemente

- [ ] **Espaciado General**
  - Padding lateral: 12px (px-3)
  - Bottom padding: 128px (espacio para navbar)
  - Sin overflow horizontal

---

## 📊 Sección 3: Dashboard

### Header de Reloj

- [ ] **Diseño Compacto**
  - Card con reloj en tiempo real
  - Icono de reloj visible (44x44px)
  - Fecha/hora truncada correctamente
  - No overflow en pantallas pequeñas

### Stats Overview (4 Cards)

- [ ] **Grid Layout**
  - 2 columnas en móvil (grid-cols-2)
  - 4 columnas en desktop
  - Gap de 12px entre cards

- [ ] **Cards Individuales**
  - Tipografía escalada: 24px en móvil
  - Texto truncado (no overflow)
  - Hover effect funciona
  - Bordes redondeados (20px)

### Lista de Citas

- [ ] **Cards de Citas (Móvil)**
  - Espaciado entre cards: 12px (gap-3)
  - Padding interno: 16px (p-4)
  - Bordes redondeados: 20px

- [ ] **Información en Card**
  - Nombre del paciente: bold, truncado
  - Fecha y hora: legible
  - Consultorio: visible si existe
  - Badge de estado: visible y claro
  - Estado de pago con color correcto:
    - Verde: Pagado
    - Amarillo: Parcial
    - Rojo: Pendiente

- [ ] **Botones de Acción**
  - Grid de 4 columnas
  - Botón "Pago" ocupa 2 columnas
  - Iconos: Pago, Editar, Cancelar
  - Cada botón: 46px+ de touch target
  - Feedback táctil (scale-95) al presionar
  - Bordes redondeados (12-16px)

---

## 🔧 Sección 4: Formularios e Inputs

### Campos de Input

- [ ] **Tamaño Touch-Friendly**
  - Altura mínima: 50px
  - Font-size: 16px (sin zoom en iOS)
  - Bordes redondeados: 16px
  - Padding: 14px 18px

- [ ] **Selects**
  - Altura mínima: 50px
  - Flecha customizada visible
  - Dropdown funciona correctamente

- [ ] **Textareas**
  - Altura mínima: 100px
  - Resize vertical habilitado
  - Mismos estilos que inputs

- [ ] **Checkboxes y Radios**
  - Tamaño: 24x24px
  - Labels con min-height 44px
  - Clickeable en toda el área

### Botones

- [ ] **Tamaños**
  - Min-height: 50px
  - Padding generoso
  - Font-weight: 600

- [ ] **Estilos**
  - btn-primary: fondo azul
  - btn-secondary: fondo gris
  - btn-danger: fondo rojo
  - Bordes redondeados: 16px

- [ ] **Interacciones**
  - Hover effect funciona
  - Active scale-down (95%)
  - Disabled state correcto

---

## 🎭 Sección 5: Animaciones

### Navegación

- [ ] **Navbar Auto-Hide**
  - Transición suave (300ms)
  - Sin saltos o glitches

### Cards y Elementos

- [ ] **Clases de Animación**
  - `.animate-fade-in-up`: funciona
  - `.animate-scale-in`: funciona
  - `.touch-feedback`: ripple visible al tocar

### Performance

- [ ] **60 FPS**
  - Scroll suave sin lag
  - Animaciones fluidas
  - Sin jank visual

---

## 📐 Sección 6: Responsive Design

### Breakpoints

- [ ] **Mobile (< 768px)**
  - Layout de 1 columna
  - Navbar inferior visible
  - Header compacto
  - Cards apiladas

- [ ] **Tablet (768px - 1024px)**
  - Layout intermedio
  - Algunas grids de 2 columnas

- [ ] **Desktop (> 1024px)**
  - Navbar superior (GlassNavbar)
  - Navbar inferior oculta
  - Layout completo

---

## 🔍 Sección 7: PWA Manifest

### Configuración

- [ ] **Manifest.json**
  - Accesible en `/manifest.json`
  - Theme color: #0EA5E9
  - Background color: #F9FBFF
  - Display: standalone

- [ ] **App Shortcuts**
  - Nuevo Turno
  - Pacientes
  - Honorarios

### Install Prompt

- [ ] **Add to Home Screen**
  - Prompt aparece (si aplica)
  - Icono correcto
  - Nombre: "Clinical"

---

## 🎯 Sección 8: Accesibilidad

### Touch Targets

- [ ] **Tamaños Mínimos**
  - Botones: 50x50px ✓
  - Icon buttons: 46x46px ✓
  - Links: 44px altura ✓

### Contrast

- [ ] **Ratios de Contraste**
  - Texto principal: 4.5:1 mínimo
  - Texto grande: 3:1 mínimo
  - Iconos: 3:1 mínimo

### Navegación

- [ ] **Teclado**
  - Tab navigation funciona
  - Focus visible
  - Skip links (si aplica)

---

## 🐛 Sección 9: Testing de Bugs

### Scroll Behavior

- [ ] Sin scroll horizontal inesperado
- [ ] Navbar no cubre contenido importante
- [ ] Safe areas respetadas (notch, home indicator)

### Estados

- [ ] Loading states visibles
- [ ] Error states claros
- [ ] Empty states informativos

### Edge Cases

- [ ] Texto muy largo (truncado)
- [ ] Sin datos (mensajes apropiados)
- [ ] Slow connection (loaders)

---

## 🚀 Sección 10: Performance

### Lighthouse Audit

1. Abrir Chrome DevTools
2. Tab "Lighthouse"
3. Seleccionar "Mobile"
4. Ejecutar audit

**Objetivos:**
- [ ] Performance: > 90
- [ ] Accessibility: > 90
- [ ] Best Practices: > 90
- [ ] SEO: > 90
- [ ] PWA: Todos los checks

### Core Web Vitals

- [ ] **LCP** (Largest Contentful Paint): < 2.5s
- [ ] **FID** (First Input Delay): < 100ms
- [ ] **CLS** (Cumulative Layout Shift): < 0.1

---

## 📱 Sección 11: Dispositivos Reales

### iOS (Safari)

- [ ] iPhone SE (375px)
- [ ] iPhone 12/13/14 (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] iPad (768px)

### Android (Chrome)

- [ ] Galaxy S20 (360px)
- [ ] Pixel 5 (393px)
- [ ] Galaxy Tab (800px)

---

## ✅ Verificación Final

- [ ] Todas las secciones completadas
- [ ] Bugs documentados (si existen)
- [ ] Screenshots tomados
- [ ] Feedback recopilado

---

## 📝 Notas de Testing

**Dispositivo probado:**
- Modelo:
- OS:
- Navegador:
- Versión:

**Problemas encontrados:**
1.
2.
3.

**Sugerencias:**
1.
2.
3.

---

**Fecha de testing**: _______________
**Probado por**: _______________
**Estado**: [ ] Aprobado [ ] Requiere cambios
