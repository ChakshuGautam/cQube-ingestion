import { Test, TestingModule } from '@nestjs/testing';
import { JSONSchema4 } from 'json-schema';
import { QueryBuilderService } from './query-builder.service';
import { mockDimensionGrammar, mockEventGrammar } from '../mocks/types.mocks';
import { PrismaService } from '../../prisma.service';
import { DimensionService } from '../dimension/dimension.service';
import { EventService } from '../event/event.service';



describe('QueryBuilderService', () => {
  let service: QueryBuilderService;
  let dimensionService: DimensionService;
  let prismaService: PrismaService;
  let eventService: EventService;



  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryBuilderService, PrismaService, DimensionService, EventService],
    }).compile();

    service = module.get<QueryBuilderService>(QueryBuilderService);
    prismaService = module.get<PrismaService>(PrismaService);
    dimensionService = module.get<DimensionService>(DimensionService);
    eventService = module.get<EventService>(EventService);


  });

  it('generates a create statement with a single integer column', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
      false,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n  id integer\n);',
      ),
    );
  });

  it('generates a create statement with a single string column', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        name: { type: 'string' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n  name VARCHAR\n);',
      ),
    );
  });

  it('should log errors when there is an error in the create query', async () => {
    const error = new Error('Some error occurred');
    const autoPrimaryKey = true;
    const createQuery = 'CREATE TABLE school ...';
    const indexQuery = ['CREATE INDEX ...', 'CREATE INDEX ...'];
    jest.spyOn(service, 'generateCreateStatement').mockReturnValue(createQuery);
    jest.spyOn(service, 'generateIndexStatement').mockReturnValue(indexQuery);
    const $queryRawUnsafeSpy = jest.spyOn(prismaService, '$queryRawUnsafe').mockRejectedValue(error);
    await dimensionService.createDimension(mockDimensionGrammar(), autoPrimaryKey);
    expect(service.generateCreateStatement).toHaveBeenCalledWith(mockDimensionGrammar().schema, autoPrimaryKey);
    expect(service.generateIndexStatement).toHaveBeenCalledWith(mockDimensionGrammar().schema);
    expect(prismaService.$queryRawUnsafe).toHaveBeenCalledWith(createQuery);
  });

  it('generates a create statement with a string column with a max length', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        name: { type: 'string', maxLength: 255 },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n  name VARCHAR(255)\n);',
      ),
    );
  });

  it('generates a create statement with multiple columns with Timestamps', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n  id integer,\n  name VARCHAR(255),\n  date_created TIMESTAMP\n);',
      ),
    );
  });

  it('generates a create statement with a single float column', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'number', format: 'float' },
      },
      indexes: [
        {
          name: 'my_table_id_idx',
          columns: ['id'],
        },
      ],
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n  id FLOAT8\n);',
      ),
    );
  });

  it('generates a create statement with a single double column', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'number', format: 'double' },
      },
    };

    const createStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
    );
    expect(createStatement).toBe(
      service.cleanStatement(
        'CREATE TABLE my_schema.my_table (\n  id FLOAT8\n);',
      ),
    );
  });

  it('generates an index statement for each index defined in the schema', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
      },
      indexes: [{ columns: [['name']] }, { columns: [['date_created']] }],
    };
    const indexStatements: string[] = service.generateIndexStatement(
      jsonSchema as JSONSchema4,
    );
    const expectedStatements: string[] = [
      `CREATE INDEX my_table_name_idx ON my_schema.my_table (name);`,
      `CREATE INDEX my_table_date_created_idx ON my_schema.my_table (date_created);`,
    ].map(service.cleanStatement);
    expect(indexStatements.sort()).toEqual(expectedStatements.sort());
  });

  it('generates an index statement for each index defined in the schema', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };
    const indexStatements: string[] = service.generateIndexStatement(
      jsonSchema as JSONSchema4,
    );
    const expectedStatements: string[] = [
      `CREATE INDEX my_table_name_date_created_idx ON my_schema.my_table (name, date_created);`,
      `CREATE INDEX my_table_name_idx ON my_schema.my_table (name);`,
      `CREATE INDEX my_table_date_created_idx ON my_schema.my_table (date_created);`,
    ];
    expect(indexStatements.sort()).toEqual(expectedStatements.sort());
  });

  it('generates a insert statement', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };

    const dataForJSONSchema = {
      name: 'test',
      date_created: '2020-01-01T00:00:00.000Z',
    };

    const insertStatement = service.generateInsertStatement(
      jsonSchema as JSONSchema4,
      dataForJSONSchema,
    );

    expect(insertStatement).toBe(
      service.cleanStatement(
        `INSERT INTO my_schema.my_table (name, date_created) VALUES ('test', '2020-01-01T00:00:00.000Z');`,
      ),
    );
  });

  it('generates a "Create" statement with ID as primary key', () => {
    const jsonSchema = {
      title: 'my_table',
      psql_schema: 'my_schema',
      properties: {
        name: { type: 'string', maxLength: 255 },
        date_created: { type: 'string', format: 'date-time' },
      },
      indexes: [
        { columns: [['name', 'date_created']] },
        { columns: [['name'], ['date_created']] },
      ],
    };

    const insertStatement = service.generateCreateStatement(
      jsonSchema as JSONSchema4,
      true,
    );

    expect(insertStatement).toBe(
      service.cleanStatement(`CREATE TABLE my_schema.my_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        date_created TIMESTAMP
      );`),
    );
  });

  it('should call generateInsertStatement with the correct parameters', async () => {
    jest.spyOn(service, 'generateInsertStatement').mockReturnValue('INSERT QUERY');
    const data = { field1: 'value1', field2: 'value2' };
    await eventService.processEventData(mockEventGrammar(), data);
    expect(service.generateInsertStatement(mockEventGrammar().schema, data)).toBe('INSERT QUERY');
    expect(service.generateInsertStatement).toHaveBeenCalledWith(mockEventGrammar().schema, data);
  });

  it('should call generateInsertStatement with the correct parameters', async () => {
  const mockInsertQuery = 'mock-insert-query';
    const mockError = new Error('Some error occurred');
    const data = [
      { name: 'value1', date_created: '2020-01-01T00:00:00.000Z' },
      { name: 'value2', date_created: '2020-01-02T00:00:00.000Z' },
    ];     jest.spyOn(service, 'generateBulkInsertStatementOld').mockReturnValue(mockInsertQuery);
    prismaService.$queryRawUnsafe = jest.fn().mockRejectedValue(mockError);
    await dimensionService.insertBulkDimensionDataV2(mockDimensionGrammar(), data);
    expect(service.generateBulkInsertStatementOld).toHaveBeenCalledWith(mockDimensionGrammar().schema, data);
    expect(prismaService.$queryRawUnsafe).toHaveBeenCalledWith(mockInsertQuery);
  });
});
