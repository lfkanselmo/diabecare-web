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
│   │   ├── auth/               ← AuthService (getUserId, getPatientId, getRefreshToken,
│   │   │                          isTokenExpired público, isAdmin, logout), AuthApiService
│   │   │                          (login/register/refresh/logout/logoutAll/getActiveSessions/
│   │   │                          forgotPassword/resetPassword), TokenRefreshCoordinator
│   │   │                          (evita refrescos concurrentes duplicados)
│   │   ├── guards/             ← AuthGuard, AdminGuard (protege /app/admin por rol)
│   │   ├── i18n/               ← TranslocoHttpLoader (carga public/i18n/{lang}.json)
│   │   ├── interceptors/       ← JWT interceptor, Error interceptor (maneja 401 con
│   │   │                          refresco automático + reintento; 403 con notificación),
│   │   │                          Language interceptor (header Accept-Language),
│   │   │                          Loading interceptor
│   │   ├── layout/             ← Shell, Navbar (logout solo de la sesión actual, selector
│   │   │                          de idioma, acceso a Admin si corresponde), Sidebar
│   │   └── services/           ← AlertService (con detección de alertas nuevas),
│   │                              ThemeService, MetadataService, LanguageService
│   │                              (es/en, recarga la página al cambiar), PushNotificationService,
│   │                              SystemConfigService, AccountService,
│   │                              NotificationService (banner global, sin CdkOverlay)
│   ├── shared/
│   │   ├── components/         ← AlertsPanel, NotificationBanner (montado una vez
│   │   │                          en AppComponent), LoadingIndicator
│   │   └── models/             ← Interfaces TypeScript por dominio (incluye
│   │                              ActiveSession, RefreshTokenRequest/Response,
│   │                              CaregiverInvite/Link, GlucoseReminder, ExternalFood,
│   │                              DeviceApiKey, BleGlucoseMeasurement)
│   ├── store/
│   │   └── glucose/            ← NgRx: actions, reducer, effects, selectors (único store
│   │                              NgRx del proyecto — el resto de features usa Signals)
│   └── features/
│       ├── auth/               ← Login (maneja ACCOUNT_SUSPENDED/INVALID_CREDENTIALS,
│       │                          guarda refresh token), Register (checkbox de aceptación
│       │                          de Habeas Data enlazando a /legal/privacidad),
│       │                          ForgotPassword, ResetPassword
│       ├── admin/               ← Panel de administración (solo rol ADMIN): listado
│       │                          paginado de usuarios, cambio de rol PATIENT/ADMIN,
│       │                          recarga de SystemConfig en caliente
│       ├── caregivers/          ← Compartir acceso a datos del paciente: generar/revocar
│       │                          código de invitación, canjear código como cuidador,
│       │                          vista de solo lectura de un paciente vinculado
│       │                          (últimos 14 días de glucosa + alertas)
│       ├── legal/               ← Página pública de Política de Privacidad / Habeas Data
│       │                          (Ley 1581 de 2012), enlazada desde registro y footer
│       ├── dashboard/          ← Métricas, alertas, accesos rápidos
│       ├── glucose/            ← Registro (botón "Ahora"), conectar glucómetro por
│       │                          Bluetooth (BleGlucoseMeterService, Web Bluetooth API),
│       │                          historial (selector de rango + gráfica rediseñada)
│       ├── nutrition/           ← Registro de comidas (botón "Ahora"), buscador de
│       │                          alimentos, escáner de código de barras (@zxing) +
│       │                          FoodLookupService (búsqueda por barcode en catálogo externo)
│       ├── vitals/             ← Signos vitales, ejercicio (botón "Ahora")
│       ├── medications/        ← CRUD de medicamentos (recordatorio push automático según
│       │                          frecuencia) + calculadora de insulina e insulin profile
│       │                          como pestañas de la misma página
│       ├── reports/            ← Generación de reportes PDF
│       └── profile/            ← Perfil del paciente, ciclo menstrual, recordatorios
│                                  proactivos de glucosa (horarios configurables, con
│                                  supresión si ya hubo lectura en los últimos 30 min),
│                                  tab "Cuenta" (exportar datos, suspender/eliminar,
│                                  sesiones activas, cerrar sesión en todos los dispositivos),
│                                  tab "Dispositivos" (API keys para bridges externos
│                                  de CGM/glucómetro — DeviceApiKeysComponent)
├── public/
│   ├── manifest.webmanifest    ← PWA manifest
│   ├── i18n/                   ← es.json / en.json — traducciones Transloco (ver
│   │                              sección "Internacionalización")
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
- **Notificación inmediata**: tras registrar, si se generó una alerta nueva, aparece en el banner global de notificaciones (ver sección dedicada) — ya no usa `MatSnackBar`
- **Conectar glucómetro por Bluetooth** (`BleGlucoseMeterService`, Web Bluetooth API): lee la última medición de un glucómetro BLE estándar (Bluetooth SIG Glucose Service, UUID `0x1808`) y precarga valor, unidad, fecha y `deviceSource` en el formulario — el botón se oculta con un aviso si el navegador no soporta Web Bluetooth (Safari/iOS)

