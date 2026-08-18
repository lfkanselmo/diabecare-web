import { Component, Input, OnChanges, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { TranslocoService } from '@jsverse/transloco';
import { Hba1cTrendResponse } from '../../../../shared/models/vitals.model';
import { getCssColor } from '../../../../shared/utils/css-color.utils';

@Component({
  selector: 'app-hba1c-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './hba1c-chart.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './hba1c-chart.component.scss',
})
export class Hba1cChartComponent implements OnChanges {
  @Input() trend: Hba1cTrendResponse[] = [];

  private readonly transloco = inject(TranslocoService);

  chartOptions: EChartsOption = {};

  ngOnChanges(): void {
    if (this.trend.length > 0) {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      this.buildChart(dark);
    }
  }

  private buildChart(dark: boolean): void {
    const months = this.trend.map((t) => t.month);
    const hba1c = this.trend.map((t) => t.estimatedHba1c ?? null);
    const glucose = this.trend.map((t) => t.averageGlucose ?? null);

    const labelColor = getCssColor('--color-text-secondary', dark ? '#9B97C0' : '#546E7A');
    const gridColor = dark ? 'rgba(255,255,255,0.06)' : '#F0F0F0';
    const axisColor = dark ? 'rgba(255,255,255,0.12)' : '#E0E0E0';
    const primaryColor = getCssColor('--color-primary', dark ? '#776CDA' : '#5B4FCF');
    const tealColor = getCssColor('--color-info', dark ? '#2DD4CF' : '#0EA5A0');
    const barColor = dark ? 'rgba(14,165,160,0.35)' : '#A2D9CE';
    const goalColor = getCssColor('--color-success', dark ? '#4ADE98' : '#22A96A');
    const estimatedSeries = this.transloco.translate('vitals.hba1cChart.estimatedSeries');
    const averageGlucoseSeries = this.transloco.translate('vitals.hba1cChart.averageGlucoseSeries');

    this.chartOptions = {
      backgroundColor: 'transparent',
      grid: { top: 50, right: 60, bottom: 60, left: 60 },
      legend: {
        data: [estimatedSeries, averageGlucoseSeries],
        top: 0,
        textStyle: { fontSize: 11, color: labelColor },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: getCssColor('--color-surface', dark ? '#121214' : '#FFFFFF'),
        borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E8E6F5',
        textStyle: {
          color: getCssColor('--color-text-primary', dark ? '#EAE8F8' : '#1A1730'),
          fontSize: 12,
        },
        formatter: (params: any) => {
          let html = `<strong>${params[0].name}</strong><br/>`;
          params.forEach((p: any) => {
            if (p.value !== null) {
              html += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong><br/>`;
            }
          });
          return html;
        },
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { fontSize: 11, color: labelColor },
        axisLine: { lineStyle: { color: axisColor } },
        axisTick: { lineStyle: { color: axisColor } },
      },
      yAxis: [
        {
          type: 'value',
          name: 'HbA1c (%)',
          nameTextStyle: { color: primaryColor, fontSize: 10 },
          axisLabel: { color: primaryColor, fontSize: 10 },
          splitLine: { lineStyle: { color: gridColor } },
          min: 4,
          max: 12,
        },
        {
          type: 'value',
          name: 'mg/dL',
          nameTextStyle: { color: tealColor, fontSize: 10 },
          axisLabel: { color: tealColor, fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: estimatedSeries,
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
            data: [
              {
                yAxis: 7.0,
                label: {
                  formatter: this.transloco.translate('vitals.hba1cChart.goalLabel'),
                  fontSize: 9,
                  color: goalColor,
                },
                lineStyle: { color: goalColor, type: 'dashed', opacity: 0.6 },
              },
            ],
          },
        },
        {
          name: averageGlucoseSeries,
          type: 'bar',
          yAxisIndex: 1,
          data: glucose,
          barMaxWidth: 30,
          itemStyle: { color: barColor, borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }
}
