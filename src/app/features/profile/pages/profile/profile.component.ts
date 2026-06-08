import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PatientResponse } from '../../../../shared/models/patient.model';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        DatePipe,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatSnackBarModule,
        MatDividerModule,
        MatChipsModule
    ],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly profileService = inject(ProfileService);
    private readonly authService = inject(AuthService);
    private readonly snackBar = inject(MatSnackBar);

    loading = signal(false);
    saving = signal(false);
    patient = signal<PatientResponse | null>(null);

    form: FormGroup = this.fb.group({
        heightCm: [null, [Validators.min(50), Validators.max(250)]],
        targetGlucoseMin: [null, [Validators.required, Validators.min(50)]],
        targetGlucoseMax: [null, [Validators.required, Validators.min(50)]],
        dailyCalorieGoal: [null, [Validators.min(500), Validators.max(5000)]],
        activityLevel: ['', Validators.required],
        preferredGlucoseUnit: ['', Validators.required]
    });

    readonly activityLevels = [
        { value: 'SEDENTARY', label: 'Sedentario' },
        { value: 'LIGHTLY_ACTIVE', label: 'Ligeramente activo' },
        { value: 'MODERATELY_ACTIVE', label: 'Moderadamente activo' },
        { value: 'VERY_ACTIVE', label: 'Muy activo' }
    ];

    readonly glucoseUnits = [
        { value: 'MG_DL', label: 'mg/dL' },
        { value: 'MMOL_L', label: 'mmol/L' }
    ];

    readonly diabetesTypeLabels: Record<string, string> = {
        TYPE_1: 'Tipo 1',
        TYPE_2: 'Tipo 2',
        GESTATIONAL: 'Gestacional',
        LADA: 'LADA',
        MODY: 'MODY'
    };

    ngOnInit(): void {
        this.loadProfile();
    }

    onSave(): void {
        if (this.form.invalid) return;

        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.saving.set(true);

        this.profileService.update(patientId, this.form.getRawValue()).subscribe({
            next: (updated) => {
                this.patient.set(updated);
                this.authService.saveSession(
                    this.authService.getToken()!,
                    updated
                );
                this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', { duration: 3000 });
                this.saving.set(false);
            },
            error: () => {
                this.snackBar.open('Error al actualizar el perfil', 'Cerrar', { duration: 3000 });
                this.saving.set(false);
            }
        });
    }

    private loadProfile(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);

        this.profileService.getById(patientId).subscribe({
            next: (data) => {
                this.patient.set(data);
                this.form.patchValue({
                    heightCm: data.heightCm,
                    targetGlucoseMin: data.targetGlucoseMin,
                    targetGlucoseMax: data.targetGlucoseMax,
                    dailyCalorieGoal: data.dailyCalorieGoal,
                    activityLevel: data.activityLevel,
                    preferredGlucoseUnit: data.preferredGlucoseUnit
                });
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    getActivityLabel(level: string): string {
        return this.activityLevels.find(a => a.value === level)?.label ?? level;
    }
}