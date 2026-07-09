import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ExternalFoodResponse } from '../../../shared/models/external-food.model';

@Injectable({ providedIn: 'root' })
export class FoodLookupService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/food-lookup`;

    lookupBarcode(barcode: string): Observable<ExternalFoodResponse> {
        return this.http.get<ExternalFoodResponse>(`${this.baseUrl}/barcode/${barcode}`);
    }
}
