import { Component } from '@angular/core';
import { ExerciseLogComponent } from '../../components/exercise-log/exercise-log.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-exercise',
    standalone: true,
    imports: [ExerciseLogComponent, MatIconModule, MatButtonModule, RouterLink],
    templateUrl: './exercise.component.html',
    styleUrl: './exercise.component.scss'
})
export class ExerciseComponent { }