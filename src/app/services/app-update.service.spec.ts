import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { AppUpdateService } from './app-update.service';

describe('AppUpdateService', () => {
  let versionUpdates: Subject<VersionEvent>;
  let swUpdate: { isEnabled: boolean; versionUpdates: Subject<VersionEvent>; checkForUpdate: jasmine.Spy; activateUpdate: jasmine.Spy };
  let toastController: jasmine.SpyObj<ToastController>;
  let toast: { present: jasmine.Spy };

  const versionReady = {
    type: 'VERSION_READY',
    currentVersion: { hash: 'abc' },
    latestVersion: { hash: 'def' }
  } as VersionEvent;

  const createService = (isEnabled: boolean): AppUpdateService => {
    versionUpdates = new Subject<VersionEvent>();
    swUpdate = {
      isEnabled,
      versionUpdates,
      checkForUpdate: jasmine.createSpy('checkForUpdate').and.resolveTo(false),
      activateUpdate: jasmine.createSpy('activateUpdate').and.resolveTo(true)
    };
    toast = { present: jasmine.createSpy('present').and.resolveTo() };
    toastController = jasmine.createSpyObj<ToastController>('ToastController', ['create']);
    toastController.create.and.resolveTo(toast as never);

    TestBed.configureTestingModule({
      providers: [
        AppUpdateService,
        { provide: SwUpdate, useValue: swUpdate },
        { provide: ToastController, useValue: toastController },
        { provide: TranslateService, useValue: { instant: (key: string) => key } }
      ]
    });

    return TestBed.inject(AppUpdateService);
  };

  it('propose de recharger quand une nouvelle version est prête', async () => {
    const service = createService(true);
    service.init();

    versionUpdates.next(versionReady);
    await Promise.resolve();

    expect(toastController.create).toHaveBeenCalled();
    const options = toastController.create.calls.mostRecent().args[0]!;
    expect(options.message).toBe('update.available');
    expect(options.duration).toBeUndefined();
    expect(options.buttons?.length).toBe(2);
  });

  it('active la mise à jour quand l\'utilisateur accepte', async () => {
    const service = createService(true);
    // Promesse jamais résolue : évite le document.location.reload() qui suit, interdit sous Karma.
    swUpdate.activateUpdate.and.returnValue(new Promise<boolean>(() => undefined));
    service.init();

    versionUpdates.next(versionReady);
    await Promise.resolve();

    const [reloadButton] = toastController.create.calls.mostRecent().args[0]!.buttons as { handler: () => void }[];
    reloadButton.handler();

    expect(swUpdate.activateUpdate).toHaveBeenCalled();
  });

  it('ignore les évènements autres que VERSION_READY', async () => {
    const service = createService(true);
    service.init();

    versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'def' } } as VersionEvent);
    await Promise.resolve();

    expect(toastController.create).not.toHaveBeenCalled();
  });

  it('ne fait rien si le service worker est désactivé', () => {
    const service = createService(false);
    service.init();

    versionUpdates.next(versionReady);

    expect(toastController.create).not.toHaveBeenCalled();
  });

  it('planifie la vérification périodique hors de la zone Angular', () => {
    const service = createService(true);
    const zone = TestBed.inject(NgZone);
    spyOn(zone, 'runOutsideAngular').and.callThrough();

    service.init();

    expect(zone.runOutsideAngular).toHaveBeenCalled();
  });
});
