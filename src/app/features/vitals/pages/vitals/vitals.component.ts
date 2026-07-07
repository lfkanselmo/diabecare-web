import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { VitalsService } from '../../services/vitals.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Hba1cTrendResponse, VitalSignResponse } from '../../../../shared/models/vitals.model';
import { Hba1cChartComponent } from '../../components/hba1c-chart/hba1c-chart.component';
import { ExerciseLogComponent } from '../../components/exercise-log/exercise-log.component';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
    selector: 'app-vitals',
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
        MatButtonToggleModule,
        MatTabsModule,
        Hba1cChartComponent,
        ExerciseLogComponent,
        TranslocoPipe
    ],
    templateUrl: './vitals.component.html',
    styleUrl: './vitals.component.scss'
})
export class VitalsComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly vitalsService = inject(VitalsService);
    private readonly authService = inject(AuthService);
    private readonly notificationService = inject(NotificationService);
    private readonly transloco = inject(TranslocoService);

    loading = signal(false);
    history = signal<VitalSignResponse[]>([]);
    hba1cTrend = signal<Hba1cTrendResponse[]>([]);
    trendMonths = signal<3 | 6 | 12>(6);

    form: FormGroup = this.fb.group({
        weightKg: [null],
        heightCm: [null],
        systolicBp: [null],
        diastolicBp: [null],
        heartRate: [null],
        hba1c: [null],
        notes: ['']
    });

    get bmiLabels(): Record<string, string> {
        return {
            UNDERWEIGHT: this.transloco.translate('vitals.bmiUnderweight'),
            NORMAL: this.transloco.translate('vitals.bmiNormal'),
            OVERWEIGHT: this.transloco.translate('vitals.bmiOverweight'),
            OBESE: this.transloco.translate('vitals.bmiObese')
        };
    }

    ngOnInit(): void {
        this.loadHistory();
        this.loadTrend();
    }

    onSubmit(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);

        this.vitalsService.register(patientId, this.form.getRawValue()).subscribe({
            next: (vital) => {
                this.history.update(list => [vital, ...list]);
                this.form.reset();
                this.loadTrend();
                this.notificationService.success(this.transloco.translate('vitals.successMessage'));
                this.loading.set(false);
            },
            error: () => {
                this.notificationService.danger(this.transloco.translate('vitals.errorMessage'));
                this.loading.set(false);
            }
        });
    }

    onTrendMonthsChange(months: 3 | 6 | 12): void {
        this.trendMonths.set(months);
        this.loadTrend();
    }

    private loadHistory(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;
        this.vitalsService.getAll(patientId).subscribe({
            next: (data) => this.history.set(data),
            error: () => { }
        });
    }

    private loadTrend(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;
        this.vitalsService.getHba1cTrend(patientId, this.trendMonths()).subscribe({
            next: (data) => this.hba1cTrend.set(data),
            error: () => { }
        });
    }
}