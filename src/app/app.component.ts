import { Component } from '@angular/core';
import { LanguageService } from './services/language.service';
import { FoodCatalogService } from './services/food-catalog.service';
import { AppUpdateService } from './services/app-update.service';
import { ThemeService } from './services/theme.service';
import { DatabaseMigrationService } from './services/database-migration.service';

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
    private themeService: ThemeService,
    private databaseMigrationService: DatabaseMigrationService
  ) {
    this.languageService.init();
    this.databaseMigrationService.init(); // Migration des données (silencieuse)
    this.foodCatalogService.init();
    this.appUpdateService.init();
    this.themeService.init();
  }
}
