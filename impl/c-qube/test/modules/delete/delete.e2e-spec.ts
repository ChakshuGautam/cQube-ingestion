import { Test, TestingModule } from '@nestjs/testing';
import { DeleteService } from '../../../src/services/delete/delete.service';
import { CsvAdapterService } from '../../../src/services/csv-adapter/csv-adapter.service';
import { PrismaService } from '../../../src/prisma.service';
import * as fs from 'fs';
import { DatasetService } from '../../../src/services/dataset/dataset.service';
import { QueryBuilderService } from '../../../src/services/query-builder/query-builder.service';
import { EventService } from '../../../src/services/event/event.service';
import { DimensionService } from '../../../src/services/dimension/dimension.service';
import { DimensionGrammarService } from '../../../src/services/csv-adapter/parser/dimension-grammar/dimension-grammar.service';
import { PipeService } from '../../../src/services/pipe/pipe.service';
import { TransformerService } from '../../../src/services/transformer/transformer.service';
import { InstrumenttypeService } from '../../../src/services/instrumenttype/instrumenttype.service';
import { VizService } from '../../../src/services/viz/viz.service';
import { ConfigService } from '@nestjs/config';
import { databasePoolFactory } from '../../../src/app.module';
import { DifferenceGeneratorService } from '../../../src/services/csv-adapter/parser/update-diff/update-diff.service';

// output dataset JSONs

