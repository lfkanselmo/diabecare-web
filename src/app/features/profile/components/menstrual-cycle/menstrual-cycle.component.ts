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
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MenstrualCycleService } from '../../services/menstrual-cycle.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SystemConfigService } from '../../../../core/services/system-config.service';
import { MetadataService } from '../../../../core/services/metadata.service';
import {
    CycleSymptom,
    CyclePhase,
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
        CycleCalendarComponent,
        TranslocoPipe
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
    private readonly transloco = inject(TranslocoService);
    readonly metadata = inject(MetadataService);

    loading = signal(false);
    saving = signal(false);
    finishingPeriod = signal(false);
    confirmFinish = signal(false);
    status = signal<MenstrualCycleStatusResponse | null>(null);
    noData = signal(false);

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

    toggleSymptom(symptom: string): void {
        const current = new Map(this.selectedSymptoms());
        if (current.has(symptom as CycleSymptom)) {
            current.delete(symptom as CycleSymptom);
        } else {
            current.set(symptom as CycleSymptom, 'MILD');
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

    isSymptomSelected(symptom: string): boolean {
        return this.selectedSymptoms().has(symptom as CycleSymptom);
    }

    getSeverityFor(symptom: CycleSymptom): SymptomSeverity {
        return this.selectedSymptoms().get(symptom) ?? 'MILD';
    }

    asSeverity(value: string): SymptomSeverity {
        return value as SymptomSeverity;
    }

    onStartCycle(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.saving.set(true);

        this.cycleService.register(patientId, this.startForm.getRawValue()).subscribe({
            next: data => {
                this.status.set(data);
                this.noData.set(false);
                this.notificationService.success(this.transloco.translate('profile.cycle.periodRegisteredSuccess'));
                this.saving.set(false);
            },
            error: () => {
                this.notificationService.danger(this.transloco.translate('profile.cycle.periodRegisterError'));
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
                this.notificationService.success(this.transloco.translate('profile.cycle.todayEntrySaved'));
                this.saving.set(false);
                this.loadStatus();
            },
            error: () => {
                this.notificationService.danger(this.transloco.translate('profile.cycle.todayEntryError'));
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
                this.notificationService.success(this.transloco.translate('profile.cycle.periodFinishedSuccess'));
                this.finishingPeriod.set(false);
                this.confirmFinish.set(false);
            },
            error: (err) => {
                const message = err?.error?.message ?? this.transloco.translate('profile.cycle.periodFinishError');
                this.notificationService.danger(message);
                this.finishingPeriod.set(false);
                this.confirmFinish.set(false);
            }
        });
    }

    onJumpToFinishPeriod(): void {
        this.confirmFinish.set(true);
        document.getElementById('finish-period-section')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        return this.metadata.getLabelByValue(this.metadata.cycleSymptoms(), symptom);
    }

    getSeverityLabel(severity: string): string {
        return this.metadata.getLabelByValue(this.metadata.symptomSeverities(), severity);
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