import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MenstrualCycleService } from '../../services/menstrual-cycle.service';
import { AuthService } from '../../../../core/auth/auth.service';
import {
    CyclePhase,
    MenstrualCycleStatusResponse
} from '../../../../shared/models/menstrual-cycle.model';
import { CycleCalendarComponent } from '../cycle-calendar/cycle-calendar.component';

@Component({
    selector: 'app-menstrual-cycle',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        DatePipe,
        DecimalPipe,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatDividerModule,
        MatChipsModule,
        CycleCalendarComponent
    ],
    templateUrl: './menstrual-cycle.component.html',
    styleUrl: './menstrual-cycle.component.scss'
})
export class MenstrualCycleComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly cycleService = inject(MenstrualCycleService);
    private readonly authService = inject(AuthService);
    private readonly snackBar = inject(MatSnackBar);

    loading = signal(false);
    saving = signal(false);
    status = signal<MenstrualCycleStatusResponse | null>(null);
    noData = signal(false);

    form: FormGroup = this.fb.group({
        startDate: [new Date().toISOString().split('T')[0]],
        periodLengthDays: [5],
        symptoms: [''],
        notes: ['']
    });

    readonly phaseColors: Record<CyclePhase, string> = {
        MENSTRUATION: '#EF5350',
        FOLLICULAR: '#66BB6A',
        OVULATION: '#42A5F5',
        LUTEAL_EARLY: '#FFA726',
        LUTEAL_LATE: '#FF7043'
    };

    readonly phaseIcons: Record<CyclePhase, string> = {
        MENSTRUATION: 'water_drop',
        FOLLICULAR: 'local_florist',
        OVULATION: 'egg',
        LUTEAL_EARLY: 'trending_up',
        LUTEAL_LATE: 'warning'
    };

    readonly commonSymptoms = [
        'Cólicos', 'Dolor de cabeza', 'Fatiga',
        'Cambios de humor', 'Hinchazón', 'Antojos',
        'Sensibilidad en senos', 'Dificultad para dormir'
    ];

    selectedSymptoms = signal<string[]>([]);

    ngOnInit(): void {
        this.loadStatus();
    }

    toggleSymptom(symptom: string): void {
        const current = this.selectedSymptoms();
        const updated = current.includes(symptom)
            ? current.filter(s => s !== symptom)
            : [...current, symptom];
        this.selectedSymptoms.set(updated);
        this.form.patchValue({ symptoms: updated.join(', ') });
    }

    isSymptomSelected(symptom: string): boolean {
        return this.selectedSymptoms().includes(symptom);
    }

    onRegister(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.saving.set(true);

        this.cycleService.register(patientId, this.form.getRawValue()).subscribe({
            next: (data) => {
                this.status.set(data);
                this.noData.set(false);
                this.selectedSymptoms.set([]);
                this.form.patchValue({ symptoms: '', notes: '' });
                this.snackBar.open('Ciclo registrado correctamente', 'Cerrar', { duration: 3000 });
                this.saving.set(false);
            },
            error: () => {
                this.snackBar.open('Error al registrar el ciclo', 'Cerrar', { duration: 3000 });
                this.saving.set(false);
            }
        });
    }

    getPhaseColor(phase: CyclePhase): string {
        return this.phaseColors[phase] ?? '#9E9E9E';
    }

    getPhaseIcon(phase: CyclePhase): string {
        return this.phaseIcons[phase] ?? 'circle';
    }

    private loadStatus(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);

        this.cycleService.getStatus(patientId).subscribe({
            next: (data) => {
                this.status.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                if (err.status === 400) this.noData.set(true);
                this.loading.set(false);
            }
        });
    }
}