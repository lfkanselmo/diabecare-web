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
        path: '',
        redirectTo: 'register',
        pathMatch: 'full'
    }
];