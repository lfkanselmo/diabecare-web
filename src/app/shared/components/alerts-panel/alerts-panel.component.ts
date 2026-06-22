import { Component, Input, ViewEncapsulation, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AlertResponse, AlertSeverity } from '../../../shared/models/alert.model';
import { SystemConfigService } from '../../../core/services/system-config.service';

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

    private readonly systemConfig = inject(SystemConfigService);

    getAlertColor(severity: AlertSeverity): string {
        return this.systemConfig.getAlertColor(severity);
    }

    getAlertBg(severity: AlertSeverity): string {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return this.systemConfig.getAlertBg(severity, isDark);
    }

    getSeverityIcon(severity: AlertSeverity): string {
        return this.systemConfig.getSeverityIcon(severity);
    }
}