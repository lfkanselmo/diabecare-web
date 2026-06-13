import { Routes } from '@angular/router';

export const VITALS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/vitals/vitals.component').then(m => m.VitalsComponent)
    },
    {
        path: 'exercise',
        loadComponent: () =>
            import('./pages/exercise/exercise.component').then(m => m.ExerciseComponent)
    }
];