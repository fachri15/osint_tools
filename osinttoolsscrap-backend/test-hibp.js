// HIBP Integration Test Utility
// Menjalankan uji coba HIBP API v3 langsung ke endpoint resmi
const { getBreachesForAccount, getPastesForAccount } = require('./services/hibpService');

async function runTest() {
  console.log('=== HIBP v3 API Test (BreachesForAccount) ===');
  const testAccount = 'account-exists@hibp-integration-tests.com';
  console.log(`Menguji akun uji coba resmi HIBP: ${testAccount}`);
  
  const result = await getBreachesForAccount(testAccount);
  console.log('Status HTTP:', result.status);
  console.log('Pwned status:', result.isPwned);
  console.log('Jumlah breach terdeteksi:', result.count);
  if (result.breaches && result.breaches.length > 0) {
    console.log('Detail breach pertama:', {
      name: result.breaches[0].name,
      title: result.breaches[0].title,
      domain: result.breaches[0].domain,
      breachDate: result.breaches[0].breachDate,
      pwnCount: result.breaches[0].pwnCount,
      dataClasses: result.breaches[0].dataClasses,
      severity: result.breaches[0].severity,
    });
  }
}

runTest();

