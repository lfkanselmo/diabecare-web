import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { GlucoseReminderService } from '../../services/glucose-reminder.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { GlucoseReminderResponse } from '../../../../shared/models/glucose-reminder.model';

@Component({
    selector: 'app-glucose-reminders',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSlideToggleModule,
        TranslocoPipe
    ],
    templateUrl: './glucose-reminders.component.html',
    styleUrl: './glucose-reminders.component.scss'
})
export class GlucoseRemindersComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly reminderService = inject(GlucoseReminderService);
    private readonly authService = inject(AuthService);
    private readonly notificationService = inject(NotificationService);
    private readonly transloco = inject(TranslocoService);

    reminders = signal<GlucoseReminderResponse[]>([]);
    loading = signal(true);
    armedDeleteId = signal<string | null>(null);

    form: FormGroup = this.fb.group({
        reminderTime: ['', Validators.required],
        label: ['']
    });

    ngOnInit(): void {
        this.loadReminders();
    }

    onAdd(): void {
        if (this.form.invalid) return;

        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.reminderService.create(patientId, {
            reminderTime: this.form.value.reminderTime,
            label: this.form.value.label || null
        }).subscribe({
            next: reminder => {
                this.reminders.update(list => [...list, reminder].sort(
                    (a, b) => a.reminderTime.localeCompare(b.reminderTime)));
                this.form.reset();
                this.notificationService.success(this.transloco.translate('profile.reminders.added'));
            },
            error: () => this.notificationService.danger(this.transloco.translate('profile.reminders.addError'))
        });
    }

    onToggle(reminder: GlucoseReminderResponse): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.reminderService.toggle(patientId, reminder.id, !reminder.enabled).subscribe({
            next: updated => {
                this.reminders.update(list => list.map(r => r.id === updated.id ? updated : r));
            },
            error: () => this.notificationService.danger(this.transloco.translate('profile.reminders.toggleError'))
        });
    }

    onArmDelete(reminderId: string): void {
        this.armedDeleteId.set(reminderId);
    }

    onCancelDelete(): void {
        this.armedDeleteId.set(null);
    }

    onDelete(reminderId: string): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.reminderService.delete(patientId, reminderId).subscribe({
            next: () => {
                this.reminders.update(list => list.filter(r => r.id !== reminderId));
                this.armedDeleteId.set(null);
            },
            error: () => {
                this.armedDeleteId.set(null);
                this.notificationService.danger(this.transloco.translate('profile.reminders.deleteError'));
            }
        });
    }

    private loadReminders(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);
        this.reminderService.getAll(patientId).subscribe({
            next: reminders => {
                this.reminders.set(reminders);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }
}