### Calculadora de insulina

- Pestaña "Calculadora" dentro de la página de Medicamentos (`/app/medications`), con dosis de corrección y dosis para comida

### Nutrición

- Registro de comidas con botón "Ahora"
- Buscador de alimentos con debounce 300ms sobre un catálogo de **635 alimentos** (colombianos, latinoamericanos e internacionales — ver sección dedicada)
- **Escaneo de código de barras**: `BarcodeScannerComponent` abre un diálogo con acceso a la cámara (`@zxing/browser`, `BrowserMultiFormatReader`) y decodifica el código en tiempo real; el resultado se resuelve contra un catálogo externo vía `FoodLookupService` (`GET /food-lookup/barcode/{barcode}`)
- Notificación inmediata de alertas nuevas tras registrar (banner global)

### Signos vitales y ejercicio

- Registro con botón "Ahora" (ejercicio; signos vitales ya lo tenía)
- Gráfica de tendencia HbA1c con `connectNulls` para legibilidad con datos esparcidos
- Notificación inmediata de alertas nuevas tras registrar ejercicio, con acción "Ver" que navega al dashboard

### Medicamentos

- CRUD completo, auditado en backend
- Recordatorio push automático derivado de la frecuencia del medicamento (ícono informativo junto a cada medicamento activo, sin configuración adicional del usuario)

### Reportes

- Selector de rango de fechas con atajos, descarga de reporte PDF

### Perfil

- Edición de datos médicos
- **Tab "Cuenta"**: exportar todos los datos personales y de salud del paciente (derecho de acceso, Ley 1581 de 2012), suspender o eliminar la propia cuenta, con confirmación de dos pasos en banda separada (no inline), iconografía corregida (`delete` en vez de `delete_forever`), texto blanco en botones de confirmación
- **Sesiones activas**: lista de dispositivos con sesión iniciada (etiqueta de dispositivo + última actividad) y botón "Cerrar sesión en todos los dispositivos" con la misma confirmación de dos pasos — distinto del logout normal del navbar, que solo cierra la sesión actual
- **Tab "Recordatorios"**: recordatorios proactivos de glucosa (`GlucoseRemindersComponent`) — el paciente configura horarios (+ etiqueta opcional) en los que recibe una notificación push para registrar una lectura; el backend suprime el aviso si ya existe una lectura en los últimos 30 minutos
- **Tab "Dispositivos"** (`DeviceApiKeysComponent`): genera/revoca API keys para que un bridge externo (CGM, Nightscout, etc. — ver sección "Importación de lecturas por dispositivo" en la documentación del backend) importe lecturas sin login interactivo; la key cruda solo se muestra una vez al generarla
- Ciclo menstrual como página independiente (solo pacientes femeninas)
- Fix: `(selectedTabChange)` dispara `window.dispatchEvent(new Event('resize'))` para que ECharts se redimensione correctamente al cambiar de tab

### Panel de administración

