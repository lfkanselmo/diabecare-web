import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AccountService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/account`;

    suspend(userId: string): Observable<void> {
        return this.http.patch<void>(`${this.baseUrl}/${userId}/suspend`, {});
    }

    delete(userId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${userId}`);
    }
}