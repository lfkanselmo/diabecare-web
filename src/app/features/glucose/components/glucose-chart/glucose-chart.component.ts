import { Component, Input, OnChanges, inject } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { DatePipe } from '@angular/common';
import { GlucoseReadingResponse, MealMarkerResponse } from '../../../../shared/models/glucose.model';
import { ExerciseLogResponse } from '../../../../shared/models/exercise.model';
import { MetadataService } from '../../../../core/services/metadata.service';

interface TimelineEvent {
    type: 'meal' | 'exercise';
    time: Date;
    icon: string;
    title: string;
    detail: string;
}

@Component({
    selector: 'app-glucose-chart',
    standalone: true,
    imports: [NgxEchartsDirective, DatePipe],
    templateUrl: './glucose-chart.component.html',
    styleUrl: './glucose-chart.component.scss'
})
export class GlucoseChartComponent implements OnChanges {

    @Input() readings: GlucoseReadingResponse[] = [];
    @Input() mealMarkers: MealMarkerResponse[] = [];
    @Input() exerciseLogs: ExerciseLogResponse[] = [];
    @Input() targetMin = 70;
    @Input() targetMax = 180;

    chartOptions: EChartsOption = {};
    timelineEvents: TimelineEvent[] = [];

    private readonly metadata = inject(MetadataService);

    private readonly MAX_GAP_MS = 2 * 60 * 60 * 1000; // 2 horas

    ngOnChanges(): void {
        this.buildTimelineEvents();

        if (this.readings.length > 0) {
            const dark = document.documentElement.getAttribute('data-theme') === 'dark';
            this.buildChart(dark);
        }
    }

    private buildTimelineEvents(): void {
        const mealEvents: TimelineEvent[] = this.mealMarkers.map(meal => ({
            type: 'meal',
            time: new Date(meal.consumedAt),
            icon: '🍽',
            title: this.metadata.getLabelByValue(this.metadata.mealTypes(), meal.mealType),
            detail: `${Math.round(meal.totalCalories)} kcal · ${meal.totalCarbohydrates}g carbohidratos`
        }));

        const exerciseEvents: TimelineEvent[] = this.exerciseLogs.map(log => ({
            type: 'exercise',
            time: new Date(log.performedAt),
            icon: '🏃',
            title: this.metadata.getLabelByValue(this.metadata.exerciseTypes(), log.exerciseType),
            detail: `${log.durationMinutes} min · Intensidad ${this.metadata.getLabelByValue(this.metadata.exerciseIntensities(), log.intensity)}`
        }));

        this.timelineEvents = [...mealEvents, ...exerciseEvents]
            .sort((a, b) => b.time.getTime() - a.time.getTime());
    }

