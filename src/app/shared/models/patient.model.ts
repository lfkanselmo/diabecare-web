export interface PatientResponse {
    patientId: string;
    fullName: string;
    dateOfBirth: string;
    age: number;
    diabetesType: string;
    diagnosisDate: string;
    heightCm: number;
    targetGlucoseMin: number;
    targetGlucoseMax: number;
    dailyCalorieGoal: number | null;
    activityLevel: string;
    preferredGlucoseUnit: string;
    insulinSensitivityFactor: number | null;
    insulinToCarbRatio: number | null;
    targetGlucoseForCorrection: number | null;
    biologicalSex: string;
}

export interface UpdatePatientRequest {
    heightCm?: number;
    targetGlucoseMin: number;
    targetGlucoseMax: number;
    dailyCalorieGoal?: number;
    activityLevel: string;
    preferredGlucoseUnit: string;
}