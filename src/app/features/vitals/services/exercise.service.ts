import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ExerciseLogResponse, RegisterExerciseRequest } from '../../../shared/models/exercise.model';

@Injectable({ providedIn: 'root' })
export class ExerciseService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/exercise`;

    register(patientId: string, request: RegisterExerciseRequest): Observable<ExerciseLogResponse> {
        return this.http.post<ExerciseLogResponse>(`${this.baseUrl}/${patientId}`, request);
    }

    getHistory(patientId: string, from: string, to: string): Observable<ExerciseLogResponse[]> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http.get<ExerciseLogResponse[]>(
            `${this.baseUrl}/${patientId}/history`, { params });
    }
}