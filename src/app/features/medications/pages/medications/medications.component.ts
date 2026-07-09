import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MedicationsService } from '../../services/medications.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
    DoseUnit,
    MedicationFrequency,
    MedicationResponse,
    MedicationType
} from '../../../../shared/models/medication.model';
import { MatTabsModule } from '@angular/material/tabs';
import { InsulinCalculatorComponent } from '../../components/insulin-calculator/insulin-calculator.component';
import { InsulinProfileComponent } from '../../components/insulin-profile/insulin-profile.component';
import { MetadataService } from '@core/services/metadata.service';

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
        MatChipsModule,
        MatTabsModule,
        MatTooltipModule,
        InsulinCalculatorComponent,
        InsulinProfileComponent,
        TranslocoPipe
    ],
    templateUrl: './medications.component.html',
    styleUrl: './medications.component.scss'
})
export class MedicationsComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly medicationsService = inject(MedicationsService);
    private readonly authService = inject(AuthService);
    private readonly notificationService = inject(NotificationService);
    private readonly transloco = inject(TranslocoService);
    private readonly route = inject(ActivatedRoute);
    readonly metadata = inject(MetadataService);

    loading = signal(false);
    medications = signal<MedicationResponse[]>([]);
    selectedTabIndex = signal(0);

    form: FormGroup = this.fb.group({
        name: ['', Validators.required],
        type: ['', Validators.required],
        dose: [null, [Validators.required, Validators.min(0.01)]],
        doseUnit: ['', Validators.required],
        frequency: ['', Validators.required],
        notes: ['']
    });

    ngOnInit(): void {
        this.loadMedications();

        if (this.route.snapshot.queryParamMap.get('tab') === 'calculator') {
            this.selectedTabIndex.set(1);
        }
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
                this.notificationService.success(this.transloco.translate('medications.successAdd'));
                this.loading.set(false);
            },
            error: () => {
                this.notificationService.danger(this.transloco.translate('medications.errorAdd'));
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
                this.notificationService.success(this.transloco.translate('medications.successDeactivate'));
            },
            error: () => {
                this.notificationService.danger(this.transloco.translate('medications.errorDeactivate'));
            }
        });
    }

    getMedicationTypeLabel(type: string): string {
        return this.metadata.getLabelByValue(this.metadata.medicationTypes(), type);
    }

    getFrequencyLabel(freq: string): string {
        return this.metadata.getLabelByValue(this.metadata.medicationFrequencies(), freq);
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