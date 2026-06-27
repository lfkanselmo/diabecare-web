export type ExerciseType =
    | 'WALKING' | 'RUNNING' | 'CYCLING' | 'SWIMMING'
    | 'WEIGHT_TRAINING' | 'YOGA' | 'FOOTBALL' | 'BASKETBALL'
    | 'DANCING' | 'HIKING' | 'OTHER';

export type ExerciseIntensity = 'LOW' | 'MODERATE' | 'HIGH';

export interface RegisterExerciseRequest {
    exerciseType: ExerciseType;
    intensity: ExerciseIntensity;
    durationMinutes: number;
    notes?: string;
    performedAt?: string;
    caloriesBurned?: number | null;
}

export interface ExerciseLogResponse {
    exerciseId: string;
    exerciseType: ExerciseType;
    intensity: ExerciseIntensity;
    durationMinutes: number;
    caloriesBurned: number;
    notes: string | null;
    performedAt: string;
}