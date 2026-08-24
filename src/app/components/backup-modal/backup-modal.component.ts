import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ModalController, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataTransferService } from '../../services/data-transfer.service';

@Component({
  selector: 'app-backup-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
  templateUrl: './backup-modal.component.html',
  styleUrls: ['./backup-modal.component.scss']
})
export class BackupModalComponent {
  importExportError: string | null = null;
  importLoading = false;
  clearLoading = false;

  constructor(
    private dataTransferService: DataTransferService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  onClose(): void {
    this.modalController.dismiss();
  }

  exportData(): void {
    this.dataTransferService.downloadExport();
  }

  async clearAllData(): Promise<void> {
    const confirmed = await this.confirmAction(
      this.translate.instant('backupModal.confirmClearTitle'),
      this.translate.instant('backupModal.confirmClearMessage'),
      this.translate.instant('backupModal.clearAction')
    );
    if (!confirmed) return;

    try {
      this.clearLoading = true;
      this.importExportError = null;
      await this.dataTransferService.clearAllData();
      await this.showToast(this.translate.instant('backupModal.clearSuccess'));
    } catch (err) {
      this.importExportError = err instanceof Error ? err.message : this.translate.instant('backupModal.clearError');
      console.error(err);
    } finally {
      this.clearLoading = false;
    }
  }

  async onImportFileSelected(event: Event): Promise<void> {
    this.importExportError = null;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const confirmed = await this.confirmAction(
      this.translate.instant('backupModal.confirmImportTitle'),
      this.translate.instant('backupModal.confirmImportMessage'),
      this.translate.instant('backupModal.importAction')
    );
    if (!confirmed) {
      input.value = '';
      return;
    }

    try {
      this.importLoading = true;
      const text = await file.text();
      await this.dataTransferService.importFromJson(text);
      await this.showToast(this.translate.instant('backupModal.importSuccess'));
    } catch (err) {
      this.importExportError = err instanceof Error ? err.message : this.translate.instant('backupModal.importError');
      console.error(err);
    } finally {
      this.importLoading = false;
      input.value = '';
    }
  }

  private async confirmAction(header: string, message: string, confirmText: string): Promise<boolean> {
    return new Promise(resolve => {
      this.alertController.create({
        header,
        message,
        buttons: [
          { text: this.translate.instant('common.cancel'), role: 'cancel', handler: () => resolve(false) },
          { text: confirmText, role: 'destructive', handler: () => resolve(true) }
        ]
      }).then(alert => alert.present());
    });
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }
}
