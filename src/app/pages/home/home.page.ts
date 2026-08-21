import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ModalController, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FoodService } from '../../services/food.service';
import { LocationService } from '../../services/location.service';
import { UnitService } from '../../services/unit.service';
import { Food, StorageLocation, STORAGE_LOCATION_LABELS } from '../../models/food.model';
import { Unit, UNIT_LABELS } from '../../models/unit.model';
import { AddFoodModalComponent } from '../../components/add-food-modal/add-food-modal.component';
import { OptionsModalComponent } from '../../components/options-modal/options-modal.component';
import { ToBuyModalComponent } from '../../components/to-buy-modal/to-buy-modal.component';

// En deçà de ce nombre d'aliments, la liste tient sur un écran et la recherche n'apporte rien
const SEARCH_VISIBILITY_THRESHOLD = 6;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
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

  StorageLocation = StorageLocation;
  STORAGE_LOCATION_LABELS = STORAGE_LOCATION_LABELS;
  Unit = Unit;
  UNIT_LABELS = UNIT_LABELS;

  constructor(
    public foodService: FoodService,
    private locationService: LocationService,
    private unitService: UnitService,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController,
    private translate: TranslateService
  ) {}

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
        duration: 1800,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    }
  }

  async toggleFavorite(foodId: string, event: Event): Promise<void> {
    event.stopPropagation();
    await this.foodService.toggleFavorite(foodId);
  }

  async toggleAddForm(): Promise<void> {
    const modal = await this.modalController.create({
      component: AddFoodModalComponent,
      cssClass: 'add-food-modal'
    });

    await modal.present();
  }

  async openEditForm(food: Food): Promise<void> {
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

  getUnitLabel(unit: string | undefined): string {
    if (!unit) return 'units.piece';
    return UNIT_LABELS[unit as Unit] ?? this.unitService.getUnitName(unit) ?? unit;
  }

  getFoodsByLocation(location: string | undefined): Food[] {
    return this.foodService.getFoodsByLocation(location);
  }

  isLowStock(food: Food): boolean {
    return food.minimalStock !== undefined && food.quantity < food.minimalStock;
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
