const prisma = require('./config/prisma');

async function showSettings() {
  const settings = await prisma.systemSetting.findMany();
  console.log('All settings in DB:');
  settings.forEach(s => {
    console.log(`- ${s.key}: "${s.value}"`);
  });
  await prisma.$disconnect();
}

showSettings();
