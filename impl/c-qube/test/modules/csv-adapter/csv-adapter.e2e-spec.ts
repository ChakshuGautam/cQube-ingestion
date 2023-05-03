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

// sample response
import * as smallResponse from '../../fixtures/outputDatasets/small_config.json';

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

  it('ingest test data', async () => {
    const ingestionFolder = './test/fixtures/ingestionConfigs';
    const ingestionConfigFileName = 'config.test.json';
    await csvAdapterService.ingest(ingestionFolder, ingestionConfigFileName);

    await csvAdapterService.ingestData({});

    const res: any = await csvAdapterService.prisma
      .$queryRaw`SELECT * FROM datasets.test_program_meeting_conducted_daily_academicyear`;
    res.forEach((item) => {
      item.date = item.date.toISOString().slice(0, 10);
    });
    console.log('res: ', res);
    expect(res).toMatchObject(smallResponse);
  });

  // it('validate the grammar and event data', async () => {
  //   const ingestionFolder = './test/fixtures/ingestionConfigs';
  //   const ingestionConfigFileName = 'config.test.json';
  //   await csvAdapterService.ingestData({});
  // });

  // it('validate the grammar and event data', async () => {
  //   const ingestionFolder = './test/fixtures/ingestionConfigs';
  //   const ingestionConfigFileName = 'config.test.json';
  //   await csvAdapterService.ingestData({});
  // });

  // it('sanity check data for single quotes', async () => {
  //   return true;
  // });
});
