import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MetadataItem {
    value: string;
    label: string;
}

@Injectable({ providedIn: 'root' })
export class MetadataService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/metadata`;

    readonly exerciseTypes = signal<MetadataItem[]>([]);
    readonly exerciseIntensities = signal<MetadataItem[]>([]);
    readonly medicationTypes = signal<MetadataItem[]>([]);
    readonly doseUnits = signal<MetadataItem[]>([]);
    readonly medicationFrequencies = signal<MetadataItem[]>([]);
    readonly mealTypes = signal<MetadataItem[]>([]);
    readonly readingTypes = signal<MetadataItem[]>([]);
    readonly activityLevels = signal<MetadataItem[]>([]);
    readonly diabetesTypes = signal<MetadataItem[]>([]);
    readonly glucoseUnits = signal<MetadataItem[]>([]);

    readonly loaded = signal(false);

    loadAll(): void {
        if (this.loaded()) return;

        forkJoin({
            exerciseTypes: this.http.get<MetadataItem[]>(`${this.baseUrl}/exercise-types`),
            exerciseIntensities: this.http.get<MetadataItem[]>(`${this.baseUrl}/exercise-intensities`),
            medicationTypes: this.http.get<MetadataItem[]>(`${this.baseUrl}/medication-types`),
            doseUnits: this.http.get<MetadataItem[]>(`${this.baseUrl}/dose-units`),
            medicationFrequencies: this.http.get<MetadataItem[]>(`${this.baseUrl}/medication-frequencies`),
            mealTypes: this.http.get<MetadataItem[]>(`${this.baseUrl}/meal-types`),
            readingTypes: this.http.get<MetadataItem[]>(`${this.baseUrl}/reading-types`),
            activityLevels: this.http.get<MetadataItem[]>(`${this.baseUrl}/activity-levels`),
            diabetesTypes: this.http.get<MetadataItem[]>(`${this.baseUrl}/diabetes-types`),
            glucoseUnits: this.http.get<MetadataItem[]>(`${this.baseUrl}/glucose-units`)
        }).subscribe({
            next: (data) => {
                this.exerciseTypes.set(data.exerciseTypes);
                this.exerciseIntensities.set(data.exerciseIntensities);
                this.medicationTypes.set(data.medicationTypes);
                this.doseUnits.set(data.doseUnits);
                this.medicationFrequencies.set(data.medicationFrequencies);
                this.mealTypes.set(data.mealTypes);
                this.readingTypes.set(data.readingTypes);
                this.activityLevels.set(data.activityLevels);
                this.diabetesTypes.set(data.diabetesTypes);
                this.glucoseUnits.set(data.glucoseUnits);
                this.loaded.set(true);
            },
            error: (err) => console.error('Error cargando metadatos:', err)
        });
    }

    getLabelByValue(items: MetadataItem[], value: string): string {
        return items.find(i => i.value === value)?.label ?? value;
    }
}