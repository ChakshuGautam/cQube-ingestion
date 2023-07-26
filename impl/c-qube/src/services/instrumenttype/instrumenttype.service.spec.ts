import { Test, TestingModule } from '@nestjs/testing';
import { InstrumenttypeService } from './instrumenttype.service';
import { PrismaService } from '../../prisma.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';

describe('InstrumenttypeService', () => {
  let service: InstrumenttypeService;
  let prismaService: PrismaService;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InstrumenttypeService, PrismaService, QueryBuilderService],
    }).compile();

    service = module.get<InstrumenttypeService>(InstrumenttypeService);
    prismaService = module.get<PrismaService>(PrismaService);

  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a default instrument type', async () => {
    const instrumentType = await service.createDefaultInstrumentType();
    expect(instrumentType).toBeDefined();
    expect(instrumentType.name).toEqual('COUNTER');
  });

  it('should get an instrument type by name', async () => {
    const instrumentType = await service.getInstrumentTypeByName('COUNTER');
    expect(instrumentType).toBeDefined();
    expect(instrumentType.name).toEqual('COUNTER');
  });


  it('should create a default instrument type when none exists', async () => {
    // Mock that findMany returns an empty array
    prismaService.instrumentType.findMany = jest.fn().mockResolvedValue([]);

    // Mock the create method to return a custom InstrumentTypeModel object
    const mockCreatedInstrumentType = { id: 1, name: 'COUNTER' };
    prismaService.instrumentType.create = jest.fn().mockResolvedValue(mockCreatedInstrumentType);

    const result = await service.createDefaultInstrumentType();

    // Assertions
    expect(prismaService.instrumentType.findMany).toHaveBeenCalled();
    expect(prismaService.instrumentType.create).toHaveBeenCalledWith({
      data: {
        name: 'COUNTER',
      },
    });
    expect(result).toEqual(mockCreatedInstrumentType);
  });


});
