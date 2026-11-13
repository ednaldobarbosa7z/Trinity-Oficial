const path = require('node:path');
const { spawnSync } = require('node:child_process');
const result = spawnSync(
  process.execPath,
  [require.resolve('@playwright/test/cli'), ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    windowsHide: true,
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH:
        process.env.PLAYWRIGHT_BROWSERS_PATH || path.resolve(__dirname, '../.cache/ms-playwright'),
    },
  },
);
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
