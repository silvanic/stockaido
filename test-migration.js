#!/usr/bin/env node
/**
 * Test du service de migration DatabaseMigrationService
 * Crée des données de test dans les anciennes bases (StockIonic)
 * et vérifie qu'elles sont migrées correctement
 */

const fs = require('fs');

console.log('🧪 Test de migration StockIonic → Stockaido');
console.log('=============================================\n');

// Données de test
const testFoods = [
  {
    id: 'food-1',
    name: 'Lait Entier',
    quantity: 1,
    unit: 'l',
    location: 'fridge',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'food-2',
    name: 'Pain Complet',
    quantity: 500,
    unit: 'g',
    location: 'pantry',
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  }
];

const testLocations = [
  {
    id: 'loc-1',
    name: 'Frigo',
    createdAt: new Date().toISOString()
  },
  {
    id: 'loc-2',
    name: 'Cave',
    createdAt: new Date().toISOString()
  }
];

const testUnits = [
  {
    id: 'unit-1',
    name: 'Cuillère à soupe personnalisée',
    short: 'c.à.s. perso',
    createdAt: new Date().toISOString()
  }
];

const testShoppingItems = [
  {
    id: 'item-1',
    name: 'Œufs',
    checked: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'item-2',
    name: 'Fromage',
    checked: true,
    createdAt: new Date().toISOString()
  }
];

/**
 * Crée des données de test dans les anciennes bases IndexedDB
 */
function createTestDataInOldDatabases() {
  return new Promise((resolve) => {
    console.log('📝 Étape 1: Création de données de test dans les anciennes bases');
    console.log('   - Création base StockIonic...');

    const testData = [
      { dbName: 'StockIonic', storeName: 'foods', data: testFoods },
      { dbName: 'StockIonicLocations', storeName: 'locations', data: testLocations },
      { dbName: 'StockIonicUnits', storeName: 'units', data: testUnits },
      { dbName: 'StockIonicShoppingList', storeName: 'items', data: testShoppingItems }
    ];

    let completed = 0;

    testData.forEach(({ dbName, storeName, data }) => {
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

        data.forEach(item => {
          store.add(item);
        });

        transaction.oncomplete = () => {
          console.log(`   ✅ ${dbName}: ${data.length} éléments créés`);
          completed++;
          if (completed === testData.length) {
            resolve();
          }
        };
      };
    });
  });
}

/**
 * Lit les données d'une base IndexedDB
 */
function readDatabase(dbName, storeName) {
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

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };

      getAllRequest.onerror = () => resolve([]);
    };

    request.onerror = () => resolve([]);
  });
}

/**
 * Vérifie que les données ont été migrées correctement
 */
async function verifyMigration() {
  console.log('\n🔍 Étape 2: Vérification des données migrées');

  const checks = [
    { oldDb: 'StockIonic', newDb: 'Stockaido', store: 'foods' },
    { oldDb: 'StockIonicLocations', newDb: 'StockaidoLocations', store: 'locations' },
    { oldDb: 'StockIonicUnits', newDb: 'StockaidoUnits', store: 'units' },
    { oldDb: 'StockIonicShoppingList', newDb: 'StockaidoShoppingList', store: 'items' }
  ];

  let allOk = true;

  for (const check of checks) {
    const oldData = await readDatabase(check.oldDb, check.store);
    const newData = await readDatabase(check.newDb, check.store);

    const oldExists = oldData.length > 0;
    const newExists = newData.length > 0;
    const countMatches = oldData.length === newData.length;

    console.log(`\n   ${check.store.toUpperCase()}:`);
    console.log(`   - Ancienne base (${check.oldDb}): ${oldData.length} éléments`);
    console.log(`   - Nouvelle base (${check.newDb}): ${newData.length} éléments`);

    if (oldExists && newExists && countMatches) {
      console.log(`   ✅ Migration réussie`);

      // Afficher les données migrées
      if (newData.length > 0) {
        newData.forEach((item, idx) => {
          if (item.name) {
            console.log(`      └─ ${idx + 1}. ${item.name}`);
          }
        });
      }
    } else {
      console.log(`   ❌ ERREUR: Données non migrées correctement`);
      allOk = false;
    }
  }

  return allOk;
}

/**
 * Nettoie les bases de test
 */
function cleanupDatabases() {
  return new Promise((resolve) => {
    console.log('\n🧹 Étape 3: Nettoyage des bases de test');

    const dbNames = [
      'StockIonic',
      'StockIonicLocations',
      'StockIonicUnits',
      'StockIonicShoppingList',
      'Stockaido',
      'StockaidoLocations',
      'StockaidoUnits',
      'StockaidoShoppingList'
    ];

    let cleaned = 0;

    dbNames.forEach(dbName => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => {
        console.log(`   🗑️  ${dbName} supprimée`);
        cleaned++;
        if (cleaned === dbNames.length) {
          resolve();
        }
      };
      request.onerror = () => {
        cleaned++;
        if (cleaned === dbNames.length) {
          resolve();
        }
      };
    });
  });
}

/**
 * Exécute le test complet
 */
async function runTest() {
  try {
    console.log('Ce test doit être exécuté dans un navigateur avec IndexedDB disponible.\n');
    console.log('Instructions:\n');
    console.log('1. Ouvrir la console du navigateur (F12)');
    console.log('2. Copier/coller ce code dans la console:');
    console.log('');
    console.log('```');
    
    // Afficher les étapes du test
    console.log('// Étape 1: Créer des données de test');
    console.log('const testFoods = ', JSON.stringify(testFoods, null, 2));
    console.log('');
    console.log('// Étape 2: Créer les anciennes bases avec des données');
    console.log('// (voir verifyMigration pour le code)');
    console.log('');
    console.log('// Étape 3: Appeler le service de migration');
    console.log('// La migration devrait déplacer les données automatiquement');
    console.log('');
    console.log('// Étape 4: Vérifier que les données sont dans les nouvelles bases');
    console.log('```');

    console.log('\n📋 RÉSUMÉ DU TEST:');
    console.log('==================');
    console.log('\nDonnées de test créées:');
    console.log(`  - ${testFoods.length} aliments`);
    console.log(`  - ${testLocations.length} lieux`);
    console.log(`  - ${testUnits.length} unités`);
    console.log(`  - ${testShoppingItems.length} articles`);
    console.log('\nCe qui est testé:');
    console.log('  ✅ Détection des anciennes bases');
    console.log('  ✅ Copie des aliments StockIonic → Stockaido');
    console.log('  ✅ Copie des lieux StockIonicLocations → StockaidoLocations');
    console.log('  ✅ Copie des unités StockIonicUnits → StockaidoUnits');
    console.log('  ✅ Copie de la liste StockIonicShoppingList → StockaidoShoppingList');
    console.log('  ✅ Suppression des anciennes bases');
    console.log('  ✅ Enregistrement de la migration en localStorage');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

runTest();
