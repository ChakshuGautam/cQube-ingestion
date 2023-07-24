import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CsvAdapterService } from './../../../src/services/csv-adapter/csv-adapter.service';
import { AppModule } from './../../../src/app.module';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './../../../src/prisma.service';
import { EventService } from './../../../src/services/event/event.service';
import { DatasetService } from './../../../src/services/dataset/dataset.service';
import { DimensionService } from './../../../src/services/dimension/dimension.service';
import { QueryBuilderService } from './../../../src/services/query-builder/query-builder.service';
import { DimensionGrammarService } from './../../../src/services/csv-adapter/parser/dimension-grammar/dimension-grammar.service';
import { DifferenceGeneratorService } from './../../../src/services/csv-adapter/parser/update-diff/update-diff.service';
import { Pool } from 'pg';
import { ConfigModule, ConfigService } from '@nestjs/config';

import * as eventGrammarJSON from '../../fixtures/outputDatasets/specData/eventGrammar.json';
import * as dimensionGrammarJSON from '../../fixtures/outputDatasets/specData/dimensionGrammar.json';
import * as datasetGrammarJSON from '../../fixtures/outputDatasets/specData/datasetGrammar.json';
import * as negativeTestData from '../../fixtures/outputDatasets/negative_e2e.json';
import * as completeIngestionData from '../../fixtures/outputDatasets/complete_e2e.json';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let csvAdapterService: CsvAdapterService;

  const databasePoolFactory = async (configService: ConfigService) => {
    return new Pool({
      user: configService.get('DB_USERNAME'),
      host: configService.get('DB_HOST'),
      database: configService.get('DB_NAME'),
      password: configService.get('DB_PASSWORD'),
      port: configService.get<number>('DB_PORT'),
    });
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        CsvAdapterService,
        EventService,
        QueryBuilderService,
        PrismaService,
        DimensionService,
        DatasetService,
        DimensionGrammarService,
        {
          provide: 'DATABASE_POOL',
          inject: [ConfigService],
          useFactory: databasePoolFactory,
        },
        DifferenceGeneratorService
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    csvAdapterService = app.get<CsvAdapterService>(CsvAdapterService);
  });

  it('should be defined', () => {
    expect(csvAdapterService).toBeDefined();
  });

  /*it('complete ingestion', async () => {
    await csvAdapterService.ingest(
      './test/fixtures/ingestionConfigs',
      'config.complete.json',
    );
    await csvAdapterService.ingestData(
      {},
      './test/fixtures/ingestionConfigs/programs/test-complete-ingestion',
    );
    const data: string[] = await csvAdapterService.prisma.$queryRawUnsafe(
      'SELECT avg, count, sum, month, year, academicyear_id, district_id  FROM datasets.test_complete_ingestion_testcompleteingestion_qvxsaup1nxb__b2rg',
    );

    let distIds: any[] = await csvAdapterService.prisma.$queryRawUnsafe(
      'SELECT DISTINCT district_id from datasets.test_complete_ingestion_meeting_conducted_weekly_district',
    );
    distIds = distIds.map((item) => item['district_id']);
    distIds = distIds.filter((item, idx) => distIds.indexOf(item) === idx);

    expect(data).toBeDefined();
    expect(data.length).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
    expect(distIds.sort()).toEqual(['101', '102', '201', '202']);
    expect(data).toEqual(expect.arrayContaining(completeIngestionData));
  });

  it('partial ingestion', async () => {
    await csvAdapterService.ingest(
      './test/fixtures/ingestionConfigs',
      'config.partial.json',
    );
    await csvAdapterService.ingestData(
      {},
      './test/fixtures/ingestionConfigs/programs/test-partial-ingestion',
    );

    const data: string[] = await csvAdapterService.prisma.$queryRawUnsafe(
      'SELECT * FROM datasets.test_partial_ingestion_meeting_conducted_daily_academicyear',
    );

    let distIds: any[] = await csvAdapterService.prisma.$queryRawUnsafe(
      'SELECT DISTINCT district_id from datasets.test_partial_ingestion_meeting_conducted_weekly_district',
    );
    distIds = distIds.map((item) => item['district_id']);
    distIds = distIds.filter((item, idx) => distIds.indexOf(item) === idx);

    expect(data).toBeDefined();
    expect(data.length).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
    expect(distIds.sort()).toEqual(['101', '102', '201', '202']);
  });

  it('skipping empty files', async () => {
    await csvAdapterService.ingest(
      './test/fixtures/ingestionConfigs',
      'config.skip.json',
    );
    await csvAdapterService.ingestData(
      {},
      './test/fixtures/ingestionConfigs/programs/test-skipping-ingestion',
    );

    const data = await csvAdapterService.prisma.$queryRawUnsafe(
      'SELECT * FROM datasets.test_skipping_ingestion_meeting_conducted_daily_academicyear',
    );

    expect(data).toBeDefined();
    expect(data).toEqual([]);
  });

  it('add test for spec', async () => {
    await csvAdapterService.ingest();
    const datasetGrammar =
      await csvAdapterService.prisma.datasetGrammar.findMany({
        select: {
          // id: true,
          name: true,
          dimensions: true,
          schema: true,
          timeDimension: true,
          program: true,
          isCompound: true,
          tableName: true,
          tableNameExpanded: true,
        },
      });

    const dimensionGrammar =
      await csvAdapterService.prisma.dimensionGrammar.findMany({
        select: {
          // id: true,
          name: true,
          type: true,
          schema: true,
          storage: true,
        },
      });

    const eventGrammar = await csvAdapterService.prisma.eventGrammar.findMany({
      select: {
        // id: true,
        name: true,
        instrumentField: true,
        schema: true,
        instrumentType: true,
        // dimensionMapping: true,
        program: true,
        eventType: true,
      },
    });

    expect(eventGrammar).toEqual(eventGrammarJSON);
    expect(dimensionGrammar).toEqual(
      expect.arrayContaining(dimensionGrammarJSON),
    );
    expect(datasetGrammar).toEqual(expect.arrayContaining(datasetGrammarJSON));
  });

  it('tries to ingest a negative event', async () => {
    await csvAdapterService.ingest(
      './test/fixtures/ingestionConfigs',
      'config.negative.json',
    );
    await csvAdapterService.ingestData(
      {},
      './test/fixtures/ingestionConfigs/programs/test-negative-ingestion',
    );
    const data: string[] = await csvAdapterService.prisma.$queryRawUnsafe(
      'SELECT avg, count, sum, month, year, academicyear_id, district_id  FROM datasets.test_complete_ingestion_testcompleteingestion_qvxsaup1nxb__b2rg',
    );

    let distIds: any[] = await csvAdapterService.prisma.$queryRawUnsafe(
      'SELECT DISTINCT district_id from datasets.test_complete_ingestion_meeting_conducted_weekly_district',
    );
    distIds = distIds.map((item) => item['district_id']);
    distIds = distIds.filter((item, idx) => distIds.indexOf(item) === idx);

    expect(data).toBeDefined();
    expect(data.length).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
    expect(distIds.sort()).toEqual(['101', '102', '201', '202']);
    expect(data).toEqual(expect.arrayContaining(negativeTestData));
  });*/
});
