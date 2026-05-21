import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MedicationResponse, RegisterMedicationRequest } from '@shared/models/medication.model';

@Injectable({ providedIn: 'root' })
export class MedicationsService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/medications`;

    register(patientId: string, request: RegisterMedicationRequest): Observable<MedicationResponse> {
        return this.http.post<MedicationResponse>(`${this.baseUrl}/${patientId}`, request);
    }

    getActive(patientId: string): Observable<MedicationResponse[]> {
        return this.http.get<MedicationResponse[]>(`${this.baseUrl}/${patientId}`);
    }

    deactivate(patientId: string, medicationId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${patientId}/${medicationId}`);
    }
}