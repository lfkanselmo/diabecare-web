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
        // Pública a propósito: el registro enlaza aquí antes de que exista sesión.
        path: 'legal/privacidad',
        loadComponent: () =>
            import('./features/legal/pages/privacy-policy/privacy-policy.component')
                .then(m => m.PrivacyPolicyComponent)
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
                path: 'caregivers',
                loadChildren: () =>
                    import('./features/caregivers/caregivers.routes').then(m => m.CAREGIVERS_ROUTES)
            },
            {
                path: 'reports',
                loadComponent: () =>
                    import('./features/reports/pages/report/report.component')
                        .then(m => m.ReportComponent)
            },
            {
                path: 'profile',
                loadComponent: () =>
                    import('./features/profile/pages/profile/profile.component')
                        .then(m => m.ProfileComponent)
            },
            {
                path: 'cycle',
                loadComponent: () =>
                    import('./features/profile/pages/cycle/cycle.component')
                        .then(m => m.CycleComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
        ]
    },
    {
        path: '**',
        redirectTo: 'app/dashboard'
    }
];