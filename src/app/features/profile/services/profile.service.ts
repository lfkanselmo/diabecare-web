import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PatientResponse, UpdatePatientRequest } from '../../../shared/models/patient.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/patients`;

    getById(patientId: string): Observable<PatientResponse> {
        return this.http.get<PatientResponse>(`${this.baseUrl}/${patientId}`);
    }

    update(patientId: string, request: UpdatePatientRequest): Observable<PatientResponse> {
        return this.http.put<PatientResponse>(`${this.baseUrl}/${patientId}`, request);
    }
}