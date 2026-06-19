import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlertResponse } from '../../shared/models/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/alerts`;

    private readonly lastKnownSignatures = signal<Set<string>>(new Set());

    getAlerts(patientId: string): Observable<AlertResponse[]> {
        return this.http.get<AlertResponse[]>(`${this.baseUrl}/${patientId}`);
    }

    primeKnownAlerts(patientId: string): void {
        this.getAlerts(patientId).subscribe({
            next: alerts => this.lastKnownSignatures.set(new Set(alerts.map(a => this.signatureOf(a)))),
            error: () => { }
        });
    }

    getNewAlerts(patientId: string): Observable<AlertResponse[]> {
        return new Observable<AlertResponse[]>(subscriber => {
            this.getAlerts(patientId).subscribe({
                next: alerts => {
                    const known = this.lastKnownSignatures();
                    const newAlerts = alerts.filter(a => !known.has(this.signatureOf(a)));

                    this.lastKnownSignatures.set(new Set(alerts.map(a => this.signatureOf(a))));

                    subscriber.next(newAlerts);
                    subscriber.complete();
                },
                error: err => subscriber.error(err)
            });
        });
    }

    private signatureOf(alert: AlertResponse): string {
        return `${alert.title}|${alert.message}`;
    }
}