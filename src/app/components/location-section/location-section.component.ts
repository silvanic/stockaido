import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Food } from '../../models/food.model';
import { Unit, UNIT_LABELS } from '../../models/unit.model';
import { UnitService } from '../../services/unit.service';

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
export class LocationSectionComponent {
  @Input({ required: true }) group!: LocationGroup;
  // Pendant une recherche active, la section reste dépliée pour ne pas cacher les résultats
  @Input() searchActive = false;

  @Output() editFood = new EventEmitter<Food>();
  @Output() toggleFavoriteFood = new EventEmitter<string>();
  @Output() incrementFood = new EventEmitter<string>();
  @Output() decrementFood = new EventEmitter<string>();
  @Output() deleteFood = new EventEmitter<string>();

  private collapsed = false;

  constructor(
    private translate: TranslateService,
    private unitService: UnitService
  ) {}

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
