const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const studentApiRoutes = require('./routes/studentApi');
const staffApiRoutes = require('./routes/staffApi');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);
app.use('/api/student', studentApiRoutes);
app.use('/api/staff', staffApiRoutes);

app.get('/', (req, res) => {
  res.json({ message: '🚀 VietBridge Education API Server is running!' });
});

// Graceful port error handling
const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🟢 Express Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`==================================================`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const ALT_PORT = Number(PORT) + 1;
    console.warn(`⚠️ Port ${PORT} đang được sử dụng, tự động chuyển sang port ${ALT_PORT}...`);
    app.listen(ALT_PORT, () => {
      console.log(`🟢 Express Server đang chạy tại: http://localhost:${ALT_PORT}`);
    });
  } else {
    console.error('❌ Server error:', err);
  }
});
