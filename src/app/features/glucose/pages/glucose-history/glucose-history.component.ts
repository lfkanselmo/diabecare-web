import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { GlucoseService } from '../../services/glucose.service';
import { ExerciseService } from '../../../vitals/services/exercise.service';
import { AuthService } from '../../../../core/auth/auth.service';
import {
    GlucoseReadingResponse,
    GlucoseStatus,
    MealMarkerResponse
} from '../../../../shared/models/glucose.model';
import { ExerciseLogResponse } from '../../../../shared/models/exercise.model';
import { GlucoseChartComponent } from '../../components/glucose-chart/glucose-chart.component';
import { MetadataService } from '@core/services/metadata.service';

@Component({
    selector: 'app-glucose-history',
    standalone: true,
    imports: [
        RouterLink,
        DatePipe,
        DecimalPipe,
        NgClass,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatButtonToggleModule,
        MatSnackBarModule,
        GlucoseChartComponent
    ],
    templateUrl: './glucose-history.component.html',
    styleUrl: './glucose-history.component.scss'
})
export class GlucoseHistoryComponent implements OnInit {

    private readonly glucoseService = inject(GlucoseService);
    private readonly exerciseService = inject(ExerciseService);
    private readonly authService = inject(AuthService);
    private readonly snackBar = inject(MatSnackBar);
    readonly metadata = inject(MetadataService);

    readings = signal<GlucoseReadingResponse[]>([]);
    mealMarkers = signal<MealMarkerResponse[]>([]);
    exerciseLogs = signal<ExerciseLogResponse[]>([]);
    loading = signal(true);
    view = signal<'chart' | 'table'>('chart');

    readonly displayedColumns = ['measuredAt', 'value', 'readingType', 'status', 'notes', 'actions'];

    ngOnInit(): void {
        this.loadHistory();
    }

    onDelete(readingId: string): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.glucoseService.delete(patientId, readingId).subscribe({
            next: () => {
                this.readings.update(list => list.filter(r => r.readingId !== readingId));
                this.snackBar.open('Lectura eliminada', 'Cerrar', { duration: 3000 });
            },
            error: () => {
                this.snackBar.open('Error al eliminar la lectura', 'Cerrar', { duration: 3000 });
            }
        });
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            CRITICALLY_LOW: 'Crítico bajo',
            LOW: 'Bajo',
            NORMAL: 'Normal',
            HIGH: 'Alto',
            CRITICALLY_HIGH: 'Crítico alto'
        };
        return labels[status] ?? status;
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

    private loadHistory(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        const to = new Date().toISOString();
        const from = new Date();
        from.setDate(from.getDate() - 30);
        const fromStr = from.toISOString();

        forkJoin({
            glucose: this.glucoseService.getHistory(patientId, fromStr, to),
            exercise: this.exerciseService.getHistory(patientId, fromStr, to)
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
}