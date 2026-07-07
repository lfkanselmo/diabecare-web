import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    AgpBucketResponse,
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

    getLatest(patientId: string): Observable<GlucoseReadingResponse | null> {
        return this.http.get<GlucoseReadingResponse>(`${this.baseUrl}/${patientId}/latest`);
    }

    getStats(patientId: string, from: string, to: string): Observable<GlucoseStatsResponse> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http.get<GlucoseStatsResponse>(
            `${this.baseUrl}/${patientId}/stats`, { params });
    }

    getAgpProfile(patientId: string, from: string, to: string): Observable<AgpBucketResponse[]> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http.get<AgpBucketResponse[]>(
            `${this.baseUrl}/${patientId}/agp-profile`, { params });
    }

    delete(patientId: string, readingId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${patientId}/${readingId}`);
    }

    exportCsv(patientId: string, from: string, to: string): Observable<Blob> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http.get(`${this.baseUrl}/${patientId}/export/csv`,
            { params, responseType: 'blob' });
    }

    exportJson(patientId: string, from: string, to: string): Observable<Blob> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http.get(`${this.baseUrl}/${patientId}/export/json`,
            { params, responseType: 'blob' });
    }
}