import * as single_old from '../../fixtures/outputDatasets/update/single_old.json';
import * as single_updated from '../../fixtures/outputDatasets/update/single_updated.json';
import * as multiple_old from '../../fixtures/outputDatasets/update/multiple_old.json';
import * as multiple_updated from '../../fixtures/outputDatasets/update/multiple_updated.json';
import * as compound_old from '../../fixtures/outputDatasets/update/compound_old.json';
import * as compound_updated from '../../fixtures/outputDatasets/update/compound_updated.json';
import * as time_old from '../../fixtures/outputDatasets/update/time_old.json';
import * as time_updated from '../../fixtures/outputDatasets/update/time_updated.json';

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
        DifferenceGeneratorService,
      ],
    }).compile();

    deleteService = module.get<DeleteService>(DeleteService);
    csvAdapterService = module.get<CsvAdapterService>(CsvAdapterService);
    prismaService = module.get<PrismaService>(PrismaService);

    // ingest the dimension
    await csvAdapterService.ingest();

    // ingest the data
    await csvAdapterService.ingestData({});
  });

  it('should be defined', () => {
    expect(deleteService).toBeDefined();
  });

  it('should update a single row for an event with only single dimensions (diksha_avg_playtime)', async () => {
    // await csvAdapterService.ingest();
    // await csvAdapterService.ingestData({});
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
      // console.log(data);
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
      // console.log(data);
      (data as any[]).forEach((item) => updatedData.push(item));
    }

    // fs.writeFileSync(
    //   './test/fixtures/outputDatasets/update/single_updated.json',
    //   JSON.stringify({ data: updatedData }),
    // );

    expect(updatedData).toEqual(expect.arrayContaining(single_updated.data));

    return;
  });

  it('should update two rows for an event with only single dimensions (diksha_avg_playtime)', async () => {
    // await csvAdapterService.ingest();
    // await csvAdapterService.ingestData({});
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
      // console.log(data);
      (data as any[]).forEach((item) => oldData.push(item));
    }

    // fs.writeFileSync(
    //   './test/fixtures/outputDatasets/update/multiple_old.json',
    //   JSON.stringify({ data: oldData }),
    // );

    expect(oldData).toEqual(expect.arrayContaining(multiple_old.data));

    await deleteService.deleteData(
      './test/fixtures/test-csvs/update-diff/avgplaytime-update.data3.csv',
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
      // console.log(data);
      (data as any[]).forEach((item) => updatedData.push(item));
    }

    // fs.writeFileSync(
    //   './test/fixtures/outputDatasets/update/multiple_updated.json',
    //   JSON.stringify({ data: updatedData }),
    // );

    expect(updatedData).toEqual(expect.arrayContaining(multiple_updated.data));

    return;
  });

  it('should update the data for an event with single + compound dimensions (diksha_lined_qr)', async () => {
    // await csvAdapterService.ingest();
    // await csvAdapterService.ingestData({});
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
      // console.log(data);
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
      // console.log(data);
      (data as any[]).forEach((item) => updatedData.push(item));
    }

    // fs.writeFileSync(
    //   './test/fixtures/outputDatasets/update/compound_updated.json',
    //   JSON.stringify({ data: updatedData }),
    // );

    expect(updatedData).toEqual(expect.arrayContaining(compound_updated.data));
    return;
  });

  it('should update the data for an event with time dimension', async () => {
    // this is blocked since there is a bug in the table naming is weird for datasets with time dimensions
    const tables = [
      'sch_att_studentsmarked_ZWBtSHghdGlEYW5hf0UT',
      'sch_att_studentsmarked_ZWBtSHghcmxYdncIHDET',
      'sch_att_studentsmarked_Z2tnSW9jIGRDYmBkYHRf',
      'sch_att_studentsmarked_Z2tnSW9jIGRNYmR9YHRf',
      'sch_att_studentsmarked_ZWBtSHghc2xCZmhtbjET',
      'sch_att_studentsmarked_X2lsQ250YjBNeHN_Ym4N',
      'sch_att_studentsmarked_bxkDNhEMFQArb353YnB0',
      'sch_att_studentsmarked_Z2tnSW9jIGJIfnNkCRcr',
      'sch_att_studentsmarked_K2lsQ250YjBacmhkf2tu',
      'sch_att_studentsmarked_Y2ZmQmYhd3JWcXkIHDEH',
      'sch_att_studentsmarked_X2lsQ250YjBcd3RzZgIN',
      'sch_att_studentsmarked_X31qRWV__fDBZaXp0aAIN',
      'sch_att_studentsmarked_BAQISHghY2NfenNkLFZh',
      'sch_att_studentsmarked_FwQSNhcUEBVQdHdge24b',
      'sch_att_studentsmarked_Z2tnSW9jIGJGfnd9CRcr',
      'sch_att_studentsmarked_c21hQmV9IGdYcHBzCRcr',
      'sch_att_studentsmarked_ChUSMA8RBXRScnN6ZQFj',
      'sch_att_studentsmarked_bx4GMBYKGRFfb353YnB0',
      'sch_att_studentsmarked_X2lsQ250YjBdd25jeWd_',
      'sch_att_studentsmarked_Z2tnSW9jIHNJeXt5ZRcr',
      'sch_att_studentsmarked_ZWBtSHghY2NfenNkHDET',
      'sch_att_studentsmarked_Z2tnSW9jIGNGZGdibGUr',
      'sch_att_studentsmarked_FQoDLG9jIHNHeX9gZSdM',
      'sch_att_studentsmarked_FwQSNhcUEBVedHN5e24b',
      'sch_att_studentsmarked_DxMVNgMAcXRScnN6ZQFk',
      'sch_att_studentsmarked_c21hQmV9IGdWcHRqCRcr',
      'sch_att_studentsmarked_FQoDLG9jIHNJeXt5ZSdM',
      'sch_att_studentsmarked_EAEUMREYAWFQdHdge24b',
      'sch_att_studentsmarked_EAEUMREYAWFedHN5e24b',
      'sch_att_studentsmarked_OBsNJwt0YjBNeHN_Ym49',
      'sch_att_studentsmarked_EQEOIQ59c2FedHN5e24b',
      'sch_att_studentsmarked_DwkFKWZycXRScnN6ZQFl',
      'sch_att_studentsmarked_bx8GKgYVfGNfb353YnB0',
      'sch_att_studentsmarked_Z2tnSW9jIGNIZGN7bGUr',
      'sch_att_studentsmarked_Z2tnSW9jIHNHeX9gZRcr',
      'sch_att_studentsmarked_EQEOIQ59c2FQdHdge24b',
      'sch_att_studentsmarked_Daily_district',
      'sch_att_studentsmarked_Daily_cluster',
      'sch_att_studentsmarked_Weekly_grade',
      'sch_att_studentsmarked_Monthly_cluster',
      'sch_att_studentsmarked_Monthly_block',
      'sch_att_studentsmarked_Daily_block',
      'sch_att_studentsmarked_Weekly_district',
      'sch_att_studentsmarked_Daily_grade',
      'sch_att_studentsmarked_Weekly_gender',
      'sch_att_studentsmarked_Monthly_district',
      'sch_att_studentsmarked_Yearly_schoolcategory',
      'sch_att_studentsmarked_Daily_school',
      'sch_att_studentsmarked_Weekly_block',
      'sch_att_studentsmarked_Monthly_grade',
      'sch_att_studentsmarked_Weekly_cluster',
      'sch_att_studentsmarked_Daily_gender',
      'sch_att_studentsmarked_Monthly_school',
      'sch_att_studentsmarked_Monthly_gender',
      'sch_att_studentsmarked_Weekly_school',
      'sch_att_studentsmarked_Weekly_schoolcategory',
      'sch_att_studentsmarked_Yearly_block',
      'sch_att_studentsmarked_Daily_schoolcategory',
      'sch_att_studentsmarked_Monthly_schoolcategory',
      'sch_att_studentsmarked_Yearly_grade',
      'sch_att_studentsmarked_Yearly_district',
      'sch_att_studentsmarked_Yearly_cluster',
      'sch_att_studentsmarked_Yearly_school',
      'sch_att_studentsmarked_Yearly_gender',
    ];

    // await csvAdapterService.ingest();
    // await csvAdapterService.ingestData({});
    const oldData = [];
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const data = await prismaService.$queryRawUnsafe(
        `SELECT sum, count, avg FROM datasets.${table}`,
      );
      // console.log(data);
      (data as any[]).forEach((item) => oldData.push(item));
    }
    // fs.writeFileSync(
    //   './test/fixtures/outputDatasets/update/time_old.json',
    //   JSON.stringify({ data: oldData }),
    // );

    expect(oldData).toEqual(expect.arrayContaining(time_old.data));

    await deleteService.deleteData(
      './test/fixtures/test-csvs/update-diff/studentsmarked-update.data.csv',
      './test/fixtures/test-csvs/update-diff/studentsmarked-ingested.data.csv',
      './test/fixtures/test-csvs/update-diff/studentsmarked-event.grammar.csv',
      'sch_att_studentsmarked',
    );

    const updatedData = [];
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const data = await prismaService.$queryRawUnsafe(
        `SELECT sum, count, avg FROM datasets.${table}`,
      );
      // console.log(data);
      (data as any[]).forEach((item) => updatedData.push(item));
    }

    // fs.writeFileSync(
    //   './test/fixtures/outputDatasets/update/time_updated.json',
    //   JSON.stringify({ data: updatedData }),
    // );

    expect(updatedData).toEqual(expect.arrayContaining(time_updated.data));

    return;
  });

  it('should update try updating the file which has no changes from the ingested file', async () => {
    // await csvAdapterService.ingest();
    // await csvAdapterService.ingestData({});
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
      // console.log(data);
      (data as any[]).forEach((item) => oldData.push(item));
    }

    expect(oldData).toEqual(expect.arrayContaining(single_old.data));

    await deleteService.deleteData(
      './test/fixtures/test-csvs/update-diff/avgplaytime-nochange-update.data.csv',
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
      // console.log(data);
      (data as any[]).forEach((item) => updatedData.push(item));
    }

    expect(updatedData).toEqual(expect.arrayContaining(single_old.data));

    return;
  });
});
