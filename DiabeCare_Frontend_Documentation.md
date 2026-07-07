# DiabeCare — Frontend Architecture & Technical Documentation

> **Angular 21 | Arquitectura Feature-Based | Design System "Calm Health"**

| Campo | Valor |
|---|---|
| Versión | 4.0.0 |
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
7. [Sistema de Notificaciones](#7-sistema-de-notificaciones)
8. [Gestión de Cuenta y Sesiones](#8-gestión-de-cuenta-y-sesiones)
9. [Refresh Tokens — Flujo en Frontend](#9-refresh-tokens--flujo-en-frontend)
10. [Catálogo de Alimentos](#10-catálogo-de-alimentos)
11. [Selector de Rango de Fechas](#11-selector-de-rango-de-fechas)
12. [UX de Formularios — Botón "Ahora"](#12-ux-de-formularios--botón-ahora)
13. [Capa HTTP y Comunicación](#13-capa-http-y-comunicación)
14. [Estándares Técnicos y de Código](#14-estándares-técnicos-y-de-código)
15. [Rendimiento y Optimización](#15-rendimiento-y-optimización)
16. [Accesibilidad](#16-accesibilidad)

---

## 1. Visión General

### 1.1 Objetivos de la Interfaz

- Registro rápido de glucosa con fecha/hora actual por defecto (máximo 3 taps/clics)
- Dashboard centralizado con métricas visuales, alertas de patrón y accesos rápidos
- Correlación visual entre glucosa, comidas y ejercicio sin saturar la gráfica
- Sistema de alertas clínicas inteligentes con notificación inmediata tras cada registro, sin depender de overlays compartidos que puedan bloquear la interacción
- Notificaciones push nativas para alertas asíncronas (resumen semanal)
- Sesión persistente sin reautenticación constante — refresco automático de access token en segundo plano
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
│   │   │                          #   getPatientId, getRefreshToken, logout),
│   │   │                          #   AuthApiService (login/register/refresh/
│   │   │                          #   logout/logoutAll/getActiveSessions),
│   │   │                          #   TokenRefreshCoordinator
│   │   ├── interceptors/          # JwtInterceptor, ErrorInterceptor (401 → refresco
│   │   │                          #   automático + reintento; 403 → notificación)
│   │   ├── layout/                # Shell, Navbar (logout de sesión actual), Sidebar
│   │   └── services/              # ThemeService, MetadataService,
│   │                              # GlucoseStateService, PushNotificationService,
│   │                              # AlertService, SystemConfigService,
│   │                              # AccountService, NotificationService
│   ├── shared/
│   │   ├── components/            # AlertsPanel, NotificationBanner
│   │   └── models/                # Interfaces TypeScript del dominio (incluye
│   │                              # ActiveSession, RefreshTokenRequest/Response)
│   ├── store/
│   │   └── glucose/               # NgRx store de glucosa
│   └── features/
│       ├── auth/                  # Login (maneja códigos de error
│       │                          #   ACCOUNT_SUSPENDED, INVALID_CREDENTIALS,
│       │                          #   guarda refresh token), Register
│       ├── dashboard/              # Vista principal con métricas
│       ├── glucose/                # Registro, historial (selector de rango +
│       │                          #   gráfica rediseñada), calculadora de insulina
│       ├── nutrition/               # Registro de comidas (635 alimentos)
│       ├── vitals/                  # Signos vitales, ejercicio
│       ├── medications/              # Medicamentos
│       ├── reports/                  # Reportes PDF
│       └── profile/                  # Perfil, ciclo menstrual, tab "Cuenta"
│                                     #   (sesiones activas, logout-all)
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

### 6.2 Decisión: por qué NgRx solo para glucosa (2026-07-07)

`src/app/store/glucose/` es el único store real de NgRx en todo el proyecto — el resto de features (nutrición, vitales, medicamentos, ciclo) usa servicios `providedIn: 'root'` con Angular Signals. Existían carpetas `features/{glucose,medications,nutrition,vitals}/store/` vacías, restos de un plan de "NgRx por feature" que se evaluó y abandonó sin documentar la decisión ni borrar el andamiaje — eliminadas en esta sesión.

**Por qué glucosa sí usa NgRx y el resto no:**
- Glucosa es el único dominio con estado *derivado* no trivial que se consume desde múltiples componentes hermanos a la vez (dashboard, navbar, historial) con una necesidad real de caché con TTL — encaja con lo que NgRx resuelve bien (selectors memoizados, un solo punto de verdad para datos que varias vistas leen sin relación jerárquica directa entre ellas).
- El resto de features expone estado que un único componente "dueño" consume casi en exclusiva (formulario + su propia lista), donde un signal en un servicio ya es la fuente única de verdad sin necesidad de acciones/reducers/efectos.

**Si se agrega una feature nueva:** por defecto, usar signals + servicio (el patrón mayoritario). Justificar NgRx explícitamente aquí solo si aparece la misma necesidad de caché compartido entre vistas no relacionadas — no por consistencia superficial con "cómo se hizo glucosa".

---

## 7. Sistema de Notificaciones

### 7.1 Bug de origen: overlay huérfano bloqueando clics

El mecanismo original usaba `MatSnackBar`. Tras registrar una lectura de glucosa: se abría un snackbar de éxito, se navegaba al historial, y ~400ms después (vía `setTimeout`) se abría un *segundo* snackbar si había una alerta nueva — todo en mitad de una transición de ruta. `MatSnackBar` comparte el mismo `CdkOverlay` que `mat-menu` y `mat-datepicker`; reemplazar overlays durante una navegación de ruta podía dejar el anterior "huérfano" (detached pero no destruido), bloqueando clics en la página de destino **sin mostrarse visualmente**. Síntoma reportado: tras registrar una lectura, el botón "Nueva lectura" en el historial dejaba de responder, sin verse deshabilitado.

### 7.2 Solución: NotificationService global, sin CdkOverlay

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
    private readonly notifications = signal<AppNotification[]>([]);
    readonly visible = this.notifications.asReadonly();

    success(title: string, message?: string, autoDismissMs = 4000): void;
    info(title: string, message?: string, autoDismissMs = 4000): void;
    warning(title: string, message?: string, autoDismissMs = 4000, action?: NotificationAction): void;
    danger(title: string, message?: string, autoDismissMs = 4000): void;
    showAlert(alert: AlertResponse, autoDismissMs = 4000, action?: NotificationAction): void;

    dismiss(id: number): void;
    clear(): void;
}
```

```typescript
// app.ts (componente raíz) — montado UNA SOLA VEZ
@Component({
    template: `
        <app-notification-banner />
        <router-outlet />
    `
})
export class AppComponent { }
```

`NotificationBannerComponent` usa `position: fixed` y vive en el `AppComponent`, no en cada página — sobrevive cualquier navegación, incluso entre `/app/**` y `/auth/**` (rutas hermanas, no anidadas). Nunca toca `CdkOverlay`, así que no puede reproducir el bug original.

Se migraron los **11 archivos** que usaban `MatSnackBar`: `glucose-register`, `glucose-history`, `meal-log`, `exercise-log`, `vitals`, `menstrual-cycle`, `profile`, `report`, `insulin-calculator`, `insulin-profile`, `medications`, `navbar`. Cero referencias a `MatSnackBar` en el proyecto tras la migración.

### 7.3 Por qué un servicio global y no un banner por página

La primera iteración pasó las notificaciones vía `Router.navigate(..., { state })` y un banner local en `glucose-history`. Funcionaba para ese caso puntual, pero no escalaba: cada flujo con navegación necesitaría su propio mecanismo de "consumir navigation state", y un mensaje no podía sobrevivir una navegación entre páginas hermanas como `/app/**` ↔ `/auth/**` (ej. "Cuenta eliminada, hasta luego" antes de ir a login). El diseño final es un único punto de entrada (`notificationService.success(...)`) sin que el caller necesite saber si va a navegar después o no.

### 7.4 AlertService — detección de alertas nuevas (sin cambios de fondo)

```typescript
@Injectable({ providedIn: 'root' })
export class AlertService {
    private readonly lastKnownSignatures = signal<Set<string>>(new Set());

    getAlerts(patientId: string): Observable<AlertResponse[]>;
    primeKnownAlerts(patientId: string): void;        // sincroniza al cargar el dashboard
    getNewAlerts(patientId: string): Observable<AlertResponse[]>;  // solo las nuevas

    private signatureOf(alert: AlertResponse): string {
        return `${alert.title}|${alert.message}`;  // no solo título
    }
}
```

La lógica de detección no cambió (comparación por firma `título|mensaje`, necesaria porque alertas de patrón mantienen el mismo título con datos distintos en el mensaje). Lo único que cambió es el canal de salida:

```typescript
// Antes:
this.snackBar.open(`⚠ ${newAlerts[0].title}`, 'Ver', { duration: 6000 });

// Ahora:
newAlerts.forEach(alert => this.notificationService.showAlert(alert));
// o con acción:
this.notificationService.showAlert(alert, undefined, {
    label: 'Ver',
    onClick: () => this.router.navigate(['/app/dashboard'])
});
```

Y, crucialmente, ya no hace falta el `setTimeout(400)` para "no chocar con el snackbar de éxito" ni separar el caso "con navegación" del caso "sin navegación" — el banner global no tiene ese problema de timing en ninguno de los dos casos.

### 7.5 Push Notifications (sin cambios)

Web Push API con claves VAPID, suscripción vía `PushNotificationService`, usado para el resumen semanal automático. Sin relación con el `NotificationService` de banner — son dos sistemas distintos: uno entrega mensajes asíncronos del servidor al sistema operativo (push), el otro muestra mensajes síncronos dentro de la propia app (banner).

---

## 8. Gestión de Cuenta y Sesiones

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

Tras suspender/eliminar exitosamente: notificación de confirmación (`NotificationService.success`, ver sección 7) → `setTimeout` de 2s → `authService.logout()` + redirección a `/auth/login`.

### 8.4 Sesiones activas (nuevo)

Misma pestaña "Cuenta", nueva sección entre "Suspender" y "Eliminar" — misma jerarquía visual y mismas clases SCSS (`profile__account-*`) que las acciones existentes:

```typescript
sessions = signal<ActiveSession[]>([]);
loadingSessions = signal(false);
confirmLogoutAll = signal(false);
loggingOutAll = signal(false);

ngOnInit(): void {
    this.loadProfile();
    this.loadSessions();   // GET /api/v1/auth/sessions/{userId}
}

onLogoutAllDevices(): void {
    if (!this.confirmLogoutAll()) { this.confirmLogoutAll.set(true); return; }
    // segundo clic: POST /api/v1/auth/logout-all { userId }
    // → limpia sesión local y redirige a login (esta acción SÍ cierra la sesión actual también)
}
```

Cada sesión en la lista muestra `deviceLabel` (ej. "Chrome en Windows") y `lastUsedAt ?? createdAt` formateado con `DatePipe`. El botón "Cerrar sesión en todos los dispositivos" usa la misma confirmación de dos pasos que suspender/eliminar cuenta, por consistencia de patrón — es una acción de alto impacto (cierra la sesión propia también) aunque no sea irreversible como eliminar la cuenta.

---

## 9. Refresh Tokens — Flujo en Frontend

### 9.1 Por qué se necesitó

El access token dura 15 minutos. Sin un mecanismo de refresco, cualquier sesión de uso normal (revisar el dashboard, registrar una comida, ver el historial) terminaba forzando un re-login. Esto se resolvió en conjunto con el backend (ver documentación de backend, sección 7.7) agregando refresh tokens; esta sección documenta exclusivamente la parte de frontend.

### 9.2 TokenRefreshCoordinator

```typescript
@Injectable({ providedIn: 'root' })
export class TokenRefreshCoordinator {
    private refreshing = false;
    private readonly refreshedToken$ = new BehaviorSubject<string | null>(null);

    refreshAccessToken(): Observable<string> {
        if (this.refreshing) {
            // Ya hay un refresco en curso — esperar su resultado en vez de disparar otro
            return this.refreshedToken$.pipe(
                filter((token): token is string => token !== null),
                take(1)
            );
        }

        const refreshToken = this.authService.getRefreshToken();
        if (!refreshToken) return throwError(() => new Error('NO_REFRESH_TOKEN'));

        this.refreshing = true;
        this.refreshedToken$.next(null);

        return this.authApiService.refresh({ refreshToken }).pipe(
            tap(response => {
                this.authService.saveAccessToken(response.accessToken, response.refreshToken);
                this.refreshing = false;
                this.refreshedToken$.next(response.accessToken);
            }),
            map(response => response.accessToken)
        );
    }

    onRefreshFailed(): void {
        this.refreshing = false;
        this.refreshedToken$.next(null);
    }
}
```

**Problema que resuelve**: un dashboard que dispara 5 peticiones en paralelo (`forkJoin`) y todas fallan con 401 al mismo tiempo no debe disparar 5 llamadas a `/refresh` — solo la primera dispara la llamada real; las siguientes 4 esperan el resultado vía el `BehaviorSubject` compartido.

Se evaluó implementar esto con variables de módulo (`let isRefreshing = false` a nivel de archivo) en una primera iteración y se descartó: rompe la inyectabilidad/testeabilidad y no es idiomático en Angular. Un servicio `providedIn: 'root'` logra el mismo singleton compartido de forma correcta.

### 9.3 error.interceptor.ts — orquestación completa

```typescript
const handleUnauthorized = () =>
    tokenRefreshCoordinator.refreshAccessToken().pipe(
        switchMap(newAccessToken =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${newAccessToken}` } }))
        ),
        catchError(() => {
            tokenRefreshCoordinator.onRefreshFailed();
            return redirectToLogin();   // limpia sesión, notifica, redirige a /auth/login
        })
    );

return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !isAuthEndpoint) return handleUnauthorized();
        if (error.status === 403 && !isAuthEndpoint) {
            notificationService.danger(apiError?.message ?? 'No tienes permiso...');
        }
        return throwError(() => error);
    })
);
```

`isAuthEndpoint` excluye `/api/v1/auth/**` de esta lógica — un 401 al hacer login (credenciales incorrectas) no debe disparar un intento de refresh ni redirigir; ese caso lo maneja el propio `LoginComponent`.

**Diferencia clave 401 vs 403**: 401 dispara el flujo de refresco (la sesión puede salvarse); 403 solo notifica al usuario, sin tocar la sesión — un 403 significa que el usuario *sí* está autenticado pero no tiene permiso sobre ese recurso específico, no que deba volver a loguearse.

### 9.4 Logout: sesión actual vs todos los dispositivos

```typescript
// navbar.component.ts
onLogout(): void {
    const refreshToken = this.authService.getRefreshToken();
    this.authService.clearSession();          // limpia SIEMPRE, sin esperar el backend
    this.router.navigate(['/auth/login']);
    if (refreshToken) {
        this.authApiService.logout(refreshToken).subscribe({ error: () => {} });  // best-effort
    }
}
```

```typescript
// profile.component.ts — distinto endpoint, distinto alcance
onLogoutAllDevices(): void {
    // confirmación de dos pasos, mismo patrón que suspender/eliminar cuenta
    this.authApiService.logoutAll(userId).subscribe({
        next: () => { this.authService.clearSession(); this.router.navigate(['/auth/login']); }
    });
}
```

**Bug evitado**: la primera versión tenía un único `LogoutUseCase` en backend que revocaba *todos* los dispositivos sin distinción — el logout normal del navbar habría desconectado, por ejemplo, una sesión móvil activa. Se separó en dos endpoints (`/logout` vs `/logout-all`) y dos métodos correspondientes en `AuthApiService`.

La limpieza de `localStorage` en `onLogout()` ocurre **antes** de llamar al backend, no depende de su respuesta — permite cerrar sesión sin conexión a internet.

---

## 10. Catálogo de Alimentos

### 10.1 Sin cambios de código, solo de datos

El catálogo de alimentos creció de 172 a 635 registros en esta sesión (ver documentación de backend, sección 14, para el detalle completo de las migraciones). El frontend no requirió ningún cambio estructural: `FoodResponse.category` siempre fue `string` libre, así que las 7 categorías nuevas (`FRUTOS_SECOS`, `EMBUTIDOS`, `CONDIMENTOS`, `COMIDA_RAPIDA`, `PANADERIA`, `VEGANOS`, `INDUSTRIALES`, `COMIDA_CALLE`) llegan al buscador (`food-search.component.ts`) sin tocar código.

### 10.2 Punto a revisar (no abordado esta sesión)

El componente de búsqueda de alimentos no fue auditado contra el catálogo ampliado — vale la pena confirmar en una sesión futura que el límite de resultados mostrados en el autocomplete (si existe alguno) siga siendo razonable con más del cuádruple de alimentos en la tabla, y que el orden de resultados (relevancia vs. alfabético) no se vea afectado negativamente por el volumen.

---

## 11. Selector de Rango de Fechas

### 11.1 Patrón replicado de `ReportComponent`

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

### 11.2 Fix de overlay

`mat-menu` por defecto limita `max-width`, cortando el contenido del rango personalizado. Como `mat-menu` se renderiza en un overlay fuera del árbol del componente, requiere `::ng-deep` a nivel de archivo (no anidado dentro de la clase del componente) para alcanzar `.mat-mdc-menu-panel`:

```scss
::ng-deep .glucose-history__range-menu .mat-mdc-menu-panel {
  max-width: 320px !important;
  width: 320px;
}
```

---

## 12. UX de Formularios — Botón "Ahora"

### 12.1 Motivación

Reducir fricción en el caso más común: registrar una medición en el momento en que ocurre. El campo de fecha/hora ya cargaba el instante actual por defecto, pero no había forma rápida de "resetear" a la hora actual si el usuario tardó en completar el formulario.

### 12.2 Patrón aplicado

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

## 13. Capa HTTP y Comunicación

### 13.1 Interceptores (actualizado esta sesión)

```
jwtInterceptor    → adjunta Authorization: Bearer <token> a cada request saliente (sin cambios)
errorInterceptor  → 401 (fuera de /auth/**): refresca el token automáticamente y reintenta
                      (ver sección 9); 403: solo notifica, no redirige; ambos casos antes
                      solo redirigían a login directamente sin distinguir, o ni siquiera
                      reaccionaban al 403
```

Orden de registro en `app.config.ts`: `withInterceptors([jwtInterceptor, errorInterceptor])`. Los interceptores funcionales de Angular se ejecutan en ese orden para la request saliente, y en orden inverso para la respuesta/error — `errorInterceptor` ve el error primero (más cerca de la respuesta del backend), por eso la lógica de refresco vive ahí y no en `jwtInterceptor`.

### 13.2 Servicios HTTP nuevos esta sesión

| Servicio | Responsabilidad |
|---|---|
| `AuthApiService` | login, register, **refresh, logout, logoutAll, getActiveSessions** (los últimos 4, nuevos) |
| `TokenRefreshCoordinator` | coordina refrescos concurrentes (ver sección 9) |
| `NotificationService` | banner de notificaciones global (ver sección 7) |

`AccountService`, `SystemConfigService` ya estaban cubiertos en sección 6 de una sesión anterior.

---

## 14. Estándares Técnicos y de Código

### 14.1 Convenciones (sin cambios respecto a versión anterior)

Ver tabla completa en versión previa. Adición: NgRx Actions y Selectors siguen el patrón `[Feature] Verb Noun` / `select` + Feature + Property — sin cambios esta sesión, NgRx no se tocó.

### 14.2 Reglas derivadas de sesiones anteriores

- **`@for` track expression**: nunca usar un campo no garantizado único (como `alert.type` cuando puede repetirse) — usar `$index` si no hay un identificador único real
- **`datetime-local` inputs**: siempre usar un helper que corrija el offset de timezone, nunca `toISOString()` directo
- **Comparación de objetos para detectar "cambios"**: comparar por una firma compuesta de los campos relevantes, no por un único campo que pueda repetirse con datos distintos (ej. `título|mensaje`, no solo `título`)
- **Vinculación temporal de eventos a una métrica puntual**: siempre aplicar una ventana de tolerancia máxima — vincular "el evento más cercano sin importar qué tan lejos esté" produce resultados engañosos cuando hay pocos puntos de referencia

### 14.3 Reglas nuevas derivadas de esta sesión

- **Nunca usar `MatSnackBar`**: usar siempre `NotificationService` (sección 7). Reintroducir `MatSnackBar` reabre el riesgo de overlays huérfanos en el `CdkOverlay` compartido con `mat-menu`/`mat-datepicker`
- **Mostrar un mensaje justo antes de `router.navigate(...)`** con cualquier componente que dependa de `CdkOverlay` (snackbar, menú, tooltip persistente) es un patrón a evitar — si el mensaje debe sobrevivir la navegación, usar un servicio global con un componente montado en la raíz, no un mecanismo por página
- **Servicios de coordinación de operaciones async concurrentes** (ej. refrescar un token cuando N requests fallan a la vez) van en un servicio `providedIn: 'root'` con un `BehaviorSubject` como flag compartido, nunca en variables de módulo (`let` a nivel de archivo) — rompe inyectabilidad y testeabilidad
- **Logout y operaciones de "salir"**: limpiar el estado local primero, llamar al backend después sin bloquear sobre su respuesta (best-effort) — el usuario debe poder cerrar sesión sin conexión
- **Excluir explícitamente los endpoints de autenticación** (`/api/v1/auth/**`) de cualquier interceptor que reaccione a 401 — un fallo de login no es un fallo de sesión

---

## 15. Rendimiento y Optimización

Sin cambios respecto a la versión anterior — NgRx con TTL 5 min, Service Worker, lazy loading por feature.

---

## 16. Accesibilidad

Sin cambios — ver versión anterior para el detalle completo (WCAG 2.1 AA, aria-labels, contraste, navegación por teclado).

---

*DiabeCare Frontend Documentation v4.0*
