export interface FoodResponse {
    foodId: string;
    name: string;
    category: string;
    caloriesPer100g: number;
    carbsPer100g: number;
    proteinsPer100g: number;
    fatsPer100g: number;
    fiberPer100g: number | null;
    sodiumPer100g: number | null;
}