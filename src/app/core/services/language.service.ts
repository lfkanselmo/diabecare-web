import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

const LANG_KEY = 'dc_lang';

export type AppLanguage = 'es' | 'en';

/**
 * LOCALE_ID de Angular (usado por DatePipe/DecimalPipe) es un token estático que se
 * resuelve una sola vez al arrancar la app — por eso, a diferencia del tema claro/oscuro,
 * cambiar de idioma sí recarga la página: es la única forma de que el formateo de fechas
 * y números quede consistente con el nuevo idioma, no solo los textos traducidos por
 * Transloco (esos sí podrían cambiar sin recargar).
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {

    private readonly transloco = inject(TranslocoService);

    readonly currentLang = signal<AppLanguage>(LanguageService.loadLanguage());

    setLanguage(lang: AppLanguage): void {
        if (lang === this.currentLang()) return;
        localStorage.setItem(LANG_KEY, lang);
        window.location.reload();
    }

    getActiveLang(): AppLanguage {
        return this.transloco.getActiveLang() as AppLanguage;
    }

    static loadLanguage(): AppLanguage {
        const saved = localStorage.getItem(LANG_KEY);
        if (saved === 'es' || saved === 'en') return saved;
        return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es';
    }
}
