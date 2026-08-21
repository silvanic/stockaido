import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FoodService } from '../../services/food.service';
import { UnitService } from '../../services/unit.service';
import { Food } from '../../models/food.model';
import { Unit, UNIT_LABELS } from '../../models/unit.model';
import { AddFoodModalComponent } from '../add-food-modal/add-food-modal.component';

@Component({
  selector: 'app-to-buy-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  templateUrl: './to-buy-modal.component.html',
  styleUrls: ['./to-buy-modal.component.scss']
})
export class ToBuyModalComponent {
  toBuyList = this.foodService.toBuyList;

  constructor(
    private foodService: FoodService,
    private unitService: UnitService,
    private modalController: ModalController
  ) {}

  getUnitLabel(unit: string | undefined): string {
    if (!unit) return 'units.piece';
    return UNIT_LABELS[unit as Unit] ?? this.unitService.getUnitName(unit) ?? unit;
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
