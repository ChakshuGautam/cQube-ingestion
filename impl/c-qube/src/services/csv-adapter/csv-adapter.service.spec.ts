import { Test, TestingModule } from '@nestjs/testing';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { CsvAdapterService } from './csv-adapter.service';
import { PrismaService } from '../../prisma.service';
import { DimensionService } from '../dimension/dimension.service';
import { DataFrame } from 'nodejs-polars';
import { DatasetService } from '../dataset/dataset.service';
import { DimensionGrammar } from 'src/types/dimension';
import { DatasetGrammar } from 'src/types/dataset';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pl = require('nodejs-polars');

describe('CsvAdapterService', () => {
  let service: CsvAdapterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsvAdapterService,
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

  it('should process a CSV', async () => {
    const csvPath = 'fixtures/2023-01-11.csv';
    const df: DataFrame = pl.readCSV(csvPath);
    const allHeaders = df.columns;

    const eventCounterColumns = [
      'total_interactions',
      'total_timespent_in_seconds',
      'total_count',
    ];

    const dateFieldColumn = 'Date';
    // Can be inferred from the dataFieldColumn
    const dateFieldFrequency = 'Daily';
    const defaultTimeDimensions = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

    const dimensionColumns = allHeaders.filter(
      (h) =>
        h !== dateFieldColumn &&
        !eventCounterColumns.includes(h) &&
        h.length > 0,
    );

    await service.prisma.$executeRawUnsafe(
      `TRUNCATE table spec."DimensionGrammar";`,
    );
    await service.prisma.$executeRawUnsafe(
      `TRUNCATE table spec."DatasetGrammar" CASCADE;`,
    );
    for (let i = 0; i < dimensionColumns.length; i++) {
      await service.prisma.$executeRawUnsafe(
        `DROP TABLE IF EXISTS dimensions."${dimensionColumns[i]}"`,
      );
    }
    await service.prisma.$executeRawUnsafe(
      `select 'drop table if exists "' || tablename || '" cascade;' 
        from pg_tables where schemaname = 'datasets';`,
    );
    const dimensionGrammars: DimensionGrammar[] =
      service.getDimensionGrammars(dimensionColumns);
    const eventGrammars = service.generateEventGrammar(eventCounterColumns);
    const datasetGrammars: DatasetGrammar[] = service.generateDatasetGrammars(
      dimensionGrammars,
      defaultTimeDimensions,
      eventGrammars,
    );

    for (let i = 0; i < datasetGrammars.length; i++) {
      await service.prisma.$executeRawUnsafe(
        `DROP TABLE IF EXISTS datasets."${datasetGrammars[
          i
        ].name.toLowerCase()}"`,
      );
    }

    await service.csvToDomainSpec(
      csvPath,
      dateFieldColumn,
      eventCounterColumns,
    );
  });
});
