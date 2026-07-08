import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { CaregiversService } from '../../services/caregivers.service';
import { GlucoseService } from '../../../glucose/services/glucose.service';
import { AlertService } from '../../../../core/services/alert.service';
import { AlertsPanelComponent } from '../../../../shared/components/alerts-panel/alerts-panel.component';
import { PatientResponse } from '../../../../shared/models/patient.model';
import { GlucoseReadingResponse, GlucoseStatsResponse } from '../../../../shared/models/glucose.model';
import { AlertResponse } from '../../../../shared/models/alert.model';
import { MetadataService } from '@core/services/metadata.service';
import { daysAgo } from '../../../../shared/utils/date.utils';

@Component({
    selector: 'app-caregiver-view',
    standalone: true,
    imports: [
        DecimalPipe,
        RouterLink,
        MatIconModule,
        MatProgressSpinnerModule,
        AlertsPanelComponent,
        TranslocoPipe
    ],
    templateUrl: './caregiver-view.component.html',
    styleUrl: './caregiver-view.component.scss'
})
export class CaregiverViewComponent implements OnInit {

    private readonly route = inject(ActivatedRoute);
    private readonly caregiversService = inject(CaregiversService);
    private readonly glucoseService = inject(GlucoseService);
    private readonly alertService = inject(AlertService);
    readonly metadata = inject(MetadataService);

    loading = signal(true);
    patient = signal<PatientResponse | null>(null);
    latestReading = signal<GlucoseReadingResponse | null>(null);
    stats = signal<GlucoseStatsResponse | null>(null);
    alerts = signal<AlertResponse[]>([]);

    ngOnInit(): void {
        const patientId = this.route.snapshot.paramMap.get('patientId');
        if (!patientId) return;

        this.caregiversService.getPatient(patientId).subscribe({
            next: (data) => {
                this.patient.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });

        this.glucoseService.getLatest(patientId).subscribe({
            next: (data) => this.latestReading.set(data),
            error: () => { }
        });

        const to = new Date();
        const from = daysAgo(14);

        this.glucoseService.getStats(patientId, from.toISOString(), to.toISOString()).subscribe({
            next: (data) => this.stats.set(data),
            error: () => { }
        });

        this.alertService.getAlerts(patientId).subscribe({
            next: (data) => this.alerts.set(data),
            error: () => { }
        });
    }

    getDiabetesTypeLabel(type: string): string {
        return this.metadata.getLabelByValue(this.metadata.diabetesTypes(), type);
    }
}
