import { Routes } from '@angular/router';

export const NUTRITION_ROUTES: Routes = [
    {
        path: 'log',
        loadComponent: () =>
            import('./pages/meal-log/meal-log.component').then(m => m.MealLogComponent)
    },
    {
        path: 'history',
        loadComponent: () =>
            import('./pages/nutrition-history/nutrition-history.component')
                .then(m => m.NutritionHistoryComponent)
    },
    {
        path: '',
        redirectTo: 'log',
        pathMatch: 'full'
    }
];