import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { GlucoseService } from '../../../glucose/services/glucose.service';
import { NutritionService } from '../../../nutrition/services/nutrition.service';
import { VitalsService } from '../../../vitals/services/vitals.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { GlucoseStatsResponse } from '../../../../shared/models/glucose.model';
import { DailySummaryResponse } from '../../../../shared/models/nutrition.model';
import { VitalSignResponse } from '../../../../shared/models/vitals.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [MatIconModule, MatButtonModule, RouterLink, DatePipe, DecimalPipe],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

    private readonly glucoseService = inject(GlucoseService);
    private readonly nutritionService = inject(NutritionService);
    private readonly vitalsService = inject(VitalsService);
    private readonly authService = inject(AuthService);

    readonly today = new Date();
    readonly patientId = this.authService.getPatientId();

    glucoseStats = signal<GlucoseStatsResponse | null>(null);
    dailySummary = signal<DailySummaryResponse | null>(null);
    latestVitals = signal<VitalSignResponse | null>(null);
    loading = signal(true);

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

        this.glucoseService.getStats(this.patientId, from, to).subscribe({
            next: (stats) => this.glucoseStats.set(stats),
            error: () => { }
        });

        this.nutritionService.getDailySummary(this.patientId, todayStr).subscribe({
            next: (summary) => this.dailySummary.set(summary),
            error: () => { }
        });

        this.vitalsService.getLatest(this.patientId).subscribe({
            next: (vitals) => this.latestVitals.set(vitals),
            error: () => { }
        });

        this.loading.set(false);
    }
}