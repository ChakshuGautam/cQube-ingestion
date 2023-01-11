import { Test, TestingModule } from '@nestjs/testing';
import { DimensionGrammar } from 'src/types/dimension';
import { PrismaService } from '../../prisma.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { DimensionService } from './dimension.service';

describe('DimensionService', () => {
  let service: DimensionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryBuilderService, PrismaService, DimensionService],
    }).compile();

    service = module.get<DimensionService>(DimensionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create a new dimension from a DimensionGrammar', async () => {
    await service.prisma.$executeRawUnsafe(
      `DROP TABLE IF EXISTS "dimensions"."school";`,
    );
    const grammar: DimensionGrammar = {
      name: 'School',
      type: 'Dynamic',
      storage: {
        indexes: ['name', 'type'],
        primaryId: 'id',
      },
      schema: {
        title: 'School',
        psql_schema: 'dimensions',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string', maxLength: 255 },
          date_created: { type: 'string', format: 'date-time' },
        },
        indexes: [
          { columns: [['name', 'date_created']] },
          { columns: [['name'], ['date_created']] },
        ],
      },
    };
    const d = await service.createDimension(grammar);
    const indexes: any[] = await service.prisma.$queryRawUnsafe(
      `select indexname from pg_indexes where tablename = 'school';`,
    );
    const exptectedIndexes = [
      { indexname: 'school_name_date_created_idx' },
      { indexname: 'school_name_idx' },
      { indexname: 'school_date_created_idx' },
    ];
    expect(indexes.sort()).toEqual(exptectedIndexes);
    //teaddown
    await service.prisma.$executeRawUnsafe(
      `DROP TABLE IF EXISTS "dimensions"."school";`,
    );
  });

  it('insert dimension data to the school dimenstion table', async () => {
    await service.prisma.$executeRawUnsafe(
      `DROP TABLE IF EXISTS "dimensions"."school";`,
    );
    const grammar: DimensionGrammar = {
      name: 'School',
      type: 'Dynamic',
      storage: {
        indexes: ['name', 'type'],
        primaryId: 'id',
      },
      schema: {
        title: 'School',
        psql_schema: 'dimensions',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string', maxLength: 255 },
          date_created: { type: 'string', format: 'date-time' },
        },
        indexes: [
          { columns: [['name', 'date_created']] },
          { columns: [['name'], ['date_created']] },
        ],
      },
    };
    const d = await service.createDimension(grammar);
    const data = [
      { id: 1, name: 'school1', date_created: '2020-01-01' },
      { id: 2, name: 'school2', date_created: '2020-01-02' },
      { id: 3, name: 'school3', date_created: '2020-01-03' },
    ];
    await service.insertDimensionData(grammar, data);
    const result = await service.prisma.$queryRawUnsafe(
      `select * from dimensions.school;`,
    );
    expect(result).toEqual(data);
    //teaddown
    await service.prisma.$executeRawUnsafe(
      `DROP TABLE IF EXISTS "dimensions"."school";`,
    );
  });
});
