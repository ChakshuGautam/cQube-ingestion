import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma.service';
import { DimensionService } from '../dimension/dimension.service';
import { EventService } from '../event/event.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { DatasetService } from './dataset.service';
import { Pool } from 'pg';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  DatasetGrammar as DatasetGrammarModel,
  EventGrammar as EventGrammarModel,
  PrismaClient,
  prisma,
} from '@prisma/client';
import { mockDatasetGrammar } from '../mocks/types.mocks';

// Mock PrismaService
const mockPrismaService = {
  datasetGrammar: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  eventGrammar: {
    findUnique: jest.fn(),
  },
  $queryRawUnsafe: jest.fn(),
};

// Mock QueryBuilderService
const mockQueryBuilderService = {
  generateCreateStatement: jest.fn(),
  generateIndexStatement: jest.fn(),
  generateInsertStatement: jest.fn(),
  generateBulkInsertStatement: jest.fn(),
};

// Mock Pool (for DATABASE_POOL)
const mockPool = {
  query: jest.fn(),
};
const mockEventService = {
  dbModelToEventGrammar: jest.fn(),
};


describe('DatasetService', () => {
  let service: DatasetService;
  let prismaService: PrismaService;
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
    service = new DatasetService(
      mockPrismaService as any,
      mockQueryBuilderService as any,
      mockEventService as any,
      mockPool as any,
    );
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
    prismaService = module.get<PrismaService>(PrismaService);
    service = module.get<DatasetService>(DatasetService);
    
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  // it('should be defined', () => {
  //   // expect(service).toBeDefined();
  //   expect(true).toBe(true);
  // });

  // it('should create a DatasetGrammar', async () => {
  //   // Set up mock data and expected output
  //   const datasetGrammar1 = mockDatasetGrammar(); // Using the mockDatasetGrammar function to generate the datasetGrammar mock data
  //   const expectedDatasetGrammar = { name: datasetGrammar1.name,
  //     description: datasetGrammar1.description,
  //     dimensions: datasetGrammar1.dimensions,
  //     schema: datasetGrammar1.schema,
  //     isCompound: datasetGrammar1.isCompound,
  //     eventGrammarFile: datasetGrammar1.eventGrammarFile,
  //     eventGrammar: datasetGrammar1.eventGrammar,
  //     timeDimension: datasetGrammar1.timeDimension,};
  //   mockPrismaService.datasetGrammar.create.mockResolvedValueOnce(expectedDatasetGrammar);

  //   // Call the method to be tested
  //   const result = await service.createDatasetGrammar(datasetGrammar1);

  //   // Check the result
  //   expect(result).toEqual(expectedDatasetGrammar);
  //   expect(mockPrismaService.datasetGrammar.create).toHaveBeenCalledTimes(1);
  //   expect(mockPrismaService.datasetGrammar.create).toHaveBeenCalledWith(datasetGrammar1);
  // });

  // it('should return null for timeDimension if it\'s not provided in the model', async () => {
  //   // Set up mock data with no timeDimension
  //   const datasetGrammar1 = {
  //     name: 'Test Dataset',
  //     description: 'Testing the DatasetGrammar creation',
  //     dimensions: [],
  //     schema: {},
  //     isCompound: false,
  //   };
  //   const expectedDatasetGrammar = {
  //     ...datasetGrammar1,
  //     timeDimension: null,
  //     eventGrammar: undefined,
  //     eventGrammarFile: null,
  //     tableName: null,
  //     tableNameExpanded: null,
  //   };
  //   mockPrismaService.datasetGrammar.create.mockResolvedValueOnce(expectedDatasetGrammar);
  
  //   // Call the method to be tested
  //   const result = await service.createDatasetGrammar(datasetGrammar1);
  
  //   // Check the result
  //   expect(result).toEqual(expectedDatasetGrammar);
  //   expect(mockPrismaService.datasetGrammar.create).toHaveBeenCalledTimes(1);
  //   expect(mockPrismaService.datasetGrammar.create).toHaveBeenCalledWith(datasetGrammar1);
  // });
  // it('should return the dataset grammar when the dataset is found', async () => {
  //   // Set up mock data
  //   const datasetId = 1;
  //   const mockDataset = mockDatasetGrammar();
  //   mockPrismaService.datasetGrammar.findUnique.mockResolvedValueOnce(mockDataset);

  //   // Mock the eventGrammar findUnique call
  //   const mockEventGrammar = { id: 123, name: 'Test Event Grammar' };
  //   mockPrismaService.eventGrammar.findUnique.mockResolvedValueOnce(mockEventGrammar);

  //   // Call the method to be tested
  //   const result = await service.getDatasetGrammar(datasetId);

  //   // Check the result
  //   expect(result).toEqual({
  //     // Populate the expected result based on the provided mock data
  //     eventGrammar: mockDataset.eventGrammarId ? mockEventGrammar : null,
  //     // ... Other properties ...
  //   });

  //   expect(mockPrismaService.datasetGrammar.findUnique).toHaveBeenCalledTimes(1);
  //   expect(mockPrismaService.datasetGrammar.findUnique).toHaveBeenCalledWith({
  //     where: {
  //       id: datasetId,
  //     },
  //   });
  //   expect(mockPrismaService.eventGrammar.findUnique).toHaveBeenCalledTimes(1);
  //   if (mockDataset.eventGrammarId) {
  //     expect(mockPrismaService.eventGrammar.findUnique).toHaveBeenCalledWith({
  //       where: {
  //         id: mockDataset.eventGrammarId,
  //       },
  //     });
  //   } else {
  //     expect(mockPrismaService.eventGrammar.findUnique).not.toHaveBeenCalled();
  //   }
  // });

  // it('should return null when the dataset is not found', async () => {
  //   // Set up mock data
  //   const datasetId = 2;
  //   mockPrismaService.datasetGrammar.findUnique.mockResolvedValueOnce(null);

  //   // Call the method to be tested
  //   const result = await service.getDatasetGrammar(datasetId);

  //   // Check the result
  //   expect(result).toBeNull();
  //   expect(mockPrismaService.datasetGrammar.findUnique).toHaveBeenCalledTimes(1);
  //   expect(mockPrismaService.datasetGrammar.findUnique).toHaveBeenCalledWith({
  //     where: {
  //       id: datasetId,
  //     },
  //   });
  //   expect(mockPrismaService.eventGrammar.findUnique).not.toHaveBeenCalled();
  // });
  
  
  

  it('should return the correct counter aggregates', () => {
    const result = service.counterAggregates();

    // Check if the returned object has the expected properties
    expect(result).toHaveProperty('count');
    expect(result).toHaveProperty('sum');
    expect(result).toHaveProperty('avg');

    // Check the type and format of each property
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
  
    it('should return the correct dimension for any other key', () => {
      const key = 'some_key';
      const result = service.addDateDimension(key);
  
      expect(result).toHaveProperty(key);
      expect(result[key]).toEqual({ type: 'integer' });
      expect(result).toHaveProperty('year');
      expect(result.year).toEqual({ type: 'integer' });
    });   

    
});

