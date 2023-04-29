import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma.service';
import { EventService } from './../src/services/event/event.service';
import { DatasetService } from './../src/services/dataset/dataset.service';
import { DimensionService } from './../src/services/dimension/dimension.service';
import { QueryBuilderService } from './../src/services/query-builder/query-builder.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        EventService,
        DatasetService,
        PrismaService,
        DimensionService,
        QueryBuilderService,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', async () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
