import { Test, TestingModule } from '@nestjs/testing';
import { InstrumenttypeService } from './instrumenttype.service';
import { PrismaService } from '../../prisma.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';

describe('InstrumenttypeService', () => {
  let service: InstrumenttypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InstrumenttypeService, PrismaService, QueryBuilderService],
    }).compile();

    service = module.get<InstrumenttypeService>(InstrumenttypeService);
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
});
