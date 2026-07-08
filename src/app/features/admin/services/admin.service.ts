import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../shared/models/page.model';
import { AdminUserResponse, ChangeUserRoleRequest } from '../models/admin-user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/admin`;

    getUsers(page = 0, size = 20): Observable<PageResponse<AdminUserResponse>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<PageResponse<AdminUserResponse>>(`${this.baseUrl}/users`, { params });
    }

    changeUserRole(userId: string, role: string): Observable<void> {
        const request: ChangeUserRoleRequest = { role };
        return this.http.patch<void>(`${this.baseUrl}/users/${userId}/role`, request);
    }
}
