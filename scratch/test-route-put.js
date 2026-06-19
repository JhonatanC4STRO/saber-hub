const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { PUT } = require('../app/api/cursos/[id]/route.js');
const { signToken } = require('../lib/jwt');

async function test() {
  try {
    console.log('Testing route PUT with estado=publicado...');

    // Generate valid instructor token
    const token = await signToken({
      id: 'cmpfuecno000g1wuqczz453pg',
      rol: 'instructor'
    });
    
    // Mock request object
    const req = {
      cookies: {
        get: () => ({ value: token })
      },
      json: async () => ({ estado: 'publicado' })
    };

    // Mock params
    const params = Promise.resolve({ id: 'cmqho47d70002ocuqmkttaywv' });

    const res = await PUT(req, { params });
    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Response body:', data);
  } catch (error) {
    console.error('Exception thrown:', error);
  }
}

test();
