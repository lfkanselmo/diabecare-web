import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ExerciseService } from '../../services/exercise.service';
import { AuthService } from '../../../../core/auth/auth.service';
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
        MatSnackBarModule,
        MatDividerModule
    ],
    templateUrl: './exercise-log.component.html',
    styleUrl: './exercise-log.component.scss'
})
export class ExerciseLogComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly exerciseService = inject(ExerciseService);
    private readonly authService = inject(AuthService);
    private readonly snackBar = inject(MatSnackBar);
    readonly metadata = inject(MetadataService);

    loading = signal(false);
    history = signal<ExerciseLogResponse[]>([]);

    form: FormGroup = this.fb.group({
        exerciseType: ['', Validators.required],
        intensity: ['MODERATE', Validators.required],
        durationMinutes: [null, [Validators.required, Validators.min(1)]],
        notes: [''],
        performedAt: [new Date().toISOString().slice(0, 16)]
    });

    ngOnInit(): void {
        this.loadHistory();
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
            next: (log) => {
                this.history.update(list => [log, ...list]);
                this.form.patchValue({ durationMinutes: null, notes: '' });
                this.snackBar.open('Ejercicio registrado', 'Cerrar', { duration: 3000 });
                this.loading.set(false);
            },
            error: () => {
                this.snackBar.open('Error al registrar el ejercicio', 'Cerrar', { duration: 3000 });
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

    private loadHistory(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        const to = new Date().toISOString();
        const from = new Date();
        from.setDate(from.getDate() - 30);

        this.exerciseService.getHistory(patientId, from.toISOString(), to).subscribe({
            next: (data) => this.history.set(data),
            error: () => { }
        });
    }
}