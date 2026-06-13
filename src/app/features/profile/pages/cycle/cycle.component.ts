import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MenstrualCycleComponent } from '../../components/menstrual-cycle/menstrual-cycle.component';

@Component({
    selector: 'app-cycle',
    standalone: true,
    imports: [MatIconModule, MatButtonModule, RouterLink, MenstrualCycleComponent],
    templateUrl: './cycle.component.html',
    styleUrl: './cycle.component.scss'
})
export class CycleComponent { }