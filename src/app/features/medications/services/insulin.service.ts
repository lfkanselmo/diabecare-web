import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    InsulinCalculationRequest,
    InsulinCalculationResponse,
    UpdateInsulinProfileRequest
} from '../../../shared/models/insulin.model';
import { PatientResponse } from '../../../shared/models/patient.model';

@Injectable({ providedIn: 'root' })
export class InsulinService {

    private readonly http = inject(HttpClient);

    calculate(patientId: string, request: InsulinCalculationRequest): Observable<InsulinCalculationResponse> {
        return this.http.post<InsulinCalculationResponse>(
            `${environment.apiUrl}/insulin/${patientId}/calculate`, request);
    }

    updateInsulinProfile(patientId: string, request: UpdateInsulinProfileRequest): Observable<PatientResponse> {
        return this.http.patch<PatientResponse>(
            `${environment.apiUrl}/patients/${patientId}/insulin-profile`, request);
    }
}