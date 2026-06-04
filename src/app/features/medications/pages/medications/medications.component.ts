import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MedicationsService } from '../../services/medications.service';
import { AuthService } from '../../../../core/auth/auth.service';
import {
    DoseUnit,
    MedicationFrequency,
    MedicationResponse,
    MedicationType
} from '../../../../shared/models/medication.model';
import { MatTabsModule } from '@angular/material/tabs';
import { InsulinCalculatorComponent } from '../../components/insulin-calculator/insulin-calculator.component';
import { InsulinProfileComponent } from '../../components/insulin-profile/insulin-profile.component';

@Component({
    selector: 'app-medications',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatSnackBarModule,
        MatChipsModule,
        MatTabsModule,
        InsulinCalculatorComponent,
        InsulinProfileComponent
    ],
    templateUrl: './medications.component.html',
    styleUrl: './medications.component.scss'
})
export class MedicationsComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly medicationsService = inject(MedicationsService);
    private readonly authService = inject(AuthService);
    private readonly snackBar = inject(MatSnackBar);

    loading = signal(false);
    medications = signal<MedicationResponse[]>([]);

    form: FormGroup = this.fb.group({
        name: ['', Validators.required],
        type: ['', Validators.required],
        dose: [null, [Validators.required, Validators.min(0.01)]],
        doseUnit: ['', Validators.required],
        frequency: ['', Validators.required],
        notes: ['']
    });

    readonly medicationTypes: { value: MedicationType; label: string }[] = [
        { value: 'INSULIN_BASAL', label: 'Insulina basal' },
        { value: 'INSULIN_BOLUS', label: 'Insulina bolo' },
        { value: 'ORAL', label: 'Oral' },
        { value: 'INJECTABLE', label: 'Inyectable' }
    ];

    readonly doseUnits: { value: DoseUnit; label: string }[] = [
        { value: 'MG', label: 'mg' },
        { value: 'ML', label: 'mL' },
        { value: 'UNITS', label: 'Unidades' }
    ];

    readonly frequencies: { value: MedicationFrequency; label: string }[] = [
        { value: 'ONCE_DAILY', label: 'Una vez al día' },
        { value: 'TWICE_DAILY', label: 'Dos veces al día' },
        { value: 'THREE_TIMES_DAILY', label: 'Tres veces al día' },
        { value: 'WITH_MEALS', label: 'Con las comidas' },
        { value: 'BEFORE_MEALS', label: 'Antes de las comidas' },
        { value: 'AT_BEDTIME', label: 'Al acostarse' },
        { value: 'AS_NEEDED', label: 'Según necesidad' }
    ];

    readonly typeLabels: Record<MedicationType, string> = {
        INSULIN_BASAL: 'Insulina basal',
        INSULIN_BOLUS: 'Insulina bolo',
        ORAL: 'Oral',
        INJECTABLE: 'Inyectable'
    };

    readonly frequencyLabels: Record<MedicationFrequency, string> = {
        ONCE_DAILY: 'Una vez al día',
        TWICE_DAILY: 'Dos veces al día',
        THREE_TIMES_DAILY: 'Tres veces al día',
        WITH_MEALS: 'Con las comidas',
        BEFORE_MEALS: 'Antes de las comidas',
        AT_BEDTIME: 'Al acostarse',
        AS_NEEDED: 'Según necesidad'
    };

    ngOnInit(): void {
        this.loadMedications();
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.loading.set(true);

        this.medicationsService.register(patientId, this.form.getRawValue()).subscribe({
            next: (med) => {
                this.medications.update(list => [med, ...list]);
                this.form.reset();
                this.snackBar.open('Medicamento registrado', 'Cerrar', { duration: 3000 });
                this.loading.set(false);
            },
            error: () => {
                this.snackBar.open('Error al registrar el medicamento', 'Cerrar', { duration: 3000 });
                this.loading.set(false);
            }
        });
    }

    onDeactivate(medicationId: string): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.medicationsService.deactivate(patientId, medicationId).subscribe({
            next: () => {
                this.medications.update(list => list.filter(m => m.medicationId !== medicationId));
                this.snackBar.open('Medicamento desactivado', 'Cerrar', { duration: 3000 });
            },
            error: () => {
                this.snackBar.open('Error al desactivar el medicamento', 'Cerrar', { duration: 3000 });
            }
        });
    }

    getTypeLabel(type: string): string {
        return this.typeLabels[type as MedicationType] ?? type;
    }

    getFrequencyLabel(frequency: string): string {
        return this.frequencyLabels[frequency as MedicationFrequency] ?? frequency;
    }

    private loadMedications(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        this.medicationsService.getActive(patientId).subscribe({
            next: (data) => this.medications.set(data),
            error: () => { }
        });
    }
}