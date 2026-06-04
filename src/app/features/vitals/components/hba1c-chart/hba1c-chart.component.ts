import { Component, Input, OnChanges } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { Hba1cTrendResponse } from '../../../../shared/models/vitals.model';

@Component({
    selector: 'app-hba1c-chart',
    standalone: true,
    imports: [NgxEchartsDirective],
    templateUrl: './hba1c-chart.component.html',
    styleUrl: './hba1c-chart.component.scss'
})
export class Hba1cChartComponent implements OnChanges {

    @Input() trend: Hba1cTrendResponse[] = [];

    chartOptions: EChartsOption = {};

    ngOnChanges(): void {
        if (this.trend.length > 0) this.buildChart();
    }

    private buildChart(): void {
        const months = this.trend.map(t => t.month);
        const hba1c = this.trend.map(t => t.estimatedHba1c ?? null);
        const glucose = this.trend.map(t => t.averageGlucose ?? null);

        this.chartOptions = {
            backgroundColor: 'transparent',
            grid: { top: 50, right: 60, bottom: 60, left: 60 },
            legend: {
                data: ['HbA1c estimada (%)', 'Glucosa promedio (mg/dL)'],
                top: 0,
                textStyle: { fontSize: 11, color: '#546E7A' }
            },
            tooltip: {
                trigger: 'axis',
                formatter: (params: any) => {
                    let html = `<strong>${params[0].name}</strong><br/>`;
                    params.forEach((p: any) => {
                        if (p.value !== null) {
                            html += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong><br/>`;
                        }
                    });
                    return html;
                }
            },
            xAxis: {
                type: 'category',
                data: months,
                axisLabel: { fontSize: 11, color: '#546E7A' },
                axisLine: { lineStyle: { color: '#E0E0E0' } }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'HbA1c (%)',
                    nameTextStyle: { color: '#1565C0', fontSize: 10 },
                    axisLabel: { color: '#1565C0', fontSize: 10 },
                    splitLine: { lineStyle: { color: '#F0F0F0' } },
                    min: 4,
                    max: 12
                },
                {
                    type: 'value',
                    name: 'mg/dL',
                    nameTextStyle: { color: '#00695C', fontSize: 10 },
                    axisLabel: { color: '#00695C', fontSize: 10 },
                    splitLine: { show: false }
                }
            ],
            series: [
                {
                    name: 'HbA1c estimada (%)',
                    type: 'line',
                    yAxisIndex: 0,
                    data: hba1c,
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 8,
                    lineStyle: { color: '#1565C0', width: 2.5 },
                    itemStyle: { color: '#1565C0' },
                    markLine: {
                        silent: true,
                        data: [
                            {
                                yAxis: 7.0,
                                label: { formatter: 'Meta 7%', fontSize: 9, color: '#2E7D32' },
                                lineStyle: { color: '#2E7D32', type: 'dashed', opacity: 0.6 }
                            }
                        ]
                    }
                },
                {
                    name: 'Glucosa promedio (mg/dL)',
                    type: 'bar',
                    yAxisIndex: 1,
                    data: glucose,
                    barMaxWidth: 30,
                    itemStyle: {
                        color: '#A2D9CE',
                        borderRadius: [4, 4, 0, 0]
                    }
                }
            ]
        };
    }
}