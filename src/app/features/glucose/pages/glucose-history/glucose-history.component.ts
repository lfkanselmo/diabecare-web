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
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { GlucoseService } from '../../services/glucose.service';
import { ExerciseService } from '../../../vitals/services/exercise.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { MetadataService } from '@core/services/metadata.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LanguageService } from '../../../../core/services/language.service';
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
        MatTooltipModule,
        GlucoseChartComponent,
        TranslocoPipe
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
    private readonly transloco = inject(TranslocoService);
    private readonly languageService = inject(LanguageService);
    readonly metadata = inject(MetadataService);

    readings = signal<GlucoseReadingResponse[]>([]);
    mealMarkers = signal<MealMarkerResponse[]>([]);
    exerciseLogs = signal<ExerciseLogResponse[]>([]);
    loading = signal(true);
    view = signal<'chart' | 'table'>('chart');
    armedDeleteReadingId = signal<string | null>(null);

    readonly displayedColumns = ['measuredAt', 'value', 'readingType', 'status', 'notes', 'actions'];

    readonly quickRanges = [
        { labelKey: 'glucose.history.last7Days', days: 7 },
        { labelKey: 'glucose.history.last30Days', days: 30 },
        { labelKey: 'glucose.history.last90Days', days: 90 },
        { labelKey: 'glucose.history.last6Months', days: 180 }
    ];

    rangeForm: FormGroup = this.fb.group({
        from: [this.daysAgo(30), Validators.required],
        to: [new Date(), Validators.required]
    });

    selectedRangeLabel = signal(this.transloco.translate('glucose.history.last30Days'));

    ngOnInit(): void {
        this.loadHistory();
    }

    applyQuickRange(labelKey: string, days: number): void {
        const to = new Date();
        const from = this.daysAgo(days);
        this.rangeForm.patchValue({ from, to });
        this.selectedRangeLabel.set(this.transloco.translate(labelKey));
        this.loadHistory();
    }

    applyCustomRange(): void {
        if (this.rangeForm.invalid) return;
        this.selectedRangeLabel.set(this.formatCustomLabel());
        this.loadHistory();
    }

    onArmDelete(readingId: string): void {
        this.armedDeleteReadingId.set(readingId);
    }

    onCancelDelete(): void {
        this.armedDeleteReadingId.set(null);
    }

    onDelete(readingId: string): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.glucoseService.delete(patientId, readingId).subscribe({
            next: () => {
                this.readings.update(list => list.filter(r => r.readingId !== readingId));
                this.armedDeleteReadingId.set(null);
                this.notificationService.success(this.transloco.translate('glucose.history.deletedSuccess'));
            },
            error: () => {
                this.armedDeleteReadingId.set(null);
                this.notificationService.danger(this.transloco.translate('glucose.history.deleteError'));
            }
        });
    }

    getStatusLabel(status: string): string {
        return this.metadata.getLabelByValue(this.metadata.glucoseStatuses(), status);
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
            glucose: this.glucoseService.getHistory(patientId, from, to, 0, 500),
            exercise: this.exerciseService.getHistory(patientId, from, to, 0, 500)
        }).subscribe({
            next: ({ glucose, exercise }) => {
                this.readings.set(glucose.readings.content);
                this.mealMarkers.set(glucose.mealMarkers);
                this.exerciseLogs.set(exercise.content);
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
        const locale = this.languageService.getActiveLang() === 'en' ? 'en-US' : 'es-CO';
        return `${from.toLocaleDateString(locale)} — ${to.toLocaleDateString(locale)}`;
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