import {
  Component,
  inject,
  OnInit,
  signal,
  ChangeDetectorRef,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ProfileService } from '../../services/profile.service';
import { AccountService } from '../../../../core/services/account.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MetadataService } from '@core/services/metadata.service';
import { PatientResponse } from '../../../../shared/models/patient.model';
import { ActiveSession } from '../../../../shared/models/auth.model';
import { MenstrualCycleComponent } from '../../components/menstrual-cycle/menstrual-cycle.component';
import { GlucoseRemindersComponent } from '../../components/glucose-reminders/glucose-reminders.component';
import { DeviceApiKeysComponent } from '../../components/device-api-keys/device-api-keys.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    MatChipsModule,
    MatTabsModule,
    MatDialogModule,
    MenstrualCycleComponent,
    GlucoseRemindersComponent,
    DeviceApiKeysComponent,
    TranslocoPipe,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly accountService = inject(AccountService);
  private readonly authService = inject(AuthService);
  private readonly authApiService = inject(AuthApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly metadata = inject(MetadataService);

  loading = signal(false);
  saving = signal(false);
  suspending = signal(false);
  deleting = signal(false);
  exporting = signal(false);
  confirmDelete = signal(false);
  confirmSuspend = signal(false);
  patient = signal<PatientResponse | null>(null);

  sessions = signal<ActiveSession[]>([]);
  loadingSessions = signal(false);
  confirmLogoutAll = signal(false);
  loggingOutAll = signal(false);

  form: FormGroup = this.fb.group({
    heightCm: [null, [Validators.min(50), Validators.max(250)]],
    targetGlucoseMin: [null, [Validators.required, Validators.min(50)]],
    targetGlucoseMax: [null, [Validators.required, Validators.min(50)]],
    dailyCalorieGoal: [null, [Validators.min(500), Validators.max(5000)]],
    activityLevel: ['', Validators.required],
    preferredGlucoseUnit: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadProfile();
    this.loadSessions();
  }

  onTabChange(): void {
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  }

  onSave(): void {
    if (this.form.invalid) return;

    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    this.saving.set(true);

    this.profileService.update(patientId, this.form.getRawValue()).subscribe({
      next: (updated) => {
        this.patient.set(updated);
        this.authService.saveSession(this.authService.getToken()!, updated);
        this.notificationService.success(this.transloco.translate('profile.account.updateSuccess'));
        this.saving.set(false);
      },
      error: () => {
        this.notificationService.danger(this.transloco.translate('profile.account.updateError'));
        this.saving.set(false);
      },
    });
  }

  onSuspendAccount(): void {
    if (!this.confirmSuspend()) {
      this.confirmSuspend.set(true);
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) return;

    this.suspending.set(true);

    this.accountService.suspend(userId).subscribe({
      next: () => {
        this.notificationService.success(
          this.transloco.translate('profile.account.suspendedSuccess'),
        );
        setTimeout(() => {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: () => {
        this.notificationService.danger(this.transloco.translate('profile.account.suspendError'));
        this.suspending.set(false);
        this.confirmSuspend.set(false);
      },
    });
  }

  onDeleteAccount(): void {
    if (!this.confirmDelete()) {
      this.confirmDelete.set(true);
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) return;

    this.deleting.set(true);

    this.accountService.delete(userId).subscribe({
      next: () => {
        this.notificationService.success(
          this.transloco.translate('profile.account.deletedSuccess'),
        );
        setTimeout(() => {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: () => {
        this.notificationService.danger(this.transloco.translate('profile.account.deleteError'));
        this.deleting.set(false);
        this.confirmDelete.set(false);
      },
    });
  }

  onExportData(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.exporting.set(true);

    this.accountService.exportData(userId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'diabecare_mis_datos.json';
        link.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => {
        this.notificationService.danger(this.transloco.translate('profile.account.exportError'));
        this.exporting.set(false);
      },
    });
  }

  cancelSuspend(): void {
    this.confirmSuspend.set(false);
  }

  cancelDelete(): void {
    this.confirmDelete.set(false);
  }

  onLogoutAllDevices(): void {
    if (!this.confirmLogoutAll()) {
      this.confirmLogoutAll.set(true);
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) return;

    this.loggingOutAll.set(true);

    this.authApiService.logoutAll(userId).subscribe({
      next: () => {
        this.notificationService.success(
          this.transloco.translate('profile.account.logoutAllSuccess'),
        );
        this.authService.clearSession();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.notificationService.danger(this.transloco.translate('profile.account.logoutAllError'));
        this.loggingOutAll.set(false);
        this.confirmLogoutAll.set(false);
      },
    });
  }

  cancelLogoutAll(): void {
    this.confirmLogoutAll.set(false);
  }

  get isFemale(): boolean {
    return this.patient()?.biologicalSex === 'FEMALE';
  }

  private loadSessions(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.loadingSessions.set(true);

    this.authApiService.getActiveSessions(userId).subscribe({
      next: (data) => {
        this.sessions.set(data);
        this.loadingSessions.set(false);
      },
      error: () => this.loadingSessions.set(false),
    });
  }

  private loadProfile(): void {
    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    this.loading.set(true);

    this.profileService.getById(patientId).subscribe({
      next: (data) => {
        this.patient.set(data);
        this.form.patchValue({
          heightCm: data.heightCm,
          targetGlucoseMin: data.targetGlucoseMin,
          targetGlucoseMax: data.targetGlucoseMax,
          dailyCalorieGoal: data.dailyCalorieGoal,
          activityLevel: data.activityLevel,
          preferredGlucoseUnit: data.preferredGlucoseUnit,
        });
        this.cdr.detectChanges();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
