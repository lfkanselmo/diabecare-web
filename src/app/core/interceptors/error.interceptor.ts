import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { TokenRefreshCoordinator } from '../auth/token-refresh-coordinator';
import { NotificationService } from '../services/notification.service';
import { ApiError } from '../../shared/models/api-error.model';

const AUTH_ENDPOINT_PATTERN = '/api/v1/auth/';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(AuthService);
    const tokenRefreshCoordinator = inject(TokenRefreshCoordinator);
    const notificationService = inject(NotificationService);

    const isAuthEndpoint = req.url.includes(AUTH_ENDPOINT_PATTERN);

    const redirectToLogin = (): Observable<never> => {
        authService.clearSession();
        notificationService.warning('Tu sesión ha expirado', 'Inicia sesión nuevamente para continuar.');
        router.navigate(['/auth/login']);
        return throwError(() => new Error('SESSION_EXPIRED'));
    };

    const handleUnauthorized = () =>
        tokenRefreshCoordinator.refreshAccessToken().pipe(
            switchMap(newAccessToken =>
                next(req.clone({ setHeaders: { Authorization: `Bearer ${newAccessToken}` } }))
            ),
            catchError(() => {
                tokenRefreshCoordinator.onRefreshFailed();
                return redirectToLogin();
            })
        );

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !isAuthEndpoint) {
                return handleUnauthorized();
            }

            if (error.status === 403 && !isAuthEndpoint) {
                const apiError = error.error as ApiError | undefined;
                notificationService.danger(apiError?.message ?? 'No tienes permiso para realizar esta acción.');
            }

            return throwError(() => error);
        })
    );
};