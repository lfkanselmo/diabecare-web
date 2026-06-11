import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MetadataService } from '../../services/metadata.service';

@Component({
    selector: 'app-shell',
    standalone: true,
    imports: [RouterOutlet, NavbarComponent, SidebarComponent],
    templateUrl: './shell.component.html',
    styleUrl: './shell.component.scss'
})
export class ShellComponent implements OnInit {

    private readonly metadataService = inject(MetadataService);

    sidebarOpen = true;

    ngOnInit(): void {
        this.metadataService.loadAll();
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }
}