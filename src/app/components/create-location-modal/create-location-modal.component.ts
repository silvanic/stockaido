import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-create-location-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
  templateUrl: './create-location-modal.component.html',
  styleUrls: ['./create-location-modal.component.scss']
})
export class CreateLocationModalComponent {
  name: string = '';
  loading = false;
  error: string | null = null;

  constructor(
    private locationService: LocationService,
    private modalController: ModalController,
    private translate: TranslateService
  ) {}

  async onSubmit(): Promise<void> {
    if (!this.name.trim()) {
      this.error = this.translate.instant('createLocationModal.nameRequired');
      return;
    }

    try {
      this.loading = true;
      this.error = null;
      const newLocation = await this.locationService.addLocation(this.name);
      this.modalController.dismiss(newLocation, 'confirm');
    } catch (err) {
      this.error = this.translate.instant('createLocationModal.createError');
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  onClose(): void {
    this.modalController.dismiss(null, 'cancel');
  }
}
