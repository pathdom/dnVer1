const { spawn } = require('child_process');

console.log('🚀 Đang khởi chạy hệ thống VietBridge Full-stack (Backend + 3 Frontend Apps)...');

function runProc(name, cmd, args, cwd) {
  const proc = spawn(cmd, args, { cwd: cwd || process.cwd(), shell: true, stdio: 'inherit' });
  proc.on('error', err => console.error(`[${name}] error:`, err));
  return proc;
}

// 1. Start Server Backend
runProc('SERVER', 'node', ['server/index.js']);

// 2. Start Frontend Apps
setTimeout(() => {
  runProc('ADMIN', 'npx', ['vite', '--port', '5173'], 'client-admin');
  runProc('STAFF', 'npx', ['vite', '--port', '5174'], 'client-staff');
  runProc('STUDENT', 'npx', ['vite', '--port', '5175'], 'client-student');
}, 1000);
