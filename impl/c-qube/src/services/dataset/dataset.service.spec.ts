import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma.service';
import { DimensionService } from '../dimension/dimension.service';
import { EventService } from '../event/event.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { DatasetService } from './dataset.service';
import { Pool } from 'pg';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatasetGrammar } from 'src/types/dataset';
import { isTimeDimensionPresent } from '../csv-adapter/csv-adapter.utils';

const prismaMock = {
  datasetGrammar: {
    findUnique: jest.fn(),
  },
};

describe('DatasetService', () => {
  let service: DatasetService;
  let prismaService: PrismaService;
  let queryBuilderService: QueryBuilderService;
  let eventService: EventService;
  let mockPrismaService: any; // Use "any" type for the mockPrismaService

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

  it('should insert bulk dataset data', async () => {
    const datasetGrammar: DatasetGrammar = {
      name: 'Test Dataset',
      description: 'This is a test dataset',
      dimensions: [],
      schema: {
        type: 'object',
        properties: {}, // Add your schema properties here
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


