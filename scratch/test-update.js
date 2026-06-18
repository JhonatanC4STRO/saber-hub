require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const prisma = require('../lib/prisma').default;

async function test() {
  try {
    const id = 'cmqho47d70002ocuqmkttaywv';
    console.log('Testing update for course:', id);
    const res = await prisma.curso.update({
      where: { id },
      data: {
        estado: 'borrador'
      }
    });
    console.log('Success!', res);
  } catch (error) {
    console.error('Error during update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