- Ruta `/app/admin`, protegida por `adminGuard` (requiere rol `ADMIN`, almacenado localmente tras login/registro; si no aplica, redirige a `/app/dashboard`)
- `AdminComponent`: listado paginado de usuarios (`GET /admin/users`), cambio de rol `PATIENT ⇄ ADMIN` con confirmación de un clic armado (`armedRoleChangeUserId`), y botón para recargar `SystemConfigService` en caliente sin recargar la app
- Enlace visible en el menú de usuario del navbar únicamente si `AuthService.isAdmin()` es verdadero

### Cuidadores

- Feature `caregivers`, ruta `/app/caregivers` (+ `/app/caregivers/view/:patientId`)
- Un paciente genera un código de invitación (`CaregiversService.createInvite`) y lo comparte fuera de la app; puede revocar el vínculo en cualquier momento
- Un cuidador canjea el código (`redeem`) para vincularse a ese paciente y ver `getMyPatients()` — la lista de pacientes a los que tiene acceso
- `CaregiverViewComponent`: vista de solo lectura del paciente vinculado — última lectura de glucosa, estadísticas de los últimos 14 días y panel de alertas clínicas (`AlertsPanelComponent` reutilizado)

### Consentimiento / Habeas Data

- `PrivacyPolicyComponent` en `/legal/privacidad` — ruta pública (sin guard), pensada para enlazarse antes de que exista sesión
- El formulario de registro incluye un checkbox obligatorio (`termsAccepted`) que enlaza a esta página antes de poder crear la cuenta
- Contenido alineado con la Ley 1581 de 2012 (protección de datos personales en Colombia); el mismo marco legal habilita la exportación de datos personales desde el tab "Cuenta" del perfil

### Recuperación de contraseña

- `/auth/forgot-password`: solicita el correo y siempre responde con el mismo mensaje de éxito exista o no la cuenta (mitigación de enumeración de usuarios); solo distingue un 429 (rate limit) para mostrar un mensaje específico
- `/auth/reset-password`: recibe el token enviado por correo y establece la nueva contraseña vía `AuthApiService.resetPassword(token, newPassword)`

### PWA

- Instalable, Service Worker con caché estratificado

### Notificaciones push

- Activación vía campana en navbar, Web Push API nativa

### Sistema de notificaciones (banner global, sin WebSockets)

- `NotificationService` (singleton `providedIn: 'root'`) + `NotificationBannerComponent` montado una sola vez en `AppComponent`, junto al `router-outlet` — sobrevive cualquier navegación, incluso entre `/app/**` y `/auth/**`
- Reemplaza por completo `MatSnackBar` en los 11 lugares donde se usaba (registro de glucosa, comidas, ejercicio, signos vitales, ciclo menstrual, perfil, reportes, calculadora de insulina, medicamentos, navbar) — corrige un bug donde el `CdkOverlay` compartido por snackbar/menú/datepicker podía quedar huérfano tras una navegación rápida, bloqueando clics sin mostrarse visualmente
- `AlertService.getNewAlerts()` sigue comparando por firma `título|mensaje` de las alertas actuales contra las últimas conocidas en la sesión, evitando falsos negativos cuando una alerta del mismo tipo persiste con datos actualizados (ej. "Patrón: hipoglucemias frecuentes" con conteo distinto) — solo cambió el canal de salida (banner en vez de snackbar)
- Auto-dismiss configurable + cierre manual + acción opcional (ej. "Ver" → navega al dashboard)

### Sesión persistente (refresh tokens)

- El access token dura 15 minutos; al expirar, `error.interceptor.ts` lo refresca automáticamente en segundo plano (sin que el usuario lo note) y reintenta la petición que falló
- Si varias peticiones fallan casi simultáneamente, `TokenRefreshCoordinator` evita disparar múltiples refrescos en paralelo — la primera dispara la llamada real, las demás esperan su resultado
- Si el refresh token también es inválido/expiró (7 días de inactividad), recién ahí se cierra sesión y se redirige a login
- Logout del navbar revoca solo la sesión actual; "Cerrar sesión en todos los dispositivos" (en el perfil) revoca todas

