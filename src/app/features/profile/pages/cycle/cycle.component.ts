import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MenstrualCycleComponent } from '../../components/menstrual-cycle/menstrual-cycle.component';

@Component({
  selector: 'app-cycle',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, RouterLink, MenstrualCycleComponent, TranslocoPipe],
  templateUrl: './cycle.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './cycle.component.scss',
})
export class CycleComponent {}
