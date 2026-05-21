import { Injectable, signal } from '@angular/core';

const TOKEN_KEY = 'dc_access_token';
const PATIENT_KEY = 'dc_patient';

@Injectable({ providedIn: 'root' })
export class AuthService {

    private readonly _isAuthenticated = signal(this.hasToken());

    isAuthenticated(): boolean {
        return this._isAuthenticated();
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    saveSession(token: string, patient: unknown): void {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(PATIENT_KEY, JSON.stringify(patient));
        this._isAuthenticated.set(true);
    }

    clearSession(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(PATIENT_KEY);
        this._isAuthenticated.set(false);
    }

    private hasToken(): boolean {
        return !!localStorage.getItem(TOKEN_KEY);
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
}