import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    CyclePhaseDayResponse,
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

    getPhaseCalendar(patientId: string, from: string, to: string): Observable<CyclePhaseDayResponse[]> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http.get<CyclePhaseDayResponse[]>(
            `${this.baseUrl}/${patientId}/phase-calendar`, { params });
    }
}