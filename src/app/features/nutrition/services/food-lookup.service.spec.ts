import { TestBed } from '@angular/core/testing';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FoodLookupService } from './food-lookup.service';
import { ExternalFoodResponse } from '../../../shared/models/external-food.model';
import { environment } from '../../../../environments/environment';

const BASE_URL = `${environment.apiUrl}/food-lookup`;

describe('FoodLookupService', () => {

    let service: FoodLookupService;
    let controller: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                FoodLookupService,
            ],
        });

        service = TestBed.inject(FoodLookupService);
        controller = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        controller.verify();
    });

    describe('lookupBarcode()', () => {

        it('should perform a GET to the food-lookup barcode endpoint', () => {
            // Arrange
            const barcode = '7622210951902';

            // Act
            service.lookupBarcode(barcode).subscribe();

            // Assert
            const req = controller.expectOne(`${BASE_URL}/barcode/${barcode}`);
            expect(req.request.method).toBe('GET');
            req.flush({} as ExternalFoodResponse);
        });

        it('should emit the mapped product on a successful response', () => {
            // Arrange
            const barcode = '7622210951902';
            const response: ExternalFoodResponse = {
                barcode,
                name: 'Nutella',
                brand: 'Ferrero',
                caloriesPer100g: 539,
                carbsPer100g: 57.5,
                proteinsPer100g: 6.3,
                fatsPer100g: 30.9
            };
            let result: ExternalFoodResponse | undefined;

            // Act
            service.lookupBarcode(barcode).subscribe(r => result = r);
            controller.expectOne(`${BASE_URL}/barcode/${barcode}`).flush(response);

            // Assert
            expect(result).toEqual(response);
        });

        it('should propagate an error when the product is not found', () => {
            // Arrange
            const barcode = '0000000000000';
            let errored = false;

            // Act
            service.lookupBarcode(barcode).subscribe({
                error: () => errored = true
            });
            controller
                .expectOne(`${BASE_URL}/barcode/${barcode}`)
                .flush('Not Found', { status: 404, statusText: 'Not Found' });

            // Assert
            expect(errored).toBe(true);
        });
    });
});
