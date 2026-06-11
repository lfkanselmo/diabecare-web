import { Component, Input, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AlertResponse, AlertSeverity } from '../../../shared/models/alert.model';

@Component({
    selector: 'app-alerts-panel',
    standalone: true,
    imports: [MatIconModule],
    templateUrl: './alerts-panel.component.html',
    styleUrl: './alerts-panel.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class AlertsPanelComponent {

    @Input() alerts: AlertResponse[] = [];

    readonly severityIcons: Record<AlertSeverity, string> = {
        SUCCESS: 'check_circle',
        INFO: 'info',
        WARNING: 'warning',
        DANGER: 'error'
    };

    private get isDark(): boolean {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    getAlertColor(severity: AlertSeverity): string {
        const map: Record<AlertSeverity, string> = {
            SUCCESS: '#22A96A',
            INFO: '#0EA5A0',
            WARNING: '#E8A020',
            DANGER: '#E04B4B'
        };
        return map[severity];
    }

    getAlertBg(severity: AlertSeverity): string {
        const dark = this.isDark;
        const map: Record<AlertSeverity, [string, string]> = {
            SUCCESS: ['#E3F7EE', 'rgba(34,169,106,0.12)'],
            INFO: ['#E0F5F4', 'rgba(14,165,160,0.12)'],
            WARNING: ['#FEF5E0', 'rgba(232,160,32,0.12)'],
            DANGER: ['#FEECEC', 'rgba(224,75,75,0.12)']
        };
        return dark ? map[severity][1] : map[severity][0];
    }
}