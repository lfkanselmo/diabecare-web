# DiabeCare — Frontend Architecture & Technical Documentation

> **Angular 21 | Arquitectura Feature-Based | Design System "Calm Health"**

| Campo | Valor |
|---|---|
| Versión | 2.0.0 |
| Framework | Angular 21 (Standalone Components) |
| UI Library | Angular Material 21 + ECharts 6 |
| State Mgmt | NgRx 21 + Angular Signals |
| Estilos | SCSS + Design Tokens "Calm Health" |
| PWA | @angular/service-worker 21 |

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Arquitectura del Frontend](#2-arquitectura-del-frontend)
3. [Sistema de Diseño](#3-sistema-de-diseño)
4. [Pantallas y Navegación](#4-pantallas-y-navegación)
5. [Componentes Reutilizables Clave](#5-componentes-reutilizables-clave)
6. [State Management](#6-state-management)
7. [PWA y Notificaciones Push](#7-pwa-y-notificaciones-push)
8. [Capa HTTP y Comunicación](#8-capa-http-y-comunicación)
9. [Estándares Técnicos y de Código](#9-estándares-técnicos-y-de-código)
10. [Rendimiento y Optimización](#10-rendimiento-y-optimización)
11. [Accesibilidad](#11-accesibilidad)

---

## 1. Visión General

### 1.1 Objetivos de la Interfaz

- Interfaz intuitiva para registro rápido de glucosa (máximo 3 taps/clics)
- Dashboard centralizado con métricas visuales, alertas de patrón y accesos rápidos
- Correlación visual entre glucosa, comidas y ejercicio en una sola gráfica
- Sistema de alertas clínicas inteligentes (7 tipos + alertas de patrón + ciclo menstrual)
- Notificaciones push nativas para alertas y resumen semanal
- Diseño responsive: funcional en desktop, tablet y mobile
- Modo oscuro opcional para uso nocturno (mediciones de madrugada)
- Instalable como PWA en dispositivos móviles y desktop

### 1.2 Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Framework | Angular 21 con Standalone Components |
| Lenguaje | TypeScript 5.x (strict mode) |
| Estilos | SCSS con Design Tokens + CSS Custom Properties |
| UI Components | Angular Material 21 |
| Gráficas | Apache ECharts 6 (ngx-echarts 21) |
| State Management | NgRx 21 + Angular Signals |
| HTTP Client | Angular HttpClient con Interceptors |
| Formularios | Reactive Forms con validadores personalizados |
| Routing | Angular Router con Guards y lazy loading |
| PWA | @angular/service-worker 21 |
| Push Notifications | Web Push API nativa |
| Build | Angular CLI 21 + esbuild |

---

## 2. Arquitectura del Frontend

### 2.1 Patrón: Feature-Based Architecture

La aplicación se organiza por **features** (dominio funcional). Cada feature es autocontenida con sus propios componentes, servicios y rutas.

### 2.2 Estructura de Carpetas

```
src/
├── app/
│   ├── core/                      # Singleton: guards, interceptors, servicios globales
│   │   ├── auth/                  # AuthService, AuthGuard, JwtInterceptor
│   │   ├── interceptors/          # JwtInterceptor, ErrorInterceptor
│   │   ├── layout/                # Shell, Navbar, Sidebar
│   │   └── services/              # ThemeService, MetadataService,
│   │                              # GlucoseStateService, PushNotificationService,
│   │                              # AlertService
│   ├── shared/
│   │   ├── components/            # AlertsPanel
│   │   └── models/                # Interfaces TypeScript del dominio
│   ├── store/
│   │   └── glucose/               # NgRx store de glucosa
│   │       ├── glucose.actions.ts
│   │       ├── glucose.reducer.ts
│   │       ├── glucose.effects.ts
│   │       └── glucose.selectors.ts
│   └── features/
│       ├── auth/                  # Login, Register
│       ├── dashboard/             # Vista principal con métricas
│       ├── glucose/               # Registro, historial, calculadora de insulina
│       ├── nutrition/             # Registro de comidas
│       ├── vitals/                # Signos vitales, ejercicio
│       ├── medications/           # Medicamentos
│       ├── reports/               # Reportes PDF
│       └── profile/               # Perfil del paciente, ciclo menstrual
├── public/
│   ├── manifest.webmanifest       # PWA manifest
│   └── icons/                     # Íconos PWA (72px a 512px)
└── styles/
    ├── tokens.scss                # Design tokens "Calm Health"
    ├── mixins.scss                # Mixins SCSS globales
    └── theme.scss                 # Tema Angular Material (deep-purple)
```

### 2.3 Estructura Interna de un Feature

```
features/glucose/
├── components/
│   ├── glucose-chart/             # Gráfica ECharts con marcadores
│   └── hba1c-chart/               # Gráfica de tendencia HbA1c
├── pages/
│   ├── glucose-register/          # Formulario de registro
│   ├── glucose-history/           # Historial con gráfica y tabla
│   └── insulin-calculator/        # Calculadora de dosis de insulina
├── services/
│   └── glucose.service.ts         # HTTP calls + exportación CSV/JSON
└── glucose.routes.ts              # Rutas lazy-loaded
```

---

## 3. Sistema de Diseño "Calm Health"

### 3.1 Filosofía

El sistema de diseño "Calm Health" prioriza la claridad y la calma visual — sin sombras agresivas, sin pesos tipográficos pesados, con colores semánticos suaves y bordes finos. Diseñado para que el paciente pueda leer sus métricas clínicas sin ansiedad visual.

### 3.2 Paleta de Colores

| Nombre | Hex | Uso |
|---|---|---|
| Primary Índigo | `#5B4FCF` | Acciones principales, nav, botones |
| Primary Light | `#EEF0FF` | Fondos de preview, estados hover |
| Success | `#22A96A` | Glucosa en rango, metas cumplidas |
| Warning | `#E8A020` | Glucosa alta, variabilidad alta |
| Danger | `#E04B4B` | Hipoglucemia, errores |
| Info Teal | `#0EA5A0` | Información secundaria, marcadores comida |
| Surface | `#F7F6FC` | Fondo principal |
| Card | `#FFFFFF` | Cards y paneles |
| Border | `rgba(91,79,207,0.12)` | Bordes de cards |

**Modo oscuro:**
| Token | Valor |
|---|---|
| Background | `#16142A` |
| Surface | `#1F1D36` |
| Primary (dark) | `#8B82E0` |

### 3.3 Tipografía

- **Fuente**: Inter (Google Fonts) — pesos 400 y 500 únicamente
- **Font weight**: 500 para todos los headings (nunca 600/700)
- **Escala**: xs (11px), sm (13px), md (15px), lg (18px), xl (22px), 2xl (28px)

### 3.4 Design Tokens Principales

```scss
:root {
  --color-primary:       #5B4FCF;
  --color-primary-light: #EEF0FF;
  --color-success:       #22A96A;
  --color-warning:       #E8A020;
  --color-danger:        #E04B4B;
  --color-info:          #0EA5A0;
  --color-surface:       #FFFFFF;
  --color-background:    #F7F6FC;
  --color-border:        rgba(91, 79, 207, 0.12);

  --radius-lg:  14px;   // Cards
  --radius-md:  10px;   // Inputs, chips
  --radius-full: 999px; // Pills, badges

  --font-weight-medium: 500;
  --transition-fast:    150ms ease;
  --transition-normal:  250ms ease;
}
```

### 3.5 Reglas de Estilo

- Cards: `border: 0.5px solid var(--color-border)` — sin box-shadow
- Sidebar: `position: sticky` — nunca `fixed` (causa loop Angular)
- ECharts modo oscuro: leer `data-theme` UNA vez en `ngOnChanges`, nunca en getter
- `ViewEncapsulation.None` solo donde es necesario: login, register, profile, alerts-panel
- Alertas: colores via `[style]` binding inline — no clases CSS (evita conflictos con Material)

---

## 4. Pantallas y Navegación

### 4.1 Rutas

```
/auth/login
/auth/register
/app/dashboard
/app/glucose/register
/app/glucose/history
/app/glucose/insulin-calculator
/app/nutrition/log
/app/nutrition/history
/app/vitals
/app/vitals/exercise
/app/medications
/app/reports
/app/profile
/app/cycle                        ← Solo pacientes femeninas
```

### 4.2 Sidebar

| Ítem | Ruta | Ícono |
|---|---|---|
| Dashboard | `/app/dashboard` | `dashboard` |
| Glucosa | `/app/glucose` | `water_drop` |
| Nutrición | `/app/nutrition` | `restaurant` |
| Signos vitales | `/app/vitals` | `favorite` |
| Medicamentos | `/app/medications` | `medication` |
| Reportes | `/app/reports` | `description` |
| Mi perfil | `/app/profile` | `person` |

### 4.3 Navbar

- Logo + nombre de la app
- **Chip de glucosa**: última lectura con color semántico (verde/ámbar/rojo), actualizado via `GlucoseStateService`
- **Campana de notificaciones**: activa/desactiva push notifications
- Toggle modo oscuro/claro
- Menú de usuario (perfil, cerrar sesión)

---

## 5. Componentes Reutilizables Clave

### 5.1 `AlertsPanelComponent`

Panel de alertas clínicas con 4 severidades:

- `SUCCESS` — verde: racha positiva de TIR
- `INFO` — teal: avisos nutricionales, fases del ciclo
- `WARNING` — ámbar: glucosa alta, HbA1c elevada, patrones
- `DANGER` — rojo: hipoglucemia, hipoglucemias frecuentes

Colores aplicados via `[style]` binding inline para compatibilidad con modo oscuro. `ViewEncapsulation.None` habilitado.

**Alertas de patrón detectadas:**
- Glucosa alta en ayuno (>60% de ayunos >130 mg/dL, mín 3 lecturas)
- Picos postprandiales frecuentes (>50% >180 mg/dL, mín 3 lecturas)
- Hipoglucemias frecuentes (≥3 episodios en 14 días)
- Alta variabilidad glucémica (CV ≥36%, mín 7 lecturas)

### 5.2 `GlucoseChartComponent`

Gráfica ECharts con:
- Línea de glucosa con `visualMap` por rangos semánticos
- Marcadores de comidas (líneas discontinuas teal) via `MealMarkerResponse[]`
- Marcadores de ejercicio (líneas punteadas índigo) via `ExerciseLogResponse[]`
- Líneas de límite mínimo y máximo objetivo
- Zona verde de rango objetivo (markArea)
- Leyenda explicativa de colores y marcadores
- Tooltips con contexto clínico
- Paleta adaptativa modo oscuro/claro (lectura única en `ngOnChanges`)

### 5.3 `CycleCalendarComponent`

Calendario del ciclo menstrual con:
- Rueda ECharts de 5 fases (menstruación, folicular, ovulación, lútea temprana, lútea tardía)
- Calendario mensual con colores por fase
- Colores adaptativos: `lightColor` (modo claro) / `darkColor` rgba baja opacidad (modo oscuro)
- Flag `dark` leído una vez en `ngOnChanges` y pasado a `CalendarDay`

### 5.4 `InsulinCalculatorComponent`

Calculadora de dosis de insulina:
- Dosis de corrección: `(glucosaActual - objetivo) / factorSensibilidad`
- Dosis para comida: `carbohidratos / ratioCarbos`
- Disclaimer médico prominente
- Resultado con advertencia de verificar con médico

---

## 6. State Management

### 6.1 Cuándo usar NgRx vs Signals

| Escenario | Solución | Razón |
|---|---|---|
| Estadísticas de glucosa (dashboard) | NgRx + Effects | Cacheable, compartido entre componentes |
| Estado local de formulario | Signal | Solo vive dentro del componente |
| Tema claro/oscuro | ThemeService + localStorage | Global pero simple |
| Última lectura de glucosa (navbar) | GlucoseStateService (Signal) | Singleton sin HTTP adicional |
| Alertas, resúmenes, otros datos | Signal en componente | Sin necesidad de caché global |

### 6.2 NgRx Glucose Store

```typescript
interface GlucoseState {
  stats:      GlucoseStatsResponse | null;
  loading:    boolean;
  error:      string | null;
  lastLoaded: number | null;  // timestamp para TTL de caché
}
```

**Acciones:**
- `[Glucose] Load Stats` — despacha con patientId, from, to
- `[Glucose] Load Stats Success` — puebla stats y actualiza lastLoaded
- `[Glucose] Load Stats Failure` — almacena el error
- `[Glucose] Invalidate Cache` — resetea lastLoaded para forzar recarga

**TTL de caché:** 5 minutos. El effect verifica `selectIsStale()` antes de hacer la llamada HTTP.

### 6.3 GlucoseStateService

Singleton con signal `latestReading` para compartir la última lectura entre el dashboard y el navbar sin peticiones HTTP adicionales. El dashboard lo actualiza al cargar el historial; el navbar solo lo lee.

---

## 7. PWA y Notificaciones Push

### 7.1 Service Worker

Configurado con `@angular/service-worker`. Solo activo en build de producción.

**Estrategia de caché (`ngsw-config.json`):**
| Grupo | Endpoints | TTL |
|---|---|---|
| `metadata-api` | `/api/v1/metadata/**` | 7 días |
| `foods-api` | `/api/v1/foods/**` | 24 horas |
| `api-data` | `/api/v1/**` | 1 hora |
| `assets` | Fuentes Google, imágenes | Indefinido (lazy) |

### 7.2 Notificaciones Push

**Flujo de suscripción:**
1. Usuario hace clic en campana → `PushNotificationService.requestPermissionAndSubscribe()`
2. Se solicita permiso al navegador
3. Se obtiene la clave VAPID del backend (`GET /api/v1/push/vapid-public-key`)
4. Se suscribe al `PushManager` del Service Worker
5. Se envía `{ endpoint, p256dh, auth }` al backend (`POST /api/v1/push/subscribe`)

**Handler de push (`sw-push-handler.js`):**
- Escucha eventos `push` y muestra notificación con título, cuerpo e ícono
- Escucha `notificationclick` y abre/enfoca la app

**Nota:** Requiere HTTPS en producción. En localhost funciona como excepción del navegador.

---

## 8. Capa HTTP y Comunicación

### 8.1 Interceptores

| Interceptor | Responsabilidad |
|---|---|
| `JwtInterceptor` | Adjunta `Authorization: Bearer <token>` a todas las peticiones |
| `ErrorInterceptor` | Captura 401 (redirige a login), 403, 404, 500 con mensajes en español |

### 8.2 Servicios HTTP por Feature

| Servicio | Endpoints |
|---|---|
| `GlucoseService` | register, getHistory, getStats, delete, exportCsv, exportJson |
| `NutritionService` | registerMeal, getDailySummary, getHistory, searchFoods |
| `VitalsService` | register, getLatest, getHistory, getHba1cTrend |
| `ExerciseService` | register, getHistory |
| `MedicationService` | register, getAll, deactivate |
| `AlertService` | getAlerts |
| `ProfileService` | getById, update |
| `MenstrualCycleService` | register, getStatus |
| `PushNotificationService` | requestPermissionAndSubscribe, unsubscribe |

### 8.3 Exportación de datos

`GlucoseService` incluye métodos de exportación:
```typescript
exportCsv(patientId, from, to): Observable<Blob>
exportJson(patientId, from, to): Observable<Blob>
```

La descarga se maneja con `URL.createObjectURL` y un `<a>` element creado dinámicamente.

---

## 9. Estándares Técnicos y de Código

### 9.1 Convenciones de Nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes | PascalCase + `Component` | `GlucoseRegisterComponent` |
| Servicios | PascalCase + `Service` | `GlucoseService`, `AuthService` |
| Interfaces | PascalCase (sin prefijo `I`) | `GlucoseReading`, `Patient` |
| Enums | PascalCase | `GlucoseStatus`, `MealType` |
| NgRx Actions | `[Feature] Verb Noun` | `[Glucose] Load Stats Success` |
| NgRx Selectors | `select` + Feature + Property | `selectStats`, `selectLoading` |
| Archivos | kebab-case | `glucose-register.component.ts` |
| CSS Classes | BEM | `glucose-card__value--critical` |
| Rutas URL | kebab-case | `/glucose/insulin-calculator` |

### 9.2 Reglas TypeScript

- `strict: true` en `tsconfig` — sin `any` implícito
- Nunca usar tipo `any`. Alternativa: `unknown` con type guards
- Interfaces para modelos de datos
- Funciones puras para transformaciones de datos

### 9.3 Reglas de Componentes Angular

- Todos los componentes son **Standalone Components**
- `inject()` para inyección de dependencias (no constructor)
- Signals para estado local (`signal()`, `computed()`)
- HTML, SCSS y TypeScript siempre en archivos separados — nunca `template` o `styles` inline
- Un componente por archivo
- Lógica de negocio en servicios, nunca directamente en el componente

### 9.4 Reglas de ECharts

- **Nunca** usar getters para leer el tema — causan loop infinito de detección de cambios
- Leer `document.documentElement.getAttribute('data-theme')` una sola vez al inicio de `ngOnChanges`
- Pasar el flag `dark` como parámetro a los métodos privados de construcción de opciones

---

## 10. Rendimiento y Optimización

### 10.1 Lazy Loading

- Cada feature se carga de forma lazy mediante `loadComponent` / `loadChildren`
- El bundle inicial incluye únicamente: core, auth y shell de layout

### 10.2 Caché

- NgRx Store con TTL de 5 minutos para estadísticas de glucosa
- Service Worker para caché de assets y respuestas de API en producción
- `GlucoseStateService` como singleton para evitar peticiones HTTP adicionales en el navbar

### 10.3 Métricas Objetivo

| Métrica | Objetivo |
|---|---|
| LCP | < 2.5 segundos |
| FID | < 100 ms |
| CLS | < 0.1 |
| Bundle inicial | < 2 MB |

---

## 11. Accesibilidad

> Objetivo: cumplimiento **WCAG 2.1 nivel AA**

- Todos los íconos sin texto visible incluyen `aria-label` descriptivo
- Contraste mínimo de colores: 4.5:1 para texto normal
- Navegación completa por teclado
- ARIA live regions para alertas de glucosa
- Focus visible en todos los elementos interactivos
- Formularios con `<label>` asociados explícitamente
- Mensajes de error asociados al campo con `aria-describedby`
- Gráficas con tooltips descriptivos como alternativa accesible

---

*DiabeCare Frontend Documentation v2.0*
