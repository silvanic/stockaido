import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ModalController, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FoodService } from '../../services/food.service';
import { LocationService } from '../../services/location.service';
import { UnitService } from '../../services/unit.service';
import { FoodCatalogService } from '../../services/food-catalog.service';
import { CreateFoodDTO, Food, StorageLocation, STORAGE_LOCATION_LABELS } from '../../models/food.model';
import { NameSuggestion } from '../../models/food-catalog.model';
import { normalizeForSearch } from '../../shared/text-normalization';
import { Unit, UNIT_LABELS } from '../../models/unit.model';
import { CreateLocationModalComponent } from '../create-location-modal/create-location-modal.component';

@Component({
  selector: 'app-add-food-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
  templateUrl: './add-food-modal.component.html',
  styleUrls: ['./add-food-modal.component.scss']
})
export class AddFoodModalComponent implements OnInit {
  @Input() food: Food | undefined; // Si fourni, la popin passe en mode édition
  @Output() closeModal = new EventEmitter<void>();
  @Output() foodAdded = new EventEmitter<void>();

  // Form data
  name: string = '';
  quantity: number = 1;
  unit: string | undefined = Unit.PIECE;
  location: string | undefined = StorageLocation.FRIDGE;
  minimalStock: number | undefined;
  step: number = 1;
  notes: string = '';
  isFavorite: boolean = false;
  imageUrl: string | undefined;

  loading = false;
  error: string | null = null;
  imageError: string | null = null;

  // Autocomplete sur le nom (aliments déjà enregistrés + catalogue de référence)
  nameSuggestions: NameSuggestion[] = [];
  showSuggestions = false;
  private static readonly MAX_NAME_SUGGESTIONS = 6;

  private static readonly MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
  private static readonly MAX_IMAGE_DIMENSION = 512; // px, côté le plus grand après redimensionnement
  private static readonly IMAGE_JPEG_QUALITY = 0.8;

  StorageLocation = StorageLocation;
  STORAGE_LOCATION_LABELS = STORAGE_LOCATION_LABELS;
  Unit = Unit;
  UNIT_LABELS = UNIT_LABELS;

  constructor(
    private foodService: FoodService,
    private locationService: LocationService,
    private unitService: UnitService,
    private foodCatalogService: FoodCatalogService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  get isEditMode(): boolean {
    return !!this.food;
  }

  get isLowStock(): boolean {
    return !!this.food && this.food.minimalStock !== undefined && this.food.quantity < this.food.minimalStock;
  }

  get customLocations() {
    return this.locationService.locations();
  }

  get customUnits() {
    return this.unitService.units();
  }

  // Lieux où un aliment portant le même nom existe déjà (pour éviter les doublons)
  get duplicateLocationNames(): string[] {
    const query = this.name.trim().toLowerCase();
    if (!query) return [];
    return this.foodService.foods$()
      .filter(f => f.name.trim().toLowerCase() === query && f.id !== this.food?.id)
      .map(f => f.location)
      .filter((loc): loc is string => !!loc);
  }

  get isLocationDuplicate(): boolean {
    return !!this.location && this.duplicateLocationNames.includes(this.location);
  }

  ngOnInit(): void {
    if (this.food) {
      this.name = this.food.name;
      this.quantity = this.food.quantity;
      this.unit = this.food.unit;
      this.location = this.food.location;
      this.minimalStock = this.food.minimalStock;
      this.step = this.food.step ?? 1;
      this.notes = this.food.notes ?? '';
      this.isFavorite = this.food.isFavorite ?? false;
      this.imageUrl = this.food.imageUrl;
    }
  }

  async onImageSelected(event: Event): Promise<void> {
    this.imageError = null;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.imageError = this.translate.instant('foodModal.imageInvalidType');
      input.value = '';
      return;
    }

    if (file.size > AddFoodModalComponent.MAX_IMAGE_SIZE_BYTES) {
      this.imageError = this.translate.instant('foodModal.imageTooLarge');
      input.value = '';
      return;
    }

    try {
      this.imageUrl = await this.resizeImageToDataUrl(file);
    } catch (err) {
      this.imageError = this.translate.instant('foodModal.imageReadError');
      console.error(err);
    } finally {
      input.value = '';
    }
  }

  removeImage(): void {
    this.imageUrl = undefined;
    this.imageError = null;
  }

