export interface InsulinCalculationRequest {
    currentGlucose: number;
    carbsToEat?: number;
    beforeMeal: boolean;
}

export interface InsulinCalculationResponse {
    correctionDose: number;
    mealDose: number;
    totalDose: number;
    explanation: string;
    disclaimer: string;
}

export interface UpdateInsulinProfileRequest {
    sensitivityFactor: number;
    carbRatio: number;
    targetGlucose: number;
}