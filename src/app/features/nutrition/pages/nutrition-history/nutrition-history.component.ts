import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NutritionService } from '../../services/nutrition.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { MetadataService } from '@core/services/metadata.service';
import { LanguageService } from '../../../../core/services/language.service';
import { MealEntryResponse } from '../../../../shared/models/nutrition.model';
import { toLocalDateString } from '../../../../shared/utils/date.utils';

@Component({
    selector: 'app-nutrition-history',
    standalone: true,
    imports: [
        DatePipe,
        DecimalPipe,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatPaginatorModule,
        TranslocoPipe
    ],
    templateUrl: './nutrition-history.component.html',
    styleUrl: './nutrition-history.component.scss'
})
export class NutritionHistoryComponent implements OnInit {

    private readonly fb = inject(FormBuilder);
    private readonly nutritionService = inject(NutritionService);
    private readonly authService = inject(AuthService);
    private readonly transloco = inject(TranslocoService);
    private readonly languageService = inject(LanguageService);
    readonly metadata = inject(MetadataService);

    meals = signal<MealEntryResponse[]>([]);
    loading = signal(true);
    totalElements = signal(0);
    pageIndex = signal(0);
    pageSize = signal(20);

    readonly quickRanges = [
        { labelKey: 'nutrition.history.last7Days', days: 7 },
        { labelKey: 'nutrition.history.last30Days', days: 30 },
        { labelKey: 'nutrition.history.last90Days', days: 90 }
    ];

    rangeForm: FormGroup = this.fb.group({
        from: [this.daysAgo(7), Validators.required],
        to: [new Date(), Validators.required]
    });

    selectedRangeLabel = signal(this.transloco.translate('nutrition.history.last7Days'));

    ngOnInit(): void {
        this.loadHistory();
    }

    applyQuickRange(labelKey: string, days: number): void {
        const to = new Date();
        const from = this.daysAgo(days);
        this.rangeForm.patchValue({ from, to });
        this.selectedRangeLabel.set(this.transloco.translate(labelKey));
        this.pageIndex.set(0);
        this.loadHistory();
    }

    applyCustomRange(): void {
        if (this.rangeForm.invalid) return;
        this.selectedRangeLabel.set(this.formatCustomLabel());
        this.pageIndex.set(0);
        this.loadHistory();
    }

    getMealTypeLabel(type: string): string {
        return this.metadata.getLabelByValue(this.metadata.mealTypes(), type);
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
        this.loadHistory();
    }

    private loadHistory(): void {
        const patientId = this.authService.getPatientId();
        if (!patientId) return;

        const { from, to } = this.getRangeIso();
        this.loading.set(true);

        this.nutritionService.getMealHistory(
            patientId, from, to, this.pageIndex(), this.pageSize()
        ).subscribe({
            next: page => {
                this.meals.set(this.sortByDateDesc(page.content));
                this.totalElements.set(page.totalElements);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    private sortByDateDesc(meals: MealEntryResponse[]): MealEntryResponse[] {
        return [...meals].sort(
            (a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime()
        );
    }

    private getRangeIso(): { from: string; to: string } {
        const fromDate: Date = this.rangeForm.get('from')?.value;
        const toDate: Date = this.rangeForm.get('to')?.value;
        return {
            from: toLocalDateString(fromDate),
            to: toLocalDateString(toDate)
        };
    }

    private daysAgo(days: number): Date {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
    }

    private formatCustomLabel(): string {
        const from: Date = this.rangeForm.get('from')?.value;
        const to: Date = this.rangeForm.get('to')?.value;
        const locale = this.languageService.getActiveLang() === 'en' ? 'en-US' : 'es-CO';
        return `${from.toLocaleDateString(locale)} — ${to.toLocaleDateString(locale)}`;
    }
}