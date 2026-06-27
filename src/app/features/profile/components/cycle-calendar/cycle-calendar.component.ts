import { Component, Input, OnChanges, inject } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { DatePipe, KeyValuePipe, TitleCasePipe } from '@angular/common';
import { MenstrualCycleStatusResponse, CyclePhase } from '../../../../shared/models/menstrual-cycle.model';
import { SystemConfigService } from '../../../../core/services/system-config.service';
import { MetadataService } from '../../../../core/services/metadata.service';
import { MenstrualCycleService } from '../../services/menstrual-cycle.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { toLocalDateString } from '../../../../shared/utils/date.utils';
import { getCssColor } from '../../../../shared/utils/css-color.utils';

@Component({
    selector: 'app-cycle-calendar',
    standalone: true,
    imports: [NgxEchartsDirective, DatePipe, KeyValuePipe, TitleCasePipe],
    templateUrl: './cycle-calendar.component.html',
    styleUrl: './cycle-calendar.component.scss'
})
export class CycleCalendarComponent implements OnChanges {

    @Input() status!: MenstrualCycleStatusResponse;

    private readonly systemConfig = inject(SystemConfigService);
    private readonly cycleService = inject(MenstrualCycleService);
    private readonly authService = inject(AuthService);
    readonly metadata = inject(MetadataService);

    wheelOptions: EChartsOption = {};
    calendarDays: CalendarDay[] = [];
    currentMonth = new Date();

    get phaseConfig() {
        return this.systemConfig.phaseConfig;
    }

    getPhaseLabel(phase: string): string {
        return this.metadata.getLabelByValue(this.metadata.cyclePhases(), phase);
    }

    ngOnChanges(): void {
        if (this.status) {
            const dark = document.documentElement.getAttribute('data-theme') === 'dark';
            this.buildWheelChart(dark);
            this.loadCalendar(dark);
        }
    }

    private buildWheelChart(dark: boolean): void {
        const cycleLength = this.status.averageCycleLength
            ? Math.round(this.status.averageCycleLength)
            : 28;
        const dayOfCycle = this.status.dayOfCycle;
        const currentPhase = this.status.currentPhase;
        const labelColor = getCssColor('--color-text-secondary', dark ? '#9B97C0' : '#546E7A');
        const borderColor = dark ? getCssColor('--color-surface-variant', '#1C1C20') : '#FFFFFF';
        const cfg = this.systemConfig.phaseConfig;

        const phases = [
            { name: this.getPhaseLabel('MENSTRUATION'), value: 5, color: cfg['MENSTRUATION'].color, phase: 'MENSTRUATION' },
            { name: this.getPhaseLabel('FOLLICULAR'), value: 8, color: cfg['FOLLICULAR'].color, phase: 'FOLLICULAR' },
            { name: this.getPhaseLabel('OVULATION'), value: 1, color: cfg['OVULATION'].color, phase: 'OVULATION' },
            { name: this.getPhaseLabel('LUTEAL_EARLY'), value: 7, color: cfg['LUTEAL_EARLY'].color, phase: 'LUTEAL_EARLY' },
            { name: this.getPhaseLabel('LUTEAL_LATE'), value: cycleLength - 21, color: cfg['LUTEAL_LATE'].color, phase: 'LUTEAL_LATE' }
        ];

        this.wheelOptions = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                backgroundColor: getCssColor('--color-surface', dark ? '#121214' : '#FFFFFF'),
                borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E8E6F5',
                textStyle: { color: getCssColor('--color-text-primary', dark ? '#EAE8F8' : '#1A1730') },
                formatter: (p: any) => {
                    const phase = phases[p.dataIndex];
                    const pCfg = cfg[phase.phase];
                    return `<div style="font-size:13px">
                        <strong>${pCfg.icon} ${phase.name}</strong><br/>
                        Días ${pCfg.days}<br/>
                        ${p.percent.toFixed(0)}% del ciclo
                    </div>`;
                }
            },
            graphic: [{
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                    text: `Día\n${dayOfCycle}`,
                    fill: cfg[currentPhase].color,
                    fontSize: 20,
                    fontWeight: 'bold',
                    lineHeight: 24,
                    align: 'center'
                }
            }],
            series: [{
                type: 'pie',
                radius: ['45%', '75%'],
                startAngle: 270,
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 4, borderColor: 'transparent', borderWidth: 2 },
                label: {
                    show: true, position: 'outside',
                    formatter: (p: any) => phases[p.dataIndex].name,
                    fontSize: 11, color: labelColor
                },
                emphasis: {
                    itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.3)' }
                },
                data: phases.map(p => ({
                    value: p.value,
                    name: p.name,
                    itemStyle: {
                        color: p.color,
                        opacity: p.phase === currentPhase ? 1 : 0.55,
                        borderColor: p.phase === currentPhase ? borderColor : 'transparent',
                        borderWidth: p.phase === currentPhase ? 3 : 0
                    }
                }))
            }]
        };
    }

    private loadCalendar(dark: boolean): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        this.cycleService.getPhaseCalendar(
            patientId,
            toLocalDateString(firstDay),
            toLocalDateString(lastDay)
        ).subscribe({
            next: phaseDays => this.buildCalendar(dark, firstDay, lastDay, phaseDays),
            error: () => { }
        });
    }

    private buildCalendar(dark: boolean, firstDay: Date, lastDay: Date, phaseDays: { date: string; phase: CyclePhase }[]): void {
        const today = new Date();
        const startPad = firstDay.getDay();
        const nextCycle = new Date(this.status.nextCycleStart);

        const phaseByDate = new Map(phaseDays.map(d => [d.date, d.phase]));

        this.calendarDays = [];

        for (let i = 0; i < startPad; i++) {
            this.calendarDays.push({ date: null, phase: null, isToday: false, isPredicted: false, dark });
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), d);
            const isToday = date.toDateString() === today.toDateString();
            const phase = phaseByDate.get(toLocalDateString(date)) ?? null;
            const isPredicted = date >= nextCycle && date < new Date(nextCycle.getTime() + 5 * 86400000);

            this.calendarDays.push({ date: d, phase, isToday, isPredicted, dark });
        }
    }

    getDayColor(day: CalendarDay): string {
        if (!day.phase) return 'transparent';
        const cfg = this.systemConfig.phaseConfig[day.phase];
        return day.dark ? cfg.darkColor : cfg.lightColor;
    }

    getDayBorderColor(day: CalendarDay): string {
        if (!day.phase) return 'transparent';
        const base = this.systemConfig.phaseConfig[day.phase].color;
        return day.dark ? base + '60' : base + '40';
    }
}

interface CalendarDay {
    date: number | null;
    phase: CyclePhase | null;
    isToday: boolean;
    isPredicted: boolean;
    dark: boolean;
}