import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID, APP_INITIALIZER } from '@angular/core';
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
import { MetadataService } from './core/services/metadata.service';
import { AuthService } from './core/auth/auth.service';

registerLocaleData(localeEs);

function initializeMetadata(
  metadataService: MetadataService,
  authService: AuthService
): () => Promise<void> {
  return () => new Promise((resolve) => {
    if (!authService.isAuthenticated()) {
      resolve();
      return;
    }
    metadataService.loadAll();
    const interval = setInterval(() => {
      if (metadataService.loaded()) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, 5000);
  });
}

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
    {
      provide: APP_INITIALIZER,
      useFactory: initializeMetadata,
      deps: [MetadataService, AuthService],
      multi: true
    }
  ]
};