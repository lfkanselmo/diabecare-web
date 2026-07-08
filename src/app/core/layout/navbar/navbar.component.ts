import { Component, EventEmitter, Output, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../auth/auth.service';
import { AuthApiService } from '../../auth/auth-api.service';
import { ThemeService } from '../../services/theme.service';
import { SystemConfigService } from '../../services/system-config.service';
import { MetadataService } from '../../services/metadata.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { NotificationService } from '../../services/notification.service';
import { LanguageService, AppLanguage } from '../../services/language.service';
import { GlucoseActions } from '../../../store/glucose/glucose.actions';
import { selectLatestReading } from '../../../store/glucose/glucose.selectors';
import { GlucoseStatus } from '../../../shared/models/glucose.model';
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
        TranslocoPipe
    ],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {

    @Output() menuToggle = new EventEmitter<void>();

    private readonly authService = inject(AuthService);
    private readonly authApiService = inject(AuthApiService);
    private readonly router = inject(Router);
    private readonly notificationService = inject(NotificationService);
    private readonly pushService = inject(PushNotificationService);
    private readonly transloco = inject(TranslocoService);
    private readonly systemConfig = inject(SystemConfigService);
    private readonly metadata = inject(MetadataService);
    private readonly store = inject(Store);
    readonly themeService = inject(ThemeService);
    readonly languageService = inject(LanguageService);

    readonly latestReading = toSignal(this.store.select(selectLatestReading), { initialValue: null });
    readonly isAdmin = this.authService.isAdmin();

    notificationsEnabled = signal(false);
    showNotifButton = signal(false);

    readonly languages: { value: AppLanguage; label: string }[] = [
        { value: 'es', label: 'Español' },
        { value: 'en', label: 'English' }
    ];

    ngOnInit(): void {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            this.showNotifButton.set(true);
            this.notificationsEnabled.set(Notification.permission === 'granted');
        }

        const patientId = this.authService.getPatientId();
        if (patientId) {
            this.store.dispatch(GlucoseActions.loadLatest({ patientId }));
        }
    }

    getChipColor(status: GlucoseStatus): string {
        return this.systemConfig.getGlucoseStatusColor(status, false);
    }

    getChipBg(status: GlucoseStatus): string {
        return this.systemConfig.getGlucoseStatusBg(status);
    }

    getStatusLabel(status: GlucoseStatus): string {
        return this.metadata.getLabelByValue(this.metadata.glucoseStatuses(), status);
    }

    async onToggleNotifications(): Promise<void> {
        if (this.notificationsEnabled()) {
            await this.pushService.unsubscribe();
            this.notificationsEnabled.set(false);
            this.notificationService.info(this.transloco.translate('navbar.notificationsDisabled'));
        } else {
            const ok = await this.pushService.requestPermissionAndSubscribe();
            this.notificationsEnabled.set(ok);
            if (ok) {
                this.notificationService.success(this.transloco.translate('navbar.notificationsEnabled'));
            } else {
                this.notificationService.danger(this.transloco.translate('navbar.notificationsFailed'));
            }
        }
    }

    onMenuToggle(): void {
        this.menuToggle.emit();
    }

    onSelectLanguage(lang: AppLanguage): void {
        this.languageService.setLanguage(lang);
    }

    onLogout(): void {
        const refreshToken = this.authService.getRefreshToken();

        this.authService.clearSession();
        this.router.navigate(['/auth/login']);

        if (refreshToken) {
            this.authApiService.logout(refreshToken).subscribe({ error: () => { } });
        }
    }
}