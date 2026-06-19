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
        if (this.trend.length > 0) {
            const dark = document.documentElement.getAttribute('data-theme') === 'dark';
            this.buildChart(dark);
        }
    }

    private buildChart(dark: boolean): void {
        const months = this.trend.map(t => t.month);
        const hba1c = this.trend.map(t => t.estimatedHba1c ?? null);
        const glucose = this.trend.map(t => t.averageGlucose ?? null);

        const labelColor = dark ? '#9B97C0' : '#546E7A';
        const gridColor = dark ? 'rgba(139,130,224,0.1)' : '#F0F0F0';
        const axisColor = dark ? 'rgba(139,130,224,0.2)' : '#E0E0E0';
        const primaryColor = dark ? '#8B82E0' : '#5B4FCF';
        const tealColor = dark ? '#2DD4CF' : '#0EA5A0';
        const barColor = dark ? 'rgba(14,165,160,0.35)' : '#A2D9CE';
        const goalColor = dark ? '#4ADE98' : '#22A96A';

        this.chartOptions = {
            backgroundColor: 'transparent',
            grid: { top: 50, right: 60, bottom: 60, left: 60 },
            legend: {
                data: ['HbA1c estimada (%)', 'Glucosa promedio (mg/dL)'],
                top: 0,
                textStyle: { fontSize: 11, color: labelColor }
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: dark ? '#1F1D36' : '#FFFFFF',
                borderColor: dark ? 'rgba(139,130,224,0.2)' : '#E8E6F5',
                textStyle: { color: dark ? '#EAE8F8' : '#1A1730', fontSize: 12 },
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
                axisLabel: { fontSize: 11, color: labelColor },
                axisLine: { lineStyle: { color: axisColor } },
                axisTick: { lineStyle: { color: axisColor } }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'HbA1c (%)',
                    nameTextStyle: { color: primaryColor, fontSize: 10 },
                    axisLabel: { color: primaryColor, fontSize: 10 },
                    splitLine: { lineStyle: { color: gridColor } },
                    min: 4,
                    max: 12
                },
                {
                    type: 'value',
                    name: 'mg/dL',
                    nameTextStyle: { color: tealColor, fontSize: 10 },
                    axisLabel: { color: tealColor, fontSize: 10 },
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
                    connectNulls: true,
                    symbol: 'circle',
                    symbolSize: 8,
                    lineStyle: { color: primaryColor, width: 2.5 },
                    itemStyle: { color: primaryColor },
                    markLine: {
                        silent: true,
                        data: [{
                            yAxis: 7.0,
                            label: { formatter: 'Meta 7%', fontSize: 9, color: goalColor },
                            lineStyle: { color: goalColor, type: 'dashed', opacity: 0.6 }
                        }]
                    }
                },
                {
                    name: 'Glucosa promedio (mg/dL)',
                    type: 'bar',
                    yAxisIndex: 1,
                    data: glucose,
                    barMaxWidth: 30,
                    itemStyle: { color: barColor, borderRadius: [4, 4, 0, 0] }
                }
            ]
        };
    }
}