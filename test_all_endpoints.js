const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';

async function request(path, options = {}) {
  const url = new URL(API_BASE + path);
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 KHAN CLOTHES SYSTEM END-TO-END HEALTH AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name} ${extra ? `(${extra})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('/health');
    assert('API /health endpoint responds', health.status === 200, `status: ${health.status}, env: ${health.body?.environment}`);

    // 2. Authentication Login
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@khanclothes.com', password: 'admin123' }
    });
    const token = loginRes.body?.data?.token;
    assert('Admin login (/auth/login)', loginRes.status === 200 && !!token, `User: ${loginRes.body?.data?.user?.name}`);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Current User Profile
    const meRes = await request('/auth/me', { headers: authHeaders });
    assert('Get current profile (/auth/me)', meRes.status === 200 && meRes.body?.data?.email === 'admin@khanclothes.com');

    // 4. Cities
    const citiesRes = await request('/cities', { headers: authHeaders });
    assert('Fetch Cities (/cities)', citiesRes.status === 200 && Array.isArray(citiesRes.body?.data), `Count: ${citiesRes.body?.data?.length}`);

    // 5. Stuffs
    const stuffsRes = await request('/stuffs', { headers: authHeaders });
    assert('Fetch Stuffs (/stuffs)', stuffsRes.status === 200 && Array.isArray(stuffsRes.body?.data), `Count: ${stuffsRes.body?.data?.length}`);

    // 6. Locations
    const locsRes = await request('/locations', { headers: authHeaders });
    assert('Fetch Locations (/locations)', locsRes.status === 200 && Array.isArray(locsRes.body?.data), `Count: ${locsRes.body?.data?.length}`);

    // 7. Articles
    const articlesRes = await request('/articles', { headers: authHeaders });
    assert('Fetch Articles Catalog (/articles)', articlesRes.status === 200 && Array.isArray(articlesRes.body?.data), `Count: ${articlesRes.body?.data?.length}`);

    // 8. Suppliers
    const suppliersRes = await request('/suppliers', { headers: authHeaders });
    assert('Fetch China Suppliers (/suppliers)', suppliersRes.status === 200 && Array.isArray(suppliersRes.body?.data), `Count: ${suppliersRes.body?.data?.length}`);

    // 9. Customers
    const customersRes = await request('/customers', { headers: authHeaders });
    assert('Fetch Customers / Shopkeepers (/customers)', customersRes.status === 200 && Array.isArray(customersRes.body?.data), `Count: ${customersRes.body?.data?.length}`);

    // 10. Outward
    const outwardRes = await request('/outward', { headers: authHeaders });
    assert('Fetch Outward Dispatches (/outward)', outwardRes.status === 200 && Array.isArray(outwardRes.body?.data), `Count: ${outwardRes.body?.data?.length}`);

    // 11. Purchases
    const purchasesRes = await request('/purchases', { headers: authHeaders });
    assert('Fetch Inward Purchases (/purchases)', purchasesRes.status === 200 && Array.isArray(purchasesRes.body?.data), `Count: ${purchasesRes.body?.data?.length}`);

    // 12. Supplier Payments
    const supPaymentsRes = await request('/payments/supplier', { headers: authHeaders });
    assert('Fetch Supplier TT Payments (/payments/supplier)', supPaymentsRes.status === 200 && Array.isArray(supPaymentsRes.body?.data), `Count: ${supPaymentsRes.body?.data?.length}`);

    // 13. Customer Payments
    const custPaymentsRes = await request('/payments/customer', { headers: authHeaders });
    assert('Fetch Customer Wasooli Payments (/payments/customer)', custPaymentsRes.status === 200 && Array.isArray(custPaymentsRes.body?.data), `Count: ${custPaymentsRes.body?.data?.length}`);

    // 14. Reports Dashboard Metrics
    const reportsRes = await request('/reports/dashboard', { headers: authHeaders });
    assert('Fetch Dashboard Live Metrics (/reports/dashboard)', reportsRes.status === 200 && typeof reportsRes.body?.data === 'object');

    // 15. Detailed Customer Khata Mathematics Audit
    console.log('\n--- 🧮 Checking Customer Khata Balance Mathematics ---');
    const customers = customersRes.body?.data || [];
    let khataMathErrors = 0;
    for (const cust of customers) {
      const remaining = Number(cust.remainingBalance || 0);
      const totalBill = Number(cust.totalBill || 0);
      const totalPaid = Number(cust.totalPaid || 0);
      const calculatedRemaining = totalBill - totalPaid;

      if (remaining !== calculatedRemaining) {
        console.warn(`  ⚠️ Khata mismatch for customer "${cust.shopName}": recorded=${remaining}, calculated=${calculatedRemaining}`);
        khataMathErrors++;
      }
    }
    assert('All Customer Khata Balances match formula (totalBill - totalPaid)', khataMathErrors === 0, `Audited ${customers.length} shopkeepers`);

    // 16. Detailed Supplier Ledger Mathematics Audit
    console.log('\n--- 🧮 Checking Supplier Ledger Balance Mathematics ---');
    const suppliers = suppliersRes.body?.data || [];
    let supplierMathErrors = 0;
    for (const sup of suppliers) {
      const remaining = Number(sup.remainingBalance || 0);
      const totalPurchases = Number(sup.totalPurchases || 0);
      const totalPayments = Number(sup.totalPayments || 0);
      const opening = Number(sup.openingBalance || 0);
      const calculated = (opening + totalPurchases) - totalPayments;

      if (Math.abs(remaining - calculated) > 0.01) {
        console.warn(`  ⚠️ Supplier mismatch for "${sup.company}": recorded=${remaining}, calculated=${calculated}`);
        supplierMathErrors++;
      }
    }
    assert('All China Supplier Balances match formula ((opening + totalPurchases) - totalPayments)', supplierMathErrors === 0, `Audited ${suppliers.length} vendors`);

    // 17. Article Stock Arithmetic Audit
    console.log('\n--- 🧮 Checking Article Inventory Levels ---');
    const articles = articlesRes.body?.data || [];
    let invalidStock = 0;
    for (const art of articles) {
      const stock = Number(art.currentStock);
      if (isNaN(stock)) {
        invalidStock++;
      }
    }
    assert('All Articles have valid numeric stock values', invalidStock === 0, `Audited ${articles.length} articles`);

    console.log('\n====================================================');
    console.log(`📊 FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
    if (failed === 0) {
      console.log('🎉 ALL SYSTEMS 100% OPERATIONAL & READY FOR CLIENT DEPLOYMENT!');
    }
    console.log('====================================================\n');

  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

runTests();
