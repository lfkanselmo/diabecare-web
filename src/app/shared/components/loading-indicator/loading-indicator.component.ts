import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
    selector: 'app-loading-indicator',
    standalone: true,
    imports: [MatProgressBarModule],
    templateUrl: './loading-indicator.component.html',
    styleUrl: './loading-indicator.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class LoadingIndicatorComponent {

    private readonly loadingService = inject(LoadingService);

    readonly visible = this.loadingService.visible;
}
