const { getAllBreaches, searchBreachesCatalog, getBreachByName } = require('./services/modules/breachAudit');

async function test() {
  console.log('Testing getAllBreaches()...');
  const all = await getAllBreaches();
  console.log('Total catalog entries:', all.length);

  console.log('\nTesting search for "Tokopedia"...');
  const toko = await searchBreachesCatalog('Tokopedia');
  console.log('Tokopedia found:', toko.length, toko.map(t => ({ name: t.name, title: t.title, domain: t.domain })));

  console.log('\nTesting search by domain "canva.com"...');
  const canva = await getAllBreaches({ domain: 'canva.com' });
  console.log('Canva domain found:', canva.length, canva.map(c => ({ name: c.name, title: c.title })));

  console.log('\nTesting getBreachByName("Adobe")...');
  const adobe = await getBreachByName('Adobe');
  console.log('Adobe found:', adobe ? adobe.title : 'None');
}

test().catch(console.error);
