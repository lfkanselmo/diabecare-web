import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

let activeRequests = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
    const loadingService = inject(LoadingService);

    if (activeRequests === 0) loadingService.show();
    activeRequests++;

    return next(req).pipe(
        finalize(() => {
            activeRequests--;
            if (activeRequests === 0) loadingService.hide();
        })
    );
};