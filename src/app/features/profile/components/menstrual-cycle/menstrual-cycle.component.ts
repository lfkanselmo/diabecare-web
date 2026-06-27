import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MenstrualCycleService } from '../../services/menstrual-cycle.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SystemConfigService } from '../../../../core/services/system-config.service';
import {
    CycleSymptom,
    CyclePhase,
    FlowIntensity,
    MenstrualCycleStatusResponse,
    SymptomInput,
    SymptomSeverity
} from '../../../../shared/models/menstrual-cycle.model';
import { CycleCalendarComponent } from '../cycle-calendar/cycle-calendar.component';
import { toLocalDateString } from '../../../../shared/utils/date.utils';

@Component({
    selector: 'app-menstrual-cycle',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        DatePipe,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
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
    finishingPeriod = signal(false);
    confirmFinish = signal(false);
    status = signal<MenstrualCycleStatusResponse | null>(null);
    noData = signal(false);

    readonly flowOptions: { value: FlowIntensity; label: string }[] = [
        { value: 'NONE', label: 'Sin sangrado' },
        { value: 'SPOTTING', label: 'Manchado' },
        { value: 'LIGHT', label: 'Ligero' },
        { value: 'MODERATE', label: 'Moderado' },
        { value: 'HEAVY', label: 'Abundante' },
        { value: 'VERY_HEAVY', label: 'Muy abundante' }
    ];

    readonly severityOptions: { value: SymptomSeverity; label: string }[] = [
        { value: 'MILD', label: 'Leve' },
        { value: 'MODERATE', label: 'Moderado' },
        { value: 'SEVERE', label: 'Severo' }
    ];

    readonly commonSymptoms: CycleSymptom[] = [
        'CRAMPS', 'HEADACHE', 'MIGRAINE', 'FATIGUE', 'MOOD_CHANGES',
        'ANXIETY', 'IRRITABILITY', 'SADNESS', 'BLOATING', 'CRAVINGS',
        'APPETITE_INCREASE', 'APPETITE_DECREASE', 'BREAST_TENDERNESS',
        'SLEEP_DIFFICULTY', 'BACK_PAIN', 'JOINT_PAIN', 'NAUSEA',
        'DIARRHEA', 'CONSTIPATION', 'ACNE', 'SPOTTING', 'HOT_FLASHES',
        'DIZZINESS', 'LOW_LIBIDO', 'HIGH_LIBIDO', 'BRAIN_FOG', 'CLOTS'
    ];

    startForm: FormGroup = this.fb.group({
        startDate: [toLocalDateString(new Date())],
        notes: ['']
    });

    finishForm: FormGroup = this.fb.group({
        endDate: [toLocalDateString(new Date())]
    });

    dayEntryForm: FormGroup = this.fb.group({
        flowIntensity: ['NONE'],
        notes: ['']
    });

    selectedSymptoms = signal<Map<CycleSymptom, SymptomSeverity>>(new Map());

    ngOnInit(): void {
        this.loadStatus();
    }

    toggleSymptom(symptom: CycleSymptom): void {
        const current = new Map(this.selectedSymptoms());
        if (current.has(symptom)) {
            current.delete(symptom);
        } else {
            current.set(symptom, 'MILD');
        }
        this.selectedSymptoms.set(current);
    }

    setSeverity(symptom: CycleSymptom, severity: SymptomSeverity): void {
        const current = new Map(this.selectedSymptoms());
        if (current.has(symptom)) {
            current.set(symptom, severity);
            this.selectedSymptoms.set(current);
        }
    }

    isSymptomSelected(symptom: CycleSymptom): boolean {
        return this.selectedSymptoms().has(symptom);
    }

    getSeverityFor(symptom: CycleSymptom): SymptomSeverity {
        return this.selectedSymptoms().get(symptom) ?? 'MILD';
    }

    onStartCycle(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.saving.set(true);

        this.cycleService.register(patientId, this.startForm.getRawValue()).subscribe({
            next: data => {
                this.status.set(data);
                this.noData.set(false);
                this.notificationService.success('Período registrado correctamente');
                this.saving.set(false);
            },
            error: () => {
                this.notificationService.danger('Error al registrar el período');
                this.saving.set(false);
            }
        });
    }

    onSaveDayEntry(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.saving.set(true);

        const symptoms: SymptomInput[] = Array.from(this.selectedSymptoms().entries())
            .map(([symptom, severity]) => ({ symptom, severity }));

        this.cycleService.registerDayEntry(patientId, {
            entryDate: toLocalDateString(new Date()),
            flowIntensity: this.dayEntryForm.get('flowIntensity')?.value,
            notes: this.dayEntryForm.get('notes')?.value,
            symptoms
        }).subscribe({
            next: () => {
                this.notificationService.success('Registro de hoy guardado');
                this.saving.set(false);
                this.loadStatus();
            },
            error: () => {
                this.notificationService.danger('Error al guardar el registro de hoy');
                this.saving.set(false);
            }
        });
    }

    onFinishPeriod(): void {
        if (!this.confirmFinish()) {
            this.confirmFinish.set(true);
            return;
        }

        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.finishingPeriod.set(true);

        this.cycleService.finishPeriod(patientId, this.finishForm.getRawValue()).subscribe({
            next: data => {
                this.status.set(data);
                this.notificationService.success('Período finalizado. Ahora conocemos tu duración real.');
                this.finishingPeriod.set(false);
                this.confirmFinish.set(false);
            },
            error: (err) => {
                const message = err?.error?.message ?? 'Error al finalizar el período';
                this.notificationService.danger(message);
                this.finishingPeriod.set(false);
                this.confirmFinish.set(false);
            }
        });
    }

    cancelFinish(): void {
        this.confirmFinish.set(false);
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

    getSeverityLabel(severity: SymptomSeverity): string {
        return this.severityOptions.find(s => s.value === severity)?.label ?? severity;
    }

    private loadStatus(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);

        this.cycleService.getStatus(patientId).subscribe({
            next: data => {
                this.status.set(data);
                this.noData.set(false);
                this.loading.set(false);

                if (data.todayEntry) {
                    this.dayEntryForm.patchValue({
                        flowIntensity: data.todayEntry.flowIntensity,
                        notes: data.todayEntry.notes ?? ''
                    });
                    const map = new Map<CycleSymptom, SymptomSeverity>();
                    data.todayEntry.symptoms.forEach(s => map.set(s.symptom, s.severity));
                    this.selectedSymptoms.set(map);
                }
            },
            error: err => {
                if (err.status === 400) this.noData.set(true);
                this.loading.set(false);
            }
        });
    }
}