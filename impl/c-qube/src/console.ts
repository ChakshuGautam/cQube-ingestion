import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CsvAdapterService } from './services/csv-adapter/csv-adapter.service';

async function bootstrap() {
  const application = await NestFactory.createApplicationContext(AppModule);

  const command = process.argv[2];
  console.log({ command });
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