### Modo oscuro

- Toggle en navbar, gráficas adaptativas

---

## Internacionalización (i18n)

La aplicación es **bilingüe (español/inglés)** vía [`@jsverse/transloco`](https://jsverse.github.io/transloco/).

- **Archivos de traducción**: `public/i18n/es.json` y `public/i18n/en.json`, con **570 claves cada uno** (paridad exacta es/en) organizadas en 14 namespaces de primer nivel: `common`, `nav`, `navbar`, `admin`, `auth`, `dashboard`, `glucose`, `medications`, `caregivers`, `nutrition`, `vitals`, `reports`, `profile`, `legal`
- **Convención de namespacing**: un objeto anidado por feature/página, con sub-namespaces por componente cuando aplica (ej. `nutrition.barcodeScanner.*`, `profile.reminders.*`, `profile.account.*`)
- **Carga**: `TranslocoHttpLoader` (`core/i18n/transloco-http-loader.ts`) descarga el JSON del idioma activo bajo demanda; configurado en `app.config.ts` con `reRenderOnLangChange` y fallback a `es`
- **`LanguageService`** (`core/services/language.service.ts`): persiste el idioma elegido en `localStorage` (`dc_lang`), detecta el idioma del navegador como valor por defecto si no hay preferencia guardada, y **recarga la página completa** al cambiar de idioma — necesario porque `LOCALE_ID` (usado por `DatePipe`/`DecimalPipe`) es un token estático que Angular resuelve una sola vez al arrancar, a diferencia del tema claro/oscuro que sí es dinámico
- **`languageInterceptor`**: agrega el header `Accept-Language` con el idioma activo a cada request saliente, para que el backend pueda localizar mensajes propios (ej. notificaciones push)
- Selector de idioma disponible en el navbar

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
| Angular | ^21.2.14 | Framework principal |
| Angular Material | ^21.2.11 | Componentes UI |
| Angular CDK | ^21.2.11 | Primitivas UI |
| NgRx (store/effects/entity/store-devtools) | ^21.1.0 | Gestión de estado (glucosa) |
| Angular Signals | — | Estado local de componentes |
| @jsverse/transloco | ^8.4.0 | Internacionalización es/en |
| @zxing/browser | ^0.2.1 | Acceso a cámara y decodificación de código de barras |
| @zxing/library | ^0.23.0 | Motor de decodificación de códigos (dependencia de @zxing/browser) |
| @types/web-bluetooth | ^0.0.21 (dev) | Tipos TypeScript para `navigator.bluetooth` (Web Bluetooth API) |
| ngx-echarts | ^21.0.0 | Directiva Angular para ECharts |
| ECharts | ^6.1.0 | Gráficas y visualizaciones |
| @angular/service-worker | ^21.2.14 | PWA y Service Worker |
| @ngx-pwa/local-storage | ^21.0.0 | Acceso tipado a localStorage |
| TypeScript | ~5.9.2 | Lenguaje principal |
| RxJS | ~7.8.0 | Programación reactiva |

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
- **`MatSnackBar` no se usa en ningún lugar del proyecto** — siempre usar `NotificationService` (success/info/warning/danger/showAlert). Reintroducir `MatSnackBar` reabriría el riesgo de overlays huérfanos en el `CdkOverlay` compartido
- Mostrar un mensaje justo antes de `router.navigate(...)` con un servicio que dependa de `CdkOverlay` (snackbar, menú, tooltip persistente) es un patrón a evitar — el `NotificationBannerComponent` vive fuera del overlay precisamente para no tener este problema
- El logout del navbar (`AuthService.getRefreshToken()` + `clearSession()`) limpia la sesión local **antes** de llamar al backend — nunca depender de la respuesta del servidor para que el usuario pueda cerrar sesión sin conexión
- `error.interceptor.ts` excluye explícitamente `/api/v1/auth/**` de su lógica de refresco — un 401 en `/auth/login` (credenciales incorrectas) no debe disparar un intento de refresh ni redirigir, eso lo maneja el propio componente de login
