import { Test, TestingModule } from '@nestjs/testing';
import { VizService } from './viz.service';

describe('VizService', () => {
  let service: VizService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VizService],
    }).compile();

    service = module.get<VizService>(VizService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
