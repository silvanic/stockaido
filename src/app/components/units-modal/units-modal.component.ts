import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ModalController, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UnitService } from '../../services/unit.service';
import { UNIT_LABELS } from '../../models/unit.model';

interface OptionItem {
  id: string;
  name: string;
  deletable: boolean;
}

@Component({
  selector: 'app-units-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
  templateUrl: './units-modal.component.html',
  styleUrls: ['./units-modal.component.scss']
})
export class UnitsModalComponent {
  newUnitName = '';
  unitFilter = '';
  unitError: string | null = null;
  unitLoading = false;

  customUnits = this.unitService.units;

  private readonly defaultUnits: OptionItem[] = Object.entries(UNIT_LABELS)
    .map(([id, name]) => ({ id, name, deletable: false }));

  get allUnits(): OptionItem[] {
    return [
      ...this.defaultUnits,
      ...this.customUnits().map(unit => ({ id: unit.id, name: unit.name, deletable: true }))
    ];
  }

  get filteredUnits(): OptionItem[] {
    const query = this.unitFilter.trim().toLowerCase();
    if (!query) return this.allUnits;
    return this.allUnits.filter(item => this.translate.instant(item.name).toLowerCase().includes(query));
  }

  constructor(
    private unitService: UnitService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  async addUnit(): Promise<void> {
    const trimmedName = this.newUnitName.trim();
    if (!trimmedName) {
      this.unitError = this.translate.instant('unitsModal.nameRequired');
      return;
    }

    if (this.isDuplicateName(trimmedName)) {
      await this.showToast(this.translate.instant('unitsModal.duplicateName'), 'warning');
      return;
    }

    try {
      this.unitLoading = true;
      this.unitError = null;
      await this.unitService.addUnit(trimmedName);
      this.newUnitName = '';
    } catch (err) {
      this.unitError = this.translate.instant('unitsModal.createError');
      console.error(err);
    } finally {
      this.unitLoading = false;
    }
  }

  // Compare insensible à la casse, y compris avec les unités par défaut traduites
  private isDuplicateName(name: string): boolean {
    const normalized = name.toLowerCase();
    return this.allUnits.some(unit => this.translate.instant(unit.name).toLowerCase() === normalized);
  }

  async deleteUnit(id: string, name: string): Promise<void> {
    const confirmed = await this.confirmDelete(this.translate.instant('unitsModal.confirmDelete', { name }));
    if (!confirmed) return;

    await this.unitService.deleteUnit(id);
    await this.showToast(this.translate.instant('unitsModal.deleted'), 'success');
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
