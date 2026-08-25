import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'stockionic-theme';
const VALID_MODES: ThemeMode[] = ['light', 'dark'];
const CYCLE_ORDER: ThemeMode[] = ['light', 'dark'];

/**
 * Gère la préférence de thème (clair / sombre / système), persistée en local storage.
 * Le thème "système" laisse `prefers-color-scheme` décider (aucune classe forcée).
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private modeSignal = signal<ThemeMode>('dark');
  mode = this.modeSignal.asReadonly();

  init(): void {
    this.apply(this.getStoredMode() ?? 'dark');
  }

  setMode(mode: ThemeMode): void {
    this.apply(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }

  // Fait défiler clair -> sombre -> système -> clair...
  cycle(): void {
    const next = CYCLE_ORDER[(CYCLE_ORDER.indexOf(this.modeSignal()) + 1) % CYCLE_ORDER.length];
    this.setMode(next);
  }

  private apply(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    const root = document.documentElement.classList;
    root.remove('force-light', 'force-dark');
    if (mode === 'light') root.add('force-light');
    if (mode === 'dark') root.add('force-dark');
  }

  private getStoredMode(): ThemeMode | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return VALID_MODES.includes(raw as ThemeMode) ? (raw as ThemeMode) : null;
  }
}
