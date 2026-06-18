import { Component, inject, OnInit, signal, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { AccountService } from '../../../../core/services/account.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { MetadataService } from '@core/services/metadata.service';
import { PatientResponse } from '../../../../shared/models/patient.model';
import { MenstrualCycleComponent } from '../../components/menstrual-cycle/menstrual-cycle.component';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        DatePipe,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatSnackBarModule,
        MatDividerModule,
        MatChipsModule,
        MatTabsModule,
        MatDialogModule,
        MenstrualCycleComponent
    ],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ProfileComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly profileService = inject(ProfileService);
    private readonly accountService = inject(AccountService);
    private readonly authService = inject(AuthService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    readonly metadata = inject(MetadataService);

    loading = signal(false);
    saving = signal(false);
    suspending = signal(false);
    deleting = signal(false);
    confirmDelete = signal(false);
    confirmSuspend = signal(false);
    patient = signal<PatientResponse | null>(null);

    form: FormGroup = this.fb.group({
        heightCm: [null, [Validators.min(50), Validators.max(250)]],
        targetGlucoseMin: [null, [Validators.required, Validators.min(50)]],
        targetGlucoseMax: [null, [Validators.required, Validators.min(50)]],
        dailyCalorieGoal: [null, [Validators.min(500), Validators.max(5000)]],
        activityLevel: ['', Validators.required],
        preferredGlucoseUnit: ['', Validators.required]
    });

    ngOnInit(): void {
        this.loadProfile();
    }

    onSave(): void {
        if (this.form.invalid) return;

        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.saving.set(true);

        this.profileService.update(patientId, this.form.getRawValue()).subscribe({
            next: updated => {
                this.patient.set(updated);
                this.authService.saveSession(this.authService.getToken()!, updated);
                this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', { duration: 3000 });
                this.saving.set(false);
            },
            error: () => {
                this.snackBar.open('Error al actualizar el perfil', 'Cerrar', { duration: 3000 });
                this.saving.set(false);
            }
        });
    }

    onSuspendAccount(): void {
        if (!this.confirmSuspend()) {
            this.confirmSuspend.set(true);
            return;
        }

        const userId = this.authService.getUserId();
        if (!userId) return;

        this.suspending.set(true);

        this.accountService.suspend(userId).subscribe({
            next: () => {
                this.snackBar.open('Cuenta suspendida. Cerrando sesión...', 'Cerrar', { duration: 3000 });
                setTimeout(() => {
                    this.authService.logout();
                    this.router.navigate(['/auth/login']);
                }, 2000);
            },
            error: () => {
                this.snackBar.open('Error al suspender la cuenta', 'Cerrar', { duration: 3000 });
                this.suspending.set(false);
                this.confirmSuspend.set(false);
            }
        });
    }

    onDeleteAccount(): void {
        if (!this.confirmDelete()) {
            this.confirmDelete.set(true);
            return;
        }

        const userId = this.authService.getUserId();
        if (!userId) return;

        this.deleting.set(true);

        this.accountService.delete(userId).subscribe({
            next: () => {
                this.snackBar.open('Cuenta eliminada. Hasta luego.', 'Cerrar', { duration: 3000 });
                setTimeout(() => {
                    this.authService.logout();
                    this.router.navigate(['/auth/login']);
                }, 2000);
            },
            error: () => {
                this.snackBar.open('Error al eliminar la cuenta', 'Cerrar', { duration: 3000 });
                this.deleting.set(false);
                this.confirmDelete.set(false);
            }
        });
    }

    cancelSuspend(): void {
        this.confirmSuspend.set(false);
    }

    cancelDelete(): void {
        this.confirmDelete.set(false);
    }

    get isFemale(): boolean {
        return this.patient()?.biologicalSex === 'FEMALE';
    }

    private loadProfile(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);

        this.profileService.getById(patientId).subscribe({
            next: data => {
                this.patient.set(data);
                this.form.patchValue({
                    heightCm: data.heightCm,
                    targetGlucoseMin: data.targetGlucoseMin,
                    targetGlucoseMax: data.targetGlucoseMax,
                    dailyCalorieGoal: data.dailyCalorieGoal,
                    activityLevel: data.activityLevel,
                    preferredGlucoseUnit: data.preferredGlucoseUnit
                });
                this.cdr.detectChanges();
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }
}