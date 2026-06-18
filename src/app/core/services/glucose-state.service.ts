import { Injectable, inject, signal } from '@angular/core';
import { GlucoseReadingResponse, GlucoseStatus } from '../../shared/models/glucose.model';
import { SystemConfigService } from './system-config.service';

@Injectable({ providedIn: 'root' })
export class GlucoseStateService {

    private readonly systemConfig = inject(SystemConfigService);

    readonly latestReading = signal<GlucoseReadingResponse | null>(null);

    setLatestReading(reading: GlucoseReadingResponse | null): void {
        this.latestReading.set(reading);
    }

    getChipColor(status: GlucoseStatus): string {
        return this.systemConfig.getGlucoseStatusColor(status, false);
    }

    getChipBg(status: GlucoseStatus): string {
        return this.systemConfig.getGlucoseStatusBg(status);
    }

    getStatusLabel(status: GlucoseStatus): string {
        return this.systemConfig.getGlucoseStatusLabel(status);
    }
}