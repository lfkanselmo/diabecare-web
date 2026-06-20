import { Injectable, signal } from '@angular/core';

const TOKEN_KEY = 'dc_access_token';
const REFRESH_TOKEN_KEY = 'dc_refresh_token';
const PATIENT_KEY = 'dc_patient';

@Injectable({ providedIn: 'root' })
export class AuthService {

    private readonly _isAuthenticated = signal(this.checkValidToken());

    isAuthenticated(): boolean {
        return this._isAuthenticated();
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    saveSession(token: string, patient: unknown, refreshToken?: string): void {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(PATIENT_KEY, JSON.stringify(patient));

        if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }

        this._isAuthenticated.set(true);
    }

    saveAccessToken(token: string, refreshToken: string): void {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        this._isAuthenticated.set(true);
    }

    clearSession(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(PATIENT_KEY);
        this._isAuthenticated.set(false);
    }

    logout(): void {
        this.clearSession();
    }

    getPatientId(): string | null {
        const raw = localStorage.getItem(PATIENT_KEY);
        if (!raw) return null;
        try {
            const patient = JSON.parse(raw);
            return patient?.patientId ?? null;
        } catch {
            return null;
        }
    }

    getUserId(): string | null {
        const token = this.getToken();
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload?.userId ?? null;
        } catch {
            return null;
        }
    }

    isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiryMs = payload.exp * 1000;
            return Date.now() >= expiryMs;
        } catch {
            return true;
        }
    }

    private checkValidToken(): boolean {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return false;
        return !this.isTokenExpired(token);
    }
}