import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.getToken();

    if (!token) {
        authService.clearSession();
        return router.createUrlTree(['/auth/login']);
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = Date.now() >= payload.exp * 1000;

        if (isExpired) {
            authService.clearSession();
            return router.createUrlTree(['/auth/login']);
        }

        return true;
    } catch {
        authService.clearSession();
        return router.createUrlTree(['/auth/login']);
    }
};