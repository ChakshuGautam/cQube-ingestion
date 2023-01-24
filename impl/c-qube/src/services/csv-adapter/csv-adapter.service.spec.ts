import { Test, TestingModule } from '@nestjs/testing';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { CsvAdapterService } from './csv-adapter.service';
import { PrismaService } from '../../prisma.service';
import { DimensionService } from '../dimension/dimension.service';
import { DataFrame } from 'nodejs-polars';
import { DatasetService } from '../dataset/dataset.service';
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
    const csvPath = '/Users/chakshugautam/Downloads/2023-01-11.csv';
    const df: DataFrame = pl.readCSV(csvPath);
    const allHeaders = df.columns;

    const eventCounterColumns = [
      'total_interactions',
      'total_timespent_in_seconds',
      'total_count',
    ];

    const dateFieldColumn = 'Date';
    const subjectColumn = 'object_id';
    // Can be inferred from the dataFieldColumn
    const dateFieldFrequency = 'Daily';

    const dimensionColumns = allHeaders.filter(
      (h) =>
        h !== dateFieldColumn &&
        h !== subjectColumn &&
        !eventCounterColumns.includes(h),
    );

    await service.prisma.$executeRawUnsafe(
      `TRUNCATE table spec."DimensionGrammar";`,
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

    /* 
      async csvToDomainSpec(csvPath: string,
              dataFieldColumn: string,
              subjectColumn: string,
              eventCounterColumns: string[],)
    */
    await service.csvToDomainSpec(
      csvPath,
      dateFieldColumn,
      subjectColumn,
      eventCounterColumns,
    );
  });
});
