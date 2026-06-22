import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MenstrualCycleService } from '../../services/menstrual-cycle.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SystemConfigService } from '../../../../core/services/system-config.service';
import { CyclePhase, MenstrualCycleStatusResponse } from '../../../../shared/models/menstrual-cycle.model';
import { CycleCalendarComponent } from '../cycle-calendar/cycle-calendar.component';
import { toLocalDateString } from '../../../../shared/utils/date.utils';

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
    private readonly notificationService = inject(NotificationService);
    private readonly systemConfig = inject(SystemConfigService);

    loading = signal(false);
    saving = signal(false);
    status = signal<MenstrualCycleStatusResponse | null>(null);
    noData = signal(false);

    form: FormGroup = this.fb.group({
        startDate: [toLocalDateString(new Date())],
        periodLengthDays: [5],
        symptoms: [''],
        notes: ['']
    });

    readonly commonSymptoms = [
        'CRAMPS', 'HEADACHE', 'FATIGUE', 'MOOD_CHANGES',
        'BLOATING', 'CRAVINGS', 'BREAST_TENDERNESS', 'SLEEP_DIFFICULTY',
        'BACK_PAIN', 'NAUSEA', 'ACNE', 'SPOTTING'
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
            next: data => {
                this.status.set(data);
                this.noData.set(false);
                this.selectedSymptoms.set([]);
                this.form.patchValue({ symptoms: '', notes: '' });
                this.notificationService.success('Ciclo registrado correctamente');
                this.saving.set(false);
            },
            error: () => {
                this.notificationService.danger('Error al registrar el ciclo');
                this.saving.set(false);
            }
        });
    }

    getPhaseColor(phase: CyclePhase): string {
        return this.systemConfig.getCyclePhaseColor(phase);
    }

    getPhaseIcon(phase: CyclePhase): string {
        return this.systemConfig.getPhaseIcon(phase);
    }

    getSymptomLabel(symptom: string): string {
        return this.systemConfig.getSymptomLabel(symptom);
    }

    getSymptomsList(symptoms: string): string {
        return symptoms
            .split(',')
            .map(s => this.systemConfig.getSymptomLabel(s.trim()))
            .join(', ');
    }

    private loadStatus(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);

        this.cycleService.getStatus(patientId).subscribe({
            next: data => {
                this.status.set(data);
                this.loading.set(false);
            },
            error: err => {
                if (err.status === 400) this.noData.set(true);
                this.loading.set(false);
            }
        });
    }
}