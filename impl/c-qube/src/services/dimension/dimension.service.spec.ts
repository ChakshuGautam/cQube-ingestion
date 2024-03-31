import { Test, TestingModule } from '@nestjs/testing';
import { DimensionGrammar } from 'src/types/dimension';
import { PrismaService } from '../../prisma.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { DimensionService } from './dimension.service';
import { grammar } from '../mocks/test.expect';

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
      `DROP TABLE IF EXISTS "dimensions"."school" CASCADE;`,
    );

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
      `DROP TABLE IF EXISTS "dimensions"."school" CASCADE;`,
    );
  });

  it('insert dimension data to the school dimenstion table', async () => {
      await service.prisma.$executeRawUnsafe(
        `DROP TABLE IF EXISTS "dimensions"."school";`,
      );
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

  it('calls generateBulkInsertStatementOld() function to return the mock insert query and verify insertion', async () => {
    await service.prisma.$executeRawUnsafe(
      `DROP TABLE IF EXISTS "dimensions"."school";`,
    );
    await service.createDimension(grammar, false);
    const data = [
      { name: 'school1', date_created: '2020-01-01T00:00:00.000Z' },
      { name: 'school2', date_created: '2020-01-02T00:00:00.000Z' },
    ];    
    await service.insertBulkDimensionDataV2(grammar, data);
    const result = await service.prisma.$queryRawUnsafe(
        `select * from dimensions.school;`,
      );
      expect(result[0].name).toEqual('school1');
      expect(result[1].name).toEqual('school2');
    await service.prisma.$executeRawUnsafe(
        `DROP TABLE IF EXISTS "dimensions"."school";`,
      );
  });  
});
