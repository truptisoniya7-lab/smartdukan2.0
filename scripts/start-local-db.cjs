const EmbeddedPostgres = require('embedded-postgres').default;
const path = require('node:path');
const fs = require('node:fs');

async function run() {
  const dbDir = path.resolve(__dirname, '..', '.pgdata');
  const isInitialised = fs.existsSync(path.join(dbDir, 'PG_VERSION'));

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    port: 5432,
    user: 'postgres',
    password: 'password123',
    persistent: true,
    initdbFlags: ['-E', 'UTF8', '--locale=C'],
  });

  if (!isInitialised) {
    console.log('[Local DB] Initialising PostgreSQL cluster with UTF8 encoding...');
    await pg.initialise();
  }

  const pidFile = path.join(dbDir, 'postmaster.pid');
  if (fs.existsSync(pidFile)) {
    try {
      fs.unlinkSync(pidFile);
      console.log('[Local DB] Cleaned up stale postmaster.pid');
    } catch (e) {
      console.warn('[Local DB] Warning: could not remove postmaster.pid', e);
    }
  }

  console.log('[Local DB] Starting PostgreSQL on port 5432...');
  await pg.start();
  console.log('[Local DB] PostgreSQL started!');

  try {
    await pg.createDatabase('smartdukan');
    console.log('[Local DB] Created "smartdukan" database.');
  } catch (err) {
    // Database already exists
  }

  console.log('[Local DB] PostgreSQL is READY at postgresql://postgres:password123@localhost:5432/smartdukan');

  const shutdown = async () => {
    console.log('[Local DB] Stopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep process alive
  setInterval(() => {}, 10000);
}

run().catch((err) => {
  console.error('[Local DB] Fatal error:', err);
  process.exit(1);
});
