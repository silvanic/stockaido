/**
 * Script de test du service de migration - À exécuter dans la console du navigateur
 * Copiez/collez ce code dans la console (F12) pour tester
 */

console.log('%c🧪 Test du Service de Migration DatabaseMigrationService', 'color: blue; font-weight: bold; font-size: 14px');
console.log('========================================================\n');

// Étape 1: Créer des données de test dans les anciennes bases
console.log('%c✏️  Étape 1: Création de données de test', 'color: green; font-weight: bold');

const testData = {
  StockIonic: {
    foods: [
      { id: 'f1', name: 'Lait Entier', quantity: 1, unit: 'l', location: 'fridge', createdAt: new Date().toISOString() },
      { id: 'f2', name: 'Pain Complet', quantity: 500, unit: 'g', location: 'pantry', createdAt: new Date().toISOString() }
    ]
  },
  StockIonicLocations: {
    locations: [
      { id: 'l1', name: 'Frigo', createdAt: new Date().toISOString() },
      { id: 'l2', name: 'Cave', createdAt: new Date().toISOString() }
    ]
  },
  StockIonicUnits: {
    units: [
      { id: 'u1', name: 'Cuillère perso', short: 'c.à.s.', createdAt: new Date().toISOString() }
    ]
  },
  StockIonicShoppingList: {
    items: [
      { id: 'i1', name: 'Œufs', checked: false, createdAt: new Date().toISOString() }
    ]
  }
};

// Fonction pour créer les données
async function createTestDatabases() {
  console.log('Création des bases de test...\n');

  for (const [dbName, stores] of Object.entries(testData)) {
    for (const [storeName, items] of Object.entries(stores)) {
      await new Promise((resolve) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);

          items.forEach(item => store.add(item));

          transaction.oncomplete = () => {
            console.log(`✅ ${dbName}: ${items.length} éléments ajoutés`);
            resolve();
          };
        };
      });
    }
  }

  console.log('\n');
}

// Fonction pour lire une base
async function readDatabase(dbName, storeName) {
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => resolve([]);
    };
    request.onerror = () => resolve([]);
  });
}

// Fonction pour vérifier les migrations
async function verifyMigrations() {
  console.log('%c🔍 Étape 2: Vérification des migrations', 'color: green; font-weight: bold');
  console.log('');

  const checks = [
    { old: 'StockIonic', new: 'Stockaido', store: 'foods', label: 'ALIMENTS' },
    { old: 'StockIonicLocations', new: 'StockaidoLocations', store: 'locations', label: 'LIEUX' },
    { old: 'StockIonicUnits', new: 'StockaidoUnits', store: 'units', label: 'UNITÉS' },
    { old: 'StockIonicShoppingList', new: 'StockaidoShoppingList', store: 'items', label: 'ARTICLES' }
  ];

  for (const check of checks) {
    const oldData = await readDatabase(check.old, check.store);
    const newData = await readDatabase(check.new, check.store);

    console.log(`${check.label}:`);
    console.log(`  Ancienne base (${check.old}): ${oldData.length} éléments`);
    console.log(`  Nouvelle base (${check.new}): ${newData.length} éléments`);

    if (oldData.length === newData.length && newData.length > 0) {
      console.log(`  ✅ Migration réussie!\n`);
    } else if (newData.length === 0 && oldData.length > 0) {
      console.log(`  ⏳ Données non encore migrées (migration pas encore exécutée)\n`);
    } else if (newData.length === 0 && oldData.length === 0) {
      console.log(`  ⏩ Pas de données (normal si premières fois)\n`);
    }
  }
}

// Fonction pour nettoyer
async function cleanupDatabases() {
  const dbNames = [
    'StockIonic', 'StockIonicLocations', 'StockIonicUnits', 'StockIonicShoppingList',
    'Stockaido', 'StockaidoLocations', 'StockaidoUnits', 'StockaidoShoppingList'
  ];

  console.log('%c🧹 Étape 3: Nettoyage des bases de test', 'color: green; font-weight: bold');
  console.log('');

  for (const dbName of dbNames) {
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => console.log(`✅ ${dbName} supprimée`);
      request.onerror = () => {};
      request.onblocked = () => {};
      setTimeout(resolve, 100);
    });
  }
}

// Exécution du test
(async () => {
  try {
    await createTestDatabases();
    console.log('%c📝 Données de test créées avec succès!', 'color: blue; font-weight: bold');
    console.log('');
    console.log('%c⏳ La migration devrait être détectée au prochain rechargement de la page.', 'color: orange');
    console.log('%c   Attendez le rechargement et vérifiez les logs...', 'color: orange');
    console.log('');
    console.log('Appuyez sur F5 pour rafraîchir et lancer la migration.');
    console.log('');
    console.log('Après rafraîchissement, vous verrez:');
    console.log('  ✅ "Migration détectée: anciennes données StockIonic trouvées"');
    console.log('  ✅ "Migration: X aliments..."');
    console.log('  ✅ "Migration: X lieux..."');
    console.log('  ✅ "Migration: X unités..."');
    console.log('  ✅ "Migration: X articles..."');
    console.log('  ✅ "✅ Migration StockIonic → Stockaido complétée avec succès"');
    console.log('');
    console.log('Pour nettoyer les données de test: cleanupDatabases()');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
})();
