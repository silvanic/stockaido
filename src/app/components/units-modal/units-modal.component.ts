import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ModalController, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UnitService } from '../../services/unit.service';
import { UNIT_LABELS, UNIT_SHORTS } from '../../models/unit.model';

interface OptionItem {
  id: string;
  name: string;
  short?: string;
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
  newUnitShort = '';
  unitFilter = '';
  unitError: string | null = null;
  unitLoading = false;

  // État pour le mode édition
  editingId: string | null = null;
  editingName = '';
  editingShort = '';

  customUnits = this.unitService.units;

  private readonly defaultUnits: OptionItem[] = Object.entries(UNIT_LABELS)
    .map(([id, name]) => ({ 
      id, 
      name, 
      short: UNIT_SHORTS[id as keyof typeof UNIT_SHORTS],
      deletable: false 
    }));

  get allUnits(): OptionItem[] {
    return [
      ...this.defaultUnits,
      ...this.customUnits().map(unit => ({ 
        id: unit.id, 
        name: unit.name, 
        short: unit.short,
        deletable: true 
      }))
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
      await this.unitService.addUnit(trimmedName, this.newUnitShort || undefined);
      this.newUnitName = '';
      this.newUnitShort = '';
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

  startEditing(unit: OptionItem): void {
    if (!unit.deletable) return; // Impossible d'éditer les unités par défaut
    this.editingId = unit.id;
    this.editingName = unit.name;
    this.editingShort = unit.short || '';
    this.unitError = null;
  }

  cancelEditing(): void {
    this.editingId = null;
    this.editingName = '';
    this.editingShort = '';
    this.unitError = null;
  }

  async saveEditing(): Promise<void> {
    if (!this.editingId) return;

    const trimmedName = this.editingName.trim();
    if (!trimmedName) {
      this.unitError = this.translate.instant('unitsModal.nameRequired');
      return;
    }

    // Vérifier les doublons (en excluant l'unité en cours d'édition)
    const isDuplicate = this.allUnits.some(unit => 
      unit.id !== this.editingId && 
      this.translate.instant(unit.name).toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      await this.showToast(this.translate.instant('unitsModal.duplicateName'), 'warning');
      return;
    }

    try {
      this.unitLoading = true;
      this.unitError = null;
      await this.unitService.updateUnit(this.editingId, trimmedName, this.editingShort || undefined);
      await this.showToast(this.translate.instant('unitsModal.updated'), 'success');
      this.cancelEditing();
    } catch (err) {
      this.unitError = this.translate.instant('unitsModal.updateError');
      console.error(err);
    } finally {
      this.unitLoading = false;
    }
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
