import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
    selector: 'app-report',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatChipsModule
    ],
    templateUrl: './report.component.html',
    styleUrl: './report.component.scss'
})
export class ReportComponent {

    private readonly fb = inject(FormBuilder);
    private readonly reportService = inject(ReportService);
    private readonly authService = inject(AuthService);
    private readonly notificationService = inject(NotificationService);

    loading = signal(false);

    form: FormGroup = this.fb.group({
        from: [null, Validators.required],
        to: [null, Validators.required]
    });

    readonly quickRanges = [
        { label: 'Últimos 7 días', days: 7 },
        { label: 'Últimos 30 días', days: 30 },
        { label: 'Últimos 90 días', days: 90 },
        { label: 'Últimos 6 meses', days: 180 },
    ];

    get selectedRange(): string {
        const from = this.form.get('from')?.value as Date;
        const to = this.form.get('to')?.value as Date;
        if (!from || !to) return '';
        return `${from.toLocaleDateString('es-CO')} — ${to.toLocaleDateString('es-CO')}`;
    }

    applyQuickRange(days: number): void {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - days);
        this.form.patchValue({ from, to });
    }

    onDownload(): void {
        if (this.form.invalid) return;

        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        const from = (this.form.get('from')?.value as Date).toISOString().split('T')[0];
        const to = (this.form.get('to')?.value as Date).toISOString().split('T')[0];

        this.loading.set(true);

        this.reportService.generateMedicalReport(patientId, from, to).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `DiabeCare_Reporte_${from}_${to}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
                this.loading.set(false);
                this.notificationService.success('Reporte descargado');
            },
            error: () => {
                this.notificationService.danger('Error al generar el reporte');
                this.loading.set(false);
            }
        });
    }
}