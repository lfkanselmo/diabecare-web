import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    GlucoseReadingResponse,
    GlucoseStatsResponse,
    RegisterGlucoseRequest
} from '@shared/models/glucose.model';

@Injectable({ providedIn: 'root' })
export class GlucoseService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/glucose`;

    register(patientId: string, request: RegisterGlucoseRequest): Observable<GlucoseReadingResponse> {
        return this.http.post<GlucoseReadingResponse>(`${this.baseUrl}/${patientId}`, request);
    }

    getHistory(patientId: string, from: string, to: string): Observable<GlucoseReadingResponse[]> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http.get<GlucoseReadingResponse[]>(
            `${this.baseUrl}/${patientId}/history`, { params });
    }

    getStats(patientId: string, from: string, to: string): Observable<GlucoseStatsResponse> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http.get<GlucoseStatsResponse>(
            `${this.baseUrl}/${patientId}/stats`, { params });
    }

    delete(patientId: string, readingId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${patientId}/${readingId}`);
    }
}