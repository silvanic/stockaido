import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonItemSliding } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ExpiryStatus, Food, getExpiryStatus } from '../../models/food.model';
import { Unit, UNIT_LABELS } from '../../models/unit.model';
import { UnitService } from '../../services/unit.service';
import { SwipeHintService } from '../../services/swipe-hint.service';

export interface LocationGroup {
  id: string | undefined;
  label: string;
  foods: Food[];
}

/**
 * Section repliable listant les aliments d'un lieu de rangement (accordéon maison).
 */
@Component({
  selector: 'app-location-section',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  templateUrl: './location-section.component.html',
  styleUrls: ['./location-section.component.scss']
})
export class LocationSectionComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) group!: LocationGroup;
  // Pendant une recherche active, la section reste dépliée pour ne pas cacher les résultats
  @Input() searchActive = false;

  @Output() editFood = new EventEmitter<Food>();
  @Output() toggleFavoriteFood = new EventEmitter<string>();
  @Output() incrementFood = new EventEmitter<string>();
  @Output() decrementFood = new EventEmitter<string>();
  @Output() deleteFood = new EventEmitter<string>();

  @ViewChildren(IonItemSliding) private slidingItems!: QueryList<IonItemSliding>;
  @ViewChildren(IonItemSliding, { read: ElementRef }) private slidingElements!: QueryList<ElementRef<HTMLElement>>;

  private swipeHintTimeouts: ReturnType<typeof setTimeout>[] = [];
  private openSlidingItem: IonItemSliding | null = null;

  private collapsed = false;

  constructor(
    private translate: TranslateService,
    private unitService: UnitService,
    private swipeHintService: SwipeHintService
  ) {}

  ngAfterViewInit(): void {
    if (this.group.foods.length === 0 || !this.swipeHintService.tryClaim()) return;
    // Délai pour laisser les web components Ionic finir leur rendu avant l'animation
    this.swipeHintTimeouts.push(setTimeout(() => this.playSwipeHint(), 400));
  }

  ngOnDestroy(): void {
    this.swipeHintTimeouts.forEach(clearTimeout);
    // Filet de sécurité : referme de force si le composant est détruit pendant l'animation
    this.openSlidingItem?.close().catch(() => undefined);
  }

  private async playSwipeHint(): Promise<void> {
    const item = this.slidingItems.first;
    if (!item) return;

    try {
      this.openSlidingItem = item;
      await item.open('end');
      this.swipeHintTimeouts.push(setTimeout(() => this.closeSwipeHint(item), 900));
    } catch (err) {
      console.error('Erreur lors de l\'ouverture de l\'indice de swipe', err);
      this.openSlidingItem = null;
    }
  }

  private async closeSwipeHint(item: IonItemSliding): Promise<void> {
    try {
      await item.close();
    } catch (err) {
      console.error('Erreur lors de la fermeture de l\'indice de swipe', err);
    } finally {
      this.openSlidingItem = null;
    }

    // Filet de sécurité supplémentaire : Ionic nettoie son état interne via un délai fixe de 600ms
    // (voir item-sliding.js) ; si ce n'est toujours pas fait un peu après, on force le nettoyage nous-mêmes
    const element = this.slidingElements.toArray()[this.slidingItems.toArray().indexOf(item)]?.nativeElement;
    if (element) {
      this.swipeHintTimeouts.push(setTimeout(() => this.forceCleanupIfStuck(element), 700));
    }
  }

  // Ne retire que les classes/styles qu'Ionic manipule lui-même (item-sliding.js), rien d'autre
  private forceCleanupIfStuck(host: HTMLElement): void {
    if (!host.classList.contains('item-sliding-active-slide')) return;

    host.classList.remove(
      'item-sliding-active-slide',
      'item-sliding-active-options-end',
      'item-sliding-active-options-start',
      'item-sliding-active-swipe-end',
      'item-sliding-active-swipe-start',
      'item-sliding-closing'
    );
    const innerItem = host.querySelector('ion-item') as HTMLElement | null;
    if (innerItem) innerItem.style.transform = '';
  }

  isCollapsed(): boolean {
    return !this.searchActive && this.collapsed;
  }

  toggleSection(): void {
    this.collapsed = !this.collapsed;
  }

  getUnitLabel(unit: string | undefined): string {
    if (!unit) return 'units.piece';
    return UNIT_LABELS[unit as Unit] ?? this.unitService.getUnitName(unit) ?? unit;
  }

  isLowStock(food: Food): boolean {
    return food.minimalStock !== undefined && food.quantity < food.minimalStock;
  }

  expiryStatus(food: Food): ExpiryStatus | undefined {
    return getExpiryStatus(food);
  }

  expiryAriaLabel(food: Food): string {
    const status = this.expiryStatus(food);
    return status ? this.translate.instant(`home.expiry.${status}`) : '';
  }

  editFoodAriaLabel(food: Food): string {
    return this.translate.instant('home.editFoodAria', { name: food.name });
  }

  incrementAriaLabel(food: Food): string {
    const unit = this.translate.instant(this.getUnitLabel(food.unit));
    return this.translate.instant('home.incrementAria', { name: food.name, step: food.step ?? 1, unit });
  }

  decrementAriaLabel(food: Food): string {
    const unit = this.translate.instant(this.getUnitLabel(food.unit));
    return this.translate.instant('home.decrementAria', { name: food.name, step: food.step ?? 1, unit });
  }

  onEdit(food: Food, event?: Event): void {
    // La barre espace fait défiler la page par défaut sur un élément focusable non natif
    event?.preventDefault();
    this.editFood.emit(food);
  }

  onToggleFavorite(food: Food, event: Event): void {
    event.stopPropagation();
    this.toggleFavoriteFood.emit(food.id);
  }
}
