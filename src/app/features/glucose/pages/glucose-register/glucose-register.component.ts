import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GlucoseService } from '../../services/glucose.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { GlucoseUnit, ReadingType } from '../../../../shared/models/glucose.model';

@Component({
    selector: 'app-glucose-register',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatSnackBarModule
    ],
    templateUrl: './glucose-register.component.html',
    styleUrl: './glucose-register.component.scss'
})
export class GlucoseRegisterComponent {

    private readonly fb = inject(FormBuilder);
    private readonly glucoseService = inject(GlucoseService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly snackBar = inject(MatSnackBar);

    loading = signal(false);

    form: FormGroup = this.fb.group({
        value: [null, [Validators.required, Validators.min(20), Validators.max(600)]],
        unit: ['MG_DL', Validators.required],
        readingType: ['', Validators.required],
        measuredAt: [new Date().toISOString().slice(0, 16), Validators.required],
        notes: [''],
        deviceSource: ['']
    });

    readonly readingTypes: { value: ReadingType; label: string }[] = [
        { value: 'FASTING', label: 'Ayuno' },
        { value: 'PRE_MEAL', label: 'Preprandial' },
        { value: 'POST_MEAL', label: 'Postprandial' },
        { value: 'BEDTIME', label: 'Antes de dormir' },
        { value: 'RANDOM', label: 'Aleatoria' }
    ];

    readonly units: { value: GlucoseUnit; label: string }[] = [
        { value: 'MG_DL', label: 'mg/dL' },
        { value: 'MMOL_L', label: 'mmol/L' }
    ];

    onSubmit(): void {
        if (this.form.invalid) return;

        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);

        const value = this.form.getRawValue();
        const request = {
            ...value,
            measuredAt: new Date(value.measuredAt).toISOString()
        };

        this.glucoseService.register(patientId, request).subscribe({
            next: () => {
                this.snackBar.open('Lectura registrada correctamente', 'Cerrar', { duration: 3000 });
                this.router.navigate(['/app/glucose/history']);
            },
            error: () => {
                this.snackBar.open('Error al registrar la lectura', 'Cerrar', { duration: 3000 });
                this.loading.set(false);
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/app/dashboard']);
    }
}