import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { forkJoin } from 'rxjs';
import { GlucoseService } from '../../services/glucose.service';
import { ExerciseService } from '../../../vitals/services/exercise.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { MetadataService } from '@core/services/metadata.service';
import { SystemConfigService } from '../../../../core/services/system-config.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
    GlucoseReadingResponse,
    GlucoseStatus,
    MealMarkerResponse
} from '../../../../shared/models/glucose.model';
import { ExerciseLogResponse } from '../../../../shared/models/exercise.model';
import { GlucoseChartComponent } from '../../components/glucose-chart/glucose-chart.component';
import { MatDividerModule } from '@angular/material/divider';

@Component({
    selector: 'app-glucose-history',
    standalone: true,
    imports: [
        RouterLink,
        DatePipe,
        DecimalPipe,
        NgClass,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatButtonToggleModule,
        MatMenuModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatInputModule,
        MatDividerModule,
        GlucoseChartComponent
    ],
    templateUrl: './glucose-history.component.html',
    styleUrl: './glucose-history.component.scss'
})
export class GlucoseHistoryComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly glucoseService = inject(GlucoseService);
    private readonly exerciseService = inject(ExerciseService);
    private readonly authService = inject(AuthService);
    private readonly notificationService = inject(NotificationService);
    private readonly systemConfig = inject(SystemConfigService);
    readonly metadata = inject(MetadataService);

    readings = signal<GlucoseReadingResponse[]>([]);
    mealMarkers = signal<MealMarkerResponse[]>([]);
    exerciseLogs = signal<ExerciseLogResponse[]>([]);
    loading = signal(true);
    view = signal<'chart' | 'table'>('chart');

    readonly displayedColumns = ['measuredAt', 'value', 'readingType', 'status', 'notes', 'actions'];

    readonly quickRanges = [
        { label: 'Últimos 7 días', days: 7 },
        { label: 'Últimos 30 días', days: 30 },
        { label: 'Últimos 90 días', days: 90 },
        { label: 'Últimos 6 meses', days: 180 }
    ];

    rangeForm: FormGroup = this.fb.group({
        from: [this.daysAgo(30), Validators.required],
        to: [new Date(), Validators.required]
    });

    selectedRangeLabel = signal('Últimos 30 días');

    ngOnInit(): void {
        this.loadHistory();
    }

    applyQuickRange(label: string, days: number): void {
        const to = new Date();
        const from = this.daysAgo(days);
        this.rangeForm.patchValue({ from, to });
        this.selectedRangeLabel.set(label);
        this.loadHistory();
    }

    applyCustomRange(): void {
        if (this.rangeForm.invalid) return;
        this.selectedRangeLabel.set(this.formatCustomLabel());
        this.loadHistory();
    }

    onDelete(readingId: string): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.glucoseService.delete(patientId, readingId).subscribe({
            next: () => {
                this.readings.update(list => list.filter(r => r.readingId !== readingId));
                this.notificationService.success('Lectura eliminada');
            },
            error: () => {
                this.notificationService.danger('Error al eliminar la lectura');
            }
        });
    }

    getStatusLabel(status: string): string {
        return this.systemConfig.getGlucoseStatusLabel(status);
    }

    getStatusClass(status: string): string {
        const map: Record<GlucoseStatus, string> = {
            CRITICALLY_LOW: 'status--critical',
            LOW: 'status--low',
            NORMAL: 'status--normal',
            HIGH: 'status--high',
            CRITICALLY_HIGH: 'status--critical'
        };
        return map[status as GlucoseStatus] ?? '';
    }

    getReadingTypeLabel(type: string): string {
        return this.metadata.getLabelByValue(this.metadata.readingTypes(), type);
    }

    onExportCsv(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        const { from, to } = this.getRangeIso();

        this.glucoseService.exportCsv(patientId, from, to).subscribe({
            next: blob => this.downloadFile(blob, 'glucosa.csv', 'text/csv'),
            error: () => { }
        });
    }

    onExportJson(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        const { from, to } = this.getRangeIso();

        this.glucoseService.exportJson(patientId, from, to).subscribe({
            next: blob => this.downloadFile(blob, 'glucosa.json', 'application/json'),
            error: () => { }
        });
    }

    private loadHistory(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        const { from, to } = this.getRangeIso();
        this.loading.set(true);

        forkJoin({
            glucose: this.glucoseService.getHistory(patientId, from, to),
            exercise: this.exerciseService.getHistory(patientId, from, to)
        }).subscribe({
            next: ({ glucose, exercise }) => {
                this.readings.set(glucose.readings);
                this.mealMarkers.set(glucose.mealMarkers);
                this.exerciseLogs.set(exercise);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    private getRangeIso(): { from: string; to: string } {
        const fromDate: Date = this.rangeForm.get('from')?.value;
        const toDate: Date = this.rangeForm.get('to')?.value;
        return {
            from: fromDate.toISOString(),
            to: toDate.toISOString()
        };
    }

    private daysAgo(days: number): Date {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
    }

    private formatCustomLabel(): string {
        const from: Date = this.rangeForm.get('from')?.value;
        const to: Date = this.rangeForm.get('to')?.value;
        return `${from.toLocaleDateString('es-CO')} — ${to.toLocaleDateString('es-CO')}`;
    }

    private downloadFile(blob: Blob, filename: string, type: string): void {
        const url = URL.createObjectURL(new Blob([blob], { type }));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}