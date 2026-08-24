import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ModalController, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LocationService } from '../../services/location.service';
import { STORAGE_LOCATION_LABELS } from '../../models/food.model';

interface OptionItem {
  id: string;
  name: string;
  deletable: boolean;
}

@Component({
  selector: 'app-locations-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
  templateUrl: './locations-modal.component.html',
  styleUrls: ['./locations-modal.component.scss']
})
export class LocationsModalComponent {
  newLocationName = '';
  locationFilter = '';
  locationError: string | null = null;
  locationLoading = false;

  customLocations = this.locationService.locations;

  private readonly defaultLocations: OptionItem[] = Object.entries(STORAGE_LOCATION_LABELS)
    .map(([id, name]) => ({ id, name, deletable: false }));

  get allLocations(): OptionItem[] {
    return [
      ...this.defaultLocations,
      ...this.customLocations().map(loc => ({ id: loc.id, name: loc.name, deletable: true }))
    ].sort((a, b) => this.locationService.getOrderIndex(a.id) - this.locationService.getOrderIndex(b.id));
  }

  get filteredLocations(): OptionItem[] {
    const query = this.locationFilter.trim().toLowerCase();
    if (!query) return this.allLocations;
    return this.allLocations.filter(item => this.translate.instant(item.name).toLowerCase().includes(query));
  }

  constructor(
    private locationService: LocationService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  async addLocation(): Promise<void> {
    const trimmedName = this.newLocationName.trim();
    if (!trimmedName) {
      this.locationError = this.translate.instant('locationsModal.nameRequired');
      return;
    }

    if (this.isDuplicateName(trimmedName)) {
      await this.showToast(this.translate.instant('locationsModal.duplicateName'), 'warning');
      return;
    }

    try {
      this.locationLoading = true;
      this.locationError = null;
      await this.locationService.addLocation(trimmedName);
      this.newLocationName = '';
    } catch (err) {
      this.locationError = this.translate.instant('locationsModal.createError');
      console.error(err);
    } finally {
      this.locationLoading = false;
    }
  }

  // Compare insensible à la casse, y compris avec les lieux par défaut traduits
  private isDuplicateName(name: string): boolean {
    const normalized = name.toLowerCase();
    return this.allLocations.some(loc => this.translate.instant(loc.name).toLowerCase() === normalized);
  }

  async deleteLocation(id: string, name: string): Promise<void> {
    const confirmed = await this.confirmDelete(this.translate.instant('locationsModal.confirmDelete', { name }));
    if (!confirmed) return;

    await this.locationService.deleteLocation(id);
    await this.showToast(this.translate.instant('locationsModal.deleted'), 'success');
  }

  isFirst(id: string): boolean {
    return this.allLocations[0]?.id === id;
  }

  isLast(id: string): boolean {
    return this.allLocations[this.allLocations.length - 1]?.id === id;
  }

  moveUp(id: string): void {
    this.locationService.moveUp(id);
  }

  moveDown(id: string): void {
    this.locationService.moveDown(id);
  }

  onClose(): void {
    this.modalController.dismiss();
  }

  private async confirmDelete(message: string): Promise<boolean> {
    return new Promise(resolve => {
      this.alertController.create({
        header: this.translate.instant('common.confirmDeleteTitle'),
        message,
        buttons: [
          { text: this.translate.instant('common.cancel'), role: 'cancel', handler: () => resolve(false) },
          { text: this.translate.instant('common.delete'), role: 'destructive', handler: () => resolve(true) }
        ]
      }).then(alert => alert.present());
    });
  }

  private async showToast(message: string, color: 'success' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
