import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    GlucoseCorrelationResponse,
    GlucoseReadingResponse,
    GlucoseStatsResponse,
    RegisterGlucoseRequest
} from '../../../shared/models/glucose.model';

@Injectable({ providedIn: 'root' })
export class GlucoseService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/glucose`;

    register(patientId: string, request: RegisterGlucoseRequest) {
        return this.http.post(`${this.baseUrl}/${patientId}`, request);
    }

    getHistory(patientId: string, from: string, to: string): Observable<GlucoseCorrelationResponse> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http.get<GlucoseCorrelationResponse>(
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

    getLatestReading(patientId: string): Observable<GlucoseReadingResponse | null> {
        const to = new Date().toISOString();
        const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http.get<GlucoseCorrelationResponse>(
            `${this.baseUrl}/${patientId}/history`, { params }
        ).pipe(
            map(res => {
                if (!res.readings.length) return null;
                return [...res.readings].sort(
                    (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
                )[0];
            })
        );
    }
}