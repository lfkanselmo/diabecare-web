import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { NutritionService } from '../../../nutrition/services/nutrition.service';
import { VitalsService } from '../../../vitals/services/vitals.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { MenstrualCycleService } from '../../../profile/services/menstrual-cycle.service';
import { GlucoseService } from '../../../glucose/services/glucose.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { GlucoseStateService } from '../../../../core/services/glucose-state.service';
import { SystemConfigService } from '../../../../core/services/system-config.service';
import { GlucoseActions } from '../../../../store/glucose/glucose.actions';
import { selectStats } from '../../../../store/glucose/glucose.selectors';
import { GlucoseStatsResponse } from '../../../../shared/models/glucose.model';
import { DailySummaryResponse } from '../../../../shared/models/nutrition.model';
import { VitalSignResponse } from '../../../../shared/models/vitals.model';
import { AlertResponse } from '../../../../shared/models/alert.model';
import { MenstrualCycleStatusResponse } from '../../../../shared/models/menstrual-cycle.model';
import { AlertsPanelComponent } from '../../../../shared/components/alerts-panel/alerts-panel.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule,
        RouterLink,
        DatePipe,
        DecimalPipe,
        AlertsPanelComponent
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

    private readonly nutritionService = inject(NutritionService);
    private readonly vitalsService = inject(VitalsService);
    private readonly profileService = inject(ProfileService);
    private readonly cycleService = inject(MenstrualCycleService);
    private readonly glucoseService = inject(GlucoseService);
    private readonly authService = inject(AuthService);
    private readonly alertService = inject(AlertService);
    private readonly glucoseStateService = inject(GlucoseStateService);
    private readonly systemConfig = inject(SystemConfigService);
    private readonly store = inject(Store);

    readonly today = new Date();
    readonly patientId = this.authService.getPatientId();

    glucoseStats = signal<GlucoseStatsResponse | null>(null);
    dailySummary = signal<DailySummaryResponse | null>(null);
    latestVitals = signal<VitalSignResponse | null>(null);
    cycleStatus = signal<MenstrualCycleStatusResponse | null>(null);
    alerts = signal<AlertResponse[]>([]);
    loading = signal(true);
    isFemale = signal(false);

    ngOnInit(): void {
        this.loadDashboardData();
    }

    private loadDashboardData(): void {
        if (!this.patientId) return;

        const now = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const from = weekAgo.toISOString();
        const to = now.toISOString();
        const todayStr = now.toISOString().split('T')[0];

        this.store.dispatch(GlucoseActions.loadStats({ patientId: this.patientId, from, to }));

        this.store.select(selectStats).subscribe({
            next: stats => this.glucoseStats.set(stats)
        });

        this.profileService.getById(this.patientId).subscribe({
            next: patient => {
                const female = patient.biologicalSex === 'FEMALE';
                this.isFemale.set(female);
                if (female) {
                    this.cycleService.getStatus(this.patientId!).subscribe({
                        next: status => this.cycleStatus.set(status),
                        error: () => { }
                    });
                }
            },
            error: () => { }
        });

        this.glucoseService.getHistory(this.patientId, from, to).subscribe({
            next: correlation => {
                if (correlation.readings.length > 0) {
                    const latest = [...correlation.readings].sort(
                        (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
                    )[0];
                    this.glucoseStateService.setLatestReading(latest);
                }
            },
            error: () => { }
        });

        this.nutritionService.getDailySummary(this.patientId, todayStr).subscribe({
            next: summary => this.dailySummary.set(summary),
            error: () => { }
        });

        this.vitalsService.getLatest(this.patientId).subscribe({
            next: vitals => this.latestVitals.set(vitals),
            error: () => { }
        });

        this.alertService.getAlerts(this.patientId).subscribe({
            next: data => this.alerts.set(data),
            error: () => { }
        });

        this.loading.set(false);
    }

    getHba1cPercent(hba1c: number): number {
        const min = 4;
        const max = 14;
        return Math.min(100, Math.max(0, ((hba1c - min) / (max - min)) * 100));
    }

    getCyclePhaseColor(phase: string): string {
        return this.systemConfig.getCyclePhaseColor(phase);
    }
}