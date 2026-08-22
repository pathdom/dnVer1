const http = require('http');

const data = JSON.stringify({
  name: 'Trần Văn Hoàng',
  email: 'hoang.tran@gmail.com',
  phone: '0912.888.999',
  hometown: 'Thái Bình',
  country: 'Nhật Bản',
  program: 'N3 + Đi làm',
  statusText: 'Mới tiếp nhận',
  ngayNhapHoc: '2026-10-01',
  tienDaDong: 15000000,
  tongTien: 110000000
});

const req = http.request({
  host: 'localhost',
  port: 5000,
  path: '/api/students',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let responseData = '';
  res.on('data', chunk => responseData += chunk);
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Data:', responseData);
  });
});

req.on('error', err => console.error('Error:', err.message));
req.write(data);
req.end();
