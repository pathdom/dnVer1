const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: 'localhost', port: 5000, path }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function testAll() {
  try {
    console.log('--- Testing /api/overview ---');
    console.log(await get('/api/overview'));

    console.log('\n--- Testing /api/students ---');
    const studentsRes = await get('/api/students');
    console.log(`Found ${studentsRes.students?.length} students in DB:`, studentsRes.students.slice(0, 2));

    console.log('\n--- Testing /api/employees ---');
    const empRes = await get('/api/employees');
    console.log(`Found ${empRes.employees?.length} employees in DB:`, empRes.employees.slice(0, 2));

    console.log('\n--- Testing /api/staff/overview ---');
    console.log(await get('/api/staff/overview'));
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

testAll();
