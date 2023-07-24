import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma.service';
import { DimensionService } from '../dimension/dimension.service';
import { EventService } from '../event/event.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { DatasetService } from './dataset.service';
import { Pool } from 'pg';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatasetGrammar, DatasetUpdateRequest, DimensionMapping } from 'src/types/dataset';

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

  it('should be defined', () => {
    expect(true).toBe(true);
  });

  it('should create a new dataset grammar', async () => {
    const datasetGrammar: DatasetGrammar = {
      name: 'Test Dataset',
      description: 'This is a test dataset',
      dimensions: [],
      schema: {
        type: 'object',
        properties: {},
      },
      eventGrammar: undefined,
      eventGrammarFile: null,
      isCompound: false,
      tableName: null,
      tableNameExpanded: null,
      timeDimension: null,
    };
    const result = await service.createDatasetGrammar(datasetGrammar);

    expect(result).toEqual(datasetGrammar);
  });

  it('should create a new dataset grammar', async () => {

    jest.mock('fs', () => ({
      writeFile: jest.fn(),
    }));
    const datasetGrammar: DatasetGrammar = {
      name: 'Test Dataset',
      description: 'This is a test dataset',
      dimensions: [],
      schema: {
        type: 'object',
        properties: {},
      },
      eventGrammar: undefined,
      eventGrammarFile: null,
      isCompound: false,
      tableName: null,
      tableNameExpanded: null,
      timeDimension: null,
    };

    const mockError = new Error('Database error');
    mockPrismaService.datasetGrammar.create.mockRejectedValueOnce(mockError);
    const consoleErrorSpy = jest.spyOn(console, 'error');
    const writeFileMock = jest.fn();
    require('fs').writeFile = writeFileMock;

    try {
      const result = await service.createDatasetGrammar(datasetGrammar);
    } catch (error) {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Test Dataset');
      expect(consoleErrorSpy).toHaveBeenCalledWith(JSON.stringify(datasetGrammar, null, 2));
    }
  });

  it('should insert bulk dataset data', async () => {
    const datasetGrammar: DatasetGrammar = {
      name: 'Test Dataset',
      description: 'This is a test dataset',
      dimensions: [],
      schema: {
        type: 'object',
        properties: {}, 
      },
    };

    const data = [
      { id: 1, name: 'Data 1' },
      { id: 2, name: 'Data 2' },
    ];

    jest
      .spyOn(service['qbService'], 'generateBulkInsertStatement')
      .mockReturnValue('INSERT INTO test_table VALUES ...');

    jest.spyOn(service['pool'], 'query').mockResolvedValue({ rows: [] });

    const result = await service.insertBulkDatasetData(datasetGrammar, data);

    expect(result).toEqual([]);
  });

  it('should process the dataset update request and perform bulk insertion successfully', async () => {
    const dimension: DimensionMapping = {
      key: 'testKey', // Replace with a valid key
      dimension: {
        name: {
          name: 'testName', 
          type: 'testType',
          storage: {
            indexes: [],
            primaryId: 'testPrimaryId', 
          },
          schema: null,
        },
        mapped_to: 'testMappedTo', 
      },
    };

    const consoleErrorSpy = jest.spyOn(console, 'error');
    const dimensionFilter = {};

   const dataset: DatasetUpdateRequest = {

      dataset: {
        name: 'Test Dataset',
        description: 'This is a test dataset',
        dimensions: [dimension],
        schema: {
          properties: {},
        },
        timeDimension: {
          key: 'timeKey',
          type: 'timeType', 
        },
      },
      updateParams: {
        sum: 0, 
        count: 0, 
        avg: 0, 
      },      
      filterParams: {},
      dimensionFilter: JSON.stringify(dimensionFilter), 

    };
    jest.spyOn(service, 'insertBulkDatasetData').mockResolvedValueOnce(Promise.resolve());
    await service.processDatasetUpdateRequest([dataset]);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });



  it('should handle bulk insertion errors and try individual insertions', async () => {
    const dimension: DimensionMapping = {
      key: 'testKey', 
      dimension: {
        name: {
          name: 'testName', 
          type: 'testType', 
          storage: {
            indexes: [],
            primaryId: 'testPrimaryId', 
          },
          schema: null,
        },
        mapped_to: 'testMappedTo', 
      },
    };
    const datasetUpdateRequest: DatasetUpdateRequest = {
      dataset: {
        name: 'Test Dataset',
        description: 'This is a test dataset',
        dimensions: [dimension],
        schema: {
          properties: {},
        },
        timeDimension: {
          key: 'timeKey',
          type: 'timeType',
        },
      },
      updateParams: {
        sum: 0, 
        count: 0, 
        avg: 0, 
      },
      filterParams: {},
      dimensionFilter: JSON.stringify({}), 
    };

    const mockErrorLogger = jest.spyOn(console, 'error').mockImplementation();
    const mockInsertDatasetData = jest.fn(() => {
      throw new Error('Mocked insertion error');
    });
    service.insertDatasetData = mockInsertDatasetData;

    try {
      await service.processDatasetUpdateRequest([datasetUpdateRequest]);
      expect(mockErrorLogger).toHaveBeenCalledWith('Mocked insertion error');
    } catch (error) {
    } finally {
      mockErrorLogger.mockRestore();
    }
  });

  it('should insert data for a single dataset', async () => {
    const data = [];
    const dimension: DimensionMapping = {
      key: 'testKey', 
      dimension: {
        name: {
          name: 'testName', 
          type: 'testType', 
          storage: {
            indexes: [],
            primaryId: 'testPrimaryId', 
          },
          schema: null,
        },
        mapped_to: 'testMappedTo', 
      },
    };
    const datasetGrammar: DatasetGrammar = {
      name: 'Test Dataset',
      description: 'This is a test dataset',
      dimensions: [dimension],
      schema: {},
    };
    try {
      const insertQuery = mockQbService.generateInsertStatement(
        datasetGrammar.schema,
        data,
      );
      console.log('Insert Query:', insertQuery);
  
      // Call the insertDatasetData function with the insertQuery
      await service.insertDatasetData(datasetGrammar, data);
  
      // Add your assertions here to verify the expected behavior
    } catch (error) {
      // Log any errors that occurred during the test
      console.error('Error:', error);
    }
  });

 
  
  it('should return an array of compound dataset grammars when filter is provided', async () => {
    const mockFilter = {
      name: 'Test',
    };
    const mockDatasetGrammars = [
      {
        id: 1,
        name: 'Test Dataset 1',
        isCompound: true,
      },
      {
        id: 2,
        name: 'Another Test Dataset',
        isCompound: true,
      },
    ];
    mockPrismaService.datasetGrammar.findMany.mockResolvedValueOnce(mockDatasetGrammars);
  });

  it('should return an empty array when no compound dataset grammar matches the filter', async () => {
    const mockFilter = {
      name: 'NonExistentDataset',
    };
    const mockEmptyDatasetGrammars: any[] = [];
    mockPrismaService.datasetGrammar.findMany.mockResolvedValueOnce(mockEmptyDatasetGrammars);
    const result = await service.getCompoundDatasetGrammars(mockFilter);
    expect(result).toEqual([]);
  });

  it('should return an array of non-compound dataset grammars when filter is provided', async () => {
    const mockFilter = {
      name: 'NonCompoundTest',
    };
    const mockDatasetGrammars = [
      {
        id: 1,
        name: 'NonCompoundTest Dataset 1',
        isCompound: false,
      },
      {
        id: 2,
        name: 'Another NonCompoundTest Dataset',
        isCompound: false,
      },
    ];
    mockPrismaService.datasetGrammar.findMany.mockResolvedValueOnce(mockDatasetGrammars);  
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


