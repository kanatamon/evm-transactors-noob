import { PrismaClient } from '@prisma/client';
import sybilConfig from '../sybils.config';
import { getDocs } from '../src/db';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await Promise.all([
    prisma.activity.deleteMany({}),
    prisma.sybil.deleteMany({}),
  ]);

  const newSybils = getDocs(sybilConfig.storage.fileName);
  for (const wallet of newSybils) {
    await prisma.sybil.create({
      data: {
        pk: wallet.pk,
        address: wallet.address,
        groupName: wallet.sheetName,
      },
    });
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
