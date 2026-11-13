const fs = require('node:fs');
const { spawn } = require('node:child_process');

// Generate configuration without embedding the TMDB key in an image layer.
fs.mkdirSync('/app/src/environments', { recursive: true });
fs.writeFileSync('/app/src/environments/environment.ts',
  'export const environment = ' + JSON.stringify({
    production: false,
    tmdbApiKey: process.env.TMDB_API_KEY || '',
    apiUrl: 'http://localhost:3000',
  }, null, 2) + ';\n');

const child = spawn(process.argv[2], process.argv.slice(3), { stdio: 'inherit' });
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', (error) => { console.error(error); process.exit(1); });
child.on('exit', (code) => process.exit(code ?? 1));