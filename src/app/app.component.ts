import { Component } from '@angular/core';
import { LanguageService } from './services/language.service';
import { FoodCatalogService } from './services/food-catalog.service';
import { AppUpdateService } from './services/app-update.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private languageService: LanguageService,
    private foodCatalogService: FoodCatalogService,
    private appUpdateService: AppUpdateService,
    private themeService: ThemeService
  ) {
    // DatabaseMigrationService est initialisé via APP_INITIALIZER dans app.module
    this.languageService.init();
    this.foodCatalogService.init();
    this.appUpdateService.init();
    this.themeService.init();
  }
}
