import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { GlucoseService } from '../../services/glucose.service';
import { BleGlucoseMeterService } from '../../services/ble-glucose-meter.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MetadataService } from '@core/services/metadata.service';
import { nowAsLocalIso, toLocalIso } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-glucose-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    TranslocoPipe,
  ],
  templateUrl: './glucose-register.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './glucose-register.component.scss',
})
export class GlucoseRegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly glucoseService = inject(GlucoseService);
  private readonly bleGlucoseMeterService = inject(BleGlucoseMeterService);
  private readonly authService = inject(AuthService);
  private readonly alertService = inject(AlertService);
  private readonly notificationService = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  readonly metadata = inject(MetadataService);

  loading = signal(false);
  connectingMeter = signal(false);
  readonly bluetoothSupported = this.bleGlucoseMeterService.isSupported();

  form: FormGroup = this.fb.group({
    value: [null, [Validators.required, Validators.min(20), Validators.max(600)]],
    unit: ['MG_DL', Validators.required],
    readingType: ['', Validators.required],
    measuredAt: [nowAsLocalIso(), Validators.required],
    notes: [''],
    deviceSource: [''],
  });

  setNow(): void {
    this.form.patchValue({ measuredAt: nowAsLocalIso() });
  }

  async onConnectMeter(): Promise<void> {
    this.connectingMeter.set(true);

    try {
      const measurement = await this.bleGlucoseMeterService.readLatestMeasurement();

      this.form.patchValue({
        value: measurement.value,
        unit: measurement.unit,
        measuredAt: toLocalIso(measurement.measuredAt),
        deviceSource: measurement.deviceName,
      });

      this.notificationService.success(
        this.transloco.translate('glucose.register.meterConnectedSuccess', {
          device: measurement.deviceName,
        }),
      );
    } catch {
      this.notificationService.danger(
        this.transloco.translate('glucose.register.meterConnectError'),
      );
    } finally {
      this.connectingMeter.set(false);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    this.loading.set(true);

    const value = this.form.getRawValue();
    const measuredAt = value.measuredAt.length === 16 ? value.measuredAt + ':00' : value.measuredAt;

    const request = { ...value, measuredAt };

    this.glucoseService.register(patientId, request).subscribe({
      next: () => {
        this.notificationService.success(
          this.transloco.translate('glucose.register.successMessage'),
        );
        this.notifyNewAlertsThenNavigate(patientId);
      },
      error: () => {
        this.notificationService.danger(this.transloco.translate('glucose.register.errorMessage'));
        this.loading.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/app/dashboard']);
  }

  private notifyNewAlertsThenNavigate(patientId: string): void {
    this.alertService.getNewAlerts(patientId).subscribe({
      next: (newAlerts) => {
        newAlerts.forEach((alert) => this.notificationService.showAlert(alert));
        this.router.navigate(['/app/glucose/history']);
      },
      error: () => this.router.navigate(['/app/glucose/history']),
    });
  }
}
