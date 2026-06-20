import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AlertSeverity } from '../../../shared/models/alert.model';
import { NotificationService } from '../../../core/services/notification.service';
import { SystemConfigService } from '../../../core/services/system-config.service';

@Component({
    selector: 'app-notification-banner',
    standalone: true,
    imports: [MatIconModule, MatButtonModule],
    templateUrl: './notification-banner.component.html',
    styleUrl: './notification-banner.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class NotificationBannerComponent {

    private readonly notificationService = inject(NotificationService);
    private readonly systemConfig = inject(SystemConfigService);

    readonly notifications = this.notificationService.visible;

    readonly severityIcons: Record<AlertSeverity, string> = {
        SUCCESS: 'check_circle',
        INFO: 'info',
        WARNING: 'warning',
        DANGER: 'error'
    };

    close(id: number): void {
        this.notificationService.dismiss(id);
    }

    runAction(id: number, onClick: () => void): void {
        onClick();
        this.close(id);
    }

    getAlertColor(severity: AlertSeverity): string {
        return this.systemConfig.getAlertColor(severity);
    }

    getAlertBg(severity: AlertSeverity): string {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return this.systemConfig.getAlertBg(severity, isDark);
    }
}