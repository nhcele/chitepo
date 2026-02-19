#!/usr/bin/env ts-node
/**
 * Standalone script to update DCC Training course lesson content from markdown
 * 
 * Usage:
 *   npm run ts-node backend/src/database/seeds/scripts/update-dcc-content.ts
 *   OR
 *   ts-node backend/src/database/seeds/scripts/update-dcc-content.ts
 */

import 'dotenv/config';
import { DataSource } from 'typeorm';
import { populateDCCTrainingContent } from './populate-dcc-content';

async function main() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || '3306');
  const username = process.env.DATABASE_USERNAME || 'root';
  const password = process.env.DATABASE_PASSWORD || 'password';
  const database = process.env.DATABASE_NAME || 'mindelta';

  console.log('Connecting to database...', { host, port, username, database });

  const dataSource = new DataSource({
    type: 'mysql',
    host,
    port,
    username,
    password,
    database,
    entities: [__dirname + '/../../../**/*.entity{.ts,.js}'],
    synchronize: false,
    charset: 'utf8mb4',
    timezone: 'Z',
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    await populateDCCTrainingContent(dataSource);

    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

main();

