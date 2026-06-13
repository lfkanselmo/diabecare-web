import { Routes } from '@angular/router';

export const GLUCOSE_ROUTES: Routes = [
    {
        path: 'register',
        loadComponent: () =>
            import('./pages/glucose-register/glucose-register.component')
                .then(m => m.GlucoseRegisterComponent)
    },
    {
        path: 'history',
        loadComponent: () =>
            import('./pages/glucose-history/glucose-history.component')
                .then(m => m.GlucoseHistoryComponent)
    },
    {
        path: 'insulin-calculator',
        loadComponent: () =>
            import('./pages/insulin-calculator/insulin-calculator.component')
                .then(m => m.InsulinCalculatorComponent)
    },
    {
        path: '',
        redirectTo: 'register',
        pathMatch: 'full'
    }
];