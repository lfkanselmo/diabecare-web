import { Injectable, signal } from '@angular/core';
import { AlertResponse } from '../../shared/models/alert.model';
import { AppNotification, NotificationAction, NotificationInput } from '../../shared/models/notification.model';

const DEFAULT_AUTO_DISMISS_MS = 4000;

@Injectable({ providedIn: 'root' })
export class NotificationService {

    private readonly notifications = signal<AppNotification[]>([]);
    readonly visible = this.notifications.asReadonly();

    private nextId = 0;
    private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

    success(title: string, message?: string, autoDismissMs = DEFAULT_AUTO_DISMISS_MS): void {
        this.show({ severity: 'SUCCESS', title, message }, autoDismissMs);
    }

    info(title: string, message?: string, autoDismissMs = DEFAULT_AUTO_DISMISS_MS): void {
        this.show({ severity: 'INFO', title, message }, autoDismissMs);
    }

    warning(title: string, message?: string, autoDismissMs = DEFAULT_AUTO_DISMISS_MS, action?: NotificationAction): void {
        this.show({ severity: 'WARNING', title, message, action }, autoDismissMs);
    }

    danger(title: string, message?: string, autoDismissMs = DEFAULT_AUTO_DISMISS_MS): void {
        this.show({ severity: 'DANGER', title, message }, autoDismissMs);
    }

    showAlert(alert: AlertResponse, autoDismissMs = DEFAULT_AUTO_DISMISS_MS, action?: NotificationAction): void {
        this.show({ severity: alert.severity, title: alert.title, message: alert.message, action }, autoDismissMs);
    }

    show(input: NotificationInput, autoDismissMs = DEFAULT_AUTO_DISMISS_MS): void {
        const id = this.nextId++;
        const notification: AppNotification = { ...input, id };

        this.notifications.update(list => [...list, notification]);

        if (autoDismissMs > 0) {
            const timer = setTimeout(() => this.dismiss(id), autoDismissMs);
            this.timers.set(id, timer);
        }
    }

    dismiss(id: number): void {
        const timer = this.timers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(id);
        }

        this.notifications.update(list => list.filter(n => n.id !== id));
    }

    clear(): void {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        this.notifications.set([]);
    }
}