import { Component, Input, OnChanges, inject } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { DatePipe, KeyValuePipe, TitleCasePipe } from '@angular/common';
import { MenstrualCycleStatusResponse, CyclePhase } from '../../../../shared/models/menstrual-cycle.model';
import { SystemConfigService } from '../../../../core/services/system-config.service';

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

    wheelOptions: EChartsOption = {};
    calendarDays: CalendarDay[] = [];
    currentMonth = new Date();

    get phaseConfig() {
        return this.systemConfig.phaseConfig;
    }

    ngOnChanges(): void {
        if (this.status) {
            const dark = document.documentElement.getAttribute('data-theme') === 'dark';
            this.buildWheelChart(dark);
            this.buildCalendar(dark);
        }
    }

    private buildWheelChart(dark: boolean): void {
        const cycleLength = Math.round(this.status.averageCycleLength) || 28;
        const dayOfCycle = this.status.dayOfCycle;
        const currentPhase = this.status.currentPhase;
        const labelColor = dark ? '#9B97C0' : '#546E7A';
        const borderColor = dark ? '#2A2845' : '#FFFFFF';
        const cfg = this.systemConfig.phaseConfig;

        const phases = [
            { name: cfg['MENSTRUATION'].label, value: 5, color: cfg['MENSTRUATION'].color, phase: 'MENSTRUATION' },
            { name: cfg['FOLLICULAR'].label, value: 8, color: cfg['FOLLICULAR'].color, phase: 'FOLLICULAR' },
            { name: cfg['OVULATION'].label, value: 1, color: cfg['OVULATION'].color, phase: 'OVULATION' },
            { name: cfg['LUTEAL_EARLY'].label, value: 7, color: cfg['LUTEAL_EARLY'].color, phase: 'LUTEAL_EARLY' },
            { name: cfg['LUTEAL_LATE'].label, value: cycleLength - 21, color: cfg['LUTEAL_LATE'].color, phase: 'LUTEAL_LATE' }
        ];

        this.wheelOptions = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                backgroundColor: dark ? '#1F1D36' : '#FFFFFF',
                borderColor: dark ? 'rgba(139,130,224,0.2)' : '#E8E6F5',
                textStyle: { color: dark ? '#EAE8F8' : '#1A1730' },
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

    private buildCalendar(dark: boolean): void {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPad = firstDay.getDay();

        this.calendarDays = [];

        for (let i = 0; i < startPad; i++) {
            this.calendarDays.push({ date: null, phase: null, isToday: false, isPredicted: false, dark });
        }

        const cycleStart = new Date(this.status.history[0]?.startDate ?? today);
        const cycleLength = Math.round(this.status.averageCycleLength) || 28;
        const nextCycle = new Date(this.status.nextCycleStart);

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(year, month, d);
            const isToday = date.toDateString() === today.toDateString();
            const diffDays = Math.floor((date.getTime() - cycleStart.getTime()) / 86400000);
            const dayInCycle = ((diffDays % cycleLength) + cycleLength) % cycleLength + 1;
            const phase = this.getDayPhase(dayInCycle, cycleLength);
            const isPredicted = date >= nextCycle && date < new Date(nextCycle.getTime() + 5 * 86400000);

            this.calendarDays.push({ date: d, phase, isToday, isPredicted, dark });
        }
    }

    private getDayPhase(day: number, cycleLength: number): CyclePhase {
        if (day <= 5) return 'MENSTRUATION';
        if (day <= 13) return 'FOLLICULAR';
        if (day === 14) return 'OVULATION';
        if (day <= Math.floor(cycleLength * 0.75)) return 'LUTEAL_EARLY';
        return 'LUTEAL_LATE';
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