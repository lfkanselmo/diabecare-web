import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlertResponse } from '../../shared/models/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/alerts`;

    getAlerts(patientId: string): Observable<AlertResponse[]> {
        return this.http.get<AlertResponse[]>(`${this.baseUrl}/${patientId}`);
    }
}