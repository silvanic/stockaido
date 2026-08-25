import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ModalController, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FoodService } from '../../services/food.service';
import { LocationService } from '../../services/location.service';
import { Food, StorageLocation } from '../../models/food.model';
import { AddFoodModalComponent } from '../../components/add-food-modal/add-food-modal.component';
import { OptionsModalComponent } from '../../components/options-modal/options-modal.component';
import { ToBuyModalComponent } from '../../components/to-buy-modal/to-buy-modal.component';
import { LocationSectionComponent } from '../../components/location-section/location-section.component';
import { ThemeService, ThemeMode } from '../../services/theme.service';

// En deçà de ce nombre d'aliments, la liste tient sur un écran et la recherche n'apporte rien
const SEARCH_VISIBILITY_THRESHOLD = 6;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule, LocationSectionComponent],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  searchQuery = '';
  showAddForm = false;

  foodsByLocation = this.foodService.foodsByLocation;
  toBuyList = this.foodService.toBuyList;
  customLocations = this.locationService.locations;
  loading = this.foodService.loading$;
  error = this.foodService.error$;
  searchQuery$ = this.foodService.searchQuery$;

  showSearch = computed(() => this.foodService.foods$().length >= SEARCH_VISIBILITY_THRESHOLD);

  themeMode = this.themeService.mode;

  private static readonly THEMES: Record<string, string> = {
    light: 'sunny-outline',
    dark: 'moon-outline'
  };

  StorageLocation = StorageLocation;

  constructor(
    public foodService: FoodService,
    private locationService: LocationService,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController,
    private translate: TranslateService,
    private themeService: ThemeService
  ) {}

  themeIcon(): string {
    return HomePage.THEMES[this.themeMode()];
  }

  themeToggleAriaLabel(): string {
    const modeLabel = this.translate.instant(`home.theme.${this.themeMode()}`);
    return this.translate.instant('home.themeToggleAria', { mode: modeLabel });
  }

  cycleTheme(): void {
    this.themeService.cycle();
  }

  onSearchChange(query: string): void {
    this.foodService.setSearchQuery(query);
  }

  async incrementQuantity(foodId: string): Promise<void> {
    await this.foodService.incrementQuantity(foodId);
  }

  async decrementQuantity(foodId: string): Promise<void> {
    await this.foodService.decrementQuantity(foodId);
  }

  async deleteFood(foodId: string): Promise<void> {
    const confirm = await this.showConfirm(this.translate.instant('home.confirmDeleteFood'));
    if (confirm) {
      await this.foodService.deleteFood(foodId);
      const toast = await this.toastController.create({
        message: this.translate.instant('home.foodDeleted'),
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    }
  }

  async toggleFavorite(foodId: string): Promise<void> {
    await this.foodService.toggleFavorite(foodId);
  }

  async toggleAddForm(): Promise<void> {
    const modal = await this.modalController.create({
      component: AddFoodModalComponent,
      cssClass: 'add-food-modal'
    });

    await modal.present();
  }

  async openEditForm(food: Food, event?: Event): Promise<void> {
    // La barre espace fait défiler la page par défaut sur un élément focusable non natif
    event?.preventDefault();
    const modal = await this.modalController.create({
      component: AddFoodModalComponent,
      componentProps: { food },
      cssClass: 'add-food-modal'
    });

    await modal.present();
  }

  async openOptionsModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: OptionsModalComponent
    });

    await modal.present();
  }

  async openToBuyModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: ToBuyModalComponent
    });

    await modal.present();
  }

  getLocationLabel(location: string | undefined): string {
    if (!location) return this.foodService.getLocationLabel(undefined);
    return this.locationService.getLocationName(location) ?? this.foodService.getLocationLabel(location);
  }

  // Groupes de lieux non vides, triés selon l'ordre défini dans la popin Lieux de rangement
  getLocationGroups(): { id: string | undefined; label: string; foods: Food[] }[] {
    const locationIds: (string | undefined)[] = [
      StorageLocation.FRIDGE,
      StorageLocation.FREEZER,
      StorageLocation.PANTRY,
      StorageLocation.OTHER,
      undefined,
      ...this.customLocations().map(loc => loc.id)
    ];

    return locationIds
      .map(id => ({ id, label: this.getLocationLabel(id), foods: this.getFoodsByLocation(id) }))
      .filter(group => group.foods.length > 0)
      .sort((a, b) => this.locationService.getOrderIndex(a.id ?? '') - this.locationService.getOrderIndex(b.id ?? ''));
  }

  toBuyAriaLabel(): string {
    const count = this.toBuyList().length;
    return this.translate.instant('home.toBuy');    return this.translate.instant('home.toBuyAria', { label: this.translate.instant('home.toBuy'), count });
  }

  getFoodsByLocation(location: string | undefined): Food[] {
    return this.foodService.getFoodsByLocation(location);
  }

  // Clé stable pour que *ngFor réutilise les instances de LocationSectionComponent (sinon leur état replié/déplié est perdu à chaque cycle)
  trackByLocationId(_index: number, group: { id: string | undefined }): string {
    return group.id ?? 'no-location';
  }

  hasVisibleFoods(): boolean {
    const grouped = this.foodsByLocation();
    return Object.values(grouped).some(foods => foods.length > 0);
  }

  private async showConfirm(message: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      const alert = await this.alertController.create({
        message,
        buttons: [
          { text: this.translate.instant('common.cancel'), role: 'cancel', handler: () => resolve(false) },
          { text: this.translate.instant('common.delete'), role: 'destructive', handler: () => resolve(true) }
        ]
      });
      await alert.present();
    });
  }
}
