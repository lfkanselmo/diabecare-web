import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MetadataService } from '../../services/metadata.service';
import { SystemConfigService } from '../../services/system-config.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private readonly metadataService = inject(MetadataService);
  private readonly systemConfigService = inject(SystemConfigService);

  sidebarOpen = true;

  ngOnInit(): void {
    this.metadataService.loadAll();
    this.systemConfigService.load();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
