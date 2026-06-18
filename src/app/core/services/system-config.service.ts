import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface SystemConfigItem {
    key: string;
    value: string;
    dataType: string;
    category: string;
    description: string;
}

@Injectable({ providedIn: 'root' })
export class SystemConfigService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/system-config`;

    private readonly configs = signal<SystemConfigItem[]>([]);
    readonly loaded = signal(false);

    readonly phaseConfig: Record<string, PhaseConfig> = {
        MENSTRUATION: { label: 'Menstruación', color: '#EF5350', lightColor: '#FFEBEE', darkColor: 'rgba(239,83,80,0.18)', days: '1-5', icon: '🩸' },
        FOLLICULAR: { label: 'Fase folicular', color: '#66BB6A', lightColor: '#E8F5E9', darkColor: 'rgba(102,187,106,0.18)', days: '6-13', icon: '🌱' },
        OVULATION: { label: 'Ovulación', color: '#42A5F5', lightColor: '#E3F2FD', darkColor: 'rgba(66,165,245,0.18)', days: '14', icon: '✨' },
        LUTEAL_EARLY: { label: 'Lútea temprana', color: '#FFA726', lightColor: '#FFF3E0', darkColor: 'rgba(255,167,38,0.18)', days: '15-21', icon: '🌙' },
        LUTEAL_LATE: { label: 'Lútea tardía', color: '#FF7043', lightColor: '#FBE9E7', darkColor: 'rgba(255,112,67,0.18)', days: '22-28', icon: '⚡' }
    };

    readonly phaseIcons: Record<string, string> = {
        MENSTRUATION: 'water_drop',
        FOLLICULAR: 'local_florist',
        OVULATION: 'egg',
        LUTEAL_EARLY: 'trending_up',
        LUTEAL_LATE: 'warning'
    };

    readonly symptomLabels: Record<string, string> = {
        CRAMPS: 'Cólicos',
        HEADACHE: 'Dolor de cabeza',
        FATIGUE: 'Fatiga',
        MOOD_CHANGES: 'Cambios de humor',
        BLOATING: 'Hinchazón',
        CRAVINGS: 'Antojos',
        BREAST_TENDERNESS: 'Sensibilidad en senos',
        SLEEP_DIFFICULTY: 'Dificultad para dormir',
        BACK_PAIN: 'Dolor de espalda',
        NAUSEA: 'Náuseas',
        ACNE: 'Acné',
        SPOTTING: 'Sangrado leve'
    };

    load(): void {
        if (this.loaded()) return;

        this.http.get<SystemConfigItem[]>(this.baseUrl).subscribe({
            next: data => {
                this.configs.set(data);
                this.loaded.set(true);
            },
            error: err => console.error('Error cargando system-config:', err)
        });
    }

    reload(): void {
        this.http.post(`${this.baseUrl}/reload`, {}).subscribe({
            next: () => {
                this.loaded.set(false);
                this.load();
            },
            error: err => console.error('Error recargando system-config:', err)
        });
    }

    getInt(key: string): number {
        return parseInt(this.getValue(key) ?? '0', 10);
    }

    getDecimal(key: string): number {
        return parseFloat(this.getValue(key) ?? '0');
    }

    getString(key: string): string {
        return this.getValue(key) ?? '';
    }

    // ── Helpers semánticos para glucosa
    getGlucoseStatusColor(status: string, isDark: boolean): string {
        const colors: Record<string, [string, string]> = {
            CRITICALLY_LOW: ['#9B1D6A', '#F48FB1'],
            LOW: ['#E04B4B', '#F07070'],
            NORMAL: ['#22A96A', '#4ADE98'],
            HIGH: ['#E8A020', '#FABD4A'],
            CRITICALLY_HIGH: ['#BF360C', '#FF8A65']
        };
        const pair = colors[status];
        if (!pair) return isDark ? '#9B97C0' : '#546E7A';
        return isDark ? pair[1] : pair[0];
    }

    getGlucoseStatusBg(status: string): string {
        const colors: Record<string, string> = {
            CRITICALLY_LOW: 'rgba(155,29,106,0.15)',
            LOW: 'rgba(224,75,75,0.15)',
            NORMAL: 'rgba(34,169,106,0.15)',
            HIGH: 'rgba(232,160,32,0.15)',
            CRITICALLY_HIGH: 'rgba(191,54,12,0.15)'
        };
        return colors[status] ?? 'transparent';
    }

    getGlucoseStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            CRITICALLY_LOW: 'Crítico bajo',
            LOW: 'Bajo',
            NORMAL: 'Normal',
            HIGH: 'Alto',
            CRITICALLY_HIGH: 'Crítico alto'
        };
        return labels[status] ?? status;
    }

    // ── Helpers semánticos para alertas
    getAlertColor(severity: string): string {
        const colors: Record<string, string> = {
            SUCCESS: '#22A96A',
            INFO: '#0EA5A0',
            WARNING: '#E8A020',
            DANGER: '#E04B4B'
        };
        return colors[severity] ?? '#546E7A';
    }

    getAlertBg(severity: string, isDark: boolean): string {
        const light: Record<string, string> = {
            SUCCESS: '#E3F7EE',
            INFO: '#E0F5F4',
            WARNING: '#FEF5E0',
            DANGER: '#FEECEC'
        };
        const dark: Record<string, string> = {
            SUCCESS: 'rgba(34,169,106,0.12)',
            INFO: 'rgba(14,165,160,0.12)',
            WARNING: 'rgba(232,160,32,0.12)',
            DANGER: 'rgba(224,75,75,0.12)'
        };
        return isDark ? (dark[severity] ?? 'transparent') : (light[severity] ?? 'transparent');
    }

    getCyclePhaseColor(phase: string): string {
        const colors: Record<string, string> = {
            MENSTRUATION: '#EF5350',
            FOLLICULAR: '#66BB6A',
            OVULATION: '#42A5F5',
            LUTEAL_EARLY: '#FFA726',
            LUTEAL_LATE: '#FF7043'
        };
        return colors[phase] ?? '#9E9E9E';
    }

    getSymptomLabel(symptom: string): string {
        return this.symptomLabels[symptom.trim()] ?? symptom;
    }

    getPhaseIcon(phase: string): string {
        return this.phaseIcons[phase] ?? 'circle';
    }

    private getValue(key: string): string | undefined {
        return this.configs().find(c => c.key === key)?.value;
    }
}

export interface PhaseConfig {
    label: string;
    color: string;
    lightColor: string;
    darkColor: string;
    days: string;
    icon: string;
}