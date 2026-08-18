import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ExerciseService } from '../../services/exercise.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ExerciseLogResponse } from '../../../../shared/models/exercise.model';
import { MetadataService } from '../../../../core/services/metadata.service';
import { daysAgo, nowAsLocalIso } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-exercise-log',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
    MatPaginatorModule,
    TranslocoPipe,
  ],
  templateUrl: './exercise-log.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './exercise-log.component.scss',
})
export class ExerciseLogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly exerciseService = inject(ExerciseService);
  private readonly authService = inject(AuthService);
  private readonly alertService = inject(AlertService);
  private readonly notificationService = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  readonly metadata = inject(MetadataService);

  loading = signal(false);
  history = signal<ExerciseLogResponse[]>([]);
  totalElements = signal(0);
  pageIndex = signal(0);
  pageSize = signal(20);

  form: FormGroup = this.fb.group({
    exerciseType: ['', Validators.required],
    intensity: ['MODERATE', Validators.required],
    durationMinutes: [null, [Validators.required, Validators.min(1)]],
    notes: [''],
    performedAt: [nowAsLocalIso()],
    caloriesBurned: [null, [Validators.min(0)]],
  });

  customCalories = signal(false);

  ngOnInit(): void {
    this.loadHistory();
  }

  toggleCustomCalories(): void {
    const next = !this.customCalories();
    this.customCalories.set(next);
    if (!next) {
      this.form.patchValue({ caloriesBurned: null });
    }
  }

  setNow(): void {
    this.form.patchValue({ performedAt: nowAsLocalIso() });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    this.loading.set(true);

    const value = this.form.getRawValue();
    const performedAt = value.performedAt
      ? value.performedAt.length === 16
        ? value.performedAt + ':00'
        : value.performedAt
      : undefined;

    const caloriesBurned = this.customCalories() ? value.caloriesBurned : null;

    this.exerciseService.register(patientId, { ...value, performedAt, caloriesBurned }).subscribe({
      next: () => {
        this.pageIndex.set(0);
        this.loadHistory();
        this.form.patchValue({
          durationMinutes: null,
          notes: '',
          performedAt: nowAsLocalIso(),
          caloriesBurned: null,
        });
        this.customCalories.set(false);
        this.notificationService.success(
          this.transloco.translate('vitals.exerciseLog.successMessage'),
        );
        this.loading.set(false);
        this.notifyIfNewAlert(patientId);
      },
      error: () => {
        this.notificationService.danger(
          this.transloco.translate('vitals.exerciseLog.errorMessage'),
        );
        this.loading.set(false);
      },
    });
  }

  getExerciseLabel(type: string): string {
    return this.metadata.getLabelByValue(this.metadata.exerciseTypes(), type);
  }

  getIntensityLabel(intensity: string): string {
    return this.metadata.getLabelByValue(this.metadata.exerciseIntensities(), intensity);
  }

  private notifyIfNewAlert(patientId: string): void {
    this.alertService.getNewAlerts(patientId).subscribe({
      next: (newAlerts) => {
        newAlerts.forEach((alert) =>
          this.notificationService.showAlert(alert, undefined, {
            label: this.transloco.translate('vitals.exerciseLog.view'),
            onClick: () => this.router.navigate(['/app/dashboard']),
          }),
        );
      },
      error: () => {},
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadHistory();
  }

  private loadHistory(): void {
    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    const to = new Date().toISOString();
    const from = daysAgo(30).toISOString();

    this.exerciseService
      .getHistory(patientId, from, to, this.pageIndex(), this.pageSize())
      .subscribe({
        next: (page) => {
          this.history.set(page.content);
          this.totalElements.set(page.totalElements);
        },
        error: () => {},
      });
  }
}
