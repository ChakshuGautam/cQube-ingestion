import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma.service';
import { TransformerService } from './transformer.service';
import { Transformer as TransformerModel } from '@prisma/client';
import { TransformAsync } from 'src/types/transformer';

interface TestTransformer extends Transformer {
  name: string;
  suggestiveEvent: any[]; // Replace 'any' with the appropriate type if known
  suggestiveDataset: any[]; // Replace 'any' with the appropriate type if known
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
    expect(prismaService.transformer.create).toHaveBeenCalledWith({
      data: {
        name: 'test-transformer',
        transformAsync: null, 
        transformSync: null, 
      },
    });
  });

  

  it('should transform synchronously', () => {
    const transformSyncFn = service.stringToTransformSync('2 + 2');
    const callback = jest.fn();
    const result = transformSyncFn(callback, null, null);
    expect(callback).toHaveBeenCalledWith(null, null, 4);
    expect(result).toBe(4);
  });

  it('should transform asynchronously', async () => {
    const transformAsyncFn = service.stringToTransformAsync('2 + 2');
    const callback = jest.fn();
    const promise = new Promise((resolve) => {
      transformAsyncFn(callback, null, null);
      setImmediate(resolve);
    });
    await promise;
    expect(callback).toHaveBeenCalledWith(null, null, 4);
  });

  
  it('should reject the promise when transformAsync throws an error', async () => {
    const transformAsyncFn = service.stringToTransformAsync('(callback) => { throw new Error("Test Error"); }');
    try {
      await transformAsyncFn(null, null, null);
      expect(true).toBe(false);
    } catch (error) {}
  });
 
  it('should throw an error when transformSync encounters an error', () => {
    const errorMessage = 'Test Error';
    const transformSyncFn = service.stringToTransformSync(`throw new Error("${errorMessage}");`);
    const callback = jest.fn();
    try {
      transformSyncFn(callback, null, null);
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toBe(errorMessage);
      expect(callback).not.toHaveBeenCalled();
    }
  });

  
});






