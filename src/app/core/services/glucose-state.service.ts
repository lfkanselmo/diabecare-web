import { Injectable, signal } from '@angular/core';
import { GlucoseReadingResponse, GlucoseStatus } from '../../shared/models/glucose.model';

@Injectable({ providedIn: 'root' })
export class GlucoseStateService {

    readonly latestReading = signal<GlucoseReadingResponse | null>(null);

    setLatestReading(reading: GlucoseReadingResponse | null): void {
        this.latestReading.set(reading);
    }

    getChipColor(status: GlucoseStatus): string {
        const map: Record<GlucoseStatus, string> = {
            CRITICALLY_LOW: '#9B1D6A',
            LOW: '#E04B4B',
            NORMAL: '#22A96A',
            HIGH: '#E8A020',
            CRITICALLY_HIGH: '#BF360C'
        };
        return map[status];
    }

    getChipBg(status: GlucoseStatus): string {
        const map: Record<GlucoseStatus, string> = {
            CRITICALLY_LOW: 'rgba(155,29,106,0.15)',
            LOW: 'rgba(224,75,75,0.15)',
            NORMAL: 'rgba(34,169,106,0.15)',
            HIGH: 'rgba(232,160,32,0.15)',
            CRITICALLY_HIGH: 'rgba(191,54,12,0.15)'
        };
        return map[status];
    }

    getStatusLabel(status: GlucoseStatus): string {
        const map: Record<GlucoseStatus, string> = {
            CRITICALLY_LOW: 'Crítico bajo',
            LOW: 'Bajo',
            NORMAL: 'Normal',
            HIGH: 'Alto',
            CRITICALLY_HIGH: 'Crítico alto'
        };
        return map[status];
    }
}