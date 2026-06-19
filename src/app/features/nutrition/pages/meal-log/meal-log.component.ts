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
import { MatTooltipModule } from '@angular/material/tooltip';
import { NutritionService } from '../../services/nutrition.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { MealItemRequest, MealType } from '../../../../shared/models/nutrition.model';
import { FoodResponse } from '../../../../shared/models/food.model';
import { FoodSearchComponent } from '@features/nutrition/components/food-search.component';
import { MetadataService } from '@core/services/metadata.service';

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
        MatDividerModule,
        MatTooltipModule,
        FoodSearchComponent
    ],
    templateUrl: './meal-log.component.html',
    styleUrl: './meal-log.component.scss'
})
export class MealLogComponent {

    private readonly fb = inject(FormBuilder);
    private readonly nutritionService = inject(NutritionService);
    private readonly authService = inject(AuthService);
    private readonly alertService = inject(AlertService);
    private readonly router = inject(Router);
    private readonly snackBar = inject(MatSnackBar);
    readonly metadata = inject(MetadataService);

    loading = signal(false);
    items = signal<MealItemRequest[]>([]);
    selectedFood = signal<FoodResponse | null>(null);

    mealForm: FormGroup = this.fb.group({
        mealType: ['', Validators.required],
        consumedAt: [this.nowAsLocalIso(), Validators.required],
        notes: ['']
    });

    quantityForm: FormGroup = this.fb.group({
        quantityGrams: [null, [Validators.required, Validators.min(0.1)]]
    });

    get totalCalories(): number {
        return this.items().reduce((sum, i) => sum + i.calories, 0);
    }

    get totalCarbs(): number {
        return this.items().reduce((sum, i) => sum + i.carbohydrates, 0);
    }

    get totalProteins(): number {
        return this.items().reduce((sum, i) => sum + (i.proteins ?? 0), 0);
    }

    get totalFats(): number {
        return this.items().reduce((sum, i) => sum + (i.fats ?? 0), 0);
    }

    get calculatedValues() {
        const food = this.selectedFood();
        const qty = this.quantityForm.get('quantityGrams')?.value;
        if (!food || !qty || qty <= 0) return null;

        const factor = qty / 100;
        return {
            calories: Math.round(food.caloriesPer100g * factor * 10) / 10,
            carbohydrates: Math.round(food.carbsPer100g * factor * 10) / 10,
            proteins: Math.round(food.proteinsPer100g * factor * 10) / 10,
            fats: Math.round(food.fatsPer100g * factor * 10) / 10
        };
    }

    setNow(): void {
        this.mealForm.patchValue({ consumedAt: this.nowAsLocalIso() });
    }

    onFoodSelected(food: FoodResponse): void {
        this.selectedFood.set(food);
        this.quantityForm.reset();
    }

    onClearFood(): void {
        this.selectedFood.set(null);
        this.quantityForm.reset();
    }

    onAddItem(): void {
        if (!this.selectedFood() || this.quantityForm.invalid) return;
        const calc = this.calculatedValues;
        if (!calc) return;

        const food = this.selectedFood()!;
        const qty = this.quantityForm.get('quantityGrams')?.value;

        this.items.update(list => [...list, {
            foodName: food.name,
            quantityGrams: qty,
            calories: calc.calories,
            carbohydrates: calc.carbohydrates,
            proteins: calc.proteins,
            fats: calc.fats,
            foodCode: food.foodId
        }]);

        this.selectedFood.set(null);
        this.quantityForm.reset();
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

        const localDate = value.consumedAt;
        const consumedAt = localDate.length === 16
            ? localDate + ':00'
            : localDate;

        const request = {
            ...value,
            consumedAt,
            items: this.items()
        };

        this.nutritionService.registerMeal(patientId, request).subscribe({
            next: () => {
                this.snackBar.open('Comida registrada correctamente', 'Cerrar', { duration: 3000 });
                this.checkAlertsThenNavigate(patientId);
            },
            error: () => {
                this.snackBar.open('Error al registrar la comida', 'Cerrar', { duration: 3000 });
                this.loading.set(false);
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/app/dashboard']);
    }

    private checkAlertsThenNavigate(patientId: string): void {
        this.alertService.getNewAlerts(patientId).subscribe({
            next: newAlerts => {
                this.router.navigate(['/app/dashboard']);

                if (newAlerts.length > 0) {
                    const first = newAlerts[0];
                    setTimeout(() => {
                        this.snackBar.open(`⚠ ${first.title}`, 'Ver', { duration: 6000 });
                    }, 400);
                }
            },
            error: () => {
                this.router.navigate(['/app/dashboard']);
            }
        });
    }

    private nowAsLocalIso(): string {
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
    }
}