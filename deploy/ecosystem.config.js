// PM2 process definitions for the Chitepo LMS (native deploy, no Docker).
//
//   Start:    pm2 start deploy/ecosystem.config.js && pm2 save
//   Restart:  pm2 restart chitepo-backend chitepo-frontend
//   Logs:     pm2 logs chitepo-backend
//
// Both apps listen only on 127.0.0.1 — Apache proxies public traffic to them,
// so nothing here is exposed to the internet directly.

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

// Resolve a bin path from wherever npm put it (workspaces hoist to root node_modules).
function resolveBin(rel) {
  const cands = [path.join(ROOT, 'node_modules', rel), path.join(ROOT, 'frontend', 'node_modules', rel)];
  for (const c of cands) { try { fs.accessSync(c); return c; } catch (e) {} }
  return cands[0];
}

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
      script: resolveBin('next/dist/bin/next'),
      args: 'start -H 127.0.0.1 -p 4000',  // change 4000 if taken; match Apache
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_BASE_PATH: '/chitepo',
        NEXT_PUBLIC_API_URL: '/chitepo',
      },
      max_memory_restart: '700M',
      error_file: path.join(ROOT, 'logs', 'frontend-error.log'),
      out_file: path.join(ROOT, 'logs', 'frontend-out.log'),
      time: true,
    },
  ],
};
