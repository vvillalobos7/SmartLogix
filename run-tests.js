const { spawnSync } = require('child_process');

const result = spawnSync('npm', ['run', 'test', '--', '--no-watch', '--code-coverage'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true
});

process.exit(result.status);
