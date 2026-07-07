import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

interface NavItem {
    labelKey: string;
    icon: string;
    route: string;
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, MatIconModule, TranslocoPipe],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

    @Input() isOpen = true;

    readonly navItems: NavItem[] = [
        { labelKey: 'nav.dashboard', icon: 'dashboard', route: '/app/dashboard' },
        { labelKey: 'nav.glucose', icon: 'water_drop', route: '/app/glucose' },
        { labelKey: 'nav.nutrition', icon: 'restaurant', route: '/app/nutrition' },
        { labelKey: 'nav.vitals', icon: 'favorite', route: '/app/vitals' },
        { labelKey: 'nav.medications', icon: 'medication', route: '/app/medications' },
        { labelKey: 'nav.caregivers', icon: 'group', route: '/app/caregivers' },
        { labelKey: 'nav.reports', icon: 'picture_as_pdf', route: '/app/reports' },
        { labelKey: 'nav.profile', icon: 'person', route: '/app/profile' },
    ];
}