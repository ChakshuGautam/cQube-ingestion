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
});
