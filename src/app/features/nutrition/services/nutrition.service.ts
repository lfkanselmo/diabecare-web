import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    DailySummaryResponse,
    MealEntryResponse,
    RegisterMealRequest
} from '@shared/models/nutrition.model';
import { PageResponse } from '@shared/models/page.model';

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

    getMealHistory(
        patientId: string, from: string, to: string,
        page = 0, size = 20
    ): Observable<PageResponse<MealEntryResponse>> {
        const params = new HttpParams()
            .set('from', from).set('to', to)
            .set('page', page).set('size', size);
        return this.http.get<PageResponse<MealEntryResponse>>(
            `${this.baseUrl}/${patientId}/meals`, { params });
    }
}