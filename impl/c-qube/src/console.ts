import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CsvAdapterService } from './services/csv-adapter/csv-adapter.service';
import { resetLogs } from './utils/debug';
import { intro, outro } from '@clack/prompts';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { DeleteService } from './services/delete/delete.service';

async function bootstrap() {
  const application = await NestFactory.createApplicationContext(AppModule);
  const csvAdapterService = application.get(CsvAdapterService);
  const deleteService = application.get(DeleteService);
  resetLogs();

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
      (yargs) => {
        yargs.option('filter', {
          alias: 'f',
          type: 'string',
          default: 'none',
          describe: 'Filter datasets to ingest',
        });
      },
      async (argv) => {
        process.env['DEBUG'] = argv.debug.toString();
        // intro(`Starting Data Ingestion Process`);
        const filter = argv.filter;

        if (filter === 'none') {
          await csvAdapterService.ingestData({});
        } else {
          await csvAdapterService.ingestData({
            name: filter,
          });
        }
        // outro(`You're all set!`);
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
      'nuke-datasets',
      'Nuke the datasets',
      (yargs) => {
        yargs.option('filter', {
          alias: 'f',
          type: 'string',
          default: 'none',
          describe: 'Filter datasets to ingest',
        });
      },
      async (argv) => {
        process.env['DEBUG'] = argv.debug.toString();
        const filter = argv.filter;

        if (filter === 'none') {
          await csvAdapterService.nukeDatasets({});
        } else {
          await csvAdapterService.nukeDatasets({
            name: filter,
          });
        }
        await application.close();
        process.exit(0);
      },
    )
    .command(
      'delete',
      'Delete the datarows',
      (yargs) => {
        yargs.option('filter', {
          alias: 'f',
          type: 'string',
          default: 'none',
          describe: 'Filter datasets to ingest',
        });
      },
      async (argv) => {
        process.env['DEBUG'] = argv.debug.toString();
        await deleteService.processDeletion();
        await application.close();
        process.exit(0);
      },
    )
    .command(
      'update',
      'Update the datarows',
      (yargs) => {
        yargs.option('filter', {
          alias: 'f',
          type: 'string',
          default: 'none',
          describe: 'Filter datasets to ingest',
        });
      },
      async (argv) => {
        process.env['DEBUG'] = argv.debug.toString();
        await deleteService.deleteData(
          './test/fixtures/test-csvs/update-diff/studentsmarked-update.data.csv',
          './test/fixtures/test-csvs/update-diff/studentsmarked-ingested.data.csv',
          './test/fixtures/test-csvs/update-diff/studentsmarked-event.grammar.csv',
          'sch_att_students_',
        );
        await application.close();
        process.exit(0);
      },
    )
    .demandCommand(1, 'Please provide a valid command')
    .help()
    .version()
    .strict()
    .parse();
}

bootstrap();
