import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CaregiversService } from '../../services/caregivers.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  CaregiverInviteResponse,
  CaregiverLinkResponse,
  PatientAccessResponse,
} from '../../../../shared/models/caregiver.model';

@Component({
  selector: 'app-caregivers',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    TranslocoPipe,
  ],
  templateUrl: './caregivers.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './caregivers.component.scss',
})
export class CaregiversComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly caregiversService = inject(CaregiversService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);

  links = signal<CaregiverLinkResponse[]>([]);
  myPatients = signal<PatientAccessResponse[]>([]);
  generatingInvite = signal(false);
  invite = signal<CaregiverInviteResponse | null>(null);
  armedRevokeLinkId = signal<string | null>(null);
  redeeming = signal(false);

  readonly redeemForm = this.fb.group({
    code: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadLinks();
    this.loadMyPatients();
  }

  onGenerateInvite(): void {
    const patientId = this.myPatientId();
    if (!patientId) return;

    this.generatingInvite.set(true);
    this.caregiversService.createInvite(patientId).subscribe({
      next: (result) => {
        this.invite.set(result);
        this.generatingInvite.set(false);
      },
      error: () => {
        this.notificationService.danger(this.transloco.translate('caregivers.errorInvite'));
        this.generatingInvite.set(false);
      },
    });
  }

  onCopyCode(): void {
    const code = this.invite()?.code;
    if (!code) return;

    navigator.clipboard.writeText(code);
    this.notificationService.success(this.transloco.translate('caregivers.codeCopied'));
  }

  onArmRevoke(linkId: string): void {
    this.armedRevokeLinkId.set(linkId);
  }

  onCancelRevoke(): void {
    this.armedRevokeLinkId.set(null);
  }

  onRevoke(linkId: string): void {
    const patientId = this.myPatientId();
    if (!patientId) return;

    this.caregiversService.revokeLink(patientId, linkId).subscribe({
      next: () => {
        this.links.update((list) => list.filter((l) => l.linkId !== linkId));
        this.armedRevokeLinkId.set(null);
        this.notificationService.success(this.transloco.translate('caregivers.revoked'));
      },
      error: () => {
        this.notificationService.danger(this.transloco.translate('caregivers.errorRevoke'));
        this.armedRevokeLinkId.set(null);
      },
    });
  }

  onRedeem(): void {
    if (this.redeemForm.invalid) return;
    const code = this.redeemForm.value.code!;

    this.redeeming.set(true);
    this.caregiversService.redeem(code).subscribe({
      next: (result) => {
        this.notificationService.success(
          this.transloco.translate('caregivers.redeemSuccess', { name: result.patientFullName }),
        );
        this.redeemForm.reset();
        this.redeeming.set(false);
        this.loadMyPatients();
      },
      error: () => {
        this.notificationService.danger(this.transloco.translate('caregivers.errorRedeem'));
        this.redeeming.set(false);
      },
    });
  }

  private loadLinks(): void {
    const patientId = this.myPatientId();
    if (!patientId) return;

    this.caregiversService.getLinks(patientId).subscribe({
      next: (data) => this.links.set(data),
      error: () => {},
    });
  }

  private loadMyPatients(): void {
    this.caregiversService.getMyPatients().subscribe({
      next: (data) => this.myPatients.set(data),
      error: () => {},
    });
  }

  private myPatientId(): string | null {
    return this.authService.getPatientId();
  }
}
