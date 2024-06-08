import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function isToday(date: Date): boolean {
  return new Date().getUTCDate() === date.getUTCDate();
}

async function main(): Promise<void> {
  const latest = await prisma.activity.findFirst({
    orderBy: {
      timestamp: 'desc',
    },
  });
  if (!latest || !isToday(latest.timestamp)) {
    await prisma.activity.deleteMany({});
    console.log('Activities are cleared.');
  } else {
    console.log('Activities are up-to-date.');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
