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
import { Pool } from 'pg';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
      imports: [AppModule, ConfigModule],
      providers: [
        CsvAdapterService,
        EventService,
        DatasetService,
        PrismaService,
        DimensionService,
        QueryBuilderService,
        DimensionGrammarService,
        {
          provide: 'DATABASE_POOL',
          inject: [ConfigService],
          useFactory: databasePoolFactory,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    csvAdapterService = app.get<CsvAdapterService>(CsvAdapterService);
  });

  it('complete ingestion', async () => {
    await csvAdapterService.ingest(
      './test/fixtures/ingestionConfigs',
      'config.complete.json',
    );
    await csvAdapterService.ingestData(
      './test/fixtures/ingestionConfigs/programs/test-complete-ingestion',
    );
  });

  it('partial ingestion', async () => {
    await csvAdapterService.ingest();
    // SQL Query to this table => nishtha_perc_certification_programnishtha
    // Convert it to JSON
    // outputDatasets/nishtha_perc_certification_programnishtha
    // expect(outputDatasets/nishtha_perc_certification_programnishtha.json).toBe(SQL Query Output);
  });

  it('skipping empty files', async () => {
    await csvAdapterService.ingest();
    // SQL Query to this table => nishtha_perc_certification_programnishtha
    // Convert it to JSON
    // outputDatasets/nishtha_perc_certification_programnishtha
    // expect(outputDatasets/nishtha_perc_certification_programnishtha.json).toBe(SQL Query Output);
  });
});
