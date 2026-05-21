export type MedicationType = 'INSULIN_BASAL' | 'INSULIN_BOLUS' | 'ORAL' | 'INJECTABLE';
export type DoseUnit = 'MG' | 'ML' | 'UNITS';
export type MedicationFrequency =
    | 'ONCE_DAILY'
    | 'TWICE_DAILY'
    | 'THREE_TIMES_DAILY'
    | 'WITH_MEALS'
    | 'BEFORE_MEALS'
    | 'AT_BEDTIME'
    | 'AS_NEEDED';

export interface RegisterMedicationRequest {
    name: string;
    type: MedicationType;
    dose: number;
    doseUnit: DoseUnit;
    frequency: MedicationFrequency;
    startDate?: string;
    notes?: string;
}

export interface MedicationResponse {
    medicationId: string;
    name: string;
    type: MedicationType;
    dose: number;
    doseUnit: DoseUnit;
    frequency: MedicationFrequency;
    startDate: string;
    active: boolean;
    notes: string | null;
}