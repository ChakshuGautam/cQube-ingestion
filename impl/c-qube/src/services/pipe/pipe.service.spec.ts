import { Test, TestingModule } from '@nestjs/testing';
import { PipeService } from './pipe.service';

describe('PipeService', () => {
  let service: PipeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PipeService],
    }).compile();

    service = module.get<PipeService>(PipeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
