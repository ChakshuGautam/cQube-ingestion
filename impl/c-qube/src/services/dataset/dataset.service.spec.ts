import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma.service';
import { DimensionService } from '../dimension/dimension.service';
import { EventService } from '../event/event.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { DatasetService } from './dataset.service';
import { Pool } from 'pg';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatasetGrammar, DatasetUpdateRequest, DimensionMapping } from 'src/types/dataset';
import { mockDatasetGrammar, mockDatasetUpdateRequest } from '../mocks/types.mocks';
import { datasetGrammar, datasetUpdateRequest } from '../mocks/test.expect';
const consoleErrorSpy = jest.spyOn(console, 'error');
const writeFileMock = jest.fn();
require('fs').writeFile = writeFileMock;


describe('DatasetService', () => {
  let service: DatasetService;
  let prismaService: PrismaService;
  let queryBuilderService: QueryBuilderService;
  let eventService: EventService;
  let mockPrismaService: any; 
  let mockQbService: any;

  const databasePoolFactory = async (configService: ConfigService) => {
    return new Pool({
      user: configService.get('DB_USERNAME'),
      host: configService.get('DB_HOST'),
      database: configService.get('DB_NAME'),
      password: configService.get('DB_PASSWORD'),
      port: configService.get<number>('DB_PORT'),
    });
  };

  beforeEach(async () => {
    mockQbService = {
      generateInsertStatement: jest.fn(),
    };
    mockPrismaService = {
      datasetGrammar: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        $queryRawUnsafe: jest.fn(),
      },
      eventGrammar: {
        findUnique: jest.fn(),
      },
    }; 
  
   const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        DatasetService,
        PrismaService,
        DimensionService,
        QueryBuilderService,
        EventService,
        {
          provide: 'DATABASE_POOL',
          inject: [ConfigService],
          useFactory: databasePoolFactory,
        },
      ],
    }).compile();

    service = module.get<DatasetService>(DatasetService);
    prismaService = module.get<PrismaService>(PrismaService);
    queryBuilderService = module.get<QueryBuilderService>(QueryBuilderService);
    eventService = module.get<EventService>(EventService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  it('should be defined', () => {
    expect(service).toBeDefined;
  });

  it('should create a new dataset grammar', async () => {
    const createdDatasetGrammar = await service.createDatasetGrammar(mockDatasetGrammar());
    expect(createdDatasetGrammar).toBeDefined();
    expect(createdDatasetGrammar.name).toEqual(mockDatasetGrammar().name);
  });

  it('should create a new dataset grammar with error', async () => {

    jest.mock('fs', () => ({
      writeFile: jest.fn(),
    }));
    
    const mockError = new Error('Database error');
    mockPrismaService.datasetGrammar.create.mockRejectedValueOnce(mockError);
    try {
      const result = await service.createDatasetGrammar(mockDatasetGrammar());
      expect(result.name).toEqual('defaultName');
    } catch (error) {
      expect(consoleErrorSpy).toHaveBeenCalledWith(JSON.stringify(mockDatasetGrammar(), null, 2));
    }
  });

  it('should insert bulk dataset data', async () => {
  
    const data = [
      { id: 1, name: 'Data 1' },
      { id: 2, name: 'Data 2' },
    ];
  
    jest
      .spyOn(service['qbService'], 'generateBulkInsertStatement')
      .mockReturnValue('INSERT INTO test_table VALUES ...');
  
    jest.spyOn(service['pool'], 'query').mockResolvedValue({ rows: 2 });
  
    const result = await service.insertBulkDatasetData(datasetGrammar, data);  
    expect(result).toEqual(2);
    
  });

  it('should handle bulk insertion errors and try individual insertions', async () => {
    const mockInsertDatasetData = jest.fn(() => {
      throw new Error('Mocked insertion error');
    });
    service.insertDatasetData = mockInsertDatasetData;
    const mockInsertDatasetDataIndividual = jest.fn();
    service.insertDatasetData = mockInsertDatasetDataIndividual;
    await service.processDatasetUpdateRequest([datasetUpdateRequest]);
    expect(mockInsertDatasetDataIndividual).toHaveBeenCalledTimes(1);
    expect(mockInsertDatasetDataIndividual.mock.calls[0][1]).toEqual({
      avg: 0,
      count: 0,
      sum: 0,
    }
    );
  });

  it('should return an empty array when no compound dataset grammar matches the filter', async () => {
    const mockFilter = {
      name: 'NonExistentDataset',
    };
    mockPrismaService.datasetGrammar.findMany.mockResolvedValueOnce(mockDatasetGrammar());
    const result = await service.getCompoundDatasetGrammars(mockFilter);
    expect(result).toEqual([]);
  });    

  it('should return an empty array when no non-compound dataset grammar matches the filter', async () => {
    const mockFilter = {
      name: 'NonExistentNonCompound',
    };
    const mockEmptyDatasetGrammars: any[] = [];
    mockPrismaService.datasetGrammar.findMany.mockResolvedValueOnce(mockEmptyDatasetGrammars);

    const result = await service.getNonCompoundDatasetGrammars(mockFilter);

    expect(result).toEqual([]);
  }); 
  
  it('should return the correct counter aggregates', () => {
    const result = service.counterAggregates();

    expect(result).toHaveProperty('count');
    expect(result).toHaveProperty('sum');
    expect(result).toHaveProperty('avg');

    expect(result.count).toEqual({ type: 'number', format: 'float' });
    expect(result.sum).toEqual({ type: 'number', format: 'float' });
    expect(result.avg).toEqual({ type: 'number', format: 'float' });
    });

    it('should return the correct dimension for "date"', () => {
      const key = 'date';
      const result = service.addDateDimension(key);
  
      expect(result).toHaveProperty(key);
      expect(result[key]).toEqual({ type: 'string', format: 'date' });
    });
  
    it('should return the correct dimension for "year"', () => {
      const key = 'year';
      const result = service.addDateDimension(key);
  
      expect(result).toHaveProperty(key);
      expect(result[key]).toEqual({ type: 'integer' });
    });

    it('should return combined properties for custom dimensions', () => {
      const key = 'customKey';
      const result = service.addDateDimension(key);
      expect(result).toEqual({
        [key]: { type: 'integer' },
        year: { type: 'integer' },
      });
    });
  });


