import { Injectable } from '@angular/core';

const STORAGE_KEY = 'stockionic-swipe-hint-seen';

/**
 * Coordonne l'affichage unique (dans la vie de l'app) de l'indice de découverte
 * du geste swipe-to-delete, quel que soit l'écran où l'utilisateur le rencontre en premier.
 */
@Injectable({
  providedIn: 'root'
})
export class SwipeHintService {
  private claimedInSession = false;

  /**
   * Retourne true uniquement pour le tout premier appelant (jamais revu ensuite)
   */
  tryClaim(): boolean {
    if (this.claimedInSession || localStorage.getItem(STORAGE_KEY)) return false;

    this.claimedInSession = true;
    localStorage.setItem(STORAGE_KEY, 'true');
    return true;
  }
}
