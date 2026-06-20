import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    ActiveSession,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
    RefreshTokenResponse
} from '@shared/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/auth`;

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request);
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request);
    }

    refresh(request: RefreshTokenRequest): Observable<RefreshTokenResponse> {
        return this.http.post<RefreshTokenResponse>(`${this.baseUrl}/refresh`, request);
    }

    logout(refreshToken: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/logout`, { refreshToken });
    }

    logoutAll(userId: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/logout-all`, { userId });
    }

    getActiveSessions(userId: string): Observable<ActiveSession[]> {
        return this.http.get<ActiveSession[]>(`${this.baseUrl}/sessions/${userId}`);
    }
}