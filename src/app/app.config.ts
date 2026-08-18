import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { registerLocaleData } from '@angular/common';
import { provideEchartsCore } from 'ngx-echarts';
import { provideTransloco } from '@jsverse/transloco';
import localeEs from '@angular/common/locales/es';
import localeEn from '@angular/common/locales/en';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { languageInterceptor } from './core/interceptors/language.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { provideServiceWorker } from '@angular/service-worker';
import { glucoseFeature } from './store/glucose/glucose.reducer';
import { GlucoseEffects } from './store/glucose/glucose.effects';
import { LanguageService } from './core/services/language.service';
import { TranslocoHttpLoader } from './core/i18n/transloco-http-loader';
import { environment } from '../environments/environment';

registerLocaleData(localeEs);
registerLocaleData(localeEn);

const activeLang = LanguageService.loadLanguage();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withXhr(),
      withInterceptors([loadingInterceptor, languageInterceptor, jwtInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
    provideStore({ glucose: glucoseFeature.reducer }),
    provideEffects([GlucoseEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    { provide: LOCALE_ID, useValue: activeLang === 'en' ? 'en' : 'es' },
    provideTransloco({
      config: {
        availableLangs: ['es', 'en'],
        defaultLang: activeLang,
        fallbackLang: 'es',
        reRenderOnLangChange: true,
        prodMode: environment.production,
      },
      loader: TranslocoHttpLoader,
    }),
    provideEchartsCore({ echarts: () => import('echarts') }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
