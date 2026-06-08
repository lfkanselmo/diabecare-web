import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'dc_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {

    readonly isDark = signal(this.loadTheme());

    toggleTheme(): void {
        const newValue = !this.isDark();
        this.isDark.set(newValue);
        this.applyTheme(newValue);
        localStorage.setItem(THEME_KEY, newValue ? 'dark' : 'light');
    }

    initTheme(): void {
        this.applyTheme(this.isDark());
    }

    private applyTheme(dark: boolean): void {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    }

    private loadTheme(): boolean {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
}