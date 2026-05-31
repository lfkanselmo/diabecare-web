import { Component, Input } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AlertResponse, AlertSeverity } from '../../../shared/models/alert.model';

@Component({
    selector: 'app-alerts-panel',
    standalone: true,
    imports: [MatIconModule, LowerCasePipe],
    templateUrl: './alerts-panel.component.html',
    styleUrl: './alerts-panel.component.scss'
})
export class AlertsPanelComponent {

    @Input() alerts: AlertResponse[] = [];

    readonly severityIcons: Record<AlertSeverity, string> = {
        SUCCESS: 'check_circle',
        INFO: 'info',
        WARNING: 'warning',
        DANGER: 'error'
    };
}