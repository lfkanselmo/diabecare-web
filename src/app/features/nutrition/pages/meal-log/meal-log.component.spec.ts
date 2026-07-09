import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { MealLogComponent } from './meal-log.component';
import { NutritionService } from '../../services/nutrition.service';
import { FoodLookupService } from '../../services/food-lookup.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MetadataService } from '@core/services/metadata.service';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { ExternalFoodResponse } from '../../../../shared/models/external-food.model';

describe('MealLogComponent', () => {

    let foodLookupServiceMock: { lookupBarcode: ReturnType<typeof vi.fn> };
    let notificationServiceMock: { success: ReturnType<typeof vi.fn>; danger: ReturnType<typeof vi.fn> };
    let dialogMock: { open: ReturnType<typeof vi.fn> };
    let afterClosedSubject: Subject<string | undefined>;

    function createComponent() {
        foodLookupServiceMock = { lookupBarcode: vi.fn() };
        notificationServiceMock = { success: vi.fn(), danger: vi.fn() };
        afterClosedSubject = new Subject<string | undefined>();
        dialogMock = { open: vi.fn().mockReturnValue({ afterClosed: () => afterClosedSubject.asObservable() }) };

        TestBed.configureTestingModule({
            providers: [
                { provide: NutritionService, useValue: {} },
                { provide: FoodLookupService, useValue: foodLookupServiceMock },
                { provide: AuthService, useValue: { getPatientId: () => 'patient-1' } },
                { provide: AlertService, useValue: {} },
                { provide: NotificationService, useValue: notificationServiceMock },
                { provide: MetadataService, useValue: { mealTypes: signal([]) } },
                { provide: MatDialog, useValue: dialogMock },
                { provide: TranslocoService, useValue: { translate: (key: string) => key } },
                { provide: Router, useValue: { navigate: vi.fn() } }
            ]
        });

        return TestBed.createComponent(MealLogComponent).componentInstance;
    }

    function makeProduct(overrides: Partial<ExternalFoodResponse> = {}): ExternalFoodResponse {
        return {
            barcode: '7622210951902',
            name: 'Nutella',
            brand: 'Ferrero',
            caloriesPer100g: 539,
            carbsPer100g: 57.5,
            proteinsPer100g: 6.3,
            fatsPer100g: 30.9,
            ...overrides
        };
    }

    describe('onScanBarcode', () => {

        it('no consulta el food-lookup cuando el diálogo se cierra sin código', () => {
            const component = createComponent();

            component.onScanBarcode();
            afterClosedSubject.next(undefined);

            expect(foodLookupServiceMock.lookupBarcode).not.toHaveBeenCalled();
        });

        it('selecciona el producto encontrado mapeándolo al formato de comida', () => {
            const component = createComponent();
            const product = makeProduct();
            foodLookupServiceMock.lookupBarcode.mockReturnValue(of(product));

            component.onScanBarcode();
            afterClosedSubject.next(product.barcode);

            expect(foodLookupServiceMock.lookupBarcode).toHaveBeenCalledWith(product.barcode);
            expect(component.selectedFood()).toEqual({
                foodId: product.barcode,
                name: product.name,
                category: product.brand,
                caloriesPer100g: product.caloriesPer100g,
                carbsPer100g: product.carbsPer100g,
                proteinsPer100g: product.proteinsPer100g,
                fatsPer100g: product.fatsPer100g,
                fiberPer100g: null,
                sodiumPer100g: null
            });
        });

        it('usa el código de barras como nombre y cadena vacía como categoría cuando faltan', () => {
            const component = createComponent();
            const product = makeProduct({ name: null, brand: null });
            foodLookupServiceMock.lookupBarcode.mockReturnValue(of(product));

            component.onScanBarcode();
            afterClosedSubject.next(product.barcode);

            expect(component.selectedFood()?.name).toBe(product.barcode);
            expect(component.selectedFood()?.category).toBe('');
        });

        it('notifica un error cuando el producto no se encuentra', () => {
            const component = createComponent();
            foodLookupServiceMock.lookupBarcode.mockReturnValue(throwError(() => new Error('not found')));

            component.onScanBarcode();
            afterClosedSubject.next('0000000000000');

            expect(notificationServiceMock.danger).toHaveBeenCalledWith('nutrition.barcodeScanner.notFound');
            expect(component.selectedFood()).toBeNull();
        });
    });
});
