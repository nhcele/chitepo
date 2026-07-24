// PM2 process definitions for the Chitepo LMS (native deploy, no Docker).
//
//   Start:    pm2 start deploy/ecosystem.config.js && pm2 save
//   Restart:  pm2 restart chitepo-backend chitepo-frontend
//   Logs:     pm2 logs chitepo-backend
//
// Both apps listen only on 127.0.0.1 — Apache proxies public traffic to them,
// so nothing here is exposed to the internet directly.

const path = require('path');
const ROOT = path.resolve(__dirname, '..');

module.exports = {
  apps: [
    {
      name: 'chitepo-backend',
      cwd: path.join(ROOT, 'backend'),
      script: 'dist/main.js',           // built by `npm run build`
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: '4001',                   // change if 4001 is taken; match Apache + no other use
      },
      max_memory_restart: '700M',
      error_file: path.join(ROOT, 'logs', 'backend-error.log'),
      out_file: path.join(ROOT, 'logs', 'backend-out.log'),
      time: true,
    },
    {
      name: 'chitepo-frontend',
      cwd: path.join(ROOT, 'frontend'),
      script: path.join(ROOT, 'frontend', 'node_modules', 'next', 'dist', 'bin', 'next'),
      args: 'start -H 127.0.0.1 -p 4000',  // change 4000 if taken; match Apache
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '700M',
      error_file: path.join(ROOT, 'logs', 'frontend-error.log'),
      out_file: path.join(ROOT, 'logs', 'frontend-out.log'),
      time: true,
    },
  ],
};
