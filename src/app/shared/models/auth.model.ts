import { PatientResponse } from "./patient.model";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
    dateOfBirth: string;
    diabetesType: string;
    diagnosisDate: string;
    heightCm: string;
}

export interface AuthResponse {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    refreshToken: string;
    refreshExpiresIn: number;
    patient: PatientResponse | null;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    refreshToken: string;
    refreshExpiresIn: number;
}

export interface ActiveSession {
    id: string;
    deviceLabel: string;
    lastUsedAt: string | null;
    createdAt: string;
}