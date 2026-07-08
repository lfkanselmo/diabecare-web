import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ExerciseLogResponse, RegisterExerciseRequest } from '../../../shared/models/exercise.model';
import { PageResponse } from '../../../shared/models/page.model';

@Injectable({ providedIn: 'root' })
export class ExerciseService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/exercise`;

    register(patientId: string, request: RegisterExerciseRequest): Observable<ExerciseLogResponse> {
        return this.http.post<ExerciseLogResponse>(`${this.baseUrl}/${patientId}`, request);
    }

    getHistory(
        patientId: string, from: string, to: string,
        page = 0, size = 20
    ): Observable<PageResponse<ExerciseLogResponse>> {
        const params = new HttpParams()
            .set('from', from).set('to', to)
            .set('page', page).set('size', size);
        return this.http.get<PageResponse<ExerciseLogResponse>>(
            `${this.baseUrl}/${patientId}/history`, { params });
    }
}