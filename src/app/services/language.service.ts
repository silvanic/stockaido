import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'fr' | 'en';

const STORAGE_KEY = 'stockionic-lang';
const SUPPORTED_LANGUAGES: AppLanguage[] = ['fr', 'en'];

/**
 * Service de gestion de la langue de l'application (persistée en local storage)
 */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  constructor(private translate: TranslateService) {
    this.translate.addLangs(SUPPORTED_LANGUAGES);
    this.translate.setDefaultLang('fr');
  }

  init(): void {
    const lang = this.getStoredLang() ?? this.getBrowserLang() ?? 'fr';
    this.use(lang);
  }

  use(lang: AppLanguage): void {
    this.translate.use(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  getCurrentLang(): AppLanguage {
    return (this.translate.currentLang as AppLanguage) ?? 'fr';
  }

  private getStoredLang(): AppLanguage | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(stored as AppLanguage) ? (stored as AppLanguage) : null;
  }

  private getBrowserLang(): AppLanguage | null {
    const browserLang = this.translate.getBrowserLang();
    return SUPPORTED_LANGUAGES.includes(browserLang as AppLanguage) ? (browserLang as AppLanguage) : null;
  }
}
