import { Injectable, NgZone } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Propose à l'utilisateur de recharger l'application quand le service worker
 * a téléchargé une nouvelle version.
 */
@Injectable({
  providedIn: 'root'
})
export class AppUpdateService {
  constructor(
    private swUpdate: SwUpdate,
    private toastController: ToastController,
    private translate: TranslateService,
    private zone: NgZone
  ) {}

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => void this.promptReload());

    // Une session PWA peut rester ouverte des jours sans jamais recharger la page.
    // Hors zone Angular : un interval suivi par zone.js empêcherait l'application
    // de devenir stable, et donc retarderait l'enregistrement du service worker.
    this.zone.runOutsideAngular(() => {
      setInterval(() => void this.checkForUpdate(), UPDATE_CHECK_INTERVAL_MS);
    });
  }

  private async checkForUpdate(): Promise<void> {
    try {
      await this.swUpdate.checkForUpdate();
    } catch (err) {
      console.error(err);
    }
  }

  private async promptReload(): Promise<void> {
    const toast = await this.toastController.create({
      message: this.translate.instant('update.available'),
      position: 'bottom',
      color: 'primary',
      buttons: [
        {
          text: this.translate.instant('update.reload'),
          handler: () => {
            void this.activateUpdate();
          }
        },
        { text: this.translate.instant('common.close'), role: 'cancel' }
      ]
    });
    await toast.present();
  }

  private async activateUpdate(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
      document.location.reload();
    } catch (err) {
      console.error(err);
    }
  }
}
