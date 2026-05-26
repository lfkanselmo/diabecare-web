import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { registerLocaleData } from '@angular/common';
import { provideEchartsCore } from 'ngx-echarts';
import localeEs from '@angular/common/locales/es';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import * as echarts from 'echarts';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    provideStore({}),
    provideEffects([]),
    provideStoreDevtools({ maxAge: 25, logOnly: false }),
    { provide: LOCALE_ID, useValue: 'es' },
    provideEchartsCore({ echarts: () => import('echarts') }),
  ]
};