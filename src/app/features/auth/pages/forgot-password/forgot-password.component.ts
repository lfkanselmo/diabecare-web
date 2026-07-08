import { Component, inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthApiService } from '../../../../core/auth/auth-api.service';

@Component({
    selector: 'app-forgot-password',
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
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ForgotPasswordComponent {

    private readonly fb = inject(FormBuilder);
    private readonly authApiService = inject(AuthApiService);
    private readonly transloco = inject(TranslocoService);

    form: FormGroup = this.fb.group({
        email: ['', [Validators.required, Validators.email]]
    });

    loading = false;
    submitted = false;
    errorMessage = '';

    onSubmit(): void {
        if (this.form.invalid) return;

        this.loading = true;
        this.errorMessage = '';

        this.authApiService.forgotPassword(this.form.value.email).subscribe({
            // El backend siempre responde 200 exista o no la cuenta (anti-enumeración),
            // así que el único mensaje de éxito posible es genérico.
            next: () => {
                this.loading = false;
                this.submitted = true;
            },
            error: err => {
                this.loading = false;
                if (err?.status === 429) {
                    this.errorMessage = this.transloco.translate('auth.forgotPassword.errorRateLimit');
                } else {
                    // Cualquier otro error (incluida la ausencia de la cuenta) se trata
                    // igual que un éxito, por la misma razón anti-enumeración de arriba.
                    this.submitted = true;
                }
            }
        });
    }
}
