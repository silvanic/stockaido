import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { CatalogEntry, CatalogFile, CatalogMetadata } from '../models/food-catalog.model';
import { normalizeForSearch } from '../shared/text-normalization';

const CATALOG_URL = './assets/catalog/catalog.json';
const NAMES_URL_PREFIX = './assets/catalog/names.';

/**
 * Catalogue de référence des aliments courants, utilisé pour l'autocomplétion.
 * Entièrement local : métadonnées communes + libellés par langue, chargés depuis les assets.
 */
@Injectable({
  providedIn: 'root'
})
export class FoodCatalogService {
  private readonly entriesSignal = signal<CatalogEntry[]>([]);
  readonly entries = this.entriesSignal.asReadonly();

  private metadata: CatalogMetadata[] | null = null;

  constructor(private http: HttpClient, private translate: TranslateService) {}

  init(): void {
    void this.load(this.translate.currentLang ?? this.translate.getDefaultLang());
    this.translate.onLangChange.subscribe(event => void this.load(event.lang));
  }

  /**
   * @param query terme déjà normalisé via normalizeForSearch()
   * @param excludedKeys noms normalisés déjà proposés par une autre source
   */
  search(query: string, limit: number, excludedKeys: Set<string>): CatalogEntry[] {
    if (!query || limit <= 0) return [];

    return this.entriesSignal()
      .filter(entry => entry.searchKey.includes(query) && entry.searchKey !== query && !excludedKeys.has(entry.searchKey))
      .sort((a, b) => Number(b.searchKey.startsWith(query)) - Number(a.searchKey.startsWith(query)))
      .slice(0, limit);
  }

  private async load(lang: string): Promise<void> {
    try {
      if (!this.metadata) {
        const file = await firstValueFrom(this.http.get<CatalogFile>(CATALOG_URL));
        this.metadata = file.entries;
      }

      const names = await firstValueFrom(this.http.get<Record<string, string>>(`${NAMES_URL_PREFIX}${lang}.json`));

      this.entriesSignal.set(
        this.metadata
          .filter(entry => !!names[entry.id])
          .map(entry => ({
            ...entry,
            name: names[entry.id],
            searchKey: normalizeForSearch(names[entry.id])
          }))
      );
    } catch (err) {
      // Le catalogue est un confort : son absence ne doit pas empêcher la saisie
      console.error('Catalogue d\'aliments indisponible', err);
      this.entriesSignal.set([]);
    }
  }
}
