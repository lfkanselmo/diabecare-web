import { Component, inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterLink,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class LoginComponent {

    private readonly fb = inject(FormBuilder);
    private readonly authApiService = inject(AuthApiService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    form: FormGroup = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]]
    });

    loading = false;
    errorMessage = '';
    hidePassword = true;

    onSubmit(): void {
        if (this.form.invalid) return;

        this.loading = true;
        this.errorMessage = '';

        this.authApiService.login(this.form.getRawValue()).subscribe({
            next: response => {
                this.authService.saveSession(response.accessToken, response.patient);
                this.router.navigate(['/app/dashboard']);
            },
            error: err => {
                const code = err?.error?.code;
                if (code === 'ACCOUNT_SUSPENDED') {
                    this.errorMessage = 'Tu cuenta está suspendida. Contacta soporte para reactivarla.';
                } else if (code === 'INVALID_CREDENTIALS') {
                    this.errorMessage = 'Correo o contraseña incorrectos.';
                } else {
                    this.errorMessage = 'Error al iniciar sesión. Intenta de nuevo.';
                }
                this.loading = false;
            }
        });
    }
}