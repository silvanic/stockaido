import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LocationsModalComponent } from '../locations-modal/locations-modal.component';
import { UnitsModalComponent } from '../units-modal/units-modal.component';
import { BackupModalComponent } from '../backup-modal/backup-modal.component';
import { ContactModalComponent } from '../contact-modal/contact-modal.component';
import { ChangelogModalComponent } from '../changelog-modal/changelog-modal.component';
import { LanguageService, AppLanguage } from '../../services/language.service';

@Component({
  selector: 'app-options-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  templateUrl: './options-modal.component.html',
  styleUrls: ['./options-modal.component.scss']
})
export class OptionsModalComponent {
  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private languageService: LanguageService,
    private translate: TranslateService
  ) {}

  onClose(): void {
    this.modalController.dismiss();
  }

  async openLocations(): Promise<void> {
    const modal = await this.modalController.create({ component: LocationsModalComponent });
    await modal.present();
  }

  async openUnits(): Promise<void> {
    const modal = await this.modalController.create({ component: UnitsModalComponent });
    await modal.present();
  }

  async openBackup(): Promise<void> {
    const modal = await this.modalController.create({ component: BackupModalComponent });
    await modal.present();
  }

  async openContact(): Promise<void> {
    const modal = await this.modalController.create({ component: ContactModalComponent });
    await modal.present();
  }

  async openChangelog(): Promise<void> {
    const modal = await this.modalController.create({ component: ChangelogModalComponent });
    await modal.present();
  }

  async openLanguageSelector(): Promise<void> {
    const currentLang = this.languageService.getCurrentLang();

    const alert = await this.alertController.create({
      header: this.translate.instant('language.title'),
      message: this.translate.instant('language.message'),
      inputs: [
        { type: 'radio', label: this.translate.instant('language.fr'), value: 'fr', checked: currentLang === 'fr' },
        { type: 'radio', label: this.translate.instant('language.en'), value: 'en', checked: currentLang === 'en' }
      ],
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('common.confirm'),
          handler: (lang: AppLanguage) => this.languageService.use(lang)
        }
      ]
    });

    await alert.present();
  }
}
