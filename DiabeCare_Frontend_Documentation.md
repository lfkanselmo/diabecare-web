# DiabeCare — Frontend Architecture & Technical Documentation

> **Angular 17+ | Arquitectura Modular | Design System**

| Campo | Valor |
|---|---|
| Versión | 1.0.0 |
| Framework | Angular 17+ (Standalone Components) |
| UI Library | Angular Material + ECharts |
| State Mgmt | NgRx + Angular Signals |
| Estilos | SCSS + Design Tokens |
| Estado | Documento Base — Proyecto de Práctica |

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Arquitectura del Frontend](#2-arquitectura-del-frontend)
3. [Sistema de Diseño](#3-sistema-de-diseño)
4. [Pantallas y Navegación](#4-pantallas-y-navegación)
5. [Componentes Reutilizables Clave](#5-componentes-reutilizables-clave)
6. [State Management con NgRx](#6-state-management-con-ngrx)
7. [Capa HTTP y Comunicación](#7-capa-http-y-comunicación)
8. [Estándares Técnicos y de Código](#8-estándares-técnicos-y-de-código)
9. [Rendimiento y Optimización](#9-rendimiento-y-optimización)
10. [Estrategia de Testing](#10-estrategia-de-testing)
11. [Accesibilidad](#11-accesibilidad)

---

## 1. Visión General

### 1.1 Objetivos de la Interfaz

- Interfaz intuitiva para registro rápido de glucosa (máximo 3 taps/clics)
- Dashboard centralizado con métricas visuales y tendencias
- Diseño responsive: funcional en desktop, tablet y mobile
- Sistema de alertas visuales para valores fuera de rango
- Generación y descarga de reportes para consultas médicas
- Modo oscuro opcional para uso nocturno (mediciones de madrugada)

### 1.2 Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Framework | Angular 17+ con Standalone Components |
| Lenguaje | TypeScript 5.x (strict mode) |
| Estilos | SCSS con Design Tokens + CSS Custom Properties |
| UI Components | Angular Material 17 |
| Gráficas | Apache ECharts (ngx-echarts) |
| State Management | NgRx 17 + Angular Signals |
| HTTP Client | Angular HttpClient con Interceptors |
| Formularios | Reactive Forms con validadores personalizados |
| Routing | Angular Router con Guards y Resolvers |
| Testing | Jest + Angular Testing Library + Cypress |
| Build | Angular CLI + esbuild |
| Linting | ESLint + Angular ESLint + Prettier |

---

## 2. Arquitectura del Frontend

### 2.1 Patrón: Feature-Based Architecture

La aplicación se organiza por **features** (dominio funcional) en lugar de por tipo técnico. Cada feature es un módulo autocontenido con sus propios componentes, servicios, estado y rutas.

### 2.2 Estructura de Carpetas

```
src/
├── app/
│   ├── core/                      # Singleton: guards, interceptors, servicios globales
│   │   ├── auth/                  # AuthService, AuthGuard, JwtInterceptor
│   │   ├── http/                  # ApiService base, ErrorInterceptor, LoadingInterceptor
│   │   ├── layout/                # AppShell, Navbar, Sidebar, Footer
│   │   └── services/              # StorageService, NotificationService, ThemeService
│   ├── shared/
│   │   ├── components/            # Componentes reutilizables (cards, charts-wrapper, badges)
│   │   ├── directives/            # Directivas personalizadas
│   │   ├── pipes/                 # GlucoseStatusPipe, CaloriesPipe, DateLocalePipe
│   │   ├── models/                # Interfaces TypeScript del dominio
│   │   ├── validators/            # Validadores reactivos personalizados
│   │   └── utils/                 # Funciones utilitarias puras
│   ├── features/
│   │   ├── auth/                  # Login, registro, forgot-password
│   │   ├── dashboard/             # Vista principal con métricas
│   │   ├── glucose/               # Registro y historial de glucosa
│   │   ├── nutrition/             # Registro de comidas y calorías
│   │   ├── vitals/                # Signos vitales (peso, PA, FC)
│   │   ├── medications/           # Medicamentos e insulina
│   │   ├── reports/               # Reportes y exportación PDF
│   │   └── profile/               # Perfil del paciente y configuración
│   └── app.config.ts              # Standalone bootstrap config
├── assets/
│   ├── i18n/                      # Archivos de traducción (es.json)
│   └── icons/                     # SVG icons set
└── styles/
    ├── _tokens.scss               # Design tokens (colores, tipografía, espaciado)
    ├── _mixins.scss               # Mixins SCSS globales
    └── _themes.scss               # Tema claro y oscuro
```

### 2.3 Estructura Interna de un Feature

```
features/glucose/
├── components/
│   ├── glucose-register/          # Formulario de registro rápido
│   ├── glucose-history/           # Tabla/lista con historial
│   ├── glucose-chart/             # Gráfica de tendencia
│   └── glucose-stats-card/        # Cards con TIR, promedio, CV
├── services/
│   └── glucose.service.ts         # HTTP calls al backend
├── store/                         # NgRx: actions, reducers, effects, selectors
│   ├── glucose.actions.ts
│   ├── glucose.reducer.ts
│   ├── glucose.effects.ts
│   └── glucose.selectors.ts
├── models/
│   └── glucose.model.ts           # Interfaces: GlucoseReading, GlucoseStats
├── guards/
│   └── glucose-data.resolver.ts   # Precarga datos antes de activar ruta
└── glucose.routes.ts              # Rutas lazy-loaded del feature
```

---

## 3. Sistema de Diseño

### 3.1 Paleta de Colores

| Nombre | Hex | Uso Principal | Contexto DiabeCare |
|---|---|---|---|
| Primary Blue | `#1565C0` | Acciones principales, nav | Botones CTA, header |
| Success Green | `#2E7D32` | Valores en rango normal | Glucosa en rango, metas cumplidas |
| Warning Amber | `#F57F17` | Valores límite o alertas | Glucosa alta, calorías al límite |
| Danger Red | `#C62828` | Valores críticos, errores | Hipoglucemia, hiperglucemia severa |
| Info Teal | `#00695C` | Información secundaria | Estadísticas, datos históricos |
| Neutral Gray | `#546E7A` | Texto secundario, bordes | Labels, separadores, iconos |
| Background | `#F5F7FA` | Fondo principal | Fondo de pantallas |
| Surface White | `#FFFFFF` | Superficies elevadas | Cards, modales, panels |

### 3.2 Tipografía

| Estilo | Especificación | Uso |
|---|---|---|
| Font Family | Inter (Google Fonts) | Fuente principal — alta legibilidad en pantallas |
| H1 Títulos | 28px / 700 Bold | Títulos de sección principales |
| H2 Subtítulos | 22px / 600 SemiBold | Títulos de cards y módulos |
| H3 Terciario | 18px / 600 SemiBold | Subtítulos internos |
| Body Large | 16px / 400 Regular | Texto principal de lectura |
| Body Small | 14px / 400 Regular | Labels, descripciones secundarias |
| Caption | 12px / 400 Regular | Timestamps, notas, ayudas |
| Metric Numbers | 36px / 700 Bold | Valores de glucosa y calorías |

### 3.3 Design Tokens (SCSS)

```scss
// styles/_tokens.scss
:root {
  // Colores semánticos
  --color-primary:    #1565C0;
  --color-success:    #2E7D32;
  --color-warning:    #F57F17;
  --color-danger:     #C62828;
  --color-info:       #00695C;
  --color-surface:    #FFFFFF;
  --color-background: #F5F7FA;
  --color-text:       #1C2833;
  --color-text-muted: #546E7A;

  // Estados de glucosa
  --glucose-low:      #C62828;   // < 70 mg/dL     → hipoglucemia
  --glucose-normal:   #2E7D32;   // 70–180 mg/dL   → en rango
  --glucose-high:     #F57F17;   // 180–250 mg/dL  → elevado
  --glucose-critical: #880E4F;   // > 250 mg/dL    → crítico

  // Espaciado
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;
  --space-2xl: 48px;

  // Bordes y sombras
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --shadow-sm: 0 1px 4px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
}
```

---

## 4. Pantallas y Navegación

### 4.1 Estructura de Rutas

```
/ (root)
├── /auth
│   ├── /login                # Inicio de sesión
│   ├── /register             # Registro de cuenta
│   └── /forgot-password      # Recuperación de contraseña
└── /app  (AuthGuard requerido)
    ├── /dashboard             # Vista principal: métricas del día
    ├── /glucose
    │   ├── /register          # Formulario rápido de registro
    │   └── /history           # Historial con filtros y gráficas
    ├── /nutrition
    │   ├── /log               # Registro de comida del día
    │   └── /history           # Historial nutricional
    ├── /vitals                # Registro de peso, PA, FC, HbA1c
    ├── /medications           # Lista y registro de medicamentos
    ├── /reports               # Generación de reportes PDF
    └── /profile               # Configuración del perfil paciente
```

### 4.2 Inventario de Pantallas

| Pantalla | Feature | Contenido Principal |
|---|---|---|
| Dashboard | `dashboard` | Resumen del día: glucosa actual, calorías, medicamentos pendientes, TIR semanal |
| Registrar Glucosa | `glucose` | Formulario: valor, tipo medición, fecha/hora, notas. Indicador de rango inmediato |
| Historial de Glucosa | `glucose` | Tabla filtrable + gráfica de líneas por período. Stats: promedio, CV, TIR |
| Registrar Comida | `nutrition` | Buscador de alimentos + lista de items + totales macro/calóricos en tiempo real |
| Historial Nutricional | `nutrition` | Gráfica de calorías diarias, distribución de macros por semana |
| Signos Vitales | `vitals` | Formulario de peso/PA/FC + gráficas de tendencia para cada signo |
| Medicamentos | `medications` | Lista de medicamentos activos, historial de tomas, checklist diario |
| Reportes | `reports` | Selector de rango de fechas + tipo de reporte + preview + descarga PDF |
| Perfil / Configuración | `profile` | Datos personales, objetivos de glucosa, notificaciones, tema, unidades |

---

## 5. Componentes Reutilizables Clave

### 5.1 `GlucoseStatusBadge`

Recibe un valor de glucosa y renderiza un badge con color y etiqueta según el estado clínico:

```typescript
@Component({
  selector: 'dc-glucose-status-badge',
  standalone: true,
  template: `
    <span class="badge" [ngClass]="statusClass">
      {{ value }} {{ unit }} — {{ statusLabel }}
    </span>
  `
})
export class GlucoseStatusBadgeComponent {
  @Input() value!: number;
  @Input() unit: 'mg/dL' | 'mmol/L' = 'mg/dL';
  @Input() targetMin = 70;
  @Input() targetMax = 180;

  get statusClass(): string { /* 'low' | 'normal' | 'high' | 'critical' */ }
  get statusLabel(): string { /* 'Hipoglucemia' | 'En rango' | 'Elevado' | 'Crítico' */ }
}
```

### 5.2 `MetricCard`

Card genérica para mostrar una métrica con valor, unidad, tendencia y estado:

```html
<dc-metric-card
  title="Glucosa Promedio (7 días)"
  [value]="135"
  unit="mg/dL"
  [trend]="-5"
  trendLabel="vs semana anterior"
  status="normal"
/>
```

### 5.3 `GlucoseLineChart`

Gráfica de línea temporal de lecturas de glucosa con banda del rango objetivo:

- Banda verde horizontal: rango objetivo del paciente (configurable)
- Líneas de referencia: umbral de hipoglucemia (70) e hiperglucemia (180)
- Puntos coloreados según estado (rojo / verde / naranja)
- Tooltip detallado: valor, tipo de medición, fecha y hora
- Zoom y pan en el eje temporal

### 5.4 `FoodSearchInput`

Input con autocompletado para búsqueda de alimentos:

- Debounce de 300ms para evitar exceso de llamadas al API
- Muestra calorías y macros al seleccionar un alimento
- Permite ingresar gramaje personalizado con recalculo en tiempo real
- Caché local de últimos 20 alimentos usados (búsqueda sin conexión)

### 5.5 `AlertsBanner`

Banner contextual que aparece cuando hay valores que requieren atención:

- 🔴 **Hipoglucemia detectada**: alerta roja con botón de acción
- 🟠 **Medicamento sin tomar**: alerta naranja con recordatorio
- 🟡 **Meta calórica superada**: alerta amarilla informativa
- 🟢 **Streak positivo** (7 días en rango): alerta verde de felicitación

---

## 6. State Management con NgRx

### 6.1 Estructura del Store Global

```typescript
interface AppState {
  auth:        AuthState;        // usuario, token, loading, error
  glucose:     GlucoseState;     // readings[], stats, filters, loading
  nutrition:   NutritionState;   // meals[], dailySummary, foods[], loading
  vitals:      VitalsState;      // vitals[], latest, loading
  medications: MedicationState;  // medications[], todayLog, loading
  ui:          UiState;          // theme, sidebarOpen, notifications[]
}
```

### 6.2 Cuándo Usar NgRx vs Signals

| Escenario | Solución | Razón |
|---|---|---|
| Datos del servidor (lecturas de glucosa) | NgRx + Effects | Compartido entre múltiples componentes, cacheable |
| Estado de un formulario local | Component Signal | Solo vive dentro del componente |
| Tema (claro/oscuro) | NgRx + localStorage | Persiste entre sesiones, afecta toda la app |
| Apertura de un modal | Component Signal | Estado completamente local |
| Lista de alertas activas | NgRx | Generadas por efectos, leídas en varios lugares |

### 6.3 Convención de Nomenclatura NgRx

```typescript
// Actions  → [Feature] Descripción del evento
export const loadGlucoseReadings     = createAction('[Glucose] Load Readings', props<{ filters: GlucoseFilters }>());
export const loadGlucoseReadingsOk   = createAction('[Glucose] Load Readings Success', props<{ readings: GlucoseReading[] }>());
export const loadGlucoseReadingsFail = createAction('[Glucose] Load Readings Failure', props<{ error: string }>());

// Selectors → select + Feature + Property
export const selectGlucoseReadings = createSelector(selectGlucoseState, s => s.readings);
export const selectGlucoseLoading  = createSelector(selectGlucoseState, s => s.loading);
export const selectGlucoseTIR      = createSelector(selectGlucoseState, s => s.stats?.tir);
```

---

## 7. Capa HTTP y Comunicación

### 7.1 Interceptores

| Interceptor | Responsabilidad |
|---|---|
| `JwtInterceptor` | Adjunta `Authorization: Bearer <token>` a todas las peticiones al API |
| `ErrorInterceptor` | Captura 401 (refresca token o redirige a login), 403, 404, 500 con mensajes en español |
| `LoadingInterceptor` | Controla el estado global de carga (spinner) en el `UiState` del store |
| `LoggingInterceptor` | Solo en `dev`: loguea requests/responses en consola con timing |

### 7.2 Servicio Base

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl; // '/api/v1'

  get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`);
  }
}
```

---

## 8. Estándares Técnicos y de Código

### 8.1 Convenciones de Nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes | PascalCase + `Component` | `GlucoseRegisterComponent` |
| Servicios | PascalCase + `Service` | `GlucoseService`, `AuthService` |
| Interfaces / Modelos | PascalCase (sin prefijo `I`) | `GlucoseReading`, `Patient`, `MealEntry` |
| Enums | PascalCase | `GlucoseStatus`, `MealType`, `DiabetesType` |
| NgRx Actions | `[Feature] Verb Noun` | `[Glucose] Load Readings Success` |
| NgRx Selectors | `select` + Feature + Property | `selectGlucoseReadings` |
| Pipes | camelCase + `Pipe` | `glucoseStatusPipe`, `caloriesTotalPipe` |
| Archivos | kebab-case | `glucose-register.component.ts` |
| CSS Classes | BEM: `block__element--modifier` | `glucose-card__value--critical` |
| Rutas URL | kebab-case | `/glucose/register`, `/vital-signs` |
| Constantes | UPPER_SNAKE_CASE | `MAX_GLUCOSE_VALUE`, `TOKEN_KEY` |

### 8.2 Reglas TypeScript

- `strict: true` en `tsconfig` — sin `any` implícito, null checks habilitados
- Nunca usar tipo `any`. Alternativa: `unknown` con type guards o generics
- Interfaces para modelos de datos, no clases (salvo casos con lógica)
- `readonly` en propiedades de modelos que no deben mutar
- Funciones puras para transformaciones de datos (sin efectos secundarios)
- Destructuring explícito al consumir observables y selectores

### 8.3 Reglas de Componentes Angular

- Todos los componentes son **Standalone Components** (sin NgModules)
- `ChangeDetectionStrategy.OnPush` por defecto en todos los componentes
- Usar `async pipe` en templates para manejar Observables (evitar `subscribe` manual)
- `signal()` para inputs en componentes nuevos, `@Input()` para compatibilidad
- Un componente por archivo; máximo 300 líneas por componente
- Lógica de negocio en servicios o store, nunca directamente en el componente

---

## 9. Rendimiento y Optimización

### 9.1 Lazy Loading

- Cada feature se carga de forma lazy mediante `loadComponent` / `loadChildren`
- El bundle inicial incluye únicamente: core, auth y shell de layout
- Preloading strategy: `PreloadAllModules` después del primer render

### 9.2 Virtualización de Listas

- CDK Virtual Scroll para historial de lecturas con más de 50 registros
- Paginación del lado del servidor en tablas de historial (`pageSize: 20`)

### 9.3 Caché y Datos

- `shareReplay(1)` en HttpClient para evitar múltiples peticiones del mismo recurso
- IndexedDB (via `@ngx-pwa/local-storage`) para caché de alimentos frecuentes
- Expiración de caché: datos del día expiran al cambiar de día (midnight reset)

### 9.4 Métricas Objetivo (Core Web Vitals)

| Métrica | Objetivo |
|---|---|
| LCP — Largest Contentful Paint | < 2.5 segundos |
| FID — First Input Delay | < 100 ms |
| CLS — Cumulative Layout Shift | < 0.1 |
| Bundle inicial | < 200 KB (gzipped) |
| Lighthouse Score | > 90 en Performance, Accessibility y Best Practices |

---

## 10. Estrategia de Testing

### 10.1 Niveles de Testing

| Nivel | Herramienta | Objetivo | Qué se prueba |
|---|---|---|---|
| Unit | Jest | > 80% cobertura | Servicios, pipes, store (reducers, selectors) |
| Component | Angular Testing Library | Componentes clave | Renderizado, inputs/outputs, interacciones |
| Integration | Cypress Component | Flujos de feature | Registro de glucosa, búsqueda de alimentos |
| E2E | Cypress | Flujos críticos | Login, registro de glucosa, ver dashboard |

### 10.2 Casos E2E Prioritarios

- **Happy path**: login exitoso → dashboard → registrar glucosa → ver en historial
- **Registro de comida**: buscar alimento → agregar porción → calorías del día actualizadas
- **Alerta de hipoglucemia**: registrar glucosa < 70 → verificar banner de alerta
- **Generación de reporte**: seleccionar rango de fechas → descargar PDF

---

## 11. Accesibilidad

> Objetivo: cumplimiento **WCAG 2.1 nivel AA**

- Todos los íconos sin texto visible incluyen `aria-label` descriptivo
- Contraste mínimo de colores: 4.5:1 para texto normal, 3:1 para texto grande
- Navegación completa por teclado (Tab, Enter, Esc para modales)
- ARIA live regions para alertas de glucosa (anuncio a lectores de pantalla)
- Focus visible en todos los elementos interactivos
- Formularios con `<label>` asociados explícitamente (no solo `placeholder`)
- Mensajes de error asociados al campo con `aria-describedby`
- Gráficas con tabla de datos equivalente como alternativa accesible

---

*DiabeCare Frontend Documentation v1.0*
