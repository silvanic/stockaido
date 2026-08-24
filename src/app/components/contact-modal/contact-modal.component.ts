import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FeedbackService } from '../../services/feedback.service';

const MAX_MESSAGE_LENGTH = 2000;

@Component({
  selector: 'app-contact-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
  templateUrl: './contact-modal.component.html',
  styleUrls: ['./contact-modal.component.scss']
})
export class ContactModalComponent {
  readonly maxMessageLength = MAX_MESSAGE_LENGTH;

  message = '';
  email = '';
  contactError: string | null = null;
  sendLoading = false;
  sent = false;

  constructor(
    private feedbackService: FeedbackService,
    private modalController: ModalController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  onClose(): void {
    this.modalController.dismiss();
  }

  async send(): Promise<void> {
    const trimmedMessage = this.message.trim();
    if (!trimmedMessage) {
      this.contactError = this.translate.instant('contactModal.messageRequired');
      return;
    }

    try {
      this.sendLoading = true;
      this.contactError = null;
      await this.feedbackService.send({ message: trimmedMessage, email: this.email.trim() || undefined });
      this.sent = true;
      this.message = '';
      this.email = '';
      await this.showToast(this.translate.instant('contactModal.sent'));
    } catch (err) {
      this.contactError = this.translate.instant('contactModal.sendError');
      console.error(err);
    } finally {
      this.sendLoading = false;
    }
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
