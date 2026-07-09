import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NutritionService } from '../../services/nutrition.service';
import { FoodLookupService } from '../../services/food-lookup.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MealItemRequest, MealType } from '../../../../shared/models/nutrition.model';
import { FoodResponse } from '../../../../shared/models/food.model';
import { FoodSearchComponent } from '@features/nutrition/components/food-search.component';
import { BarcodeScannerComponent } from '@features/nutrition/components/barcode-scanner/barcode-scanner.component';
import { MetadataService } from '@core/services/metadata.service';
import { nowAsLocalIso } from '../../../../shared/utils/date.utils';

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
        MatDividerModule,
        MatTooltipModule,
        FoodSearchComponent,
        TranslocoPipe
    ],
    templateUrl: './meal-log.component.html',
    styleUrl: './meal-log.component.scss'
})
export class MealLogComponent {

    private readonly fb = inject(FormBuilder);
    private readonly nutritionService = inject(NutritionService);
    private readonly foodLookupService = inject(FoodLookupService);
    private readonly authService = inject(AuthService);
    private readonly alertService = inject(AlertService);
    private readonly notificationService = inject(NotificationService);
    private readonly transloco = inject(TranslocoService);
    private readonly router = inject(Router);
    private readonly dialog = inject(MatDialog);
    readonly metadata = inject(MetadataService);

    loading = signal(false);
    items = signal<MealItemRequest[]>([]);
    selectedFood = signal<FoodResponse | null>(null);

    mealForm: FormGroup = this.fb.group({
        mealType: ['', Validators.required],
        consumedAt: [nowAsLocalIso(), Validators.required],
        notes: ['']
    });

    quantityForm: FormGroup = this.fb.group({
        quantityGrams: [null, [Validators.required, Validators.min(0.1)]],
        calories: [null, [Validators.required, Validators.min(0)]],
        carbohydrates: [null, [Validators.required, Validators.min(0)]],
        proteins: [null, [Validators.min(0)]],
        fats: [null, [Validators.min(0)]]
    });

    valuesEditedManually = signal(false);

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

    setNow(): void {
        this.mealForm.patchValue({ consumedAt: nowAsLocalIso() });
    }

    onFoodSelected(food: FoodResponse): void {
        this.selectedFood.set(food);
        this.valuesEditedManually.set(false);
        this.quantityForm.reset();
    }

    onScanBarcode(): void {
        const dialogRef = this.dialog.open(BarcodeScannerComponent, { width: '420px' });

        dialogRef.afterClosed().subscribe((barcode: string | undefined) => {
            if (!barcode) return;

            this.foodLookupService.lookupBarcode(barcode).subscribe({
                next: product => this.onFoodSelected({
                    foodId: product.barcode,
                    name: product.name ?? barcode,
                    category: product.brand ?? '',
                    caloriesPer100g: product.caloriesPer100g ?? 0,
                    carbsPer100g: product.carbsPer100g ?? 0,
                    proteinsPer100g: product.proteinsPer100g ?? 0,
                    fatsPer100g: product.fatsPer100g ?? 0,
                    fiberPer100g: null,
                    sodiumPer100g: null
                }),
                error: () => this.notificationService.danger(
                    this.transloco.translate('nutrition.barcodeScanner.notFound'))
            });
        });
    }

    onClearFood(): void {
        this.selectedFood.set(null);
        this.valuesEditedManually.set(false);
        this.quantityForm.reset();
    }

    onQuantityChanged(): void {
        if (this.valuesEditedManually()) return;
        this.recalculateFromQuantity();
    }

    onNutrientEditedManually(): void {
        this.valuesEditedManually.set(true);
    }

    resetToSuggestedValues(): void {
        this.valuesEditedManually.set(false);
        this.recalculateFromQuantity();
    }

    onAddItem(): void {
        if (!this.selectedFood() || this.quantityForm.invalid) return;

        const food = this.selectedFood()!;
        const value = this.quantityForm.getRawValue();

        this.items.update(list => [...list, {
            foodName: food.name,
            quantityGrams: value.quantityGrams,
            calories: value.calories,
            carbohydrates: value.carbohydrates,
            proteins: value.proteins,
            fats: value.fats,
            foodCode: food.foodId
        }]);

        this.selectedFood.set(null);
        this.valuesEditedManually.set(false);
        this.quantityForm.reset();
    }

    private recalculateFromQuantity(): void {
        const food = this.selectedFood();
        const qty = this.quantityForm.get('quantityGrams')?.value;
        if (!food || !qty || qty <= 0) return;

        const factor = qty / 100;
        this.quantityForm.patchValue({
            calories: Math.round(food.caloriesPer100g * factor * 10) / 10,
            carbohydrates: Math.round(food.carbsPer100g * factor * 10) / 10,
            proteins: Math.round(food.proteinsPer100g * factor * 10) / 10,
            fats: Math.round(food.fatsPer100g * factor * 10) / 10
        }, { emitEvent: false });
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
                this.notificationService.success(this.transloco.translate('nutrition.mealLog.successMessage'));
                this.notifyNewAlertsThenNavigate(patientId);
            },
            error: () => {
                this.notificationService.danger(this.transloco.translate('nutrition.mealLog.errorMessage'));
                this.loading.set(false);
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/app/dashboard']);
    }

    private notifyNewAlertsThenNavigate(patientId: string): void {
        this.alertService.getNewAlerts(patientId).subscribe({
            next: newAlerts => {
                newAlerts.forEach(alert => this.notificationService.showAlert(alert));
                this.router.navigate(['/app/dashboard']);
            },
            error: () => this.router.navigate(['/app/dashboard'])
        });
    }

}