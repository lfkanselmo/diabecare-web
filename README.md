# DiabeCare Web

Frontend de DiabeCare — aplicación de control de salud para pacientes diabéticos. Construido con Angular 21 y Angular Material.

---

## Requisitos

- Node.js 20+
- npm 10+
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
npm install
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
# Build de producción
ng build --configuration production

# Los archivos generados quedan en dist/
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
src/app/
├── core/
│   ├── auth/               ← AuthService, AuthGuard, validación JWT
│   ├── interceptors/       ← JWT interceptor, Error interceptor
│   ├── layout/             ← Shell, Navbar, Sidebar
│   └── services/           ← AlertService, ThemeService, MetadataService
├── shared/
│   ├── components/         ← AlertsPanel
│   └── models/             ← Interfaces TypeScript por dominio
└── features/
    ├── auth/               ← Login, Register
    ├── dashboard/          ← Métricas y alertas
    ├── glucose/            ← Registro e historial de glucosa
    ├── nutrition/          ← Registro de comidas
    ├── vitals/             ← Signos vitales y ejercicio
    ├── medications/        ← Medicamentos y calculadora de insulina
    ├── reports/            ← Generación de reportes PDF
    └── profile/            ← Perfil del paciente y ciclo menstrual
```

---

## Funcionalidades

### Dashboard

- Métricas glucémicas de los últimos 7 días
- Panel de alertas clínicas (5 tipos + alertas de ciclo menstrual)

### Glucosa

- Registro de lecturas con tipo y unidad
- Historial con gráfica ECharts y correlación de comidas (marcadores verdes)
- Estadísticas: TIR, HbA1c estimada, coeficiente de variación

### Nutrición

- Buscador de alimentos con debounce 300ms
- Cálculo automático de macronutrientes por gramaje
- Historial de comidas con totales diarios

### Signos vitales y ejercicio

- Registro de peso, presión arterial, HbA1c medida
- Gráfica de tendencia HbA1c (3, 6 o 12 meses)
- Registro de actividad física por tipo e intensidad

### Medicamentos

- CRUD completo de medicamentos
- Calculadora de dosis de insulina
- Configuración de perfil de insulina (ISF, ratio, objetivo)

### Reportes

- Selector de rango de fechas con atajos (7, 30, 90, 180 días)
- Descarga de reporte PDF enriquecido para el médico

### Perfil

- Edición de datos médicos del paciente
- Ciclo menstrual (solo pacientes femeninas):
  - Rueda circular con 5 fases
  - Calendario mensual con colores por fase
  - Predicción del próximo ciclo

### Otros

- **Modo oscuro**: toggle en navbar, persistido en localStorage
- **Metadatos dinámicos**: todos los selects cargan sus opciones desde el backend via `APP_INITIALIZER`
- **Lazy loading**: cada sección carga su bundle de forma independiente

---

## Tecnologías

| Tecnología       | Versión | Uso                            |
| ---------------- | ------- | ------------------------------ |
| Angular          | 21      | Framework principal            |
| Angular Material | 21      | Componentes UI                 |
| NgRx             | 21      | Gestión de estado              |
| ngx-echarts      | —       | Directiva Angular para ECharts |
| ECharts          | —       | Gráficas y visualizaciones     |
| TypeScript       | 5.x     | Lenguaje principal             |
| RxJS             | —       | Programación reactiva          |

---

## Comandos útiles

```bash
# Generar componente
ng generate component features/modulo/components/nombre

# Generar servicio
ng generate service features/modulo/services/nombre

# Ejecutar linting
ng lint

# Ver tamaño de bundles
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

---

## Configuración del presupuesto de bundle

En `angular.json`, los límites de tamaño están configurados en:

```json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "2mb",
    "maximumError": "4mb"
  }
]
```
