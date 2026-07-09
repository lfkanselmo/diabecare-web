import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DeviceApiKeyResponse, GeneratedDeviceApiKeyResponse } from '../../../shared/models/device-api-key.model';

@Injectable({ providedIn: 'root' })
export class DeviceApiKeyService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/device-keys`;

    getAll(patientId: string): Observable<DeviceApiKeyResponse[]> {
        return this.http.get<DeviceApiKeyResponse[]>(`${this.baseUrl}/${patientId}`);
    }

    generate(patientId: string, label: string): Observable<GeneratedDeviceApiKeyResponse> {
        return this.http.post<GeneratedDeviceApiKeyResponse>(`${this.baseUrl}/${patientId}`, { label });
    }

    revoke(patientId: string, keyId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${patientId}/${keyId}`);
    }
}
