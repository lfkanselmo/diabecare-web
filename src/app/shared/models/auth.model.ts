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
    patient: PatientResponse | null;
}