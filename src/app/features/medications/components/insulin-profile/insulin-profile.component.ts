import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { InsulinService } from '../../services/insulin.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
    selector: 'app-insulin-profile',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        TranslocoPipe
    ],
    templateUrl: './insulin-profile.component.html',
    styleUrl: './insulin-profile.component.scss'
})
export class InsulinProfileComponent {

    private readonly fb = inject(FormBuilder);
    private readonly insulinService = inject(InsulinService);
    private readonly authService = inject(AuthService);
    private readonly notificationService = inject(NotificationService);
    private readonly transloco = inject(TranslocoService);

    loading = signal(false);
    saved = signal(false);

    form: FormGroup = this.fb.group({
        sensitivityFactor: [null, [Validators.required, Validators.min(1)]],
        carbRatio: [null, [Validators.required, Validators.min(1)]],
        targetGlucose: [null, [Validators.required, Validators.min(50)]]
    });

    onSave(): void {
        if (this.form.invalid) return;

        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);

        this.insulinService.updateInsulinProfile(patientId, this.form.getRawValue()).subscribe({
            next: () => {
                this.saved.set(true);
                this.notificationService.success(this.transloco.translate('medications.insulinProfile.successMessage'));
                this.loading.set(false);
            },
            error: () => {
                this.notificationService.danger(this.transloco.translate('medications.insulinProfile.errorMessage'));
                this.loading.set(false);
            }
        });
    }
}