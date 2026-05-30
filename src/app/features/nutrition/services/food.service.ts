import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FoodResponse } from '../../../shared/models/food.model';

@Injectable({ providedIn: 'root' })
export class FoodService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/foods`;

    search(query: string): Observable<FoodResponse[]> {
        const params = new HttpParams().set('query', query);
        return this.http.get<FoodResponse[]>(`${this.baseUrl}/search`, { params });
    }
}