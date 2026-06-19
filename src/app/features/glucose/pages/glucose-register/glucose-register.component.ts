import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GlucoseService } from '../../services/glucose.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { GlucoseUnit, ReadingType } from '../../../../shared/models/glucose.model';
import { MetadataService } from '@core/services/metadata.service';

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
        MatSnackBarModule,
        MatTooltipModule
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
    readonly metadata = inject(MetadataService);

    loading = signal(false);

    form: FormGroup = this.fb.group({
        value: [null, [Validators.required, Validators.min(20), Validators.max(600)]],
        unit: ['MG_DL', Validators.required],
        readingType: ['', Validators.required],
        measuredAt: [this.nowAsLocalIso(), Validators.required],
        notes: [''],
        deviceSource: ['']
    });

    setNow(): void {
        this.form.patchValue({ measuredAt: this.nowAsLocalIso() });
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);

        const value = this.form.getRawValue();
        const measuredAt = value.measuredAt.length === 16
            ? value.measuredAt + ':00'
            : value.measuredAt;

        const request = { ...value, measuredAt };

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

    private nowAsLocalIso(): string {
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
    }
}