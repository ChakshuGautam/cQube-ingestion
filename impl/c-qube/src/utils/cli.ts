import yargs, { Arguments } from 'yargs';
import { hideBin } from 'yargs/helpers';

export function parseArguments(): any {
  return yargs(hideBin(process.argv))
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      default: false,
      describe: 'Enable debug mode',
    })
    .command('ingest', 'Starting Ingestion Process')
    .command('ingest-data', 'Starting Data Ingestion Process')
    .command('nuke-db', 'Nuke the database')
    .demandCommand(1, 'Please provide a valid command')
    .help()
    .version()
    .strict()
    .parse();
}

// async function bootstrap(argv: Arguments) {
//   const application = await NestFactory.createApplicationContext(AppModule);
//   resetLogs();

//   const command = argv._[0];
//   process.env['DEBUG'] = argv.debug.toString();
//   const csvAdapterService = application.get(CsvAdapterService);

//   switch (command) {
//     case 'ingest':
//       intro(`Starting Ingestion Process`);
//       await csvAdapterService.ingest();
//       outro(`You're all set!`);
//       break;
//     case 'ingest-data':
//       intro(`Starting Data Ingestion Process`);
//       await csvAdapterService.ingestData();
//       outro(`You're all set!`);
//       break;
//     case 'nuke-db':
//       await csvAdapterService.nuke();
//       break;
//     default:
//       console.log('Command not found');
//       process.exit(1);
//   }

//   await application.close();
//   process.exit(0);
// }

// const argv = parseArguments();
// bootstrap(argv);
