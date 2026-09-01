import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BrowserMultiFormatReader } from '@zxing/library';
import { OffFoodService, ExtractedProductData } from '../../services/off-food.service';

interface VideoInputDevice {
  deviceId: string;
  label: string;
}

@Component({
  selector: 'app-barcode-scan-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
  templateUrl: './barcode-scan-modal.component.html',
  styleUrls: ['./barcode-scan-modal.component.scss']
})
export class BarcodeScanModalComponent implements OnInit, AfterViewInit, OnDestroy {
  private videoElement: HTMLVideoElement | null = null;

  // Mode: caméra ou saisie manuelle
  mode: 'camera' | 'manual' = 'camera';
  manualBarcode: string = '';

  scanning: boolean = false;
  error: string | null = null;
  loading: boolean = false;

  private codeReader: BrowserMultiFormatReader | undefined;
  private decodeTimerInterval: ReturnType<typeof setTimeout> | undefined;
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private offFoodService: OffFoodService,
    private modalController: ModalController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Initialiser le lecteur de code-barres
    this.codeReader = new BrowserMultiFormatReader();
  }

  ngAfterViewInit(): void {
    // Demander l'accès à la caméra et démarrer le scan
    // Petit délai pour s'assurer que l'élément vidéo est rendu
    const timeout = setTimeout(() => {
      this.videoElement = document.getElementById('barcode-video-element') as HTMLVideoElement | null;
      if (this.mode === 'camera' && this.videoElement) {
        this.startCamera();
      }
    }, 100);
    this.pendingTimeouts.push(timeout);
  }

  ngOnDestroy(): void {
    this.stopCamera();
    if (this.decodeTimerInterval) {
      clearInterval(this.decodeTimerInterval);
    }
    // Nettoyer tous les timeouts en attente
    this.pendingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.pendingTimeouts = [];
  }

  /**
   * Démarrer l'accès à la caméra et le décodage en continu
   */
  private async startCamera(): Promise<void> {
    if (!this.codeReader || !this.videoElement) {
      console.error('Code reader or video element not initialized');
      this.error = this.translate.instant('barcodeScanModal.cameraAccessDenied');
      this.scanning = false;
      return;
    }

    try {
      this.scanning = true;
      this.error = null;

      // Obtenir la caméra disponible (préférer la caméra arrière)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d): d is MediaDeviceInfo => d.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        this.error = this.translate.instant('barcodeScanModal.noCameraFound');
        this.scanning = false;
        return;
      }

      // Préférer la caméra arrière (environment) si disponible
      const rearCamera = videoDevices.find(d => d.label?.includes('back') || d.label?.includes('rear') || d.label?.includes('environment'));
      const selectedDevice = rearCamera || videoDevices[videoDevices.length - 1]; // Fallback: dernière caméra

      // Vérifier encore une fois que le videoElement est disponible
      if (!this.videoElement) {
        console.error('Video element disappeared before starting camera');
        this.error = this.translate.instant('barcodeScanModal.cameraAccessDenied');
        this.scanning = false;
        return;
      }

      // Démarrer le scan
      await this.codeReader.decodeFromVideoDevice(selectedDevice.deviceId, this.videoElement, (result) => {
        if (result && result.getText()) {
          // Code-barres trouvé!
          this.handleBarcodeDetected(result.getText());
        }
      });
    } catch (error) {
      console.error('Camera error:', error);
      this.error = this.translate.instant('barcodeScanModal.cameraAccessDenied');
      this.scanning = false;
    }
  }

  /**
   * Arrêter la caméra et le décodage
   */
  private stopCamera(): void {
    if (this.codeReader) {
      this.codeReader.reset();
      this.scanning = false;
    }
  }

  /**
   * Traiter un code-barres détecté
   */
  private handleBarcodeDetected(barcode: string): void {
    this.stopCamera();
    this.loading = true;
    this.error = null;

    // Rechercher le produit via l'API OFF
    this.offFoodService.searchByBarcode(barcode).subscribe({
      next: (product) => {
        const productData = this.offFoodService.extractProductData(product);
        this.loading = false;
        
        // Passer les données à la modale et fermer
        this.modalController.dismiss(productData);
      },
      error: (err) => {
        this.loading = false;
        const errorMsg: string = err.message || this.translate.instant('barcodeScanModal.productNotFound');
        
        // If API is down, auto-switch to manual mode
        if (errorMsg.includes('temporarily unavailable')) {
          this.error = errorMsg;
          this.mode = 'manual';
          this.manualBarcode = barcode; // Pre-fill with the scanned code
          return;
        }
        
        this.error = errorMsg;
        // Redémarrer le scan pour une nouvelle tentative
        const timeout = setTimeout(() => {
          this.startCamera();
        }, 300);
        this.pendingTimeouts.push(timeout);
      }
    });
  }

  /**
   * Mode manuel: rechercher un produit par code-barres saisi
   */
  async onManualSearch(): Promise<void> {
    if (!this.manualBarcode.trim()) {
      this.error = this.translate.instant('barcodeScanModal.enterBarcode');
      return;
    }

    this.loading = true;
    this.error = null;

    this.offFoodService.searchByBarcode(this.manualBarcode).subscribe({
      next: (product) => {
        const productData = this.offFoodService.extractProductData(product);
        this.loading = false;
        
        // Passer les données à la modale et fermer
        this.modalController.dismiss(productData);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || this.translate.instant('barcodeScanModal.productNotFound');
      }
    });
  }

  /**
   * Basculer entre mode caméra et mode manuel
   */
  async toggleMode(newMode: 'camera' | 'manual'): Promise<void> {
    if (newMode === this.mode) return;

    this.mode = newMode;
    this.error = null;
    this.manualBarcode = '';

    if (newMode === 'camera') {
      // Délai pour s'assurer que l'élément vidéo est rendu
      const timeout = setTimeout(() => {
        this.videoElement = document.getElementById('barcode-video-element') as HTMLVideoElement | null;
        this.startCamera();
      }, 100);
      this.pendingTimeouts.push(timeout);
    } else {
      this.stopCamera();
    }
  }

  /**
   * Fermer la modale sans résultat
   */
  onCancel(): void {
    this.stopCamera();
    this.modalController.dismiss();
  }
}
