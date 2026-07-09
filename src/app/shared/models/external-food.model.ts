export interface ExternalFoodResponse {
    barcode: string;
    name: string | null;
    brand: string | null;
    caloriesPer100g: number | null;
    carbsPer100g: number | null;
    proteinsPer100g: number | null;
    fatsPer100g: number | null;
}
