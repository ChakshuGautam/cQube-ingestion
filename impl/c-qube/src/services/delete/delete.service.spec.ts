import { Test, TestingModule } from '@nestjs/testing';
import { DeleteService } from './delete.service';
import { CsvAdapterService } from '../csv-adapter/csv-adapter.service';
import { PrismaService } from '../../prisma.service';
import * as fs from 'fs';
import { DatasetService } from '../dataset/dataset.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { EventService } from '../event/event.service';
import { DimensionService } from '../dimension/dimension.service';
import { DimensionGrammarService } from '../csv-adapter/parser/dimension-grammar/dimension-grammar.service';
import { PipeService } from '../pipe/pipe.service';
import { TransformerService } from '../transformer/transformer.service';
import { InstrumenttypeService } from '../instrumenttype/instrumenttype.service';
import { VizService } from '../viz/viz.service';
import { ConfigService } from '@nestjs/config';
import { databasePoolFactory } from '../../app.module';


// output dataset JSONs

import * as single_old from '../../../test/fixtures/outputDatasets/update/single_old.json';
import * as single_updated from '../../../test/fixtures/outputDatasets/update/single_updated.json';
import * as compound_old from '../../../test/fixtures/outputDatasets/update/compound_old.json';
import * as compound_updated from '../../../test/fixtures/outputDatasets/update/compound_updated.json';

describe('DeleteService', () => {
  let deleteService: DeleteService;
  let csvAdapterService: CsvAdapterService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        PrismaService,
        QueryBuilderService,
        DimensionService,
        DimensionGrammarService,
        DatasetService,
        PipeService,
        TransformerService,
        CsvAdapterService,
        EventService,
        InstrumenttypeService,
        VizService,
        ConfigService,
        {
          provide: 'DATABASE_POOL',
          inject: [ConfigService],
          useFactory: databasePoolFactory,
        },
        DeleteService,
      ],
    }).compile();

    deleteService = module.get<DeleteService>(DeleteService);
    csvAdapterService = module.get<CsvAdapterService>(CsvAdapterService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(deleteService).toBeDefined();
  });

  it('should update the data for an event with only single dimensions (diksha_avg_playtime)', async () => {
    await csvAdapterService.ingest();
    await csvAdapterService.ingestData({});
    const tables = [
      'diksha_avg_play_time_in_mins_on_app_and_portal_grade',
      'diksha_avg_play_time_in_mins_on_app_and_portal_state',
      'diksha_avg_play_time_in_mins_on_app_and_portal_subject',
    ];
    const oldData = [];
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const data = await prismaService.$queryRawUnsafe(
        `SELECT sum, count, avg FROM datasets.${table}`,
      );
      console.log(data);
      (data as any[]).forEach((item) => oldData.push(item));
    }

    // fs.writeFileSync(
    //   './test/fixtures/outputDatasets/update/single_old.json',
    //   JSON.stringify({ data: oldData }),
    // );
    expect(oldData).toEqual(expect.arrayContaining(single_old.data));

    await deleteService.deleteData(
      './test/fixtures/test-csvs/update-diff/avgplaytime-update.data.csv',
      './test/fixtures/test-csvs/update-diff/avgplaytime-ingested.data.csv',
      './test/fixtures/test-csvs/update-diff/avgplaytime-event.grammar.csv',
      'diksha_avg_',
    );

    const updatedData = [];
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const data = await prismaService.$queryRawUnsafe(
        `SELECT sum, count, avg FROM datasets.${table}`,
      );
      console.log(data);
      (data as any[]).forEach((item) => updatedData.push(item));
    }

    // fs.writeFileSync(
    //   './test/fixtures/outputDatasets/update/single_updated.json',
    //   JSON.stringify({ data: updatedData }),
    // );

    expect(updatedData).toEqual(expect.arrayContaining(single_updated.data));

    return;
  });

  it('should update the data for an event with single + compound dimensions (diksha_lined_qr)', async () => {
    await csvAdapterService.ingest();
    await csvAdapterService.ingestData({});
    const tables = [
      'diksha_linked_qr_count_grade',
      'diksha_linked_qr_count_textbookdiksha',
      'diksha_linked_qr_count_medium',
      'diksha_linked_qr_count_subject',
      'diksha_linkedqrcount_bagoau1jkr8zcwe6eg90',
    ];

    const oldData = [];
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const data = await prismaService.$queryRawUnsafe(
        `SELECT sum, count, avg FROM datasets.${table}`,
      );
      console.log(data);
      (data as any[]).forEach((item) => oldData.push(item));
    }

    // fs.writeFileSync(
    //   './test/fixtures/outputDatasets/update/compound_old.json',
    //   JSON.stringify({ data: oldData }),
    // );

    expect(oldData).toEqual(expect.arrayContaining(compound_old.data));

    await deleteService.deleteData(
      './test/fixtures/test-csvs/update-diff/linkedqrcount-update.data.csv',
      './test/fixtures/test-csvs/update-diff/linkedqrcount-ingested.data.csv',
      './test/fixtures/test-csvs/update-diff/linkedqrcount-event.grammar.csv',
      'diksha_linked',
    );

    const updatedData = [];
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const data = await prismaService.$queryRawUnsafe(
        `SELECT sum, count, avg FROM datasets.${table}`,
      );
      console.log(data);
      (data as any[]).forEach((item) => updatedData.push(item));
    }

    // fs.writeFileSync(
    //   './test/fixtures/outputDatasets/update/compound_updated.json',
    //   JSON.stringify({ data: updatedData }),
    // );

    expect(updatedData).toEqual(expect.arrayContaining(compound_updated.data));
    return;
  });

  // it('should update the data for an event with time dimension', async () => {
  //   // this is blocked since there is a bug in the table naming is weird for datasets with time dimensions
  //   await csvAdapterService.ingest();
  //   await csvAdapterService.ingestData({});

  //   await deleteService.deleteData(
  //     './test/fixtures/test-csvs/update-diff/studentsmarked-update.data.csv',
  //     './test/fixtures/test-csvs/update-diff/studentsmarked-ingested.data.csv',
  //     './test/fixtures/test-csvs/update-diff/studentsmarked-event.grammar.csv',
  //     'sch_att_students_',
  //   );
  //   return;
  // });
});
