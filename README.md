# DiabeCare Web

Frontend de DiabeCare — aplicación de control de salud para pacientes diabéticos. Construido con Angular 21 y Angular Material.

---

## Requisitos

- Node.js 20+
- npm 11+
- Angular CLI 21

```bash
npm install -g @angular/cli@21
```

---

## Instalación

```bash
git clone <url-del-repositorio>
cd diabecare-web
npm install --legacy-peer-deps
```

---

## Ejecución

```bash
ng serve
# http://localhost:4200
```

> El backend debe estar corriendo en `http://localhost:8080` antes de iniciar el frontend.

---

## Build

```bash
ng build --configuration production
# dist/diabecare-web/browser/
```

### Servir build de producción localmente

```bash
ng build --configuration production
npx http-server dist/diabecare-web/browser -p 8080
```

---

## Variables de entorno

**`src/environments/environment.ts`** (desarrollo)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
};
```

**`src/environments/environment.prod.ts`** (producción)

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api/v1',
};
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── auth/               ← AuthService (getUserId, getPatientId, logout),
│   │   │                          AuthGuard, validación JWT
│   │   ├── interceptors/       ← JWT interceptor, Error interceptor
│   │   ├── layout/             ← Shell, Navbar, Sidebar
│   │   └── services/           ← AlertService (con detección de alertas nuevas),
│   │                              ThemeService, MetadataService,
│   │                              GlucoseStateService, PushNotificationService,
│   │                              SystemConfigService, AccountService
│   ├── shared/
│   │   ├── components/         ← AlertsPanel
│   │   └── models/             ← Interfaces TypeScript por dominio
│   ├── store/
│   │   └── glucose/            ← NgRx: actions, reducer, effects, selectors
│   └── features/
│       ├── auth/               ← Login (maneja ACCOUNT_SUSPENDED/INVALID_CREDENTIALS),
│       │                          Register
│       ├── dashboard/          ← Métricas, alertas, accesos rápidos
│       ├── glucose/            ← Registro (botón "Ahora"), historial (selector
│       │                          de rango + gráfica rediseñada), calculadora
│       ├── nutrition/          ← Registro de comidas (botón "Ahora")
│       ├── vitals/             ← Signos vitales, ejercicio (botón "Ahora")
│       ├── medications/        ← Medicamentos
│       ├── reports/            ← Generación de reportes PDF
│       └── profile/            ← Perfil del paciente, ciclo menstrual,
│                                  tab "Cuenta" (suspender/eliminar)
├── public/
│   ├── manifest.webmanifest    ← PWA manifest
│   └── icons/                  ← Íconos PWA (72px a 512px)
└── styles/
    ├── tokens.scss             ← Design tokens "Calm Health"
    ├── mixins.scss             ← Mixins SCSS globales
    └── theme.scss              ← Tema Angular Material (índigo)
```

---

## Funcionalidades

### Dashboard

- Chip de glucosa en tiempo real en el navbar
- Métricas glucémicas de los últimos 7 días via NgRx Store
- Indicador visual de HbA1c estimada con barra de progreso
- Panel de alertas clínicas: 7 tipos + alertas de patrón + ciclo menstrual
- Card de ciclo menstrual (solo pacientes femeninas)
- Accesos rápidos: Glucosa, Comida, Signos vitales, Medicamentos, Ejercicio, Calculadora, Ciclo menstrual

### Glucosa

- Registro de lecturas con botón "Ahora" para fecha/hora actual (offset de timezone corregido)
- **Historial con selector de rango de fechas**: menú desplegable con atajos (7/30/90/180 días) + rango personalizado con date pickers — aplica a gráfica, tabla y exportación
- **Gráfica rediseñada**: sin texto incrustado (evita solapamiento); tooltip enriquecido al hover muestra glucosa + eventos cercanos (comida/ejercicio dentro de ±2h); lista "Eventos registrados" debajo, cronológica, sin filtrar
- Exportación de datos en CSV y JSON respetando el rango seleccionado
- Estado gestionado con NgRx (caché TTL 5 minutos)
- **Notificación inmediata**: tras registrar, si se generó una alerta nueva, aparece un snackbar antes de navegar al historial

### Calculadora de insulina

