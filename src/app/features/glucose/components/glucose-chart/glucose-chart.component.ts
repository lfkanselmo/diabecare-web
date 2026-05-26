import { Component, Input, OnChanges } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { GlucoseReadingResponse } from '../../../../shared/models/glucose.model';

@Component({
    selector: 'app-glucose-chart',
    standalone: true,
    imports: [NgxEchartsDirective],
    templateUrl: './glucose-chart.component.html',
    styleUrl: './glucose-chart.component.scss'
})
export class GlucoseChartComponent implements OnChanges {

    @Input() readings: GlucoseReadingResponse[] = [];
    @Input() targetMin = 70;
    @Input() targetMax = 180;

    chartOptions: EChartsOption = {};

    private readonly statusColors: Record<string, string> = {
        CRITICALLY_LOW: '#880E4F',
        LOW: '#C62828',
        NORMAL: '#2E7D32',
        HIGH: '#F57F17',
        CRITICALLY_HIGH: '#BF360C'
    };

    ngOnChanges(): void {
        if (this.readings.length > 0) {
            this.buildChart();
        }
    }

    private buildChart(): void {
        const sorted = [...this.readings].sort(
            (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
        );

        const dates = sorted.map(r =>
            new Date(r.measuredAt).toLocaleDateString('es-CO', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            })
        );

        const values = sorted.map(r => r.value);
        const colors = sorted.map(r => this.statusColors[r.status] ?? '#2E7D32');

        this.chartOptions = {
            backgroundColor: 'transparent',
            grid: { top: 40, right: 20, bottom: 60, left: 60 },
            tooltip: {
                trigger: 'axis',
                formatter: (params: any) => {
                    const p = params[0];
                    const reading = sorted[p.dataIndex];
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
                axisLabel: {
                    rotate: 35,
                    fontSize: 11,
                    color: '#546E7A'
                },
                axisLine: { lineStyle: { color: '#E0E0E0' } }
            },
            yAxis: {
                type: 'value',
                name: 'mg/dL',
                nameTextStyle: { color: '#546E7A', fontSize: 11 },
                axisLabel: { color: '#546E7A', fontSize: 11 },
                splitLine: { lineStyle: { color: '#F0F0F0' } },
                min: (value: any) => Math.max(0, value.min - 20),
                max: (value: any) => value.max + 20
            },
            visualMap: {
                show: false,
                pieces: [
                    { lte: 54, color: '#880E4F' },
                    { gt: 54, lte: 70, color: '#C62828' },
                    { gt: 70, lte: this.targetMax, color: '#2E7D32' },
                    { gt: this.targetMax, lte: 250, color: '#F57F17' },
                    { gt: 250, color: '#BF360C' }
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
                                label: { formatter: `Mín ${this.targetMin}`, position: 'end', fontSize: 10 },
                                lineStyle: { color: '#C62828', opacity: 0.6 }
                            },
                            {
                                yAxis: this.targetMax,
                                label: { formatter: `Máx ${this.targetMax}`, position: 'end', fontSize: 10 },
                                lineStyle: { color: '#F57F17', opacity: 0.6 }
                            }
                        ]
                    },
                    markArea: {
                        silent: true,
                        itemStyle: { color: 'rgba(46, 125, 50, 0.06)' },
                        data: [[{ yAxis: this.targetMin }, { yAxis: this.targetMax }]]
                    }
                }
            ]
        };
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