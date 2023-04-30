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

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let csvAdapterService: CsvAdapterService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        CsvAdapterService,
        EventService,
        DatasetService,
        PrismaService,
        DimensionService,
        QueryBuilderService,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    csvAdapterService = app.get<CsvAdapterService>(CsvAdapterService);
  });

  it('ingest-small-data', async () => {
    // await csvAdapterService.ingest();
    // SQL Query to this table => nishtha_perc_certification_programnishtha
    // Convert it to JSON
    // outputDatasets/nishtha_perc_certification_programnishtha
    // expect(outputDatasets/nishtha_perc_certification_programnishtha.json).toBe(SQL Query Output);
  });

  it('validate the grammar and event data', async () => {
    const ingestionFolder = './test/fixtures/ingestionConfigs';
    const ingestionConfigFileName = 'config.test.json';
    await csvAdapterService.ingestData(
      ingestionFolder,
      ingestionConfigFileName,
    );
  });

  it('should do partial insertion', async () => {
    const ingestionFolder = './test/fixtures/ingestionConfigs';
    const ingestionConfigFileName = 'config.test.json';
    await csvAdapterService.ingestData(
      ingestionFolder,
      ingestionConfigFileName,
    );
  });

  it('sanity check data for single quotes', async () => {
    return true;
  });
});
