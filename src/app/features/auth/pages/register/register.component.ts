import { Component, inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { MetadataService } from '@core/services/metadata.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterLink,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatProgressSpinnerModule,
        MatStepperModule
    ],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class RegisterComponent {

    private readonly fb = inject(FormBuilder);
    private readonly authApiService = inject(AuthApiService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    readonly metadata = inject(MetadataService);

    accountForm: FormGroup = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    profileForm: FormGroup = this.fb.group({
        fullName: ['', [Validators.required, Validators.maxLength(150)]],
        dateOfBirth: [null, Validators.required],
        diabetesType: ['', Validators.required],
        diagnosisDate: [null, Validators.required],
        heightCm: ['', [Validators.required, Validators.min(50), Validators.max(250)]],
        biologicalSex: ['NOT_SPECIFIED']
    });

    readonly diabetesTypes = [
        { value: 'TYPE_1', label: 'Tipo 1' },
        { value: 'TYPE_2', label: 'Tipo 2' },
        { value: 'GESTATIONAL', label: 'Gestacional' },
        { value: 'LADA', label: 'LADA' },
        { value: 'MODY', label: 'MODY' }
    ];

    loading = false;
    errorMessage = '';
    hidePassword = true;

    onSubmit(): void {
        if (this.accountForm.invalid || this.profileForm.invalid) return;

        this.loading = true;
        this.errorMessage = '';

        const dob = this.profileForm.get('dateOfBirth')?.value as Date;
        const diagDate = this.profileForm.get('diagnosisDate')?.value as Date;

        const request = {
            email: this.accountForm.get('email')?.value,
            password: this.accountForm.get('password')?.value,
            fullName: this.profileForm.get('fullName')?.value,
            dateOfBirth: dob.toISOString().split('T')[0],
            diabetesType: this.profileForm.get('diabetesType')?.value,
            diagnosisDate: diagDate.toISOString().split('T')[0],
            heightCm: String(this.profileForm.get('heightCm')?.value),
            biologicalSex: String(this.profileForm.get('biologicalSex')?.value)
        };

        this.authApiService.register(request).subscribe({
            next: (response) => {
                this.authService.saveSession(response.accessToken, response.patient);
                this.router.navigate(['/app/dashboard']);
            },
            error: () => {
                this.errorMessage = 'Error al crear la cuenta. Verifica los datos e intenta de nuevo.';
                this.loading = false;
            }
        });
    }

    private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
        const password = group.get('password')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return password === confirm ? null : { passwordMismatch: true };
    }
}