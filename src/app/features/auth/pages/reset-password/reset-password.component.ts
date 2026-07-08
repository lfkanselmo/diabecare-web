import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterLink,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        TranslocoPipe
    ],
    templateUrl: './reset-password.component.html',
    styleUrl: './reset-password.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ResetPasswordComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly authApiService = inject(AuthApiService);
    private readonly notificationService = inject(NotificationService);
    private readonly transloco = inject(TranslocoService);

    private token = '';

    form: FormGroup = this.fb.group({
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    loading = false;
    invalidLink = false;
    hidePassword = true;

    ngOnInit(): void {
        this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
        this.invalidLink = !this.token;
    }

    onSubmit(): void {
        if (this.form.invalid || !this.token) return;

        this.loading = true;

        this.authApiService.resetPassword(this.token, this.form.value.newPassword).subscribe({
            next: () => {
                this.notificationService.success(this.transloco.translate('auth.resetPassword.successMessage'));
                this.router.navigate(['/auth/login']);
            },
            error: () => {
                this.loading = false;
                this.invalidLink = true;
            }
        });
    }

    private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
        const password = group.get('newPassword')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return password === confirm ? null : { passwordMismatch: true };
    }
}
