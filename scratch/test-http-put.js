const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { signToken } = require('../lib/jwt');

async function run() {
  try {
    const token = await signToken({
      id: 'cmpfuecno000g1wuqczz453pg',
      rol: 'instructor'
    });

    console.log('Sending PUT request to dev server...');
    const res = await fetch('http://localhost:3009/api/cursos/cmqho47d70002ocuqmkttaywv', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify({ estado: 'publicado' })
    });

    console.log('HTTP Status:', res.status);
    const text = await res.text();
    console.log('HTTP Response:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
