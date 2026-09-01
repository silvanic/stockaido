#!/usr/bin/env node
/**
 * Test script for barcode scanner functionality
 * Tests 20 products with Open Food Facts API v3
 */

const https = require('https');

const BARCODES = [
  { code: '5000112126619', name: 'Coca-Cola 500ml' },
  { code: '5449000050127', name: 'Coca-Cola 1.5L' },
  { code: '5449000214397', name: 'Fanta Orange 1.5L' },
  { code: '5449000136660', name: 'Sprite 1.5L' },
  { code: '3017624010701', name: 'Nutella 400g' },
  { code: '7613035101841', name: 'Nescafé Classic 200g' },
  { code: '8718214521604', name: "Lay's Chips 35g" },
  { code: '4056489822345', name: 'Milka Chocolate 100g' },
  { code: '5065300161074', name: 'Hobnobs 300g' },
  { code: '8718321394627', name: 'Heinz Soup 400g' },
  { code: '5410188004196', name: 'Danone Yogurt 125g' },
  { code: '5435597010119', name: 'Perrier 750ml' },
  { code: '3046920008777', name: 'Muller Yogurt 135g' },
  { code: '5449000075853', name: 'Fanta Lemon 1.5L' },
  { code: '8710447055707', name: 'Effi Chocolate 200g' },
  { code: '4006381001234', name: 'Haribo Gummies 100g' },
  { code: '5060382820381', name: 'Branston Beans 415g' },
  { code: '3023290015500', name: 'Actimel 100ml' },
  { code: '5449000111111', name: 'Minute Maid 200ml' },
  { code: '5010052013463', name: 'PG Tips Tea Bags' }
];

const API_BASE = 'https://world.openfoodfacts.org/api/v3';

function searchBarcode(barcode) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/product/${barcode}`;
    https.get(url, {
      headers: {
        'User-Agent': 'StockaidoApp/1.6 (+https://github.com/)'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ barcode, statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ barcode, statusCode: res.statusCode, error: 'JSON parse error', data });
        }
      });
    }).on('error', err => {
      resolve({ barcode, error: err.message });
    });
  });
}

async function runTests() {
  console.log('Testing Barcode Scanner with Open Food Facts API v3');
  console.log('=====================================================\n');
  console.log(`Testing ${BARCODES.length} products...\n`);

  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;
  const results = [];

  for (let i = 0; i < BARCODES.length; i++) {
    const { code, name } = BARCODES[i];
    process.stdout.write(`[${i + 1}/${BARCODES.length}] Testing ${name} (${code})... `);

    try {
      const result = await searchBarcode(code);
      
      if (result.error) {
        console.log('❌ NETWORK ERROR');
        errorCount++;
        results.push({
          ...result,
          name,
          status: 'ERROR'
        });
      } else if (result.statusCode === 200 && result.data.product) {
        const product = result.data.product;
        const productName = product.product_name || 'Unknown';
        const brands = product.brands || 'Unknown';
        const quantity = product.quantity || 'Unknown';
        
        console.log('✅ FOUND');
        successCount++;
        results.push({
          barcode: code,
          name,
          status: 'SUCCESS',
          productName,
          brands,
          quantity
        });
      } else if (result.statusCode === 404) {
        console.log('⚠️  NOT FOUND');
        notFoundCount++;
        results.push({
          barcode: code,
          name,
          status: 'NOT_FOUND'
        });
      } else {
        console.log(`❌ HTTP ${result.statusCode}`);
        errorCount++;
        results.push({
          barcode: code,
          name,
          status: 'HTTP_ERROR',
          statusCode: result.statusCode
        });
      }
    } catch (err) {
      console.log('❌ EXCEPTION');
      errorCount++;
      results.push({
        barcode: code,
        name,
        status: 'EXCEPTION',
        error: err.message
      });
    }

    // Rate limiting - wait a bit between requests
    if (i < BARCODES.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Summary
  console.log('\n\nTest Summary');
  console.log('=============');
  console.log(`✅ Found: ${successCount}/${BARCODES.length} (${Math.round(successCount/BARCODES.length*100)}%)`);
  console.log(`⚠️  Not found: ${notFoundCount}/${BARCODES.length} (${Math.round(notFoundCount/BARCODES.length*100)}%)`);
  console.log(`❌ Errors: ${errorCount}/${BARCODES.length} (${Math.round(errorCount/BARCODES.length*100)}%)`);

  console.log('\n\nDetailed Results');
  console.log('=================');
  results.forEach((r, idx) => {
    console.log(`\n${idx + 1}. ${r.name} (${r.barcode})`);
    console.log(`   Status: ${r.status}`);
    if (r.productName) {
      console.log(`   Product: ${r.productName}`);
      console.log(`   Brands: ${r.brands}`);
      console.log(`   Quantity: ${r.quantity}`);
    }
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
  });
}

runTests().catch(console.error);
