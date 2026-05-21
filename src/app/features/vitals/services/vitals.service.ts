import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RegisterVitalSignRequest, VitalSignResponse } from '@shared/models/vitals.model';

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

    getLatest(patientId: string): Observable<VitalSignResponse> {
        return this.http.get<VitalSignResponse>(`${this.baseUrl}/${patientId}/latest`);
    }
}