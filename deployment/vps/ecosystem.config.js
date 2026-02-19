// PM2 Ecosystem Configuration for Chitepo Project
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'chitepo-backend',
      cwd: '/chitepo/backend',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/chitepo/logs/backend-error.log',
      out_file: '/chitepo/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log']
    },
    {
      name: 'chitepo-frontend',
      cwd: '/chitepo/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/chitepo/logs/frontend-error.log',
      out_file: '/chitepo/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log', '.next']
    }
  ]
};

