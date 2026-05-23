import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { LoadingService } from '../../services/loading.service';

@Component({
    selector: 'app-shell',
    standalone: true,
    imports: [RouterOutlet, NavbarComponent, SidebarComponent, MatProgressBarModule],
    templateUrl: './shell.component.html',
    styleUrl: './shell.component.scss'
})
export class ShellComponent {
    readonly loadingService = inject(LoadingService);
    sidebarOpen = true;

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }
}