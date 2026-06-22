import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    Hba1cTrendResponse,
    RegisterVitalSignRequest,
    VitalSignResponse
} from '../../../shared/models/vitals.model';

@Injectable({ providedIn: 'root' })
export class VitalsService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/vitals`;

    register(patientId: string, request: RegisterVitalSignRequest): Observable<VitalSignResponse> {
        return this.http.post<VitalSignResponse>(`${this.baseUrl}/${patientId}`, request);
    }

    getAll(patientId: string): Observable<VitalSignResponse[]> {
        return this.http.get<VitalSignResponse[]>(`${this.baseUrl}/${patientId}`);
    }

    getLatest(patientId: string): Observable<VitalSignResponse | null> {
        return this.http.get<VitalSignResponse | null>(`${this.baseUrl}/${patientId}/latest`);
    }

    getHba1cTrend(patientId: string, months = 6): Observable<Hba1cTrendResponse[]> {
        const params = new HttpParams().set('months', months);
        return this.http.get<Hba1cTrendResponse[]>(
            `${this.baseUrl}/${patientId}/hba1c-trend`, { params });
    }
}