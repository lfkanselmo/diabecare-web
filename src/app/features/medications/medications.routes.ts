import { Routes } from '@angular/router';

export const MEDICATIONS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/medications/medications.component')
                .then(m => m.MedicationsComponent)
    }
];