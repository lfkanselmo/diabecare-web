import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DeviceApiKeyService } from '../../services/device-api-key.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  DeviceApiKeyResponse,
  GeneratedDeviceApiKeyResponse,
} from '../../../../shared/models/device-api-key.model';

@Component({
  selector: 'app-device-api-keys',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslocoPipe,
  ],
  templateUrl: './device-api-keys.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './device-api-keys.component.scss',
})
export class DeviceApiKeysComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly deviceApiKeyService = inject(DeviceApiKeyService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);

  keys = signal<DeviceApiKeyResponse[]>([]);
  loading = signal(true);
  armedRevokeId = signal<string | null>(null);
  generatedKey = signal<GeneratedDeviceApiKeyResponse | null>(null);

  form: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    this.loadKeys();
  }

  onGenerate(): void {
    if (this.form.invalid) return;

    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    this.deviceApiKeyService.generate(patientId, this.form.value.label).subscribe({
      next: (generated) => {
        this.generatedKey.set(generated);
        this.form.reset();
        this.loadKeys();
      },
      error: () =>
        this.notificationService.danger(
          this.transloco.translate('profile.deviceKeys.generateError'),
        ),
    });
  }

  onDismissGeneratedKey(): void {
    this.generatedKey.set(null);
  }

  async onCopyKey(rawKey: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(rawKey);
      this.notificationService.success(this.transloco.translate('profile.deviceKeys.copied'));
    } catch {
      this.notificationService.danger(this.transloco.translate('profile.deviceKeys.copyError'));
    }
  }

  onArmRevoke(keyId: string): void {
    this.armedRevokeId.set(keyId);
  }

  onCancelRevoke(): void {
    this.armedRevokeId.set(null);
  }

  onRevoke(keyId: string): void {
    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    this.deviceApiKeyService.revoke(patientId, keyId).subscribe({
      next: () => {
        this.armedRevokeId.set(null);
        this.loadKeys();
      },
      error: () => {
        this.armedRevokeId.set(null);
        this.notificationService.danger(this.transloco.translate('profile.deviceKeys.revokeError'));
      },
    });
  }

  private loadKeys(): void {
    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    this.loading.set(true);
    this.deviceApiKeyService.getAll(patientId).subscribe({
      next: (keys) => {
        this.keys.set(keys);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
