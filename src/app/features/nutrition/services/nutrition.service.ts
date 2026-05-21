import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    DailySummaryResponse,
    MealEntryResponse,
    RegisterMealRequest
} from '@shared/models/nutrition.model';

@Injectable({ providedIn: 'root' })
export class NutritionService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/nutrition`;

    registerMeal(patientId: string, request: RegisterMealRequest): Observable<MealEntryResponse> {
        return this.http.post<MealEntryResponse>(
            `${this.baseUrl}/${patientId}/meals`, request);
    }

    getDailySummary(patientId: string, date: string): Observable<DailySummaryResponse> {
        const params = new HttpParams().set('date', date);
        return this.http.get<DailySummaryResponse>(
            `${this.baseUrl}/${patientId}/summary`, { params });
    }
}