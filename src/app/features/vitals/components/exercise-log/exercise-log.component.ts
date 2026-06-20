import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ExerciseService } from '../../services/exercise.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ExerciseLogResponse } from '../../../../shared/models/exercise.model';
import { MetadataService } from '../../../../core/services/metadata.service';

@Component({
    selector: 'app-exercise-log',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        DatePipe,
        DecimalPipe,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatDividerModule,
        MatTooltipModule
    ],
    templateUrl: './exercise-log.component.html',
    styleUrl: './exercise-log.component.scss'
})
export class ExerciseLogComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly exerciseService = inject(ExerciseService);
    private readonly authService = inject(AuthService);
    private readonly alertService = inject(AlertService);
    private readonly notificationService = inject(NotificationService);
    private readonly router = inject(Router);
    readonly metadata = inject(MetadataService);

    loading = signal(false);
    history = signal<ExerciseLogResponse[]>([]);

    form: FormGroup = this.fb.group({
        exerciseType: ['', Validators.required],
        intensity: ['MODERATE', Validators.required],
        durationMinutes: [null, [Validators.required, Validators.min(1)]],
        notes: [''],
        performedAt: [this.nowAsLocalIso()]
    });

    ngOnInit(): void {
        this.loadHistory();
    }

    setNow(): void {
        this.form.patchValue({ performedAt: this.nowAsLocalIso() });
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);

        const value = this.form.getRawValue();
        const performedAt = value.performedAt
            ? value.performedAt.length === 16
                ? value.performedAt + ':00'
                : value.performedAt
            : undefined;

        this.exerciseService.register(patientId, { ...value, performedAt }).subscribe({
            next: log => {
                this.history.update(list => [log, ...list]);
                this.form.patchValue({ durationMinutes: null, notes: '', performedAt: this.nowAsLocalIso() });
                this.notificationService.success('Ejercicio registrado');
                this.loading.set(false);
                this.notifyIfNewAlert(patientId);
            },
            error: () => {
                this.notificationService.danger('Error al registrar el ejercicio');
                this.loading.set(false);
            }
        });
    }

    getExerciseLabel(type: string): string {
        return this.metadata.getLabelByValue(this.metadata.exerciseTypes(), type);
    }

    getIntensityLabel(intensity: string): string {
        return this.metadata.getLabelByValue(this.metadata.exerciseIntensities(), intensity);
    }

    private notifyIfNewAlert(patientId: string): void {
        this.alertService.getNewAlerts(patientId).subscribe({
            next: newAlerts => {
                newAlerts.forEach(alert => this.notificationService.showAlert(alert, undefined, {
                    label: 'Ver',
                    onClick: () => this.router.navigate(['/app/dashboard'])
                }));
            },
            error: () => { }
        });
    }

    private loadHistory(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        const to = new Date().toISOString();
        const from = new Date();
        from.setDate(from.getDate() - 30);

        this.exerciseService.getHistory(patientId, from.toISOString(), to).subscribe({
            next: data => this.history.set(data),
            error: () => { }
        });
    }

    private nowAsLocalIso(): string {
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
    }
}