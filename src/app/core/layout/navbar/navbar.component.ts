import { Component, EventEmitter, Output, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../services/theme.service';
import { GlucoseStateService } from '../../services/glucose-state.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [
        RouterLink,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatDividerModule,
        MatTooltipModule,
        MatSnackBarModule
    ],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {

    @Output() menuToggle = new EventEmitter<void>();

    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly snackBar = inject(MatSnackBar);
    private readonly pushService = inject(PushNotificationService);
    readonly themeService = inject(ThemeService);
    readonly glucoseState = inject(GlucoseStateService);

    notificationsEnabled = signal(false);
    showNotifButton = signal(false);

    ngOnInit(): void {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            this.showNotifButton.set(true);
            this.notificationsEnabled.set(Notification.permission === 'granted');
        }
    }

    async onToggleNotifications(): Promise<void> {
        if (this.notificationsEnabled()) {
            await this.pushService.unsubscribe();
            this.notificationsEnabled.set(false);
            this.snackBar.open('Notificaciones desactivadas', '', { duration: 2500 });
        } else {
            const ok = await this.pushService.requestPermissionAndSubscribe();
            this.notificationsEnabled.set(ok);
            this.snackBar.open(
                ok ? '¡Notificaciones activadas!' : 'No se pudo activar las notificaciones',
                '', { duration: 2500 }
            );
        }
    }

    onMenuToggle(): void {
        this.menuToggle.emit();
    }

    onLogout(): void {
        this.authService.clearSession();
        this.router.navigate(['/auth/login']);
    }
}