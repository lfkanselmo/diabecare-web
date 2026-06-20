import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, filter, map, take, tap, throwError } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TokenRefreshCoordinator {

    private readonly authApiService = inject(AuthApiService);
    private readonly authService = inject(AuthService);

    private refreshing = false;
    private readonly refreshedToken$ = new BehaviorSubject<string | null>(null);

    refreshAccessToken(): Observable<string> {
        if (this.refreshing) {
            return this.refreshedToken$.pipe(
                filter((token): token is string => token !== null),
                take(1)
            );
        }

        const refreshToken = this.authService.getRefreshToken();
        if (!refreshToken) {
            return throwError(() => new Error('NO_REFRESH_TOKEN'));
        }

        this.refreshing = true;
        this.refreshedToken$.next(null);

        return this.authApiService.refresh({ refreshToken }).pipe(
            tap(response => {
                this.authService.saveAccessToken(response.accessToken, response.refreshToken);
                this.refreshing = false;
                this.refreshedToken$.next(response.accessToken);
            }),
            map(response => response.accessToken)
        );
    }

    onRefreshFailed(): void {
        this.refreshing = false;
        this.refreshedToken$.next(null);
    }
}