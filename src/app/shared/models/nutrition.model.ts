export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface MealItemRequest {
    foodName: string;
    quantityGrams: number;
    calories: number;
    carbohydrates: number;
    proteins?: number;
    fats?: number;
    foodCode?: string;
}

export interface RegisterMealRequest {
    mealType: MealType;
    consumedAt: string;
    notes?: string;
    items: MealItemRequest[];
}

export interface MealItemResponse {
    mealItemId: string;
    foodName: string;
    quantityGrams: number;
    calories: number;
    carbohydrates: number;
    proteins: number | null;
    fats: number | null;
}

export interface MealEntryResponse {
    mealId: string;
    mealType: MealType;
    consumedAt: string;
    notes: string | null;
    totalCalories: number;
    totalCarbohydrates: number;
    totalProteins: number;
    totalFats: number;
    items: MealItemResponse[];
}

export interface DailySummaryResponse {
    date: string;
    totalCalories: number;
    totalCarbohydrates: number;
    totalProteins: number;
    totalFats: number;
    calorieGoal: number | null;
    goalReached: boolean;
}