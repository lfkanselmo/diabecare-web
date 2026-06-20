import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.getToken();

    if (!token || authService.isTokenExpired(token)) {
        authService.clearSession();
        return router.createUrlTree(['/auth/login']);
    }

    return true;
};