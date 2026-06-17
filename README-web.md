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
# Clonar el repositorio
git clone <url-del-repositorio>
cd diabecare-web

# Instalar dependencias
npm install --legacy-peer-deps
```

---

## Ejecución

```bash
# Desarrollo
ng serve

# La aplicación estará disponible en:
# http://localhost:4200
```

> El backend debe estar corriendo en `http://localhost:8080` antes de iniciar el frontend.

---

## Build

```bash
# Build de producción (incluye Service Worker PWA)
ng build --configuration production

# Los archivos generados quedan en dist/diabecare-web/browser/
```

### Servir build de producción localmente

```bash
ng build --configuration production
npx http-server dist/diabecare-web/browser -p 8080
```

---

## Variables de entorno

La URL del backend se configura en los archivos de entorno:

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
│   │   ├── auth/               ← AuthService, AuthGuard, validación JWT
│   │   ├── interceptors/       ← JWT interceptor, Error interceptor
│   │   ├── layout/             ← Shell, Navbar, Sidebar
│   │   ├── guards/             ← authGuard
│   │   └── services/           ← AlertService, ThemeService, MetadataService,
│   │                              GlucoseStateService, PushNotificationService
│   ├── shared/
│   │   ├── components/         ← AlertsPanel
│   │   └── models/             ← Interfaces TypeScript por dominio
│   ├── store/
│   │   └── glucose/            ← NgRx: actions, reducer, effects, selectors
│   └── features/
│       ├── auth/               ← Login, Register
│       ├── dashboard/          ← Métricas, alertas, accesos rápidos
│       ├── glucose/            ← Registro, historial, calculadora de insulina
│       ├── nutrition/          ← Registro de comidas
│       ├── vitals/             ← Signos vitales, ejercicio
│       ├── medications/        ← Medicamentos
│       ├── reports/            ← Generación de reportes PDF
│       └── profile/            ← Perfil del paciente, ciclo menstrual
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

- Chip de glucosa en tiempo real en el navbar (actualizado desde el historial)
- Métricas glucémicas de los últimos 7 días via NgRx Store
- Indicador visual de HbA1c estimada con barra de progreso y colores semánticos
- Panel de alertas clínicas: 7 tipos incluyendo alertas de patrón y ciclo menstrual
- Card de ciclo menstrual (solo pacientes femeninas) con fase actual y próximo período
- Accesos rápidos: Glucosa, Comida, Signos vitales, Medicamentos, Ejercicio, Calculadora, Ciclo menstrual

### Glucosa

- Registro de lecturas con tipo y unidad
- Historial con gráfica ECharts y correlación de comidas y ejercicio (marcadores diferenciados)
- Leyenda explicativa de colores y marcadores en la gráfica
- Estadísticas: TIR, HbA1c estimada, coeficiente de variación
- Exportación de datos en CSV y JSON (últimos 30 días)
- Estado gestionado con NgRx (caché TTL 5 minutos, invalidación manual)

### Calculadora de insulina

- Página independiente accesible desde el dashboard y el menú de glucosa
- Cálculo de dosis de corrección y dosis para comida
- Campos: glucosa actual, objetivo, factor de sensibilidad, carbohidratos, ratio insulina:carbs
- Advertencia médica prominente en el resultado

### Nutrición

- Buscador de alimentos con debounce 300ms
- Cálculo automático de macronutrientes por gramaje
- Historial de comidas con totales diarios

### Signos vitales y ejercicio

- Registro de peso, presión arterial, frecuencia cardíaca y HbA1c medida
- Gráfica de tendencia HbA1c estimada (3, 6 o 12 meses) con colores adaptativos al tema
- Registro de actividad física como página independiente

### Medicamentos

- CRUD completo de medicamentos
- Configuración de perfil de insulina (ISF, ratio, objetivo)

### Reportes

- Selector de rango de fechas con atajos (7, 30, 90, 180 días)
- Descarga de reporte PDF enriquecido para el médico

### Perfil

- Edición de datos médicos del paciente
- Ciclo menstrual como página independiente (solo pacientes femeninas):
  - Rueda circular con 5 fases y colores adaptativos al tema
  - Calendario mensual con colores por fase
  - Predicción del próximo ciclo
  - Síntomas mostrados en español
  - Historial de ciclos recientes

### PWA

- Instalable en dispositivos móviles y desktop
- Service Worker con caché: metadatos (7 días), alimentos (24h), API general (1h)
- Handler de notificaciones push (`sw-push-handler.js`)

### Notificaciones push

- Activación via botón campana en el navbar
- Suscripción Web Push API nativa (sin Firebase)
- Notificaciones de resumen semanal automático (lunes 8am)
- Estado de activación persistido en el backend

### Modo oscuro

- Toggle en navbar, persistido en `localStorage`
- Gráficas ECharts con paleta adaptativa (lectura única en `ngOnChanges`)
- Calendario del ciclo menstrual con opacidad reducida en modo oscuro

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
# Generar componente
ng generate component features/modulo/components/nombre

# Generar servicio
ng generate service features/modulo/services/nombre

# Build de producción
ng build --configuration production

# Ver tamaño de bundles
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

---

## Notas importantes

- El Service Worker solo se activa en build de producción (`ng build`), no en `ng serve`
- Las notificaciones push requieren HTTPS en producción (localhost es excepción del navegador)
- La card y el acceso rápido de ciclo menstrual solo aparecen para pacientes con `biologicalSex = FEMALE`
- Los getters en componentes ECharts causan loop infinito — usar variables locales en `ngOnChanges`
- `ViewEncapsulation.None` aplicado solo donde es necesario: login, register, profile, alerts-panel
