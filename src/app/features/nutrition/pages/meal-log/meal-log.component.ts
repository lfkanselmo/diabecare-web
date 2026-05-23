import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { NutritionService } from '../../services/nutrition.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { MealItemRequest, MealType } from '../../../../shared/models/nutrition.model';

@Component({
    selector: 'app-meal-log',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        DecimalPipe,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatSnackBarModule,
        MatDividerModule
    ],
    templateUrl: './meal-log.component.html',
    styleUrl: './meal-log.component.scss'
})
export class MealLogComponent {

    private readonly fb = inject(FormBuilder);
    private readonly nutritionService = inject(NutritionService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly snackBar = inject(MatSnackBar);

    loading = signal(false);
    items = signal<MealItemRequest[]>([]);

    mealForm: FormGroup = this.fb.group({
        mealType: ['', Validators.required],
        consumedAt: [new Date().toISOString().slice(0, 16), Validators.required],
        notes: ['']
    });

    itemForm: FormGroup = this.fb.group({
        foodName: ['', Validators.required],
        quantityGrams: [null, [Validators.required, Validators.min(0.1)]],
        calories: [null, [Validators.required, Validators.min(0)]],
        carbohydrates: [null, [Validators.required, Validators.min(0)]],
        proteins: [null],
        fats: [null]
    });

    readonly mealTypes: { value: MealType; label: string }[] = [
        { value: 'BREAKFAST', label: 'Desayuno' },
        { value: 'LUNCH', label: 'Almuerzo' },
        { value: 'DINNER', label: 'Cena' },
        { value: 'SNACK', label: 'Merienda' }
    ];

    get totalCalories(): number {
        return this.items().reduce((sum, i) => sum + i.calories, 0);
    }

    get totalCarbs(): number {
        return this.items().reduce((sum, i) => sum + i.carbohydrates, 0);
    }

    onAddItem(): void {
        if (this.itemForm.invalid) return;
        this.items.update(list => [...list, this.itemForm.getRawValue()]);
        this.itemForm.reset();
    }

    onRemoveItem(index: number): void {
        this.items.update(list => list.filter((_, i) => i !== index));
    }

    onSubmit(): void {
        if (this.mealForm.invalid || this.items().length === 0) return;

        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);

        const value = this.mealForm.getRawValue();
        const request = {
            ...value,
            consumedAt: new Date(value.consumedAt).toISOString(),
            items: this.items()
        };

        this.nutritionService.registerMeal(patientId, request).subscribe({
            next: () => {
                this.snackBar.open('Comida registrada correctamente', 'Cerrar', { duration: 3000 });
                this.router.navigate(['/app/dashboard']);
            },
            error: () => {
                this.snackBar.open('Error al registrar la comida', 'Cerrar', { duration: 3000 });
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/app/dashboard']);
    }
};