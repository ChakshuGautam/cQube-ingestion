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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs').promises;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pl = require('nodejs-polars');

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create dimensions out of CSV', async () => {
    const dimensionGrammar: DimensionGrammar =
      await createDimensionGrammarFromCSVDefinition(
        'fixtures/cluster-dimension.grammar.csv',
      );

    expect(dimensionGrammar).toBeDefined();
    const expectedDimensionGrammar: DimensionGrammar = {
      name: 'cluster',
      description: '',
      type: 'dynamic',
      storage: {
        indexes: ['name'],
        primaryId: 'cluster_id',
        retention: null,
        bucket_size: null,
      },
      schema: {
        title: 'cluster',
        psql_schema: 'dimensions',
        properties: {
          cluster_id: {
            type: 'string',
            unique: true,
          },
          cluster_name: {
            type: 'string',
            unique: true,
          },
          block_id: {
            type: 'string',
            unique: true,
          },
          block_name: {
            type: 'string',
            unique: true,
          },
          district_id: {
            type: 'string',
            unique: true,
          },
          district_name: {
            type: 'string',
            unique: true,
          },
          latitude: {
            type: 'string',
            unique: true,
          },
          longitude: {
            type: 'string',
            unique: true,
          },
        },
        indexes: [
          {
            columns: [['cluster_name']],
          },
        ],
      },
    };
    expect(dimensionGrammar).toEqual(expectedDimensionGrammar);

    //Pretty print dimensionGrammar object
    // console.log(JSON.stringify(dimensionGrammar, null, 2));
  });

  it('should test the creation of EventGrammar', async () => {
    const csvPath = 'fixtures/cluster-event.grammar.csv';
    const eventGrammars: EventGrammar[] =
      await createEventGrammarFromCSVDefinition(csvPath, 'fixtures');

    expect(eventGrammars).toBeDefined();
    expect(eventGrammars.length).toEqual(3);

    // Pretty print dimensionGrammar object
    // console.log(JSON.stringify(eventGrammar, null, 2));
  });

  it('should create a datasetGrammars from a CSV', async () => {
    const csvPathDimension = 'fixtures/cluster-dimension.grammar.csv';
    const csvPathEvent = 'fixtures/cluster-event.grammar.csv';
    const dimensionGrammarForCluster: DimensionGrammar =
      await createDimensionGrammarFromCSVDefinition(csvPathDimension);
    const eventGrammarForCluster: EventGrammar[] =
      await createEventGrammarFromCSVDefinition(csvPathEvent, 'fixtures');
    const defaultTimeDimensions = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
    const datasetGrammars: DatasetGrammar[] = await createDatasetGrammarsFromEG(
      'fixtures',
      [dimensionGrammarForCluster],
      defaultTimeDimensions,
      eventGrammarForCluster,
    );
    expect(datasetGrammars).toBeDefined();
    expect(datasetGrammars.length).toEqual(12);
  });

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
