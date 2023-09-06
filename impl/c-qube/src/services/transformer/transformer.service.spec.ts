import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma.service';
import { TransformerService } from './transformer.service';
import { Transformer as TransformerModel } from '@prisma/client';
import { TransformAsync } from 'src/types/transformer';

interface TestTransformer extends Transformer {
  name: string;
  suggestiveEvent: any[]; 
  suggestiveDataset: any[];
  isChainable: boolean;
  transformAsync: null;
  transformSync: null;
}

describe('TransformerService', () => {
  let service: TransformerService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformerService, PrismaService],
    }).compile();

    service = module.get<TransformerService>(TransformerService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  

  it('should persist the transformer', async () => {
    const mockTransformer: TestTransformer = {
      name: 'test-transformer',
      suggestiveEvent: [],
      suggestiveDataset: [],
      isChainable: true,
      transformAsync: null,
      transformSync: null,
    };
    const mockTransformerModel: TransformerModel = {
      id: 1,
      name: 'test-transformer',
      transformAsync: 'mock-transform-async-function',
      transformSync: 'mock-transform-sync-function',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
      suggestiveEvents: [],
      suggestiveDatasets: [],
    };
  
    jest.spyOn(prismaService.transformer, 'create').mockResolvedValue(mockTransformerModel);
    const result = await service.persistTransormer(mockTransformer);
    expect(result).toEqual(mockTransformerModel);
    expect(result.id).toBe(1);
    expect(prismaService.transformer.create).toHaveBeenCalledWith({
      data: {
        name: 'test-transformer',
        transformAsync: null, 
        transformSync: null, 
      },
    });
  });

  it('should transform synchronously and return actual value', () => {
    const transformSyncFn = service.stringToTransformSync('2 + 2');
    const callback = jest.fn();
    const result = transformSyncFn(callback, null, null);
    expect(callback).toHaveBeenCalledWith(null, null, 4);
    expect(result).toBe(4);
  });

  it('should transform asynchronously and return a promise', async () => {
    const transformAsyncFn = service.stringToTransformAsync('2 + 2');
    const callback = jest.fn();
    const promise = new Promise((resolve) => {
      transformAsyncFn(callback, null, null);
      setImmediate(resolve);
    });
    const result=await promise;
    expect(result).toBeUndefined();
    expect(callback).toHaveBeenCalledWith(null, null, 4);
  });

});


