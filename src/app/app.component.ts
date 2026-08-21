import { Component } from '@angular/core';
import { LanguageService } from './services/language.service';
import { FoodCatalogService } from './services/food-catalog.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private languageService: LanguageService, private foodCatalogService: FoodCatalogService) {
    this.languageService.init();
    this.foodCatalogService.init();
  }
}
