import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { TokenRefreshCoordinator } from '../auth/token-refresh-coordinator';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const tokenRefreshCoordinator = inject(TokenRefreshCoordinator);
    const router = inject(Router);

    const token = authService.getToken();

    if (token && !authService.isTokenExpired(token)) {
        return true;
    }

    if (!authService.getRefreshToken()) {
        authService.clearSession();
        return router.createUrlTree(['/auth/login']);
    }

    return tokenRefreshCoordinator.refreshAccessToken().pipe(
        map(() => true),
        catchError(() => {
            tokenRefreshCoordinator.onRefreshFailed();
            authService.clearSession();
            return of(router.createUrlTree(['/auth/login']));
        })
    );
};