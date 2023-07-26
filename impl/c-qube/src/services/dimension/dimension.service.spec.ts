import { Test, TestingModule } from '@nestjs/testing';
import { DimensionGrammar } from 'src/types/dimension';
import { PrismaService } from '../../prisma.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { DimensionService } from './dimension.service';
import { mockDimensionGrammar } from '../mocks/types.mocks';

describe('DimensionService', () => {
  let service: DimensionService;
  let prismaService: PrismaService;
  let qbService: QueryBuilderService;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryBuilderService, PrismaService, DimensionService],
    }).compile();

    service = module.get<DimensionService>(DimensionService);
    prismaService = module.get<PrismaService>(PrismaService);
    qbService = module.get<QueryBuilderService>(QueryBuilderService);

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
    const d = await service.createDimension(grammar, false);
    const indexes: any[] = await service.prisma.$queryRawUnsafe(
      `select indexname from pg_indexes where tablename = 'school';`,
    );
    const exptectedIndexes = [
      { indexname: 'school_name_date_created_idx' },
      { indexname: 'school_name_idx' },
      { indexname: 'school_date_created_idx' },
    ];
    expect(indexes.sort()).toEqual(exptectedIndexes);
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
    await service.createDimension(grammar, false);
    const data = { name: 'school3', date_created: '2020-01-01T00:00:00.000Z' };
    await service.insertDimensionData(grammar, data);
    const result = await service.prisma.$queryRawUnsafe(
      `select * from dimensions.school;`,
    );
    expect(result[0].name).toEqual(data.name);
    expect(result[0].date_created.toISOString()).toBe(data.date_created);
    await service.prisma.$executeRawUnsafe(
      `DROP TABLE IF EXISTS "dimensions"."school";`,
    );
  });

  it('should insert bulk dimension data and handle any errors', async () => {
    const dimensionGrammar = mockDimensionGrammar(); 
    const data = [
      { name: 'Item 1', id: 1 },
      { name: 'Item 2', id: 2 },
    ];
    prismaService.$queryRawUnsafe = jest.fn().mockImplementation(() => {
      throw new Error('Some error occurred');
    });
    await expect(service.insertBulkDimensionData(dimensionGrammar, data)).rejects.toThrowError('Some error occurred');
    expect(prismaService.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'));

    

  });

  it('should return null for an invalid dimension ID', async () => {
    const mockInvalidDimensionId = -1;
    jest.spyOn(prismaService.dimensionGrammar, 'findUnique').mockResolvedValue(null);
    jest.spyOn(service, 'dbModelToDimensionGrammar').mockReturnValue(null);
  
    const result = await service.getDimensionGrammar(mockInvalidDimensionId);
  
    expect(result).toBeNull();
    expect(prismaService.dimensionGrammar.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaService.dimensionGrammar.findUnique).toHaveBeenCalledWith({ where: { id: mockInvalidDimensionId } });
  });

  it('should return null for a dimension name not found', async () => {
    const mockDimensionNameNotFound = 'NonExistentDimension';
    jest.spyOn(prismaService.dimensionGrammar, 'findFirst').mockResolvedValue(null);
    jest.spyOn(service, 'dbModelToDimensionGrammar').mockReturnValue(null);

    const result = await service.getDimensionGrammarByName(mockDimensionNameNotFound);

    expect(result).toBeNull();
    expect(prismaService.dimensionGrammar.findFirst).toHaveBeenCalledTimes(1);
    expect(prismaService.dimensionGrammar.findFirst).toHaveBeenCalledWith({
      where: { name: mockDimensionNameNotFound },
    });
  });


  it('should log errors when there is an error in the create query', async () => {
    const error = new Error('Some error occurred');
    const autoPrimaryKey = true;
    const createQuery = 'CREATE TABLE school ...';
    const indexQuery = ['CREATE INDEX ...', 'CREATE INDEX ...'];
    jest.spyOn(qbService, 'generateCreateStatement').mockReturnValue(createQuery);
    jest.spyOn(qbService, 'generateIndexStatement').mockReturnValue(indexQuery);

    const $queryRawUnsafeSpy = jest.spyOn(prismaService, '$queryRawUnsafe').mockRejectedValue(error);
    jest.spyOn(console, 'error').mockImplementation();
    await service.createDimension(mockDimensionGrammar(), autoPrimaryKey);

    expect(qbService.generateCreateStatement).toHaveBeenCalledWith(mockDimensionGrammar().schema, autoPrimaryKey);
    expect(qbService.generateIndexStatement).toHaveBeenCalledWith(mockDimensionGrammar().schema);
    expect(prismaService.$queryRawUnsafe).toHaveBeenCalledWith(createQuery);
    expect(console.error).toHaveBeenCalledWith(mockDimensionGrammar().name);
    expect(console.error).toHaveBeenCalledWith(JSON.stringify(mockDimensionGrammar(), null, 2));
    expect(console.error).toHaveBeenCalledWith({ createQuery });
    expect(console.error).toHaveBeenCalledWith({ indexQuery });
  });

  it('should insert bulk dimension data and handle errors', async () => {
    const mockData = [
       { name: 'Item 1', id: 1 },
       { name: 'Item 2', id: 2 },
    ];
    const mockInsertQuery = 'mock-insert-query';
    const mockError = new Error('Some error occurred');

    jest.spyOn(qbService, 'generateBulkInsertStatementOld').mockReturnValue(mockInsertQuery);
    prismaService.$queryRawUnsafe = jest.fn().mockRejectedValue(mockError);
    console.error = jest.fn(); 
    console.log = jest.fn(); 

    await service.insertBulkDimensionDataV2(mockDimensionGrammar(), mockData);

    expect(qbService.generateBulkInsertStatementOld).toHaveBeenCalledWith(mockDimensionGrammar().schema, mockData);
    expect(prismaService.$queryRawUnsafe).toHaveBeenCalledWith(mockInsertQuery);
    expect(console.error).toHaveBeenCalledWith(mockInsertQuery);
    if (mockData.length < 50) {
      expect(console.log).toHaveBeenCalledWith(mockData);
    }
    expect(console.error).toHaveBeenCalledWith(mockDimensionGrammar().name);
    expect(console.error).toHaveBeenCalledWith(mockError);
  });

  it('should insert bulk dimension data and handle errors', async () => {
    const mockData = [
    ];
    const mockInsertQuery = 'mock-insert-query';
    const mockError = new Error('Some error occurred');

    jest.spyOn(qbService, 'generateBulkInsertStatementOld').mockReturnValue(mockInsertQuery);
    prismaService.$queryRawUnsafe = jest.fn().mockRejectedValue(mockError);
    console.error = jest.fn();
    console.log = jest.fn(); 
    await service.insertBulkDimensionData(mockDimensionGrammar(), mockData);

    expect(qbService.generateBulkInsertStatementOld).toHaveBeenCalledWith(mockDimensionGrammar().schema, mockData);
    expect(prismaService.$queryRawUnsafe).toHaveBeenCalledWith(mockInsertQuery);
    if (mockData.length < 50) {
      expect(console.log).toHaveBeenCalledWith(mockData);
    }
    expect(console.error).toHaveBeenCalledWith(mockDimensionGrammar().name);
    expect(console.error).toHaveBeenCalledWith(mockError);
  });
});