- Página independiente con dosis de corrección y dosis para comida

### Nutrición

- Registro de comidas con botón "Ahora"
- Buscador de alimentos con debounce 300ms
- Notificación inmediata de alertas nuevas tras registrar

### Signos vitales y ejercicio

- Registro con botón "Ahora" (ejercicio; signos vitales ya lo tenía)
- Gráfica de tendencia HbA1c con `connectNulls` para legibilidad con datos esparcidos
- Notificación inmediata de alertas nuevas tras registrar ejercicio

### Medicamentos

- CRUD completo, auditado en backend

### Reportes

- Selector de rango de fechas con atajos, descarga de reporte PDF

### Perfil

- Edición de datos médicos
- **Tab "Cuenta" (nuevo)**: suspender o eliminar la propia cuenta, con confirmación de dos pasos en banda separada (no inline), iconografía corregida (`delete` en vez de `delete_forever`), texto blanco en botones de confirmación
- Ciclo menstrual como página independiente (solo pacientes femeninas)
- Fix: `(selectedTabChange)` dispara `window.dispatchEvent(new Event('resize'))` para que ECharts se redimensione correctamente al cambiar de tab

### PWA

- Instalable, Service Worker con caché estratificado

### Notificaciones push

- Activación vía campana en navbar, Web Push API nativa
- **Notificaciones inmediatas (nuevo, sin WebSockets)**: `AlertService.getNewAlerts()` compara firma `título|mensaje` de las alertas actuales contra las últimas conocidas en la sesión, evitando falsos negativos cuando una alerta del mismo tipo persiste con datos actualizados (ej. "Patrón: hipoglucemias frecuentes" con conteo distinto)

### Modo oscuro

- Toggle en navbar, gráficas adaptativas

---

## Sistema de diseño "Calm Health"

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#5B4FCF` | Índigo — acciones principales, nav |
| `--color-success` | `#22A96A` | Glucosa en rango, metas cumplidas |
| `--color-warning` | `#E8A020` | Glucosa alta, variabilidad alta |
| `--color-danger` | `#E04B4B` | Hipoglucemia, errores |
| `--color-info` | `#0EA5A0` | Teal — información secundaria |
| `--color-surface` | `#FFFFFF` | Cards, paneles |
| `--color-background` | `#F7F6FC` | Fondo principal |
| `--radius-lg` | `14px` | Cards |
| `--radius-md` | `10px` | Inputs, chips |

---

## Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| Angular | 21 | Framework principal |
| Angular Material | 21 | Componentes UI |
| NgRx | 21 | Gestión de estado (glucosa) |
| Angular Signals | — | Estado local de componentes |
| ngx-echarts | 21 | Directiva Angular para ECharts |
| ECharts | 6.x | Gráficas y visualizaciones |
| @angular/service-worker | 21 | PWA y Service Worker |
| TypeScript | 5.x | Lenguaje principal |
| RxJS | 7.x | Programación reactiva |

---

## Comandos útiles

```bash
ng generate component features/modulo/components/nombre
ng generate service features/modulo/services/nombre
ng build --configuration production
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

---

## Notas importantes

- El Service Worker solo se activa en build de producción
- Las notificaciones push requieren HTTPS en producción (localhost es excepción)
- La card y el acceso rápido de ciclo menstrual solo aparecen para `biologicalSex = FEMALE`
- Los getters en componentes ECharts causan loop infinito — usar variables locales en `ngOnChanges`
- `ViewEncapsulation.None` aplicado solo donde es necesario: login, register, profile, alerts-panel
- `nowAsLocalIso()` (helper repetido en formularios de registro) corrige el offset de timezone — **nunca** usar `new Date().toISOString().slice(0,16)` directamente para inputs `datetime-local`, produce la hora en UTC en vez de local
- Las llamadas a `AlertService.getNewAlerts()` comparan por firma `título|mensaje`, no solo título — necesario porque alertas de patrón mantienen el mismo título con datos distintos en el mensaje
- La gráfica de glucosa usa una ventana de tolerancia de 2 horas (`MAX_GAP_MS`) para vincular eventos de comida/ejercicio a una lectura — evita asociar eventos lejanos en el tiempo cuando hay pocos puntos de glucosa
