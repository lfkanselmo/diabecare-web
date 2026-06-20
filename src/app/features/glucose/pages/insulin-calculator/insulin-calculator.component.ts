import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { InsulinCalculationResponse } from '../../../../shared/models/insulin.model';
import { InsulinService } from '@features/medications/services/insulin.service';

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
        MatDividerModule
    ],
    templateUrl: './insulin-calculator.component.html',
    styleUrl: './insulin-calculator.component.scss'
})
export class InsulinCalculatorComponent {

    private readonly fb = inject(FormBuilder);
    private readonly insulinService = inject(InsulinService);
    private readonly authService = inject(AuthService);
    private readonly notificationService = inject(NotificationService);

    loading = signal(false);
    result = signal<InsulinCalculationResponse | null>(null);

    form: FormGroup = this.fb.group({
        currentGlucose: [null, [Validators.required, Validators.min(20)]],
        carbsToEat: [null],
        beforeMeal: [false]
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
                const msg = err.error?.message ?? 'Error al calcular la dosis';
                this.notificationService.danger(msg);
                this.loading.set(false);
            }
        });
    }

    onReset(): void {
        this.form.reset({ beforeMeal: false });
        this.result.set(null);
    }
}