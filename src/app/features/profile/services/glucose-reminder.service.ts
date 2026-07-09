import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateGlucoseReminderRequest, GlucoseReminderResponse } from '../../../shared/models/glucose-reminder.model';

@Injectable({ providedIn: 'root' })
export class GlucoseReminderService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/glucose-reminders`;

    getAll(patientId: string): Observable<GlucoseReminderResponse[]> {
        return this.http.get<GlucoseReminderResponse[]>(`${this.baseUrl}/${patientId}`);
    }

    create(patientId: string, request: CreateGlucoseReminderRequest): Observable<GlucoseReminderResponse> {
        return this.http.post<GlucoseReminderResponse>(`${this.baseUrl}/${patientId}`, request);
    }

    toggle(patientId: string, reminderId: string, enabled: boolean): Observable<GlucoseReminderResponse> {
        return this.http.patch<GlucoseReminderResponse>(
            `${this.baseUrl}/${patientId}/${reminderId}`, { enabled });
    }

    delete(patientId: string, reminderId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${patientId}/${reminderId}`);
    }
}
