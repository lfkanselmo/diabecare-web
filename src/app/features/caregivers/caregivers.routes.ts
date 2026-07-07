import { Routes } from '@angular/router';

export const CAREGIVERS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/caregivers/caregivers.component').then(m => m.CaregiversComponent)
    },
    {
        path: 'view/:patientId',
        loadComponent: () =>
            import('./pages/caregiver-view/caregiver-view.component').then(m => m.CaregiverViewComponent)
    }
];
