import {
  Component,
  EventEmitter,
  Output,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { TranslocoPipe } from '@jsverse/transloco';
import { FoodResponse } from '@shared/models/food.model';
import { FoodService } from '../services/food.service';

@Component({
  selector: 'app-food-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslocoPipe,
  ],
  templateUrl: './food-search.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './food-search.component.scss',
})
export class FoodSearchComponent {
  @Output() foodSelected = new EventEmitter<FoodResponse>();

  private readonly foodService = inject(FoodService);

  searchControl = new FormControl('');
  results = signal<FoodResponse[]>([]);
  searching = signal(false);
  showResults = signal(false);

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((value) => !!value && value.length >= 2),
        switchMap((value) => {
          this.searching.set(true);
          this.showResults.set(true);
          return this.foodService.search(value!);
        }),
      )
      .subscribe({
        next: (foods) => {
          this.results.set(foods);
          this.searching.set(false);
        },
        error: () => this.searching.set(false),
      });
  }

  onSelect(food: FoodResponse): void {
    this.foodSelected.emit(food);
    this.searchControl.setValue('', { emitEvent: false });
    this.results.set([]);
    this.showResults.set(false);
  }

  onClear(): void {
    this.searchControl.setValue('');
    this.results.set([]);
    this.showResults.set(false);
  }
}
