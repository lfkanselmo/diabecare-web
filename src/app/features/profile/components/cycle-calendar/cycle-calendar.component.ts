import { Component, Input, OnChanges } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { DatePipe, KeyValuePipe, TitleCasePipe } from '@angular/common';
import { MenstrualCycleStatusResponse, CyclePhase } from '../../../../shared/models/menstrual-cycle.model';

@Component({
    selector: 'app-cycle-calendar',
    standalone: true,
    imports: [NgxEchartsDirective, DatePipe, KeyValuePipe, TitleCasePipe],
    templateUrl: './cycle-calendar.component.html',
    styleUrl: './cycle-calendar.component.scss'
})
export class CycleCalendarComponent implements OnChanges {

    @Input() status!: MenstrualCycleStatusResponse;

    wheelOptions: EChartsOption = {};
    calendarDays: CalendarDay[] = [];
    currentMonth = new Date();

    readonly phaseConfig: Record<CyclePhase, PhaseConfig> = {
        MENSTRUATION: { label: 'Menstruación', color: '#EF5350', lightColor: '#FFEBEE', darkColor: 'rgba(239,83,80,0.18)', days: '1-5', icon: '🩸' },
        FOLLICULAR: { label: 'Fase folicular', color: '#66BB6A', lightColor: '#E8F5E9', darkColor: 'rgba(102,187,106,0.18)', days: '6-13', icon: '🌱' },
        OVULATION: { label: 'Ovulación', color: '#42A5F5', lightColor: '#E3F2FD', darkColor: 'rgba(66,165,245,0.18)', days: '14', icon: '✨' },
        LUTEAL_EARLY: { label: 'Lútea temprana', color: '#FFA726', lightColor: '#FFF3E0', darkColor: 'rgba(255,167,38,0.18)', days: '15-21', icon: '🌙' },
        LUTEAL_LATE: { label: 'Lútea tardía', color: '#FF7043', lightColor: '#FBE9E7', darkColor: 'rgba(255,112,67,0.18)', days: '22-28', icon: '⚡' }
    };

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

        const phases = [
            { name: 'Menstruación', value: 5, color: '#EF5350', phase: 'MENSTRUATION' },
            { name: 'Folicular', value: 8, color: '#66BB6A', phase: 'FOLLICULAR' },
            { name: 'Ovulación', value: 1, color: '#42A5F5', phase: 'OVULATION' },
            { name: 'Lútea temprana', value: 7, color: '#FFA726', phase: 'LUTEAL_EARLY' },
            { name: 'Lútea tardía', value: cycleLength - 21, color: '#FF7043', phase: 'LUTEAL_LATE' }
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
                    const cfg = this.phaseConfig[phase.phase as CyclePhase];
                    return `<div style="font-size:13px">
                        <strong>${cfg.icon} ${phase.name}</strong><br/>
                        Días ${cfg.days}<br/>
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
                    fill: this.phaseConfig[currentPhase].color,
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
                    show: true,
                    position: 'outside',
                    formatter: (p: any) => phases[p.dataIndex].name,
                    fontSize: 11,
                    color: labelColor
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
        return day.dark
            ? this.phaseConfig[day.phase].darkColor
            : this.phaseConfig[day.phase].lightColor;
    }

    getDayBorderColor(day: CalendarDay): string {
        if (!day.phase) return 'transparent';
        const base = this.phaseConfig[day.phase].color;
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

interface PhaseConfig {
    label: string;
    color: string;
    lightColor: string;
    darkColor: string;
    days: string;
    icon: string;
}