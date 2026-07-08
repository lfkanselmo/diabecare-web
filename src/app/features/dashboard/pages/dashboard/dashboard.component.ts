import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { Store } from '@ngrx/store';
import { NutritionService } from '../../../nutrition/services/nutrition.service';
import { VitalsService } from '../../../vitals/services/vitals.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { MenstrualCycleService } from '../../../profile/services/menstrual-cycle.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { SystemConfigService } from '../../../../core/services/system-config.service';
import { GlucoseActions } from '../../../../store/glucose/glucose.actions';
import { selectLoading, selectStats } from '../../../../store/glucose/glucose.selectors';
import { GlucoseStatsResponse } from '../../../../shared/models/glucose.model';
import { DailySummaryResponse } from '../../../../shared/models/nutrition.model';
import { VitalSignResponse } from '../../../../shared/models/vitals.model';
import { AlertResponse } from '../../../../shared/models/alert.model';
import { MenstrualCycleStatusResponse } from '../../../../shared/models/menstrual-cycle.model';
import { AlertsPanelComponent } from '../../../../shared/components/alerts-panel/alerts-panel.component';
import { daysAgo, toLocalDateString } from '../../../../shared/utils/date.utils';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        RouterLink,
        DatePipe,
        DecimalPipe,
        TranslocoPipe,
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
    private readonly authService = inject(AuthService);
    private readonly alertService = inject(AlertService);
    private readonly systemConfig = inject(SystemConfigService);
    private readonly store = inject(Store);
    private readonly destroyRef = inject(DestroyRef);

    readonly today = new Date();
    readonly patientId = this.authService.getPatientId();

    glucoseStats = signal<GlucoseStatsResponse | null>(null);
    glucoseStatsLoading = signal(true);

    dailySummary = signal<DailySummaryResponse | null>(null);
    dailySummaryLoading = signal(true);

    latestVitals = signal<VitalSignResponse | null>(null);
    latestVitalsLoading = signal(true);

    cycleStatus = signal<MenstrualCycleStatusResponse | null>(null);
    cycleStatusLoading = signal(true);

    alerts = signal<AlertResponse[]>([]);
    isFemale = signal(false);

    ngOnInit(): void {
        this.loadDashboardData();
    }

    private loadDashboardData(): void {
        if (!this.patientId) return;

        const now = new Date();
        const from = daysAgo(7).toISOString();
        const to = now.toISOString();
        const todayStr = toLocalDateString(now);

        this.store.dispatch(GlucoseActions.loadStats({ patientId: this.patientId, from, to }));
        this.store.dispatch(GlucoseActions.loadLatest({ patientId: this.patientId }));

        this.store.select(selectStats).pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(stats => this.glucoseStats.set(stats));

        this.store.select(selectLoading).pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(loading => this.glucoseStatsLoading.set(loading));

        this.profileService.getById(this.patientId).subscribe({
            next: patient => {
                this.isFemale.set(patient.biologicalSex === 'FEMALE');
            },
            error: () => { }
        });

        this.cycleService.getStatus(this.patientId).subscribe({
            next: status => {
                this.cycleStatus.set(status);
                this.cycleStatusLoading.set(false);
            },
            error: () => this.cycleStatusLoading.set(false)
        });

        this.nutritionService.getDailySummary(this.patientId, todayStr).subscribe({
            next: summary => {
                this.dailySummary.set(summary);
                this.dailySummaryLoading.set(false);
            },
            error: () => this.dailySummaryLoading.set(false)
        });

        this.vitalsService.getLatest(this.patientId).subscribe({
            next: vitals => {
                this.latestVitals.set(vitals);
                this.latestVitalsLoading.set(false);
            },
            error: () => this.latestVitalsLoading.set(false)
        });

        this.alertService.getAlerts(this.patientId).subscribe({
            next: data => {
                this.alerts.set(data);
                this.alertService.primeKnownAlerts(data);
            },
            error: () => { }
        });
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