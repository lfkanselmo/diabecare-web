import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { DecimalPipe } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { InsulinService } from '../../services/insulin.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { InsulinCalculationResponse } from '../../../../shared/models/insulin.model';

@Component({
  selector: 'app-insulin-calculator',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    TranslocoPipe,
  ],
  templateUrl: './insulin-calculator.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './insulin-calculator.component.scss',
})
export class InsulinCalculatorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly insulinService = inject(InsulinService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);

  loading = signal(false);
  result = signal<InsulinCalculationResponse | null>(null);

  form: FormGroup = this.fb.group({
    currentGlucose: [null, [Validators.required, Validators.min(20)]],
    carbsToEat: [null],
    beforeMeal: [false],
  });

  onCalculate(): void {
    if (this.form.invalid) return;

    const patientId = this.authService.getPatientId();
    if (!patientId) return;

    this.loading.set(true);
    this.result.set(null);

    this.insulinService.calculate(patientId, this.form.getRawValue()).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        const msg =
          err.error?.message ??
          this.transloco.translate('medications.insulinCalculator.errorMessage');
        this.notificationService.danger(msg);
        this.loading.set(false);
      },
    });
  }

  onReset(): void {
    this.form.reset({ beforeMeal: false });
    this.result.set(null);
  }
}
