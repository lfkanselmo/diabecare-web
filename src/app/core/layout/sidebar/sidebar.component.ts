import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
    label: string;
    icon: string;
    route: string;
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, MatIconModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

    @Input() isOpen = true;

    readonly navItems: NavItem[] = [
        { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard' },
        { label: 'Glucosa', icon: 'water_drop', route: '/app/glucose' },
        { label: 'Nutrición', icon: 'restaurant', route: '/app/nutrition' },
        { label: 'Signos vitales', icon: 'favorite', route: '/app/vitals' },
        { label: 'Medicamentos', icon: 'medication', route: '/app/medications' },
        { label: 'Reportes', icon: 'picture_as_pdf', route: '/app/reports' },
        { label: 'Mi perfil', icon: 'person', route: '/app/profile' },
    ];
}