    private buildChart(dark: boolean): void {
        const sorted = [...this.readings].sort(
            (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
        );

        const dates = sorted.map(r =>
            new Date(r.measuredAt).toLocaleDateString('es-CO', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            })
        );
        const values = sorted.map(r => r.value);

        const mealMarkLines = this.buildMealMarkLines(sorted, dark);
        const exerciseMarkLines = this.buildExerciseMarkLines(sorted, dark);

        const labelColor = dark ? '#9B97C0' : '#546E7A';
        const gridColor = dark ? 'rgba(139,130,224,0.1)' : '#F0F0F0';
        const axisColor = dark ? 'rgba(139,130,224,0.2)' : '#E0E0E0';
        const areaColor = dark ? 'rgba(34,169,106,0.08)' : 'rgba(34,169,106,0.06)';
        const minLine = dark ? '#F07070' : '#C62828';
        const maxLine = dark ? '#FABD4A' : '#E8A020';

        this.chartOptions = {
            backgroundColor: 'transparent',
            grid: { top: 30, right: 20, bottom: 60, left: 60 },
            tooltip: {
                trigger: 'axis',
                backgroundColor: dark ? '#1F1D36' : '#FFFFFF',
                borderColor: dark ? 'rgba(139,130,224,0.2)' : '#E8E6F5',
                textStyle: { color: dark ? '#EAE8F8' : '#1A1730', fontSize: 12 },
                formatter: (params: any) => {
                    const p = Array.isArray(params) ? params[0] : params;
                    const reading = sorted[p.dataIndex];
                    if (!reading) return '';

                    let html = `
                        <div style="font-size:13px; max-width:220px">
                            <strong>${p.name}</strong><br/>
                            Glucosa: <strong>${reading.value} ${reading.unit === 'MG_DL' ? 'mg/dL' : 'mmol/L'}</strong><br/>
                            Tipo: ${this.metadata.getLabelByValue(this.metadata.readingTypes(), reading.readingType)}
                    `;

                    const eventsHere = this.eventsNear(reading.measuredAt);
                    if (eventsHere.length > 0) {
                        html += `<hr style="margin:6px 0; opacity:0.2"/>`;
                        eventsHere.forEach(e => {
                            html += `${e.icon} ${e.title} — ${e.detail}<br/>`;
                        });
                    }

                    html += `</div>`;
                    return html;
                }
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLabel: { rotate: 35, fontSize: 11, color: labelColor },
                axisLine: { lineStyle: { color: axisColor } },
                axisTick: { lineStyle: { color: axisColor } }
            },
            yAxis: {
                type: 'value',
                name: 'mg/dL',
                nameTextStyle: { color: labelColor, fontSize: 11 },
                axisLabel: { color: labelColor, fontSize: 11 },
                splitLine: { lineStyle: { color: gridColor } },
                min: (value: any) => Math.max(0, value.min - 20),
                max: (value: any) => value.max + 20
            },
            visualMap: {
                show: false,
                pieces: [
                    { lte: 54, color: dark ? '#F48FB1' : '#880E4F' },
                    { gt: 54, lte: 70, color: dark ? '#F07070' : '#C62828' },
                    { gt: 70, lte: this.targetMax, color: dark ? '#4ADE98' : '#22A96A' },
                    { gt: this.targetMax, lte: 250, color: dark ? '#FABD4A' : '#E8A020' },
                    { gt: 250, color: dark ? '#FF8A65' : '#BF360C' }
                ]
            },
            series: [{
                name: 'Glucosa',
                type: 'line',
                data: values,
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: { width: 2.5 },
                markLine: {
                    silent: true,
                    symbol: 'none',
                    label: { show: false },
                    lineStyle: { type: 'dashed' },
                    data: [
                        {
                            yAxis: this.targetMin,
                            label: { show: true, formatter: `Mín ${this.targetMin}`, position: 'end', fontSize: 10, color: minLine },
                            lineStyle: { color: minLine, opacity: 0.6 }
                        },
                        {
                            yAxis: this.targetMax,
                            label: { show: true, formatter: `Máx ${this.targetMax}`, position: 'end', fontSize: 10, color: maxLine },
                            lineStyle: { color: maxLine, opacity: 0.6 }
                        },
                        ...mealMarkLines,
                        ...exerciseMarkLines
                    ]
                },
                markArea: {
                    silent: true,
                    itemStyle: { color: areaColor },
                    data: [[{ yAxis: this.targetMin }, { yAxis: this.targetMax }]]
                }
            }]
        };
    }

    private buildMealMarkLines(sorted: GlucoseReadingResponse[], dark: boolean): any[] {
        if (!this.mealMarkers.length || !sorted.length) return [];

        const mealColor = dark ? '#2DD4CF' : '#0EA5A0';

        return this.mealMarkers
            .filter(meal => this.hasNearbyReading(meal.consumedAt, sorted))
            .map(meal => ({
                xAxis: this.closestIndexTo(meal.consumedAt, sorted),
                lineStyle: { color: mealColor, type: 'dashed', opacity: 0.45, width: 1.5 }
            }));
    }

    private buildExerciseMarkLines(sorted: GlucoseReadingResponse[], dark: boolean): any[] {
        if (!this.exerciseLogs.length || !sorted.length) return [];

        const exerciseColor = dark ? '#A99EF0' : '#5B4FCF';

        return this.exerciseLogs
            .filter(log => this.hasNearbyReading(log.performedAt, sorted))
            .map(log => ({
                xAxis: this.closestIndexTo(log.performedAt, sorted),
                lineStyle: { color: exerciseColor, type: 'dotted', opacity: 0.5, width: 1.5 }
            }));
    }

    private closestIndexTo(isoTime: string, sorted: GlucoseReadingResponse[]): number {
        const target = new Date(isoTime).getTime();
        return sorted.reduce((bestIdx, r, idx) => {
            const diff = Math.abs(new Date(r.measuredAt).getTime() - target);
            const bestDiff = Math.abs(new Date(sorted[bestIdx].measuredAt).getTime() - target);
            return diff < bestDiff ? idx : bestIdx;
        }, 0);
    }

    private hasNearbyReading(isoTime: string, sorted: GlucoseReadingResponse[]): boolean {
        const target = new Date(isoTime).getTime();
        return sorted.some(r => Math.abs(new Date(r.measuredAt).getTime() - target) <= this.MAX_GAP_MS);
    }

    private eventsNear(measuredAt: string): TimelineEvent[] {
        const readingTime = new Date(measuredAt).getTime();

        return this.timelineEvents.filter(e =>
            Math.abs(e.time.getTime() - readingTime) <= this.MAX_GAP_MS
        );
    }
}