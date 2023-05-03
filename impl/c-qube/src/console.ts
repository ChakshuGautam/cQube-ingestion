import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CsvAdapterService } from './services/csv-adapter/csv-adapter.service';
import { resetLogs } from './utils/debug';
import {
  intro,
  outro,
  confirm,
  select,
  spinner,
  isCancel,
  cancel,
  text,
} from '@clack/prompts';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

async function bootstrap() {
  const application = await NestFactory.createApplicationContext(AppModule);
  const csvAdapterService = application.get(CsvAdapterService);
  resetLogs();

  // const command = process.argv[2];
  // // only if third argument is passed
  // let debugFlag = false;
  // if (process.argv[3]) {
  //   debugFlag = process.argv[3].split('=')[1] === 'true';
  // }
  // process.env['DEBUG'] = debugFlag.toString();

  // switch (command) {
  //   case 'ingest':
  //     intro(`Starting Ingestion Process`);
  //     await csvAdapterService.ingest();
  //     outro(`You're all set!`);
  //     break;
  //   case 'ingest-data':
  //     intro(`Starting Data Ingestion Process`);
  //     await csvAdapterService.ingestData();
  //     outro(`You're all set!`);
  //     break;
  //   case 'nuke-db':
  //     await csvAdapterService.nuke();
  //     break;
  //   default:
  //     console.log('Command not found');
  //     process.exit(1);
  // }

  // await application.close();
  // process.exit(0);

  yargs(hideBin(process.argv))
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      default: false,
      describe: 'Enable debug mode',
    })
    .command('ingest', 'Starting Ingestion Process', {}, async (argv) => {
      process.env['DEBUG'] = argv.debug.toString();
      intro(`Starting Ingestion Process`);
      await csvAdapterService.ingest();
      outro(`You're all set!`);
      await application.close();
      process.exit(0);
    })
    .command(
      'ingest-data',
      'Starting Data Ingestion Process',
      {},
      async (argv) => {
        process.env['DEBUG'] = argv.debug.toString();
        intro(`Starting Data Ingestion Process`);
        const ingestionFolder = './ingest';
        const ingestConfigFileName = 'config.json';
        await csvAdapterService.ingestData({}); //Ingest all datasets
        // await csvAdapterService.ingestData({
        //   name: 'infra', //ingest ones with the word "infra" in the name
        // });
        outro(`You're all set!`);
        await application.close();
        process.exit(0);
      },
    )
    .command('nuke-db', 'Nuke the database', {}, async (argv) => {
      process.env['DEBUG'] = argv.debug.toString();
      await csvAdapterService.nuke();
      await application.close();
      process.exit(0);
    })
    .command(
      'ingest-test',
      'Starting Data Ingestion Process',
      {},
      async (argv) => {
        process.env['DEBUG'] = argv.debug.toString();
        intro(`Starting Data Ingestion Process`);
        const ingestionFolder = './test/fixtures/ingestionConfigs';
        const ingestConfigFileName = 'config.test.json';
        await csvAdapterService.ingest(ingestionFolder, ingestConfigFileName);
        await csvAdapterService.ingestData({});
        outro(`You're all set!`);
        await application.close();
        process.exit(0);
      },
    )
    .command('nuke-datasets', 'Nuke the datasets', {}, async (argv) => {
      process.env['DEBUG'] = argv.debug.toString();
      await csvAdapterService.nukeDatasets();
      await application.close();
      process.exit(0);
    })
    .demandCommand(1, 'Please provide a valid command')
    .help()
    .version()
    .strict()
    .parse();
}

bootstrap();
