import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ReportService } from '../../services/report.service';
import { AgpChartComponent } from '../../components/agp-chart/agp-chart.component';
import { GlucoseService } from '../../../glucose/services/glucose.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LanguageService } from '../../../../core/services/language.service';
import {
  daysAgo,
  formatDateRangeLabel,
  toLocalDateString,
} from '../../../../shared/utils/date.utils';
import { AgpBucketResponse } from '../../../../shared/models/glucose.model';

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
    MatChipsModule,
    AgpChartComponent,
    TranslocoPipe,
  ],
  templateUrl: './report.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './report.component.scss',
})
export class ReportComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly reportService = inject(ReportService);
  private readonly glucoseService = inject(GlucoseService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);
  private readonly languageService = inject(LanguageService);

  loading = signal(false);
  agpBuckets = signal<AgpBucketResponse[]>([]);

  readonly targetMin = this.authService.getPatient()?.targetGlucoseMin ?? 70;
  readonly targetMax = this.authService.getPatient()?.targetGlucoseMax ?? 180;

  form: FormGroup = this.fb.group({
    from: [null, Validators.required],
    to: [null, Validators.required],
  });

  readonly quickRanges = [
    { labelKey: 'reports.last7Days', days: 7 },
    { labelKey: 'reports.last30Days', days: 30 },
    { labelKey: 'reports.last90Days', days: 90 },
    { labelKey: 'reports.last6Months', days: 180 },
  ];

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.loadAgpProfile());
  }

  get selectedRange(): string {
    const from = this.form.get('from')?.value as Date;
    const to = this.form.get('to')?.value as Date;
    if (!from || !to) return '';
    return formatDateRangeLabel(from, to, this.languageService.getActiveLang());
  }

  applyQuickRange(days: number): void {
    const to = new Date();
    const from = daysAgo(days);
    this.form.patchValue({ from, to });
  }

  private loadAgpProfile(): void {
    const from = this.form.get('from')?.value as Date;
    const to = this.form.get('to')?.value as Date;
    if (!from || !to) {
      this.agpBuckets.set([]);
      return;
    }

    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    this.glucoseService.getAgpProfile(patientId, from.toISOString(), to.toISOString()).subscribe({
      next: (data) => this.agpBuckets.set(data),
      error: () => this.agpBuckets.set([]),
    });
  }

  onDownload(): void {
    if (this.form.invalid) return;

    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    const from = toLocalDateString(this.form.get('from')?.value as Date);
    const to = toLocalDateString(this.form.get('to')?.value as Date);

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
        this.notificationService.success(this.transloco.translate('reports.downloadedSuccess'));
      },
      error: () => {
        this.notificationService.danger(this.transloco.translate('reports.errorMessage'));
        this.loading.set(false);
      },
    });
  }
}
