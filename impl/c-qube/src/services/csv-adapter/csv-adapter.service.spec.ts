import { Test, TestingModule } from '@nestjs/testing';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { CsvAdapterService, Column } from './csv-adapter.service';
import { PrismaService } from '../../prisma.service';
import { DimensionService } from '../dimension/dimension.service';
import { DatasetService } from '../dataset/dataset.service';
import { DimensionGrammar } from 'src/types/dimension';
import {
  createDatasetGrammarsFromEG,
  createDimensionGrammarFromCSVDefinition,
  createEventGrammar,
  createEventGrammarFromCSVDefinition,
  EventDimensionMapping,
} from './csv-adapter.utils';
import { DatasetGrammar } from 'src/types/dataset';
import { EventGrammar } from 'src/types/event';
import { EventService } from '../event/event.service';
import { DataFrame } from 'nodejs-polars';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const csvParser = require('csv-parser');

// import csvtojson from 'csvtojson';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { promisify } from 'util';
import stream from 'stream';
import { createReadStream } from 'fs';
import * as csv from 'csv-parser';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs').promises;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs1 = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pl = require('nodejs-polars');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const readline = require('readline');

describe('CsvAdapterService', () => {
  let service: CsvAdapterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsvAdapterService,
        EventService,
        QueryBuilderService,
        PrismaService,
        DimensionService,
        DatasetService,
      ],
    }).compile();

    service = module.get<CsvAdapterService>(CsvAdapterService);
  });

  // it('should be defined', () => {
  //   expect(service).toBeDefined();
  // });

  it('should create a temp csv file', async () => {
    const inputFile = 'fixtures/dimension-with-comma.csv';
    const outputFile = 'fixtures/dimension-with-comma.temp.csv';

    async function processCSV(input, output) {
      return new Promise((resolve, reject) => {
        if (fs1.existsSync(output)) {
          fs1.unlinkSync(output);
        }
        const readStream = fs1.createReadStream(input);
        const writeStream = fs1.createWriteStream(output);
        const file = readline.createInterface({
          input: readStream,
          output: process.stdout,
          terminal: false,
        });
        file.on('line', (line) => {
          let newline = '';
          for (const letter in line) {
            if (line[letter] == '"') {
              continue;
            } else {
              newline = newline + line[letter];
            }
          }
          writeStream.write(newline + '\r\n');
        });
        file.on('close', async () => {
          console.log('onclose');
          // await fs1.unlinkSync(input);
          // await this.processSleep(200);
          readStream.close();
          writeStream.end();
          writeStream.on('finish', async () => {
            console.log('onfinish');
            // await fs1.renameSync(output, input);
            resolve(output);
          });
        });
        file.on('error', (err) => {
          reject(err);
        });
      });
    }

    try {
      await processCSV(inputFile, outputFile);
      console.log(`CSV file successfully processed and saved as ${outputFile}`);
    } catch (error) {
      console.error('Error processing CSV file:', error);
    }
  });

  it('should parse dataframe with comma', () => {
    const df: DataFrame = pl.readCSV('fixtures/dimension-with-comma.csv', {
      quoteChar: "'",
    });
    console.log(df);
  });

  it('should parse dataframe with comma', async () => {
    async function readCSV(filePath: string): Promise<string[][]> {
      return new Promise((resolve, reject) => {
        const rows: string[][] = [];

        fs1
          .createReadStream(filePath)
          .pipe(csv({ separator: ',', headers: false }))
          .on('data', (data) => {
            rows.push(Object.values(data));
          })
          .on('end', () => {
            resolve(rows);
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    }

    const filePath = 'fixtures/dimension-with-comma.csv';
    const df = await readCSV(filePath);
    df.shift(); // Remove the header row
  });

  // it('should create dimensions out of CSV', async () => {
  //   const dimensionGrammar: DimensionGrammar =
  //     await createDimensionGrammarFromCSVDefinition(
  //       'fixtures/cluster-dimension.grammar.csv',
  //     );

  //   expect(dimensionGrammar).toBeDefined();
  //   const expectedDimensionGrammar: DimensionGrammar = {
  //     name: 'cluster',
  //     description: '',
  //     type: 'dynamic',
  //     storage: {
  //       indexes: ['name'],
  //       primaryId: 'cluster_id',
  //       retention: null,
  //       bucket_size: null,
  //     },
  //     schema: {
  //       title: 'cluster',
  //       psql_schema: 'dimensions',
  //       properties: {
  //         cluster_id: {
  //           type: 'string',
  //           unique: true,
  //         },
  //         cluster_name: {
  //           type: 'string',
  //           unique: true,
  //         },
  //         block_id: {
  //           type: 'string',
  //           unique: false,
  //         },
  //         block_name: {
  //           type: 'string',
  //           unique: false,
  //         },
  //         district_id: {
  //           type: 'string',
  //           unique: false,
  //         },
  //         district_name: {
  //           type: 'string',
  //           unique: false,
  //         },
  //         latitude: {
  //           type: 'string',
  //           unique: false,
  //         },
  //         longitude: {
  //           type: 'string',
  //           unique: false,
  //         },
  //       },
  //       indexes: [
  //         {
  //           columns: [['cluster_name']],
  //         },
  //       ],
  //     },
  //   };
  //   expect(dimensionGrammar).toEqual(expectedDimensionGrammar);

  //   //Pretty print dimensionGrammar object
  //   // console.log(JSON.stringify(dimensionGrammar, null, 2));
  // });

  // Run first
  // describe('CSV Ingest', () => {
  //   it('should process a CSV', async () => {
  //     const csvPath = 'fixtures/2023-01-11.csv';
  //     const df: DataFrame = pl.readCSV(csvPath);
  //     const allHeaders = df.columns;

  //     const eventCounterColumns = [
  //       'total_interactions',
  //       'total_timespent_in_seconds',
  //       'total_count',
  //     ];

  //     const dateFieldColumn = 'Date';
  //     // Can be inferred from the dataFieldColumn
  //     const dateFieldFrequency = 'Daily';
  //     const defaultTimeDimensions = [
  //       'Daily',
  //       'Weekly',
  //       'Monthly',
  //       'Yearly',
  //       'Date',
  //       'Week',
  //       'Month',
  //       'Year',
  //     ];

  //     const Columns = allHeaders.filter(
  //       (h) =>
  //         h !== dateFieldColumn &&
  //         !eventCounterColumns.includes(h) &&
  //         h.length > 0,
  //     );

  //     await service.prisma.$executeRawUnsafe(
  //       `TRUNCATE table spec."DimensionGrammar";`,
  //     );
  //     await service.prisma.$executeRawUnsafe(
  //       `TRUNCATE table spec."DatasetGrammar" CASCADE;`,
  //     );
  //     for (let i = 0; i < Columns.length; i++) {
  //       await service.prisma.$executeRawUnsafe(
  //         `DROP TABLE IF EXISTS dimensions."${Columns[i]}" CASCADE`,
  //       );
  //     }
  //     await service.prisma.$executeRawUnsafe(
  //       `select 'drop table if exists "' || tablename || '" cascade;'
  //         from pg_tables where schemaname = 'datasets';`,
  //     );
  //     const dimensionGrammars: DimensionGrammar[] =
  //       service.getDimensionGrammars(Columns);
  //     const eventGrammars = service.generateEventGrammar(
  //       eventCounterColumns,
  //       dimensionGrammars,
  //     );
  //     const datasetGrammars: DatasetGrammar[] = service.generateDatasetGrammars(
  //       dimensionGrammars,
  //       defaultTimeDimensions,
  //       eventCounterColumns,
  //     );

  //     for (let i = 0; i < datasetGrammars.length; i++) {
  //       await service.prisma.$executeRawUnsafe(
  //         `DROP TABLE IF EXISTS datasets."${datasetGrammars[
  //           i
  //         ].name.toLowerCase()}" CASCADE`,
  //       );
  //     }

  //     await service.csvToDomainSpec(
  //       csvPath,
  //       dateFieldColumn,
  //       eventCounterColumns,
  //     );
  //   });
  // });

  // Run second
  // describe('Nuke DB', () => {
  //   it('should test nuke database', async () => {
  //     await service.nuke();
  //     const pendingDimensions: any[] = await service.prisma
  //       .$queryRaw`select * from pg_tables where schemaname = 'dimension'`;
  //     const pendingDatasets: any[] = await service.prisma
  //       .$queryRaw`select * from pg_tables where schemaname = 'datasets'`;
  //     const currentDatasetGrammars =
  //       await service.prisma.datasetGrammar.findMany();
  //     const currentDimensionGrammars =
  //       await service.prisma.dimensionGrammar.findMany();
  //     const currenEventGrammars = await service.prisma.eventGrammar.findMany();
  //     expect(currenEventGrammars.length).toEqual(0);
  //     expect(currentDimensionGrammars.length).toEqual(0);
  //     expect(currentDatasetGrammars.length).toEqual(0);
  //     expect(pendingDimensions.length).toEqual(0);
  //     expect(pendingDatasets.length).toEqual(0);
  //   });
  // });
});
