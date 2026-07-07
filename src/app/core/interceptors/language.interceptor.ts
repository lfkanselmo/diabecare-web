import { HttpInterceptorFn } from '@angular/common/http';
import { LanguageService } from '@core/services/language.service';
import { inject } from '@angular/core';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
    const lang = inject(LanguageService).getActiveLang();

    return next(req.clone({
        setHeaders: { 'Accept-Language': lang }
    }));
};
