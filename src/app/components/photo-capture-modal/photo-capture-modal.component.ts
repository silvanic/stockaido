import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-photo-capture-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  templateUrl: './photo-capture-modal.component.html',
  styleUrls: ['./photo-capture-modal.component.scss']
})
export class PhotoCaptureModalComponent implements OnInit, AfterViewInit, OnDestroy {
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;

  scanning: boolean = false;
  error: string | null = null;
  loading: boolean = false;

  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private modalController: ModalController,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Demander l'accès à la caméra
    const timeout = setTimeout(() => {
      this.videoElement = document.getElementById('photo-video-element') as HTMLVideoElement | null;
      if (this.videoElement) {
        this.startCamera();
      }
    }, 100);
    this.pendingTimeouts.push(timeout);
  }

  ngOnDestroy(): void {
    this.stopCamera();
    // Nettoyer tous les timeouts en attente
    this.pendingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.pendingTimeouts = [];
  }

  /**
   * Démarrer l'accès à la caméra
   */
  private async startCamera(): Promise<void> {
    if (!this.videoElement) {
      console.error('Video element not initialized');
      this.error = this.translate.instant('photoCaptureModal.cameraAccessDenied');
      this.scanning = false;
      return;
    }

    try {
      this.scanning = true;
      this.error = null;

      // Demander la caméra (préférer la caméra arrière)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;

      // S'assurer que la vidéo est en lecture
      this.videoElement.play().catch(err => {
        console.error('Error playing video:', err);
        this.error = this.translate.instant('photoCaptureModal.cameraAccessDenied');
        this.scanning = false;
      });
    } catch (error) {
      console.error('Camera error:', error);
      this.error = this.translate.instant('photoCaptureModal.cameraAccessDenied');
      this.scanning = false;
    }
  }

  /**
   * Arrêter la caméra
   */
  private stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.scanning = false;
  }

  /**
   * Capturer une photo depuis le flux vidéo
   */
  async capturePhoto(): Promise<void> {
    if (!this.videoElement) return;

    try {
      this.loading = true;

      // Créer un canvas et y dessiner le frame vidéo
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        this.error = this.translate.instant('photoCaptureModal.captureError');
        this.loading = false;
        return;
      }

      ctx.drawImage(this.videoElement, 0, 0);

      // Convertir en dataURL avec compression JPEG
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);

      this.loading = false;

      // Passer la photo au parent et fermer le modal
      this.modalController.dismiss(photoDataUrl);
    } catch (error) {
      console.error('Photo capture error:', error);
      this.error = this.translate.instant('photoCaptureModal.captureError');
      this.loading = false;
    }
  }

  /**
   * Annuler et fermer le modal
   */
  onCancel(): void {
    this.modalController.dismiss();
  }
}
