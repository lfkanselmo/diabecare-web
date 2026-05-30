import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/reports`;

    generateMedicalReport(patientId: string, from: string, to: string): Observable<Blob> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http.get(`${this.baseUrl}/${patientId}/medical`, {
            params,
            responseType: 'blob'
        });
    }
}