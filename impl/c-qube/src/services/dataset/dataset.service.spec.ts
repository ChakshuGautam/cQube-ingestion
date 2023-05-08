import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma.service';
import { DimensionService } from '../dimension/dimension.service';
import { EventService } from '../event/event.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { DatasetService } from './dataset.service';
import { DatasetUpdateRequest } from 'src/types/dataset';

describe('DatasetService', () => {
  let service: DatasetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatasetService,
        PrismaService,
        DimensionService,
        QueryBuilderService,
        EventService,
      ],
    }).compile();

    service = module.get<DatasetService>(DatasetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // it('should clean fk errors', async () => {
  //   const durs: DatasetUpdateRequest = {
  //     dataset: {
  //       name: 'nishtha_coursecompletion_state0programnishtha',
  //       tableName: 'nishtha_coursecompletion_MXRxa3ZuaV1jWXVuZnln',
  //       tableNameExpanded: 'nishtha_coursecompletion_state0programnishtha',
  //       description: '',
  //       timeDimension: null,
  //       dimensions: [],
  //       schema: {
  //         title: 'nishtha_coursecompletion_state0programnishtha',
  //         properties: [] as any,
  //         psql_schema: 'datasets',
  //       },
  //       isCompound: true,
  //       eventGrammarFile:
  //         './ingest/programs/nishtha/coursecompletion-event.grammar.csv',
  //       eventGrammar: undefined,
  //     },
  //     dimensionFilter: '',
  //     updateParams: { count: 2, sum: 69, avg: 34.5 },
  //     filterParams: { state_id: '12', program_name: 'NISHTHA 3.0' },
  //   };
  //   const data = [
  //     {
  //       count: 2,
  //       sum: 69,
  //       avg: 34.5,
  //       state_id: '12',
  //       program_name: 'NISHTHA 3.0',
  //     },
  //     {
  //       count: 2,
  //       sum: 69,
  //       avg: 34.5,
  //       state_id: '9999',
  //       program_name: 'NISHTHA 3.0',
  //     },
  //     {
  //       count: 2,
  //       sum: 69,
  //       avg: 34.5,
  //       state_id: '12',
  //       program_name: 'NISHTHA 3.0',
  //     },
  //     {
  //       count: 4,
  //       sum: 123,
  //       avg: 30.75,
  //       state_id: '12',
  //       program_name: 'NISHTHA 1.0',
  //     },
  //     {
  //       count: 2,
  //       sum: 60,
  //       avg: 30,
  //       state_id: '9999',
  //       program_name: 'NISHTHA 2.0',
  //     },
  //   ];
  //   const res = await service.removeFKErrors(durs, data);
  //   expect(res).toEqual([
  //     {
  //       count: 2,
  //       sum: 69,
  //       avg: 34.5,
  //       state_id: '12',
  //       program_name: 'NISHTHA 3.0',
  //     },
  //     {
  //       count: 2,
  //       sum: 69,
  //       avg: 34.5,
  //       state_id: '12',
  //       program_name: 'NISHTHA 3.0',
  //     },
  //     {
  //       count: 4,
  //       sum: 123,
  //       avg: 30.75,
  //       state_id: '12',
  //       program_name: 'NISHTHA 1.0',
  //     },
  //   ]);
  // });
});
