import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'app/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        loadChildren: () =>
            import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    {
        path: 'app',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./core/layout/shell/shell.component').then(m => m.ShellComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./features/dashboard/pages/dashboard/dashboard.component')
                        .then(m => m.DashboardComponent)
            },
            {
                path: 'glucose',
                loadChildren: () =>
                    import('./features/glucose/glucose.routes').then(m => m.GLUCOSE_ROUTES)
            },
            {
                path: 'nutrition',
                loadChildren: () =>
                    import('./features/nutrition/nutrition.routes').then(m => m.NUTRITION_ROUTES)
            },
            {
                path: 'vitals',
                loadChildren: () =>
                    import('./features/vitals/vitals.routes').then(m => m.VITALS_ROUTES)
            },
            {
                path: 'medications',
                loadChildren: () =>
                    import('./features/medications/medications.routes').then(m => m.MEDICATIONS_ROUTES)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'app/dashboard'
    }
];