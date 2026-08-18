import { Component, Input, OnChanges, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AgpBucketResponse } from '../../../../shared/models/glucose.model';
import { getCssColor } from '../../../../shared/utils/css-color.utils';

/**
 * Gráfico de "día modal" (Ambulatory Glucose Profile): superpone todas las lecturas
 * de glucosa del período en un único eje de 24 horas, mostrando las bandas de
 * percentiles 10-90 y 25-75 más la mediana — la visualización estándar de un
 * reporte AGP clínico.
 */
@Component({
  selector: 'app-agp-chart',
  standalone: true,
  imports: [NgxEchartsDirective, MatIconModule, TranslocoPipe],
  templateUrl: './agp-chart.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './agp-chart.component.scss',
})
export class AgpChartComponent implements OnChanges {
  @Input() buckets: AgpBucketResponse[] = [];
  @Input() targetMin = 70;
  @Input() targetMax = 180;

  chartOptions: EChartsOption = {};
  hasEnoughData = false;

  private readonly transloco = inject(TranslocoService);

  ngOnChanges(): void {
    this.hasEnoughData = this.buckets.some((b) => b.readingCount > 0);
    if (this.hasEnoughData) {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      this.buildChart(dark);
    }
  }

  private buildChart(dark: boolean): void {
    const sorted = [...this.buckets].sort((a, b) => a.hour - b.hour);
    const hours = sorted.map((b) => `${b.hour.toString().padStart(2, '0')}:00`);

    const p10 = sorted.map((b) => b.p10);
    const p25 = sorted.map((b) => b.p25);
    const median = sorted.map((b) => b.median);
    const p75 = sorted.map((b) => b.p75);
    const p90 = sorted.map((b) => b.p90);

    const band90 = sorted.map((b, i) =>
      b.p90 !== null && b.p10 !== null ? round1(b.p90 - p10[i]!) : null,
    );
    const band50 = sorted.map((b, i) =>
      b.p75 !== null && b.p25 !== null ? round1(b.p75 - p25[i]!) : null,
    );

    const labelColor = getCssColor('--color-text-secondary', dark ? '#97C0BE' : '#546E7A');
    const gridColor = dark ? 'rgba(255,255,255,0.06)' : '#F0F0F0';
    const axisColor = dark ? 'rgba(255,255,255,0.12)' : '#E0E0E0';
    const primary = getCssColor('--color-primary', dark ? '#4FBDB6' : '#0F6E6A');
    const targetAreaColor = dark ? 'rgba(34,169,106,0.08)' : 'rgba(34,169,106,0.06)';
    const minLine = getCssColor('--color-danger', dark ? '#F07070' : '#C62828');
    const maxLine = getCssColor('--color-warning', dark ? '#FABD4A' : '#E8A020');

    this.chartOptions = {
      backgroundColor: 'transparent',
      grid: { top: 30, right: 20, bottom: 40, left: 55 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: getCssColor('--color-surface', dark ? '#121214' : '#FFFFFF'),
        borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E8E6F5',
        textStyle: {
          color: getCssColor('--color-text-primary', dark ? '#E8F8F8' : '#173030'),
          fontSize: 12,
        },
        formatter: (params: any) => {
          const idx = Array.isArray(params) ? params[0].dataIndex : params.dataIndex;
          const b = sorted[idx];
          if (!b || b.readingCount === 0) {
            return `<strong>${hours[idx]}</strong><br/>${this.transloco.translate('reports.agp.noData')}`;
          }
          return `
                        <strong>${hours[idx]}</strong><br/>
                        ${this.transloco.translate('reports.agp.median')}: <strong>${b.median} mg/dL</strong><br/>
                        p25–p75: ${b.p25}–${b.p75} mg/dL<br/>
                        p10–p90: ${b.p10}–${b.p90} mg/dL<br/>
                        ${this.transloco.translate('reports.agp.readings')}: ${b.readingCount}
                    `;
        },
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLabel: { fontSize: 11, color: labelColor, interval: 2 },
        axisLine: { lineStyle: { color: axisColor } },
        axisTick: { lineStyle: { color: axisColor } },
      },
      yAxis: {
        type: 'value',
        name: 'mg/dL',
        nameTextStyle: { color: labelColor, fontSize: 11 },
        axisLabel: { color: labelColor, fontSize: 11 },
        splitLine: { lineStyle: { color: gridColor } },
      },
      series: [
        {
          name: 'p10-base',
          type: 'line',
          data: p10,
          stack: 'range90',
          lineStyle: { opacity: 0 },
          symbol: 'none',
          silent: true,
          tooltip: { show: false },
          markArea: {
            silent: true,
            itemStyle: { color: targetAreaColor },
            data: [[{ yAxis: this.targetMin }, { yAxis: this.targetMax }]],
          },
        },
        {
          name: this.transloco.translate('reports.agp.band90'),
          type: 'line',
          data: band90,
          stack: 'range90',
          lineStyle: { opacity: 0 },
          areaStyle: { color: primary, opacity: 0.12 },
          symbol: 'none',
          silent: true,
          tooltip: { show: false },
        },
        {
          name: 'p25-base',
          type: 'line',
          data: p25,
          stack: 'range50',
          lineStyle: { opacity: 0 },
          symbol: 'none',
          silent: true,
          tooltip: { show: false },
        },
        {
          name: this.transloco.translate('reports.agp.band50'),
          type: 'line',
          data: band50,
          stack: 'range50',
          lineStyle: { opacity: 0 },
          areaStyle: { color: primary, opacity: 0.28 },
          symbol: 'none',
          silent: true,
          tooltip: { show: false },
        },
        {
          name: this.transloco.translate('reports.agp.median'),
          type: 'line',
          data: median,
          lineStyle: { width: 2.5, color: primary },
          itemStyle: { color: primary },
          symbol: 'circle',
          symbolSize: 6,
          markLine: {
            silent: true,
            symbol: 'none',
            label: { show: false },
            lineStyle: { type: 'dashed' },
            data: [
              { yAxis: this.targetMin, lineStyle: { color: minLine, opacity: 0.6 } },
              { yAxis: this.targetMax, lineStyle: { color: maxLine, opacity: 0.6 } },
            ],
          },
        },
      ],
    };
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
