import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    CaregiverInviteResponse,
    CaregiverLinkResponse,
    PatientAccessResponse,
    RedeemCaregiverInviteResponse
} from '../../../shared/models/caregiver.model';
import { PatientResponse } from '../../../shared/models/patient.model';

@Injectable({ providedIn: 'root' })
export class CaregiversService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/caregivers`;
    private readonly patientsUrl = `${environment.apiUrl}/patients`;

    getPatient(patientId: string): Observable<PatientResponse> {
        return this.http.get<PatientResponse>(`${this.patientsUrl}/${patientId}`);
    }

    createInvite(patientId: string): Observable<CaregiverInviteResponse> {
        return this.http.post<CaregiverInviteResponse>(`${this.baseUrl}/${patientId}/invites`, {});
    }

    getLinks(patientId: string): Observable<CaregiverLinkResponse[]> {
        return this.http.get<CaregiverLinkResponse[]>(`${this.baseUrl}/${patientId}/links`);
    }

    revokeLink(patientId: string, linkId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${patientId}/links/${linkId}`);
    }

    redeem(code: string): Observable<RedeemCaregiverInviteResponse> {
        return this.http.post<RedeemCaregiverInviteResponse>(`${this.baseUrl}/redeem`, { code });
    }

    getMyPatients(): Observable<PatientAccessResponse[]> {
        return this.http.get<PatientAccessResponse[]>(`${this.baseUrl}/my-patients`);
    }
}
