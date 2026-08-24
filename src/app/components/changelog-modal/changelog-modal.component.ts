import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

interface ChangelogVersion {
  version: string;
  date: string;
  items: string[];
}

@Component({
  selector: 'app-changelog-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  templateUrl: './changelog-modal.component.html',
  styleUrls: ['./changelog-modal.component.scss']
})
export class ChangelogModalComponent implements OnInit, OnDestroy {
  versions: ChangelogVersion[] = [];

  private langChangeSub?: Subscription;

  constructor(
    private modalController: ModalController,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadVersions();
    this.langChangeSub = this.translate.onLangChange.subscribe(() => this.loadVersions());
  }

  ngOnDestroy(): void {
    this.langChangeSub?.unsubscribe();
  }

  onClose(): void {
    this.modalController.dismiss();
  }

  private loadVersions(): void {
    this.versions = this.translate.instant('changelogModal.versions');
  }
}
