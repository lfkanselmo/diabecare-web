export type BmiCategory = 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE';

export interface RegisterVitalSignRequest {
    weightKg?: number;
    heightCm?: number;
    systolicBp?: number;
    diastolicBp?: number;
    heartRate?: number;
    hba1c?: number;
    measuredAt?: string;
    notes?: string;
}

export interface VitalSignResponse {
    vitalId: string;
    weightKg: number | null;
    heightCm: number | null;
    bmi: number | null;
    bmiCategory: BmiCategory | null;
    systolicBp: number | null;
    diastolicBp: number | null;
    heartRate: number | null;
    hba1c: number | null;
    measuredAt: string;
    notes: string | null;
}