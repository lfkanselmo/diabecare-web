import { AlertSeverity } from './alert.model';

export interface NotificationAction {
    label: string;
    onClick: () => void;
}

export interface AppNotification {
    id: number;
    severity: AlertSeverity;
    title: string;
    message?: string;
    action?: NotificationAction;
}

export type NotificationInput = Omit<AppNotification, 'id'>;