import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InsulinService } from '../../services/insulin.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
    selector: 'app-insulin-profile',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule
    ],
    templateUrl: './insulin-profile.component.html',
    styleUrl: './insulin-profile.component.scss'
})
export class InsulinProfileComponent {

    private readonly fb = inject(FormBuilder);
    private readonly insulinService = inject(InsulinService);
    private readonly authService = inject(AuthService);
    private readonly snackBar = inject(MatSnackBar);

    loading = signal(false);
    saved = signal(false);

    form: FormGroup = this.fb.group({
        sensitivityFactor: [null, [Validators.required, Validators.min(1)]],
        carbRatio: [null, [Validators.required, Validators.min(1)]],
        targetGlucose: [null, [Validators.required, Validators.min(50)]]
    });

    onSave(): void {
        if (this.form.invalid) return;

        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);

        this.insulinService.updateInsulinProfile(patientId, this.form.getRawValue()).subscribe({
            next: () => {
                this.saved.set(true);
                this.snackBar.open('Perfil de insulina guardado', 'Cerrar', { duration: 3000 });
                this.loading.set(false);
            },
            error: () => {
                this.snackBar.open('Error al guardar el perfil', 'Cerrar', { duration: 3000 });
                this.loading.set(false);
            }
        });
    }
}