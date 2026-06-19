# DiabeCare — Frontend Architecture & Technical Documentation

> **Angular 21 | Arquitectura Feature-Based | Design System "Calm Health"**

| Campo | Valor |
|---|---|
| Versión | 3.0.0 |
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
7. [Notificaciones (Push + Inmediatas)](#7-notificaciones-push--inmediatas)
8. [Gestión de Cuenta](#8-gestión-de-cuenta)
9. [Selector de Rango de Fechas](#9-selector-de-rango-de-fechas)
10. [UX de Formularios — Botón "Ahora"](#10-ux-de-formularios--botón-ahora)
11. [Capa HTTP y Comunicación](#11-capa-http-y-comunicación)
12. [Estándares Técnicos y de Código](#12-estándares-técnicos-y-de-código)
13. [Rendimiento y Optimización](#13-rendimiento-y-optimización)
14. [Accesibilidad](#14-accesibilidad)

---

## 1. Visión General

### 1.1 Objetivos de la Interfaz

- Registro rápido de glucosa con fecha/hora actual por defecto (máximo 3 taps/clics)
- Dashboard centralizado con métricas visuales, alertas de patrón y accesos rápidos
- Correlación visual entre glucosa, comidas y ejercicio sin saturar la gráfica
- Sistema de alertas clínicas inteligentes con notificación inmediata tras cada registro
- Notificaciones push nativas para alertas asíncronas (resumen semanal)
- Diseño responsive, modo oscuro, PWA instalable
- Selección flexible de rangos de fecha donde el caso de uso lo justifica (historial de glucosa, reportes) — evaluado y descartado donde no aporta valor (tendencia HbA1c)

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
│   ├── core/
│   │   ├── auth/                  # AuthService (getUserId via JWT claim,
│   │   │                          #   getPatientId, logout), JwtInterceptor
│   │   ├── interceptors/          # JwtInterceptor, ErrorInterceptor
│   │   ├── layout/                # Shell, Navbar, Sidebar
│   │   └── services/              # ThemeService, MetadataService,
│   │                              # GlucoseStateService, PushNotificationService,
│   │                              # AlertService, SystemConfigService,
│   │                              # AccountService
│   ├── shared/
│   │   ├── components/            # AlertsPanel
│   │   └── models/                # Interfaces TypeScript del dominio
│   ├── store/
│   │   └── glucose/               # NgRx store de glucosa
│   └── features/
│       ├── auth/                  # Login (maneja códigos de error
│       │                          #   ACCOUNT_SUSPENDED, INVALID_CREDENTIALS), Register
│       ├── dashboard/              # Vista principal con métricas
│       ├── glucose/                # Registro, historial (selector de rango +
│       │                          #   gráfica rediseñada), calculadora de insulina
│       ├── nutrition/               # Registro de comidas
│       ├── vitals/                  # Signos vitales, ejercicio
│       ├── medications/              # Medicamentos
│       ├── reports/                  # Reportes PDF
│       └── profile/                  # Perfil, ciclo menstrual, tab "Cuenta"
├── public/
│   ├── manifest.webmanifest
│   └── icons/
└── styles/
    ├── tokens.scss
    ├── mixins.scss
    └── theme.scss
```

---

## 3. Sistema de Diseño "Calm Health"

Sin cambios respecto a la versión anterior — ver paleta y tipografía en `README-web.md`. Reglas de estilo relevantes a esta sesión:

- Confirmaciones de acciones destructivas (suspender/eliminar cuenta) van en una **banda separada debajo** de la acción, no inline con `justify-content: space-between` — el patrón inline comprime el texto y los botones, volviéndolos ilegibles
- Botones `mat-raised-button[color="warn"]` requieren forzar `color: #FFFFFF` vía `::ng-deep` — Angular Material no siempre aplica buen contraste de texto por defecto en ese combo
- Íconos de Material deben verificarse que existan en la fuente cargada — `delete_forever` causó ícono roto en este proyecto; `delete` es más seguro

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

### 4.2 Navbar

- Chip de glucosa (color semántico, vía `GlucoseStateService`)
- Campana de notificaciones push
- Toggle modo oscuro/claro
- Menú de usuario (perfil, cerrar sesión)

---

## 5. Componentes Reutilizables Clave

### 5.1 `AlertsPanelComponent`

Sin cambios funcionales esta sesión, pero corrigió un bug de Angular: el `@for` usaba `track alert.type`, que producía claves duplicadas (`NG0955`) cuando había múltiples alertas `GLUCOSE_PATTERN_DETECTED`. Corregido a `track $index`.

### 5.2 `GlucoseChartComponent` — rediseño completo

**Problema original**: con `markLine` mostrando texto rotado dentro de la gráfica ("🍽 Desayuno\n180 kcal"), las etiquetas se solapaban e ilegibles en cuanto había 2+ eventos cercanos en el tiempo — y con muy pocos puntos de glucosa (ej. 1 sola lectura), **todos** los eventos de fechas completamente distintas se vinculaban falsamente al único punto disponible.

**Solución implementada**:

1. **Líneas verticales sin texto** — `markLine` solo dibuja la línea discontinua (teal=comida, índigo=ejercicio), sin `label`
2. **Tooltip enriquecido al hover** — muestra glucosa + tipo de lectura + eventos relacionados (si los hay)
3. **Ventana de tolerancia temporal** (`MAX_GAP_MS = 2 horas`) — un evento solo se considera "relacionado" con una lectura de glucosa si ocurrió dentro de ±2 horas; si no hay ninguna lectura cercana, el evento ni se dibuja como línea ni aparece en el tooltip de ninguna lectura
4. **Lista "Eventos registrados" debajo de la gráfica** — muestra TODOS los eventos (comida + ejercicio) ordenados cronológicamente, sin el filtro de tolerancia temporal — preserva la información completa sin saturar la gráfica

```typescript
interface TimelineEvent {
    type: 'meal' | 'exercise';
    time: Date;
    icon: string;
    title: string;
    detail: string;
}

private readonly MAX_GAP_MS = 2 * 60 * 60 * 1000; // 2 horas

private hasNearbyReading(isoTime: string, sorted: GlucoseReadingResponse[]): boolean {
    const target = new Date(isoTime).getTime();
    return sorted.some(r => Math.abs(new Date(r.measuredAt).getTime() - target) <= this.MAX_GAP_MS);
}

private eventsNear(measuredAt: string): TimelineEvent[] {
    const readingTime = new Date(measuredAt).getTime();
    return this.timelineEvents.filter(e =>
        Math.abs(e.time.getTime() - readingTime) <= this.MAX_GAP_MS
    );
}
```

**Inyecta `MetadataService`** para resolver labels de tipos de comida/ejercicio en los eventos de la línea de tiempo, evitando mapas hardcodeados duplicados del backend.

### 5.3 `Hba1cChartComponent`

`connectNulls: true` agregado en la serie de línea — con datos esparcidos (ej. registros solo en enero y junio dentro de un rango de 6 meses), la línea de HbA1c ahora se dibuja conectando los puntos disponibles en lugar de aparecer como puntos aislados sin conexión visual.

**Decisión**: se evaluó agregar un selector de rango de fechas libre (similar al de glucosa) y se **descartó** — para una métrica de tendencia de largo plazo como HbA1c, los atajos estándar (3/6/12 meses) ya cubren los patrones de revisión clínica real (trimestral, semestral, anual). Un rango arbitrario no aporta valor clínico adicional aquí, a diferencia del historial diario de glucosa.

### 5.4 `CycleCalendarComponent`

Sin cambios funcionales. Fix de UX: el `mat-tab-group` del perfil ahora dispara `window.dispatchEvent(new Event('resize'))` al cambiar de tab (con `setTimeout` de 50ms), corrigiendo el warning `[ECharts] Can't get DOM width or height` que ocurría porque ECharts se inicializaba mientras el tab "Ciclo menstrual" aún tenía `display: none`.

### 5.5 `InsulinCalculatorComponent`

Sin cambios esta sesión.

---

## 6. State Management

Sin cambios estructurales — ver `SystemConfigService` (sección de servicios core) que ya centraliza colores semánticos, labels y configuración visual (fases de ciclo, íconos, síntomas), eliminando mapas hardcodeados duplicados que existían en `GlucoseStateService`, `AlertsPanelComponent`, `DashboardComponent`, `CycleCalendarComponent`, `MenstrualCycleComponent`, `GlucoseChartComponent`, `GlucoseHistoryComponent`.

### 6.1 SystemConfigService

```typescript
interface SystemConfigItem {
    key: string; value: string; dataType: string;
    category: string; description: string;
}
```

Métodos relevantes:
- `getInt/getDecimal/getString(key)` — lee parámetros de `system_config` (backend)
- `getGlucoseStatusColor/Bg/Label(status, isDark)` — semántica de color para `GlucoseStatus`
- `getAlertColor/Bg(severity, isDark)` — semántica de color para `AlertSeverity`
- `getCyclePhaseColor/Icon(phase)`, `phaseConfig` (Record completo) — fases del ciclo
- `getSymptomLabel(symptom)` — labels de síntomas del ciclo menstrual

Cargado al inicio en `shell.component.ts` junto con `MetadataService.loadAll()`.

---

## 7. Notificaciones (Push + Inmediatas)

### 7.1 Decisión: WebSockets descartado

Se evaluó implementar WebSockets para alertas en tiempo real y se **descartó** tras análisis: las alertas se calculan on-demand (`GetAlertsUseCase`), no hay eventos asíncronos espontáneos del servidor. El único caso de uso real — "tras registrar algo, quiero saber si se generó una alerta" — se resuelve completamente con una consulta HTTP normal inmediatamente después del registro, sin el costo de infraestructura de WebSockets (gestión de sesiones, reconexión, nuevo módulo backend).

### 7.2 AlertService — detección de alertas nuevas

```typescript
@Injectable({ providedIn: 'root' })
export class AlertService {
    private readonly lastKnownSignatures = signal<Set<string>>(new Set());

    getAlerts(patientId: string): Observable<AlertResponse[]>;

    // Llamado una vez al cargar el dashboard — sincroniza el set de "conocidas"
    primeKnownAlerts(patientId: string): void;

    // Llamado tras un registro exitoso — retorna SOLO las alertas nuevas
    getNewAlerts(patientId: string): Observable<AlertResponse[]>;

    private signatureOf(alert: AlertResponse): string {
        return `${alert.title}|${alert.message}`;  // no solo título
    }
}
```

**Bug corregido durante implementación**: comparar solo por `title` producía falsos negativos — alertas de patrón (ej. "Patrón: hipoglucemias frecuentes") mantienen el mismo título indefinidamente mientras el conteo de episodios cambia en el `message` ("7 episodios" → "8 episodios"). La firma de comparación se cambió a `título|mensaje`.

### 7.3 Patrón de uso en formularios de registro

**Con navegación** (`glucose-register`, `meal-log` — navegan tras guardar):
```typescript
private checkAlertsThenNavigate(patientId: string): void {
    this.alertService.getNewAlerts(patientId).subscribe({
        next: newAlerts => {
            this.router.navigate([...]);
            if (newAlerts.length > 0) {
                setTimeout(() => {
                    this.snackBar.open(`⚠ ${newAlerts[0].title}`, 'Ver', { duration: 6000 });
                }, 400); // delay para no chocar con el snackbar de éxito / transición de ruta
            }
        },
        error: () => this.router.navigate([...])
    });
}
```

**Sin navegación** (`exercise-log` — permanece en la misma vista):
```typescript
private notifyIfNewAlert(patientId: string): void {
    this.alertService.getNewAlerts(patientId).subscribe({
        next: newAlerts => {
            if (newAlerts.length === 0) return;
            setTimeout(() => {
                this.snackBar.open(`⚠ ${newAlerts[0].title}`, 'Ver', { duration: 6000 })
                    .onAction().subscribe(() => this.router.navigate(['/app/dashboard']));
            }, 400);
        },
        error: () => {}
    });
}
```

### 7.4 Push Notifications (sin cambios)

Web Push API con claves VAPID, suscripción vía `PushNotificationService`, usado para el resumen semanal automático. Ver versión anterior de esta documentación para el flujo completo.

---

## 8. Gestión de Cuenta

### 8.1 AccountService

```typescript
@Injectable({ providedIn: 'root' })
export class AccountService {
    suspend(userId: string): Observable<void>;  // PATCH /api/v1/account/{userId}/suspend
    delete(userId: string): Observable<void>;   // DELETE /api/v1/account/{userId}
}
```

### 8.2 AuthService — getUserId()

```typescript
getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload?.userId ?? null;  // claim agregado en backend esta sesión
    } catch {
        return null;
    }
}
```

> **Nota de implementación**: inicialmente se intentó usar el claim `sub` del JWT (que contiene el email), causando un error 500 en backend al intentar parsear el email como UUID. Se corrigió agregando un claim `userId` dedicado en la generación del token (ver documentación de backend, sección 7).

### 8.3 UI — `profile.component.ts`, tab "Cuenta"

Confirmación de dos pasos (`confirmSuspend`/`confirmDelete` signals) — primer clic muestra la confirmación, segundo clic ejecuta. La confirmación se renderiza en una banda separada debajo de la acción (no inline), con fondo `--color-surface-variant` y borde izquierdo rojo, evitando el problema de legibilidad de la versión inicial (texto y botones comprimidos por `justify-content: space-between`).

Tras suspender/eliminar exitosamente: snackbar de confirmación → `setTimeout` de 2s → `authService.logout()` + redirección a `/auth/login`.

---

## 9. Selector de Rango de Fechas

### 9.1 Patrón replicado de `ReportComponent`

`GlucoseHistoryComponent` implementa un menú desplegable (`mat-menu`) con atajos rápidos (7/30/90/180 días) + sección de rango personalizado con `MatDatepicker` para "Desde"/"Hasta", consolidados en un único control en lugar de chips fijos ocupando espacio permanente en el header.

```typescript
readonly quickRanges = [
    { label: 'Últimos 7 días',  days: 7 },
    { label: 'Últimos 30 días', days: 30 },
    { label: 'Últimos 90 días', days: 90 },
    { label: 'Últimos 6 meses', days: 180 }
];

rangeForm: FormGroup = this.fb.group({
    from: [this.daysAgo(30), Validators.required],
    to:   [new Date(), Validators.required]
});
```

El rango seleccionado (`getRangeIso()`) alimenta tanto la carga de gráfica/tabla (`loadHistory()`) como la exportación CSV/JSON — un único punto de verdad para el rango activo.

### 9.2 Fix de overlay

`mat-menu` por defecto limita `max-width`, cortando el contenido del rango personalizado. Como `mat-menu` se renderiza en un overlay fuera del árbol del componente, requiere `::ng-deep` a nivel de archivo (no anidado dentro de la clase del componente) para alcanzar `.mat-mdc-menu-panel`:

```scss
::ng-deep .glucose-history__range-menu .mat-mdc-menu-panel {
  max-width: 320px !important;
  width: 320px;
}
```

---

## 10. UX de Formularios — Botón "Ahora"

### 10.1 Motivación

Reducir fricción en el caso más común: registrar una medición en el momento en que ocurre. El campo de fecha/hora ya cargaba el instante actual por defecto, pero no había forma rápida de "resetear" a la hora actual si el usuario tardó en completar el formulario.

### 10.2 Patrón aplicado

En `glucose-register`, `exercise-log`, `meal-log` (signos vitales ya lo tenía):

```typescript
private nowAsLocalIso(): string {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

setNow(): void {
    this.form.patchValue({ measuredAt: this.nowAsLocalIso() }); // o el campo correspondiente
}
```

```html
<mat-form-field appearance="outline">
  <mat-label>Fecha y hora</mat-label>
  <input matInput formControlName="measuredAt" type="datetime-local" />
  <button mat-icon-button matSuffix type="button" (click)="setNow()" matTooltip="Usar fecha y hora actual">
    <mat-icon>schedule</mat-icon>
  </button>
</mat-form-field>
```

**Bug corregido**: el valor por defecto original usaba `new Date().toISOString().slice(0, 16)` directamente, que convierte a **UTC** — en Colombia (UTC-5) esto mostraba la hora 5 horas adelantada en el campo `datetime-local`. `nowAsLocalIso()` corrige el offset antes de formatear.

---

## 11. Capa HTTP y Comunicación

Sin cambios estructurales en interceptores. Servicios nuevos esta sesión: `AccountService`, `SystemConfigService` (ya cubierto en sección 6).

---

## 12. Estándares Técnicos y de Código

### 12.1 Convenciones (sin cambios respecto a versión anterior)

Ver tabla completa en versión previa. Adición: NgRx Actions y Selectors siguen el patrón `[Feature] Verb Noun` / `select` + Feature + Property — sin cambios esta sesión, NgRx no se tocó.

### 12.2 Reglas nuevas derivadas de esta sesión

- **`@for` track expression**: nunca usar un campo no garantizado único (como `alert.type` cuando puede repetirse) — usar `$index` si no hay un identificador único real
- **`datetime-local` inputs**: siempre usar un helper que corrija el offset de timezone, nunca `toISOString()` directo
- **Comparación de objetos para detectar "cambios"**: comparar por una firma compuesta de los campos relevantes, no por un único campo que pueda repetirse con datos distintos (ej. `título|mensaje`, no solo `título`)
- **Vinculación temporal de eventos a una métrica puntual**: siempre aplicar una ventana de tolerancia máxima — vincular "el evento más cercano sin importar qué tan lejos esté" produce resultados engañosos cuando hay pocos puntos de referencia

---

## 13. Rendimiento y Optimización

Sin cambios respecto a la versión anterior — NgRx con TTL 5 min, Service Worker, lazy loading por feature.

---

## 14. Accesibilidad

Sin cambios — ver versión anterior para el detalle completo (WCAG 2.1 AA, aria-labels, contraste, navegación por teclado).

---

*DiabeCare Frontend Documentation v3.0*
