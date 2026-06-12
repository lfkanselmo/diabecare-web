import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: []
})
export class AppComponent implements OnInit {

  private readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    this.themeService.initTheme();
    this.registerPushHandler();
  }

  private registerPushHandler(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if (!registration.active) return;
        fetch('/sw-push-handler.js')
          .then(r => r.text())
          .then(code => {
            const blob = new Blob([code], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            registration.active!.postMessage({ type: 'IMPORT_SCRIPTS', url });
          });
      });
    }
  }
}