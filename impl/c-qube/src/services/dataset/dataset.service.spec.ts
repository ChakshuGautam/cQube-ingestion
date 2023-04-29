import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma.service';
import { DimensionService } from '../dimension/dimension.service';
import { EventService } from '../event/event.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { DatasetService } from './dataset.service';

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
});
