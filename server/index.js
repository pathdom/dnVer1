require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const studentApiRoutes = require('./routes/studentApi');
const staffApiRoutes = require('./routes/staffApi');
const adminApiRoutes = require('./routes/adminApi');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes — mount the more specific /api/admin, /api/student, /api/staff
// routers BEFORE the generic /api one below. Express matches app.use() paths
// by prefix, so a catch-all mounted at '/api' would otherwise intercept every
// request under /api/student/* and /api/staff/* too (its requireAuth middleware
// would 401 them before they ever reached their own router's public /login route).
app.use('/api/admin', adminApiRoutes);
app.use('/api/student', studentApiRoutes);
app.use('/api/staff', staffApiRoutes);
app.use('/api', requireAuth('admin', 'staff'), apiRoutes);

app.get('/', (req, res) => {
  res.json({ message: '🚀 ALADDIN Education API Server is running!' });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🟢 Express Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`==================================================`);
}).on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});
