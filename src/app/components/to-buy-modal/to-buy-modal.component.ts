import { AfterViewInit, Component, ElementRef, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, IonItemSliding, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FoodService } from '../../services/food.service';
import { UnitService } from '../../services/unit.service';
import { ShoppingListService } from '../../services/shopping-list.service';
import { SwipeHintService } from '../../services/swipe-hint.service';
import { Food } from '../../models/food.model';
import { Unit, UNIT_LABELS } from '../../models/unit.model';
import { AddFoodModalComponent } from '../add-food-modal/add-food-modal.component';

@Component({
  selector: 'app-to-buy-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
  templateUrl: './to-buy-modal.component.html',
  styleUrls: ['./to-buy-modal.component.scss']
})
export class ToBuyModalComponent implements AfterViewInit, OnDestroy {
  toBuyList = this.foodService.toBuyList;
  shoppingList = this.shoppingListService.items;
  newItemName = '';

  @ViewChildren(IonItemSliding) private slidingItems!: QueryList<IonItemSliding>;
  @ViewChildren(IonItemSliding, { read: ElementRef }) private slidingElements!: QueryList<ElementRef<HTMLElement>>;

  private swipeHintTimeouts: ReturnType<typeof setTimeout>[] = [];
  private openSlidingItem: IonItemSliding | null = null;

  constructor(
    private foodService: FoodService,
    private unitService: UnitService,
    private shoppingListService: ShoppingListService,
    private swipeHintService: SwipeHintService,
    private modalController: ModalController,
    private alertController: AlertController,
    private translate: TranslateService
  ) {}

  ngAfterViewInit(): void {
    if (this.shoppingList().length === 0 || !this.swipeHintService.tryClaim()) return;
    this.swipeHintTimeouts.push(setTimeout(() => this.playSwipeHint(), 400));
  }

  ngOnDestroy(): void {
    this.swipeHintTimeouts.forEach(clearTimeout);
    // Filet de sécurité : referme de force si le composant est détruit pendant l'animation
    this.openSlidingItem?.close().catch(() => undefined);
  }

  private async playSwipeHint(): Promise<void> {
    const item = this.slidingItems.first;
    if (!item) return;

    try {
      this.openSlidingItem = item;
      await item.open('end');
      this.swipeHintTimeouts.push(setTimeout(() => this.closeSwipeHint(item), 900));
    } catch (err) {
      console.error('Erreur lors de l\'ouverture de l\'indice de swipe', err);
      this.openSlidingItem = null;
    }
  }

  private async closeSwipeHint(item: IonItemSliding): Promise<void> {
    try {
      await item.close();
    } catch (err) {
      console.error('Erreur lors de la fermeture de l\'indice de swipe', err);
    } finally {
      this.openSlidingItem = null;
    }

    // Filet de sécurité supplémentaire : Ionic nettoie son état interne via un délai fixe de 600ms
    // (voir item-sliding.js) ; si ce n'est toujours pas fait un peu après, on force le nettoyage nous-mêmes
    const element = this.slidingElements.toArray()[this.slidingItems.toArray().indexOf(item)]?.nativeElement;
    if (element) {
      this.swipeHintTimeouts.push(setTimeout(() => this.forceCleanupIfStuck(element), 700));
    }
  }

  // Ne retire que les classes/styles qu'Ionic manipule lui-même (item-sliding.js), rien d'autre
  private forceCleanupIfStuck(host: HTMLElement): void {
    if (!host.classList.contains('item-sliding-active-slide')) return;

    host.classList.remove(
      'item-sliding-active-slide',
      'item-sliding-active-options-end',
      'item-sliding-active-options-start',
      'item-sliding-active-swipe-end',
      'item-sliding-active-swipe-start',
      'item-sliding-closing'
    );
    const innerItem = host.querySelector('ion-item') as HTMLElement | null;
    if (innerItem) innerItem.style.transform = '';
  }

  getUnitLabel(unit: string | undefined): string {
    if (!unit) return 'units.piece';
    return UNIT_LABELS[unit as Unit] ?? this.unitService.getUnitName(unit) ?? unit;
  }

  async addItem(): Promise<void> {
    const trimmed = this.newItemName.trim();
    if (!trimmed) return;

    await this.shoppingListService.addItem(trimmed);
    this.newItemName = '';
  }

  toggleItem(id: string): void {
    this.shoppingListService.toggleChecked(id);
  }

  deleteItem(id: string): void {
    this.shoppingListService.deleteItem(id);
  }

  async clearShoppingList(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translate.instant('common.confirmDeleteTitle'),
      message: this.translate.instant('home.shoppingListClearConfirm'),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('common.delete'),
          role: 'destructive',
          handler: () => this.shoppingListService.clearAll()
        }
      ]
    });

    await alert.present();
  }

  async openEditForm(food: Food): Promise<void> {
    await this.onClose();

    const modal = await this.modalController.create({
      component: AddFoodModalComponent,
      componentProps: { food },
      cssClass: 'add-food-modal'
    });

    await modal.present();
  }

  onClose(): Promise<boolean> {
    return this.modalController.dismiss();
  }
}
