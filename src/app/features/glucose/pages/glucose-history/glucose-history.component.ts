import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GlucoseService } from '../../services/glucose.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { GlucoseReadingResponse, GlucoseStatus } from '../../../../shared/models/glucose.model';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-glucose-history',
    standalone: true,
    imports: [
        NgClass,
        RouterLink,
        DatePipe,
        DecimalPipe,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatChipsModule,
        MatSnackBarModule
    ],
    templateUrl: './glucose-history.component.html',
    styleUrl: './glucose-history.component.scss'
})
export class GlucoseHistoryComponent implements OnInit {

    private readonly glucoseService = inject(GlucoseService);
    private readonly authService = inject(AuthService);
    private readonly snackBar = inject(MatSnackBar);

    readings = signal<GlucoseReadingResponse[]>([]);
    loading = signal(true);

    readonly displayedColumns = ['measuredAt', 'value', 'readingType', 'status', 'notes', 'actions'];

    readonly statusLabels: Record<GlucoseStatus, string> = {
        CRITICALLY_LOW: 'Crítico bajo',
        LOW: 'Bajo',
        NORMAL: 'Normal',
        HIGH: 'Alto',
        CRITICALLY_HIGH: 'Crítico alto'
    };

    readonly readingTypeLabels: Record<string, string> = {
        FASTING: 'Ayuno',
        PRE_MEAL: 'Preprandial',
        POST_MEAL: 'Postprandial',
        BEDTIME: 'Antes de dormir',
        RANDOM: 'Aleatoria'
    };

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
        return this.statusLabels[status as GlucoseStatus] ?? status;
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
        return this.readingTypeLabels[type] ?? type;
    }

    private loadHistory(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        const to = new Date().toISOString();
        const from = new Date();
        from.setDate(from.getDate() - 30);

        this.glucoseService.getHistory(patientId, from.toISOString(), to).subscribe({
            next: (data) => {
                this.readings.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }
}