  // Redimensionne et compresse l'image côté client pour limiter la taille stockée en IndexedDB
  private resizeImageToDataUrl(file: File): Promise<string> {
    const maxDim = AddFoodModalComponent.MAX_IMAGE_DIMENSION;
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas non supporté'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', AddFoodModalComponent.IMAGE_JPEG_QUALITY));
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image invalide'));
      };

      img.src = objectUrl;
    });
  }

  // Filtre les suggestions de noms : aliments déjà enregistrés d'abord, puis catalogue de référence
  onNameInput(): void {
    const query = normalizeForSearch(this.name);
    if (!query) {
      this.nameSuggestions = [];
      this.showSuggestions = false;
      return;
    }

    const seen = new Set<string>();
    const suggestions: NameSuggestion[] = [];

    for (const food of this.foodService.foods$()) {
      if (suggestions.length >= AddFoodModalComponent.MAX_NAME_SUGGESTIONS) break;
      const key = normalizeForSearch(food.name);
      if (key === query || !key.includes(query) || seen.has(key)) continue;
      seen.add(key);
      suggestions.push({ name: food.name, unit: food.unit, step: food.step, fromCatalog: false });
    }

    const remaining = AddFoodModalComponent.MAX_NAME_SUGGESTIONS - suggestions.length;
    for (const entry of this.foodCatalogService.search(query, remaining, seen)) {
      suggestions.push({
        name: entry.name,
        unit: entry.unit,
        location: entry.location,
        fromCatalog: true
      });
    }

    this.nameSuggestions = suggestions;
    this.showSuggestions = suggestions.length > 0;
  }

  // Reprend le nom et les valeurs par défaut de la suggestion pour simplifier la saisie
  selectSuggestion(suggestion: NameSuggestion): void {
    this.name = suggestion.name;
    if (!this.isEditMode) {
      if (suggestion.unit) this.unit = suggestion.unit;
      if (suggestion.fromCatalog) {
        if (suggestion.location) this.location = suggestion.location;
      } else {
        this.step = suggestion.step ?? 1;
      }
    }
    this.showSuggestions = false;
  }

  // Délai pour laisser le temps au clic sur une suggestion de se déclencher avant la perte de focus
  hideSuggestionsDelayed(): void {
    setTimeout(() => (this.showSuggestions = false), 150);
  }

  async openCreateLocationModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: CreateLocationModalComponent
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm' && data) {
      this.location = data.id;
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.name.trim()) {
      this.error = this.translate.instant('foodModal.nameRequired');
      return;
    }

    if (this.quantity <= 0) {
      this.error = this.translate.instant('foodModal.quantityInvalid');
      return;
    }

    if (this.isLocationDuplicate) {
      this.error = this.translate.instant('foodModal.duplicateLocation');
      return;
    }

    try {
      this.loading = true;
      this.error = null;

      const data: CreateFoodDTO = {
        name: this.name.trim(),
        quantity: this.quantity,
        unit: this.unit,
        location: this.location,
        minimalStock: this.minimalStock,
        step: this.step > 0 ? this.step : 1,
        isFavorite: this.isFavorite,
        notes: this.notes.trim() || undefined,
        imageUrl: this.imageUrl
      };

      if (this.food) {
        await this.foodService.updateFood(this.food.id, data);
        await this.showToast(this.translate.instant('foodModal.foodUpdated'), 'success');
      } else {
        await this.foodService.addFood(data);
        await this.showToast(this.translate.instant('foodModal.foodAdded'), 'success');
      }
      this.foodAdded.emit();
      this.resetForm();
      this.onClose();
    } catch (err) {
      this.error = this.food ? this.translate.instant('foodModal.editError') : this.translate.instant('foodModal.addError');
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  onClose(): void {
    this.closeModal.emit();
    this.modalController.dismiss();
  }

  async onDelete(): Promise<void> {
    if (!this.food) return;

    const alert = await this.alertController.create({
      header: this.translate.instant('foodModal.confirmDeleteTitle'),
      message: this.translate.instant('foodModal.confirmDeleteMessage', { name: this.food.name }),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('common.delete'),
          role: 'destructive',
          handler: async () => {
            try {
              this.loading = true;
              await this.foodService.deleteFood(this.food!.id);
              await this.showToast(this.translate.instant('foodModal.foodDeleted'), 'danger');
              this.onClose();
            } catch (err) {
              this.error = this.translate.instant('foodModal.deleteError');
              console.error(err);
            } finally {
              this.loading = false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  private resetForm(): void {
    this.name = '';
    this.quantity = 1;
    this.unit = Unit.PIECE;
    this.location = StorageLocation.FRIDGE;
    this.minimalStock = undefined;
    this.step = 1;
    this.notes = '';
    this.isFavorite = false;
    this.imageUrl = undefined;
    this.imageError = null;
    this.error = null;
  }
}
