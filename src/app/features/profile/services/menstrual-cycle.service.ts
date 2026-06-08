import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    MenstrualCycleRequest,
    MenstrualCycleStatusResponse
} from '../../../shared/models/menstrual-cycle.model';

@Injectable({ providedIn: 'root' })
export class MenstrualCycleService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/menstrual-cycle`;

    getStatus(patientId: string): Observable<MenstrualCycleStatusResponse> {
        return this.http.get<MenstrualCycleStatusResponse>(
            `${this.baseUrl}/${patientId}/status`);
    }

    register(patientId: string, request: MenstrualCycleRequest): Observable<MenstrualCycleStatusResponse> {
        return this.http.post<MenstrualCycleStatusResponse>(
            `${this.baseUrl}/${patientId}`, request);
    }
}