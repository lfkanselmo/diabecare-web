import { Component, Input, OnChanges } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { GlucoseReadingResponse, MealMarkerResponse } from '../../../../shared/models/glucose.model';

@Component({
    selector: 'app-glucose-chart',
    standalone: true,
    imports: [NgxEchartsDirective],
    templateUrl: './glucose-chart.component.html',
    styleUrl: './glucose-chart.component.scss'
})
export class GlucoseChartComponent implements OnChanges {

    @Input() readings: GlucoseReadingResponse[] = [];
    @Input() mealMarkers: MealMarkerResponse[] = [];
    @Input() targetMin = 70;
    @Input() targetMax = 180;

    chartOptions: EChartsOption = {};

    private readonly mealTypeLabels: Record<string, string> = {
        BREAKFAST: 'Desayuno',
        LUNCH: 'Almuerzo',
        DINNER: 'Cena',
        SNACK: 'Merienda'
    };

    ngOnChanges(): void {
        if (this.readings.length > 0) {
            const dark = document.documentElement.getAttribute('data-theme') === 'dark';
            this.buildChart(dark);
        }
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

        const labelColor = dark ? '#9B97C0' : '#546E7A';
        const gridColor = dark ? 'rgba(139,130,224,0.1)' : '#F0F0F0';
        const axisColor = dark ? 'rgba(139,130,224,0.2)' : '#E0E0E0';
        const areaColor = dark ? 'rgba(34,169,106,0.08)' : 'rgba(34,169,106,0.06)';
        const minLine = dark ? '#F07070' : '#C62828';
        const maxLine = dark ? '#FABD4A' : '#E8A020';

        this.chartOptions = {
            backgroundColor: 'transparent',
            grid: { top: 40, right: 20, bottom: 60, left: 60 },
            tooltip: {
                trigger: 'axis',
                backgroundColor: dark ? '#1F1D36' : '#FFFFFF',
                borderColor: dark ? 'rgba(139,130,224,0.2)' : '#E8E6F5',
                textStyle: { color: dark ? '#EAE8F8' : '#1A1730', fontSize: 12 },
                formatter: (params: any) => {
                    const p = Array.isArray(params) ? params[0] : params;
                    const reading = sorted[p.dataIndex];
                    if (!reading) return '';
                    return `
                        <div style="font-size:13px">
                            <strong>${p.name}</strong><br/>
                            Glucosa: <strong>${reading.value} ${reading.unit === 'MG_DL' ? 'mg/dL' : 'mmol/L'}</strong><br/>
                            Tipo: ${this.getReadingTypeLabel(reading.readingType)}
                        </div>
                    `;
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
            series: [
                {
                    name: 'Glucosa',
                    type: 'line',
                    data: values,
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 8,
                    lineStyle: { width: 2.5 },
                    markLine: {
                        silent: true,
                        lineStyle: { type: 'dashed' },
                        data: [
                            {
                                yAxis: this.targetMin,
                                label: { formatter: `Mín ${this.targetMin}`, position: 'end', fontSize: 10, color: minLine },
                                lineStyle: { color: minLine, opacity: 0.6 }
                            },
                            {
                                yAxis: this.targetMax,
                                label: { formatter: `Máx ${this.targetMax}`, position: 'end', fontSize: 10, color: maxLine },
                                lineStyle: { color: maxLine, opacity: 0.6 }
                            },
                            ...mealMarkLines
                        ]
                    },
                    markArea: {
                        silent: true,
                        itemStyle: { color: areaColor },
                        data: [[{ yAxis: this.targetMin }, { yAxis: this.targetMax }]]
                    }
                }
            ]
        };
    }

    private buildMealMarkLines(sorted: GlucoseReadingResponse[], dark: boolean): any[] {
        if (!this.mealMarkers.length || !sorted.length) return [];

        const mealColor = dark ? '#2DD4CF' : '#0EA5A0';

        return this.mealMarkers.map(meal => {
            const mealTime = new Date(meal.consumedAt).getTime();
            const closestIndex = sorted.reduce((bestIdx, r, idx) => {
                const diff = Math.abs(new Date(r.measuredAt).getTime() - mealTime);
                const bestDiff = Math.abs(new Date(sorted[bestIdx].measuredAt).getTime() - mealTime);
                return diff < bestDiff ? idx : bestIdx;
            }, 0);

            return {
                xAxis: closestIndex,
                label: {
                    formatter: `🍽 ${this.mealTypeLabels[meal.mealType] ?? meal.mealType}\n${Math.round(meal.totalCalories)} kcal`,
                    position: 'insideStartTop',
                    fontSize: 9,
                    color: mealColor
                },
                lineStyle: { color: mealColor, type: 'dashed', opacity: 0.5, width: 1 }
            };
        });
    }

    private getReadingTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            FASTING: 'Ayuno',
            PRE_MEAL: 'Preprandial',
            POST_MEAL: 'Postprandial',
            BEDTIME: 'Antes de dormir',
            RANDOM: 'Aleatoria'
        };
        return labels[type] ?? type;
    }
}