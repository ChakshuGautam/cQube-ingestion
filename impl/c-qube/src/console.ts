import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CsvAdapterService } from './services/csv-adapter/csv-adapter.service';
import { resetLogs } from './utils/debug';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

async function bootstrap() {
  const application = await NestFactory.createApplicationContext(AppModule);
  resetLogs();

  const command = process.argv[2];
  const debugFlag = process.argv[3].split('=')[1] === 'true';
  process.env['DEBUG'] = debugFlag.toString();
  const csvAdapterService = application.get(CsvAdapterService);

  switch (command) {
    case 'ingest':
      await csvAdapterService.ingest();
      break;
    case 'nuke-db':
      await csvAdapterService.nuke();
      break;
    default:
      console.log('Command not found');
      process.exit(1);
  }

  await application.close();
  process.exit(0);
}

bootstrap();
