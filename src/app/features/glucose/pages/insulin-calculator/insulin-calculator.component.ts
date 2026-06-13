import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
    selector: 'app-insulin-calculator',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatDividerModule,
        DecimalPipe,
        RouterLink
    ],
    templateUrl: './insulin-calculator.component.html',
    styleUrl: './insulin-calculator.component.scss'
})
export class InsulinCalculatorComponent {

    private readonly fb = inject(FormBuilder);

    form: FormGroup = this.fb.group({
        currentGlucose: [null, [Validators.required, Validators.min(20)]],
        targetGlucose: [100, [Validators.required, Validators.min(60)]],
        carbsGrams: [null, Validators.min(0)],
        insulinSensitivity: [null, [Validators.required, Validators.min(1)]],
        insulinToCarbRatio: [null, Validators.min(1)]
    });

    result = signal<CalculationResult | null>(null);

    onCalculate(): void {
        if (this.form.invalid) return;

        const { currentGlucose, targetGlucose, carbsGrams, insulinSensitivity, insulinToCarbRatio } = this.form.getRawValue();

        const correctionDose = Math.max(0, (currentGlucose - targetGlucose) / insulinSensitivity);
        const mealDose = (carbsGrams && insulinToCarbRatio) ? carbsGrams / insulinToCarbRatio : 0;
        const totalDose = correctionDose + mealDose;

        this.result.set({ correctionDose, mealDose, totalDose });
    }

    onReset(): void {
        this.form.reset({ targetGlucose: 100 });
        this.result.set(null);
    }
}

interface CalculationResult {
    correctionDose: number;
    mealDose: number;
    totalDose: number;
}