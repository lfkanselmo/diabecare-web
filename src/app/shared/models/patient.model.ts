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
}